import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const absolutePath = configuredPath
    ? path.resolve(process.cwd(), configuredPath)
    : null;

try {
    if (!absolutePath) {
        console.log('[Firebase] Admin SDK skipped: FIREBASE_SERVICE_ACCOUNT_PATH is not configured.');
    } else if (!fs.existsSync(absolutePath)) {
        console.warn(`[Firebase] Admin SDK skipped: service account file was not found at ${absolutePath}`);
    } else {
        const content = fs.readFileSync(absolutePath, 'utf8');
        const serviceAccount = JSON.parse(content);

        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`[Firebase] Admin SDK initialized using: ${absolutePath}`);
        }
    }
} catch (error: any) {
    console.warn('[Firebase] Admin SDK skipped:', error.message);
}

export default admin;
