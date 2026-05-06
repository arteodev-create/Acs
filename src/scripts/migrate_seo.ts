import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pool from '../config/database';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, '../../database/migrations/fix_missing_indexed_col.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error('Migration file not found:', sqlPath);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        const statements = sql.split(';').filter((statement) => statement.trim().length > 0);

        console.log(`Running PostgreSQL migration from ${sqlPath}...`);

        for (const statement of statements) {
            try {
                await pool.query(statement);
                console.log('Executed:', statement.substring(0, 50) + '...');
            } catch (err: any) {
                if (err.code === '42701') {
                    console.warn('Column already exists, skipping:', statement.substring(0, 50) + '...');
                } else {
                    console.error('Error executing statement:', err.message);
                }
            }
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
