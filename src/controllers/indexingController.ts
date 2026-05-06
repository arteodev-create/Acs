import { Request, Response } from 'express';
import { google } from 'googleapis';
import pool from '../config/database';
import path from 'path';
import fs from 'fs';

// Configuration
const BATCH_SIZE = 100; // Google limit usually allow up to 100 per batch manually, but API calls are single. 
// Actually Google Indexing API is 1 URL per request, but we can parallelize.
// Quota: 200 per day for normal, higher for others. We should be careful.

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'service_account.json');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://recode.arteosocial.com';

export const submitToGoogle = async (req: Request, res: Response) => {
    try {
        // 1. Check Service Account
        if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
            return res.status(400).json({
                success: false,
                message: 'Service Account file (service_account.json) missing in server root.',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // 2. Auth with Google
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_PATH,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });
        const indexing = google.indexing({ version: 'v3', auth });

        // 3. Fetch URLs to Index
        // Get Users
        const [users]: any = await pool.query('SELECT username FROM users WHERE is_verified = 1 OR reputation_points > 10 LIMIT 50');
        // Get Active Threads
        const [threads]: any = await pool.query('SELECT slug FROM threads WHERE is_locked = 0 ORDER BY created_at DESC LIMIT 50');
        // Get Blog Posts
        const [blogs]: any = await pool.query('SELECT slug FROM blog_posts ORDER BY created_at DESC LIMIT 50');
        // Get Templates
        const [templates]: any = await pool.query('SELECT id FROM recode_scripts WHERE is_public = 1 ORDER BY stars DESC LIMIT 50');

        const urls: string[] = [];

        users.forEach((u: any) => urls.push(`${FRONTEND_URL}/@${u.username}`));
        threads.forEach((t: any) => urls.push(`${FRONTEND_URL}/forum/${t.slug}`));
        blogs.forEach((b: any) => urls.push(`${FRONTEND_URL}/blog/${b.slug}`));
        templates.forEach((t: any) => urls.push(`${FRONTEND_URL}/templates/${t.id}`));

        if (urls.length === 0) {
            return res.json({ success: true, message: 'No URLs found to index.', submitted: 0 });
        }

        // 4. Submit to Google (Parallel Limit)
        const results = [];
        let successCount = 0;
        let failCount = 0;

        // Process in chunks to avoid rate limits
        for (const url of urls) {
            try {
                // Publish URL_UPDATED
                await indexing.urlNotifications.publish({
                    requestBody: {
                        url: url,
                        type: 'URL_UPDATED'
                    }
                });
                results.push({ url, status: 'submitted' });
                successCount++;
            } catch (error: any) {
                console.error(`Failed to index ${url}:`, error.message);
                results.push({ url, status: 'failed', error: error.message });
                failCount++;
            }
        }

        res.json({
            success: true,
            message: `Indexing Process Complete. Success: ${successCount}, Failed: ${failCount}`,
            details: results
        });

    } catch (error: any) {
        console.error('Indexing Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getIndexingStatus = async (req: Request, res: Response) => {
    // Check if service account exists
    const hasCredentials = fs.existsSync(SERVICE_ACCOUNT_PATH);

    // Get Stats
    const [userCount]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    const [threadCount]: any = await pool.query('SELECT COUNT(*) as count FROM threads');
    const [blogCount]: any = await pool.query('SELECT COUNT(*) as count FROM blog_posts');

    res.json({
        success: true,
        hasCredentials,
        stats: {
            users: userCount[0].count,
            threads: threadCount[0].count,
            blogs: blogCount[0].count,
            totalUrls: userCount[0].count + threadCount[0].count + blogCount[0].count
        }
    });
};
