import pool from '../config/database';

export class BlogModel {
    static async getAllPosts(limit: number = 24, offset: number = 0) {
        const [rows] = await pool.query(`
            SELECT b.id, b.author_id, b.title, b.slug, b.summary, b.category, b.view_count, b.created_at, b.updated_at,
                   u.username, u.avatar_url, u.role
            FROM blog_posts b 
            JOIN users u ON b.author_id = u.id 
            WHERE b.created_at <= NOW() 
            ORDER BY b.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [[{ total }]]: any = await pool.query(`
            SELECT COUNT(*) as total
            FROM blog_posts
            WHERE created_at <= NOW()
        `);

        return { rows, total: Number(total) };
    }

    static async getPostBySlug(slug: string) {
        const [rows]: any = await pool.query(`
            SELECT b.*, u.username, u.avatar_url, u.role
            FROM blog_posts b 
            JOIN users u ON b.author_id = u.id 
            WHERE b.slug = ? AND b.created_at <= NOW()
        `, [slug]);
        return rows[0] || null;
    }

    static async getRelatedPosts(category: string, excludeId: number, limit: number = 3) {
        const [rows] = await pool.query(`
            SELECT title, slug, created_at, category
            FROM blog_posts
            WHERE category = ? AND id != ? AND created_at <= NOW()
            ORDER BY created_at DESC
            LIMIT ?
        `, [category, excludeId, limit]);
        return rows;
    }
}
