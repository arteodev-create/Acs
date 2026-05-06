import { OUTPUT_DIRS } from './config';
import { SqlFileWriter, sqlStr } from './helpers';

// ═══════════════════════════════════════════════════════════
// SYSTEM STATUS GENERATOR — 6 service monitors
// ═══════════════════════════════════════════════════════════

const SERVICES = [
    { name: 'API Server', status: 'operational', uptime: 99.98 },
    { name: 'MySQL Database', status: 'operational', uptime: 99.95 },
    { name: 'Redis Cache', status: 'operational', uptime: 99.99 },
    { name: 'CDN (Cloudflare)', status: 'operational', uptime: 99.97 },
    { name: 'Search Engine', status: 'operational', uptime: 99.90 },
    { name: 'WebSocket Server', status: 'operational', uptime: 99.92 },
];

export async function generateSystemStatus(): Promise<void> {
    console.log('\n🖥️  Generating system status...');

    const writer = new SqlFileWriter(
        `${OUTPUT_DIRS.phaseA.systemStatus}/system_status.sql`,
        'system_status',
        ['service_name', 'status', 'uptime_percentage']
    );

    for (const service of SERVICES) {
        writer.addRow([
            sqlStr(service.name),
            sqlStr(service.status),
            service.uptime.toFixed(2),
        ]);
    }

    await writer.close();
    console.log(`  ✅ ${SERVICES.length} service statuses generated`);
}
