import { Request, Response } from 'express';
import { databaseInfo, pingDatabase } from '../config/database';

const startedAt = Date.now();

export const getSystemStatus = async (_req: Request, res: Response) => {
    const checkedAt = new Date().toISOString();
    const services = [
        {
            name: 'API Server',
            status: 'operational',
            region: process.env.AWS_REGION || process.env.SERVER_REGION || 'configured-host',
            latencyMs: 0,
            source: 'runtime',
        },
    ];

    try {
        const start = Date.now();
        const dbPing = await pingDatabase();
        const latencyMs = Date.now() - start;

        services.push({
            name: 'PostgreSQL Database',
            status: dbPing?.ok === 1 ? 'operational' : 'degraded',
            region: process.env.SUPABASE_REGION || process.env.DB_REGION || process.env.AWS_REGION || 'postgres',
            latencyMs,
            source: 'live-database-ping',
        });

        return res.json({
            success: true,
            checkedAt,
            dataSource: 'live',
            message: 'Live backend and database status.',
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            database: {
                host: databaseInfo.host,
                port: databaseInfo.port,
                name: databaseInfo.database,
                ssl: databaseInfo.ssl,
                serverTime: dbPing?.server_time,
            },
            services,
        });
    } catch (error: any) {
        services.push({
            name: 'PostgreSQL Database',
            status: 'down',
            region: process.env.SUPABASE_REGION || process.env.DB_REGION || process.env.AWS_REGION || 'postgres',
            latencyMs: 0,
            source: 'live-database-ping',
        });

        return res.status(503).json({
            success: false,
            checkedAt,
            dataSource: 'live',
            message: 'Backend is running but database health check failed.',
            error: error.message,
            uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
            database: {
                host: databaseInfo.host,
                port: databaseInfo.port,
                name: databaseInfo.database,
                ssl: databaseInfo.ssl,
            },
            services,
        });
    }
};
