import { Request, Response } from 'express';
import pool from '../config/database';
import { catchAsync } from '../utils/catchAsync';

export const searchContent = catchAsync(async (req: Request, res: Response) => {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
        return res.json({ success: true, data: { threads: [], posts: [] } });
    }

    const searchQuery = q as string;

    const term = `%${searchQuery}%`;

    // 1. Search Threads
    const [threads]: any = await pool.query(`
        SELECT t.id, t.title, t.slug, t.created_at, u.username, u.avatar_url,
        CASE
            WHEN t.title ILIKE ? THEN 2
            WHEN t.content ILIKE ? THEN 1
            ELSE 0
        END as relevance
        FROM threads t
        JOIN users u ON t.user_id = u.id
        WHERE (t.title ILIKE ? OR t.content ILIKE ?) AND t.created_at <= NOW()
        ORDER BY relevance DESC, t.created_at DESC
        LIMIT 10
    `, [term, term, term, term]);

    // 2. Search Posts
    const [posts]: any = await pool.query(`
        SELECT p.id, p.content, p.thread_id, p.created_at, u.username,
        t.title as thread_title, t.slug as thread_slug,
        1 as relevance
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN threads t ON p.thread_id = t.id
        WHERE p.content ILIKE ? AND p.created_at <= NOW()
        ORDER BY p.created_at DESC
        LIMIT 10
    `, [term]);

    res.json({
        success: true,
        data: {
            threads,
            posts
        }
    });
});
