import pool from '../config/database';

export class ReactionModel {
    static async toggle(userId: number, targetType: 'thread' | 'post', targetId: number, reactionType: 'like' | 'insightful' | 'helpful') {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Check existing reaction
            const [existing]: any = await connection.query(
                'SELECT id, reaction_type FROM reactions WHERE user_id = ? AND target_type = ? AND target_id = ?',
                [userId, targetType, targetId]
            );

            let action: 'added' | 'removed' | 'changed';
            let reputationChange = 0;

            // Define point weights
            const weights = {
                like: 1,
                insightful: 3,
                helpful: 5
            };

            // Get target author ID
            const authorQuery = targetType === 'thread'
                ? 'SELECT user_id FROM threads WHERE id = ?'
                : 'SELECT user_id FROM posts WHERE id = ?';
            const [authors]: any = await connection.query(authorQuery, [targetId]);
            const authorId = authors[0]?.user_id;

            if (existing.length > 0) {
                if (existing[0].reaction_type === reactionType) {
                    // Remove reaction
                    await connection.query('DELETE FROM reactions WHERE id = ?', [existing[0].id]);
                    action = 'removed';
                    reputationChange = -weights[reactionType as keyof typeof weights];
                } else {
                    // Change reaction type
                    const oldType = existing[0].reaction_type as keyof typeof weights;
                    await connection.query(
                        'UPDATE reactions SET reaction_type = ? WHERE id = ?',
                        [reactionType, existing[0].id]
                    );
                    action = 'changed';
                    reputationChange = weights[reactionType] - weights[oldType];
                }
            } else {
                // Add new reaction
                await connection.query(
                    'INSERT INTO reactions (user_id, target_type, target_id, reaction_type) VALUES (?, ?, ?, ?)',
                    [userId, targetType, targetId, reactionType]
                );
                action = 'added';
                reputationChange = weights[reactionType];
            }

            // 2. Update author reputation (if not reacting to own content)
            if (authorId && authorId !== userId) {
                await connection.query(
                    'UPDATE users SET reputation_points = reputation_points + ? WHERE id = ?',
                    [reputationChange, authorId]
                );
            }

            // 3. Get new counts
            const [newCounts]: any = await connection.query(`
                SELECT 
                    SUM(CASE WHEN reaction_type = 'like' THEN 1 ELSE 0 END) as \`like\`,
                    SUM(CASE WHEN reaction_type = 'insightful' THEN 1 ELSE 0 END) as insightful,
                    SUM(CASE WHEN reaction_type = 'helpful' THEN 1 ELSE 0 END) as helpful,
                    COUNT(*) as total
                FROM reactions 
                WHERE target_type = ? AND target_id = ?
            `, [targetType, targetId]);

            await connection.commit();
            return {
                action,
                counts: {
                    like: parseInt(newCounts[0].like || 0),
                    insightful: parseInt(newCounts[0].insightful || 0),
                    helpful: parseInt(newCounts[0].helpful || 0),
                    total: parseInt(newCounts[0].total || 0)
                }
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getUserReactions(userId: number, targetType: 'thread' | 'post', targetIds: number[]) {
        if (targetIds.length === 0) return {};
        const [rows]: any = await pool.query(
            'SELECT target_id, reaction_type FROM reactions WHERE user_id = ? AND target_type = ? AND target_id IN (?)',
            [userId, targetType, targetIds]
        );

        return rows.reduce((acc: any, row: any) => {
            acc[row.target_id] = row.reaction_type;
            return acc;
        }, {});
    }
}
