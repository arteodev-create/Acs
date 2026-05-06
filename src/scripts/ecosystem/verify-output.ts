import fs from 'fs';
import path from 'path';
import { PHASE_A, PHASE_B, BASE_OUTPUT } from './config';

async function verify() {
    console.log('🔍 Final Verification of Generated Data...\n');

    const phases = [PHASE_A.label, PHASE_B.label];
    const tables = [
        'người dùng', 'chuyên mục', 'threads', 'posts',
        'reactions', 'follows', 'notifications',
        'blog_posts', 'recode_scripts', 'system_status'
    ];

    let grandTotal = 0;

    for (const phase of phases) {
        console.log(`📂 Phase: ${phase}`);
        const phasePath = path.join(BASE_OUTPUT, phase);

        if (!fs.existsSync(phasePath)) {
            console.log(`  ❌ Phase directory not found: ${phasePath}`);
            continue;
        }

        for (const table of tables) {
            const tablePath = path.join(phasePath, table);
            if (!fs.existsSync(tablePath)) continue;

            const files = fs.readdirSync(tablePath).filter(f => f.endsWith('.sql'));
            for (const file of files) {
                const fullPath = path.join(tablePath, file);
                const content = fs.readFileSync(fullPath, 'utf8');
                const match = content.match(/-- Total rows: (\d+)/);
                const count = match ? parseInt(match[1]) : 0;

                console.log(`  - ${table.padEnd(20)}: ${count.toLocaleString().padStart(8)} rows (${file})`);
                grandTotal += count;
            }
        }
        console.log('');
    }

    console.log(`✅ Verification complete. Total records across all files: ${grandTotal.toLocaleString()}`);
}

verify().catch(console.error);
