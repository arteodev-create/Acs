import pool from '../config/database';

export class ForumModel {
    static async getAllCategories() {
        const [rows] = await pool.query(`
            SELECT c.*, COUNT(t.id) as threads_count 
            FROM categories c 
            LEFT JOIN threads t ON c.id = t.category_id 
            GROUP BY c.id, c.name, c.slug, c.description, c.icon_name, c.display_order, c.created_at
            ORDER BY c.display_order ASC, c.name ASC
        `);
        return rows;
    }

    static async getThreads(limit: number, offset: number) {
        const [rows]: any = await pool.query(`
            SELECT t.*, u.username, u.avatar_url, u.headline, u.reputation_points, c.name as category_name,
            (SELECT COUNT(*) FROM posts p WHERE p.thread_id = t.id) as reply_count,
            (SELECT COUNT(*) FROM reactions r WHERE r.target_type = 'thread' AND r.target_id = t.id) as reaction_count
            FROM threads t
            JOIN users u ON t.user_id = u.id
            JOIN categories c ON t.category_id = c.id
            WHERE t.created_at <= NOW()
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const [[{ total }]]: any = await pool.query('SELECT COUNT(*) as total FROM threads WHERE created_at <= NOW()');

        return { rows, total };
    }

    static async createThread(data: { title: string, slug: string, content: string, user_id: number, category_id: number }) {
        const [result]: any = await pool.query(
            'INSERT INTO threads (title, slug, content, user_id, category_id) VALUES (?, ?, ?, ?, ?)',
            [data.title, data.slug, data.content, data.user_id, data.category_id]
        );
        return result.insertId;
    }

    static async getThreadBySlug(slug: string) {
        const [threads]: any = await pool.query(`
            SELECT t.*, u.username, u.avatar_url, u.headline, u.company, u.reputation_points, c.name as category_name,
            (SELECT COUNT(*) FROM reactions r WHERE r.target_type = 'thread' AND r.target_id = t.id) as reaction_count
            FROM threads t
            JOIN users u ON t.user_id = u.id
            JOIN categories c ON t.category_id = c.id
            WHERE t.slug = ? AND t.created_at <= NOW()
        `, [slug]);
        return threads[0] || null;
    }

    static async getPostsByThreadId(threadId: number) {
        const [posts] = await pool.query(`
            SELECT p.*, u.username, u.avatar_url, u.headline, u.company, u.reputation_points,
            parent_u.username as parent_username,
            parent_p.content as parent_content,
            (SELECT COUNT(*) FROM reactions r WHERE r.target_type = 'post' AND r.target_id = p.id) as reaction_count
            FROM posts p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN posts parent_p ON p.parent_id = parent_p.id
            LEFT JOIN users parent_u ON parent_p.user_id = parent_u.id
            WHERE p.thread_id = ?
            ORDER BY p.created_at ASC
        `, [threadId]);
        return posts;
    }

    static async getPostById(id: number) {
        const [posts]: any = await pool.query(`
            SELECT p.*, u.username, u.avatar_url, u.headline, u.company,
            t.title as thread_title, t.slug as thread_slug, c.name as category_name,
            parent_u.username as parent_username,
            parent_p.content as parent_content
            FROM posts p
            JOIN users u ON p.user_id = u.id
            JOIN threads t ON p.thread_id = t.id
            JOIN categories c ON t.category_id = c.id
            LEFT JOIN posts parent_p ON p.parent_id = parent_p.id
            LEFT JOIN users parent_u ON parent_p.user_id = parent_u.id
            WHERE p.id = ?
        `, [id]);
        return posts[0] || null;
    }

    static async createPost(data: { thread_id: number, user_id: number, content: string, parent_id?: number }) {
        const [result]: any = await pool.query(
            'INSERT INTO posts (thread_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
            [data.thread_id, data.user_id, data.content, data.parent_id || null]
        );
        return result.insertId;
    }

    static async getRelatedThreads(categoryId: number, excludeThreadId: number, limit: number = 3) {
        const [rows] = await pool.query(`
            SELECT t.title, t.slug, t.created_at, c.name as category_name
            FROM threads t
            JOIN categories c ON t.category_id = c.id
            WHERE t.category_id = ? AND t.id != ? AND t.created_at <= NOW()
            ORDER BY t.created_at DESC
            LIMIT ?
        `, [categoryId, excludeThreadId, limit]);
        return rows;
    }
}
