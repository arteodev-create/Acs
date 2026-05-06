import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/authMiddleware';
import IndexingService from '../services/IndexingService';
import { v2 as cloudinary } from 'cloudinary';

export const updateProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    // Explicitly configure cloudinary on the fly
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
        secure: true
    });

    const { username, headline, company, location, github_handle, twitter_handle, skills } = req.body;
    let { avatar_url } = req.body;
    const user_current = req.user;

    if (!user_current) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const userId = user_current.id;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required.' });
    }

    try {
        // 0. Auto-Upload Avatar to Cloudinary (if external link)
        if (avatar_url && !avatar_url.includes('res.cloudinary.com')) {
            try {
                console.log(`[Cloudinary] Uploading avatar for ${username}...`);
                const uploadRes = await cloudinary.uploader.upload(avatar_url, {
                    folder: 'recode_avatars',
                    public_id: `avatar_${username}`,
                    overwrite: true,
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                });
                avatar_url = uploadRes.secure_url;
                console.log(`[Cloudinary] Success: ${avatar_url}`);
            } catch (err: any) {
                console.error(`[Cloudinary Error]: ${err.message}`);
                // Fallback: keep original URL if upload fails
            }
        }

        // 1. Check if username exists (if changed)
        if (username !== user_current.username) {
            const [existing]: any = await pool.query('SELECT * FROM users WHERE username = ? AND id != ?', [username, userId]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Username is already taken.' });
            }
        }

        // 2. Update info
        await pool.query(
            `UPDATE users SET 
                username = ?, 
                avatar_url = ?,
                headline = ?,
                company = ?,
                location = ?,
                github_handle = ?,
                twitter_handle = ?,
                skills = ?
            WHERE id = ?`,
            [
                username,
                avatar_url || (user_current as any).avatar_url,
                headline,
                company,
                location,
                github_handle,
                twitter_handle,
                JSON.stringify(skills || []),
                userId
            ]
        );

        // 3. Get updated user
        const [updated]: any = await pool.query('SELECT id, username, email, role, avatar_url, headline, company, location, github_handle, twitter_handle, skills FROM users WHERE id = ?', [userId]);
        const user = updated[0];

        // Tự động thông báo cho Google về sự thay đổi Profile
        const profileUrl = `https://recode.arteosocial.com/${user.username}`;
        IndexingService.notify(profileUrl);

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url,
                headline: user.headline,
                company: user.company,
                location: user.location,
                github_handle: user.github_handle,
                twitter_handle: user.twitter_handle,
                skills: user.skills
            },
            message: 'Profile updated successfully.'
        });

    } catch (error: any) {
        console.error('[Update Profile Error]:', error.message);
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
};

export const getProfileByUsername = async (req: any, res: Response): Promise<any> => {
    const { username } = req.params;

    try {
        // 1. Get User Info (Only those who have reached their created_at time)
        const [users]: any = await pool.query(
            'SELECT id, username, avatar_url, headline, company, location, github_handle, twitter_handle, skills, created_at, reputation_points, role FROM users WHERE username = ? AND created_at <= NOW()',
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const user = users[0];

        // 2. Get Recent Threads
        const [threads]: any = await pool.query(
            `SELECT t.id, t.title, t.slug, t.created_at, c.name as category_name 
             FROM threads t 
             JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ? 
             ORDER BY t.created_at DESC 
             LIMIT 5`,
            [user.id]
        );

        res.json({
            success: true,
            data: {
                ...user,
                avatar_url: user.avatar_url,
                avatar: user.avatar_url, // Consistency alias
                skills: user.skills ? (typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills) : [],
                recent_threads: threads || []
            }
        });

    } catch (error: any) {
        console.error('[Get Profile Error]:', error.message);
        res.status(500).json({ success: false, message: 'Server error fetching profile.' });
    }
};
