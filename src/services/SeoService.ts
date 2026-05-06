
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import pool from '../config/database';

class SeoService {
    private keyFilePath: string | null = null;
    private jwtClient: any = null;

    constructor() {
        this.keyFilePath = this.findKeyFile();
    }

    public hasCredentials(): boolean {
        return this.keyFilePath !== null;
    }

    private findKeyFile(): string | null {
        const spécifiqueFilename = 'recode-f14b7-firebase-adminsdk-fbsvc-3ac23fb08b.json';
        const fallbackFilename = 'service_account.json';

        const possiblePaths = [
            process.env.GOOGLE_APPLICATION_CREDENTIALS,
            // Root paths
            path.join(process.cwd(), fallbackFilename),
            path.join(process.cwd(), spécifiqueFilename),
            // Config paths
            path.join(process.cwd(), 'src/config', spécifiqueFilename),
            path.join(process.cwd(), 'dist/config', spécifiqueFilename),
            path.join(process.cwd(), 'config', spécifiqueFilename),
            // Relatif to __dirname (dist/services)
            path.join(__dirname, '../../', fallbackFilename),
            path.join(__dirname, '../../', spécifiqueFilename),
            path.join(__dirname, '../config', spécifiqueFilename),
        ];

        for (const p of possiblePaths) {
            if (p && fs.existsSync(p)) {
                console.log(`[SeoService] Found credentials at: ${p}`);
                return p;
            }
        }

        console.warn(`[SEO Warning] Could not find Service Account Key. Checked ${possiblePaths.length} paths.`);
        console.warn(`[SEO Info] Current Working Directory: ${process.cwd()}`);
        return null;
    }

    private async getAuthClient() {
        if (this.jwtClient) return this.jwtClient;

        if (!this.keyFilePath) {
            throw new Error('Service Account Key not found.');
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: this.keyFilePath,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        this.jwtClient = await auth.getClient();
        return this.jwtClient;
    }

    public async submitUrl(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
        try {
            const authClient = await this.getAuthClient();
            const indexing = google.indexing({
                version: 'v3',
                auth: authClient as any,
            });

            const result = await indexing.urlNotifications.publish({
                requestBody: {
                    url: url,
                    type: type,
                },
            });

            console.log(`[SeoService] Submitted ${url}:`, result.data);

            // Update DB
            this.updateLastIndexed(url);

            return result.data;
        } catch (error: any) {
            console.error('[SeoService Error] Submit:', error.message);
            throw error;
        }
    }

    public async getUrlMetadata(url: string) {
        try {
            const authClient = await this.getAuthClient();
            const indexing = google.indexing({
                version: 'v3',
                auth: authClient as any,
            });

            const result = await indexing.urlNotifications.getMetadata({
                url: url,
            });

            return result.data;
        } catch (error: any) {
            console.error('[SeoService Error] Get Metadata:', error.message);
            if (error.code === 404) return null; // Not found in Indexing API records
            throw error;
        }
    }

    private async updateLastIndexed(url: string) {
        const now = new Date();
        try {
            if (url.includes('/forum/')) {
                const slug = url.split('/forum/')[1];
                await pool.query('UPDATE threads SET last_indexed_at = ? WHERE slug = ?', [now, slug]);
            } else if (url.includes('/blog/')) {
                const slug = url.split('/blog/')[1];
                await pool.query('UPDATE blog_posts SET last_indexed_at = ? WHERE slug = ?', [now, slug]);
            } else if (url.includes('/@')) {
                const username = url.split('/@')[1];
                await pool.query('UPDATE users SET last_indexed_at = ? WHERE username = ?', [now, username]);
            }
        } catch (err) {
            console.error('[SeoService] Failed to update DB:', err);
        }
    }
}

export default new SeoService();
