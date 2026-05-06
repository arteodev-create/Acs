import fs from 'fs';
import path from 'path';
import { PHASE_A, PHASE_B, SQL_BATCH_SIZE } from './config';
import { slugify as slugifyUtil } from '../../utils/slugUtils';

// ═══════════════════════════════════════════════════════════
// HELPERS — Random, Dates, SQL, File I/O
// ═══════════════════════════════════════════════════════════

/** Random integer in [min, max] inclusive */
export function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick one random element */
export function pick<T>(arr: readonly T[]): T {
    return arr[randInt(0, arr.length - 1)];
}

/** Pick N unique random elements */
export function pickN<T>(arr: readonly T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, arr.length));
}

/** Weighted random pick: weights = { option: probability } */
export function weightedPick<T extends string>(weights: Record<T, number>): T {
    const rand = Math.random();
    let cumulative = 0;
    for (const [key, weight] of Object.entries(weights) as [T, number][]) {
        cumulative += weight;
        if (rand <= cumulative) return key;
    }
    return Object.keys(weights)[0] as T;
}

/** Random float in [min, max) */
export function randFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Generate a natural timestamp within a date range.
 * Simulates realistic human activity patterns:
 * - Peak hours: 9AM–11PM (80% of activity)
 * - Off-peak: 11PM–9AM (20% of activity)
 * - Slight weekend dip
 * Every timestamp is unique down to the SECOND.
 */
export function naturalTimestamp(start: Date, end: Date): Date {
    const startMs = start.getTime();
    const endMs = end.getTime();

    // Pick a random day within range
    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.floor((endMs - startMs) / dayMs);
    const dayOffset = randInt(0, Math.max(0, totalDays - 1));
    const baseDate = new Date(startMs + dayOffset * dayMs);

    // Natural hour distribution (weighted toward waking hours)
    let hour: number;
    if (Math.random() < 0.80) {
        // Peak: 9AM–11PM
        hour = randInt(9, 22);
    } else {
        // Off-peak: scattered in early morning / late night
        const offPeakSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 23];
        hour = pick(offPeakSlots);
    }

    const minute = randInt(0, 59);
    const second = randInt(0, 59);

    baseDate.setHours(hour, minute, second, 0);

    // Ensure within bounds
    if (baseDate.getTime() < startMs) return new Date(startMs + randInt(0, 3600) * 1000);
    if (baseDate.getTime() > endMs) return new Date(endMs - randInt(0, 3600) * 1000);

    return baseDate;
}

/**
 * Generate timestamp for a specific phase (A or B).
 */
export function phaseTimestamp(phase: 'A' | 'B'): Date {
    const p = phase === 'A' ? PHASE_A : PHASE_B;
    return naturalTimestamp(p.start, p.end);
}

/**
 * Format Date to MySQL DATETIME string: 'YYYY-MM-DD HH:mm:ss'
 */
export function formatMySQL(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Generate a timestamp that's AFTER a given reference timestamp
 * (used for replies that must come after the parent post).
 */
export function timestampAfter(ref: Date, maxHoursLater: number = 72): Date {
    const offsetMs = randInt(60, maxHoursLater * 3600) * 1000; // At least 1 minute after
    const result = new Date(ref.getTime() + offsetMs);

    // Cap at phase B end
    const cap = PHASE_B.end.getTime();
    if (result.getTime() > cap) return new Date(cap - randInt(1, 3600) * 1000);

    return result;
}

// ═══════════════════════════════════════════════════════════
// SQL Helpers
// ═══════════════════════════════════════════════════════════

/** Escape single quotes for SQL strings */
export function esc(val: string): string {
    return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Wrap value in SQL quotes, handling NULL */
export function sqlStr(val: string | null): string {
    if (val === null) return 'NULL';
    return `'${esc(val)}'`;
}

/** Convert boolean to SQL */
export function sqlBool(val: boolean): string {
    return val ? 'TRUE' : 'FALSE';
}

/** Slugify a string */
export function slugify(text: string): string {
    return slugifyUtil(text);
}

/** Generate a unique slug (Simplified: user wants clean URLs) */
export function uniqueSlug(text: string): string {
    return slugify(text);
}

// ═══════════════════════════════════════════════════════════
// File I/O — Streaming SQL Writer
// ═══════════════════════════════════════════════════════════

export class SqlFileWriter {
    private stream: fs.WriteStream;
    private rowCount = 0;
    private batchOpen = false;
    private totalWritten = 0;

    constructor(
        private filePath: string,
        private tableName: string,
        private columns: string[],
        private header?: string
    ) {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        fs.mkdirSync(dir, { recursive: true });

        this.stream = fs.createWriteStream(filePath, { flags: 'w' });

        // Write file header
        const headerText = header || `-- Generated: ${new Date().toISOString()}\n-- Table: ${tableName}\n`;
        this.stream.write(headerText + '\n');
    }

    /** Add a row of values (already formatted as SQL value strings) */
    addRow(values: string[]): void {
        if (!this.batchOpen) {
            this.stream.write(
                `INSERT INTO \`${this.tableName}\` (${this.columns.map(c => `\`${c}\``).join(', ')}) VALUES\n`
            );
            this.batchOpen = true;
            this.rowCount = 0;
        }

        const sep = this.rowCount > 0 ? ',\n' : '';
        this.stream.write(`${sep}(${values.join(', ')})`);
        this.rowCount++;
        this.totalWritten++;

        if (this.rowCount >= SQL_BATCH_SIZE) {
            this.stream.write(';\n\n');
            this.batchOpen = false;
            this.rowCount = 0;
        }
    }

    /** Close current batch and the file */
    close(): Promise<void> {
        return new Promise((resolve) => {
            if (this.batchOpen) {
                this.stream.write(';\n');
            }
            this.stream.write(`\n-- Total rows: ${this.totalWritten}\n`);
            this.stream.end(() => resolve());
        });
    }

    get written(): number {
        return this.totalWritten;
    }
}

/** Progress logger */
export function logProgress(label: string, current: number, total: number): void {
    if (current % 1000 === 0 || current === total) {
        const pct = ((current / total) * 100).toFixed(1);
        process.stdout.write(`\r  [${label}] ${current.toLocaleString()} / ${total.toLocaleString()} (${pct}%)  `);
        if (current === total) process.stdout.write('\n');
    }
}

/** Determine which phase a date falls in */
export function getPhase(date: Date): 'A' | 'B' {
    return date.getTime() < PHASE_B.start.getTime() ? 'A' : 'B';
}
