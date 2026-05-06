import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { Pool } = require('pg');

type QueryParams = Array<unknown>;
type PgClient = {
    query: (sql: string, params?: QueryParams) => Promise<{ rows: any[]; rowCount: number | null }>;
    release: () => void;
};

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;
const hasProductionPgConfig = Boolean(
    (process.env.PGHOST || process.env.POSTGRES_HOST || process.env.SUPABASE_DB_HOST) &&
    (process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.SUPABASE_DB_NAME) &&
    (process.env.PGUSER || process.env.POSTGRES_USER || process.env.SUPABASE_DB_USER) &&
    (process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.SUPABASE_DB_PASSWORD)
);

if (isProduction) {
    if (!databaseUrl && !hasProductionPgConfig) {
        throw new Error(
            'Missing production database configuration. Set DATABASE_URL, SUPABASE_DB_URL, POSTGRES_URL, or the PGHOST/PGDATABASE/PGUSER/PGPASSWORD variables.'
        );
    }
}

const dbHost = process.env.PGHOST || process.env.POSTGRES_HOST || process.env.SUPABASE_DB_HOST || '127.0.0.1';
const dbPort = Number(process.env.PGPORT || process.env.POSTGRES_PORT || process.env.SUPABASE_DB_PORT || 5432);
const dbName = process.env.PGDATABASE || process.env.POSTGRES_DB || process.env.SUPABASE_DB_NAME || 'recode_social';
const dbUser = process.env.PGUSER || process.env.POSTGRES_USER || process.env.SUPABASE_DB_USER || 'postgres';
const dbPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.SUPABASE_DB_PASSWORD || '';
const useSsl = ['true', '1', 'required'].includes(String(process.env.DB_SSL || process.env.PGSSLMODE || process.env.SUPABASE_DB_SSL || '').toLowerCase());
const sslCaPath = process.env.DB_SSL_CA_PATH || process.env.PGSSLROOTCERT || process.env.SUPABASE_DB_SSL_CA_PATH;

const sslConfig = useSsl
    ? {
        rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false',
        ...(sslCaPath && fs.existsSync(sslCaPath) ? { ca: fs.readFileSync(sslCaPath, 'utf8') } : {}),
    }
    : undefined;

const pgPool = new Pool(databaseUrl
    ? {
        connectionString: databaseUrl,
        max: Number(process.env.DB_CONNECTION_LIMIT || 25),
        connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 30000),
        ssl: sslConfig,
    }
    : {
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUser,
        password: dbPassword,
        max: Number(process.env.DB_CONNECTION_LIMIT || 25),
        connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS || 30000),
        ssl: sslConfig,
    });

const normalizeSql = (sql: string) => sql
    .replace(/`([^`]+)`/g, '"$1"')
    .replace(/\bis_read\s*=\s*0\b/g, 'is_read = false')
    .replace(/\bis_read\s*=\s*1\b/g, 'is_read = true');

const convertPlaceholders = (sql: string, params: QueryParams = []) => {
    let index = 0;
    const expandedParams: QueryParams = [];
    let convertedSql = normalizeSql(sql).replace(/IN\s*\(\s*\?\s*\)/gi, () => {
        index += 1;
        expandedParams.push(params[index - 1]);
        return `= ANY($${index})`;
    });

    convertedSql = convertedSql.replace(/\?/g, () => {
        index += 1;
        expandedParams.push(params[index - 1]);
        return `$${index}`;
    });

    return { sql: convertedSql, params: expandedParams };
};

const shouldAppendReturningId = (sql: string) => {
    const trimmed = sql.trim().toLowerCase();
    return trimmed.startsWith('insert into') && !trimmed.includes(' returning ');
};

const executePostgresQuery = async (client: typeof pgPool | PgClient, sql: string, params: QueryParams = []) => {
    const querySql = shouldAppendReturningId(sql) ? `${sql} RETURNING id` : sql;
    const converted = convertPlaceholders(querySql, params);
    const result = await client.query(converted.sql, converted.params);
    const metadata = {
        insertId: result.rows?.[0]?.id || null,
        affectedRows: result.rowCount || 0,
        rowCount: result.rowCount || 0,
    };
    return [result.rows, metadata] as any;
};

const pool = {
    query: (sql: string, params?: QueryParams) => executePostgresQuery(pgPool, sql, params || []),
    getConnection: async () => {
        const client: PgClient = await pgPool.connect();
        return {
            query: (sql: string, params?: QueryParams) => executePostgresQuery(client, sql, params || []),
            beginTransaction: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK'),
            release: () => client.release(),
        };
    },
};

export const databaseInfo = {
    engine: 'postgres',
    host: databaseUrl ? 'connection-string' : dbHost,
    port: databaseUrl ? 5432 : dbPort,
    database: databaseUrl ? 'postgres' : dbName,
    ssl: Boolean(sslConfig),
};

export const pingDatabase = async () => {
    const [rows]: any = await pool.query('SELECT 1 AS ok, NOW() AS server_time');
    return rows[0];
};

export default pool;
