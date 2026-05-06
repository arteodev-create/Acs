import { CATEGORIES, OUTPUT_DIRS } from './config';
import { SqlFileWriter, sqlStr } from './helpers';

// ═══════════════════════════════════════════════════════════
// CATEGORIES GENERATOR — 10 forum categories
// ═══════════════════════════════════════════════════════════

export async function generateCategories(): Promise<void> {
    console.log('\n📁 Generating categories...');

    const writer = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.categories}/categories.sql`,
        'categories',
        ['name', 'slug', 'description', 'icon_name', 'display_order']
    );

    for (const cat of CATEGORIES) {
        writer.addRow([
            sqlStr(cat.name),
            sqlStr(cat.slug),
            sqlStr(cat.description),
            sqlStr(cat.icon),
            cat.order.toString(),
        ]);
    }

    await writer.close();
    console.log(`  ✅ ${CATEGORIES.length} categories generated`);
}
