import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

class IndexingService {
    private SCOPES = ['https://www.googleapis.com/auth/indexing'];

    async notify(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
        try {
            let auth;

            if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
                auth = new google.auth.GoogleAuth({
                    credentials: {
                        client_email: process.env.GOOGLE_CLIENT_EMAIL,
                        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    },
                    scopes: this.SCOPES,
                });
            } else {
                const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
                    ? path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH)
                    : path.join(__dirname, '../config/recode-f14b7-firebase-adminsdk-fbsvc-3ac23fb08b.json');

                if (!fs.existsSync(keyPath)) {
                    console.warn('[IndexingService] Missing Google credentials. Auto-index skipped.');
                    return;
                }

                auth = new google.auth.GoogleAuth({
                    keyFile: keyPath,
                    scopes: this.SCOPES,
                });
            }

            const client = await auth.getClient();
            const indexing = google.indexing({
                version: 'v3',
                auth: client as any,
            });

            const response = await indexing.urlNotifications.publish({
                requestBody: {
                    url,
                    type,
                },
            });

            console.log(`[IndexingService] Notified Google for URL: ${url}. Status: ${response.statusText}`);
            return response.data;
        } catch (error: any) {
            if (error.message?.includes('Quota exceeded') || error.code === 429) {
                console.warn(`[IndexingService] Google quota exceeded. Skipped URL: ${url}`);
            } else {
                console.error('[IndexingService] Google notify failed:', error.message);
            }
        }
    }
}

export default new IndexingService();
