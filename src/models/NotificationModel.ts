import pool from '../config/database';

export type NotificationType = 'reply' | 'reaction';
export type NotificationTargetType = 'thread' | 'post';

export class NotificationModel {
    static async create(data: {
        user_id: number,
        actor_id: number,
        type: NotificationType,
        target_type: NotificationTargetType,
        target_id: number,
        message?: string
    }) {
        // Tránh thông báo cho chính mình
        if (data.user_id === data.actor_id) return null;

        const [result]: any = await pool.query(
            'INSERT INTO notifications (user_id, actor_id, type, target_type, target_id, message) VALUES (?, ?, ?, ?, ?, ?)',
            [data.user_id, data.actor_id, data.type, data.target_type, data.target_id, data.message]
        );
        return result.insertId;
    }

    static async getByUser(userId: number, limit: number = 20) {
        const [rows] = await pool.query(`
            SELECT n.*, u.username as actor_name, u.avatar_url as actor_avatar
            FROM notifications n
            JOIN users u ON n.actor_id = u.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT ?
        `, [userId, limit]);
        return rows;
    }

    static async getUnreadCount(userId: number) {
        const [rows]: any = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return rows[0].count;
    }

    static async markAsRead(notificationId: number, userId: number) {
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
    }

    static async markAllAsRead(userId: number) {
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
            [userId]
        );
    }
}
