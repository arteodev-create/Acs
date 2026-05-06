import { Request, Response } from 'express';
import pool from '../config/database';

export const getTemplates = async (req: Request, res: Response) => {
    try {
        const { search, tag } = req.query;
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
        const limit = Math.min(60, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
        const offset = (page - 1) * limit;
        let query = `
            SELECT s.id, s.user_id, s.title, s.description, s.tags, s.stars, s.download_count, s.version, s.created_at, s.updated_at,
                   CASE
                     WHEN LENGTH(s.code_content) > 700 THEN LEFT(s.code_content, 700) || E'\\n/* preview truncated; open detail for full code */'
                     ELSE s.code_content
                   END AS code_preview,
                   u.username, u.avatar_url 
            FROM recode_scripts s
            JOIN users u ON s.user_id = u.id
        `;
        let countQuery = `SELECT COUNT(*) as total FROM recode_scripts s JOIN users u ON s.user_id = u.id`;
        const params: any[] = [];
        const conditions: string[] = ['s.created_at <= NOW()'];

        if (search || tag) {
            if (search) {
                conditions.push('(s.title LIKE ? OR s.description LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }
            if (tag) {
                conditions.push('s.tags LIKE ?');
                params.push(`%${tag}%`);
            }
        }

        const whereSql = ` WHERE ${conditions.join(' AND ')}`;
        query += whereSql;
        countQuery += whereSql;
        query += ' ORDER BY s.stars DESC, s.created_at DESC';
        query += ' LIMIT ? OFFSET ?';

        const [rows] = await pool.query(query, [...params, limit, offset]);
        const [[{ total }]]: any = await pool.query(countQuery, params);
        res.removeHeader('Pragma');
        res.removeHeader('Expires');
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: Number(total),
                total_pages: Math.ceil(Number(total) / limit),
                has_more: offset + (rows as any[]).length < Number(total),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const getTemplateById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT s.*, u.username, u.avatar_url 
            FROM recode_scripts s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND s.created_at <= NOW()
        `;
        const [rows]: any = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Template not found' });
        }

        res.removeHeader('Pragma');
        res.removeHeader('Expires');
        res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1800');
        res.json({ success: true, data: rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
