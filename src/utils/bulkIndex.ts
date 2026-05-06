import pool from '../config/database';
import IndexingService from '../services/IndexingService';

async function startBulkIndex() {
    console.log('[BulkIndex] Loading script URLs from the database...');
    try {
        const [scripts]: any = await pool.query('SELECT id FROM recode_scripts WHERE created_at <= NOW()');

        console.log(`[BulkIndex] Found ${scripts.length} scripts. Starting Google notifications...`);

        for (const script of scripts) {
            const url = `https://recode.arteosocial.com/templates/${script.id}`;
            await IndexingService.notify(url);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('[BulkIndex] Complete.');
    } catch (error: any) {
        console.error('[BulkIndex] Failed:', error.message);
    }
}

startBulkIndex();
