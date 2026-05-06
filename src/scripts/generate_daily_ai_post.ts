import * as dotenv from 'dotenv';
import axios from 'axios';
import pool from '../config/database';
import { slugify } from '../utils/slugUtils';

dotenv.config();

type DailyArticle = {
    title: string;
    summary: string;
    category: string;
    content: string;
};

const MODEL = process.env.AI_DAILY_POST_MODEL || 'inclusionai/ling-2.6-1t:free';
const PROMPT_VERSION = 'v1';
const START_DATE = process.env.AI_DAILY_POST_START_DATE || '2025-05-03';
const TIMEZONE = process.env.AI_DAILY_POST_TIMEZONE || 'Asia/Bangkok';
const MAX_TOKENS = Number(process.env.AI_DAILY_POST_MAX_TOKENS || 1200);
const TIMEOUT_MS = Number(process.env.AI_DAILY_POST_TIMEOUT_MS || 60000);

const isEnabled = () => String(process.env.AI_DAILY_POST_ENABLED || 'false').toLowerCase() === 'true';
const isDryRun = () => String(process.env.AI_DAILY_POST_DRY_RUN || 'false').toLowerCase() === 'true';

const getLocalDate = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
};

const daysBetween = (start: string, end: string) => {
    const startMs = Date.parse(`${start}T00:00:00Z`);
    const endMs = Date.parse(`${end}T00:00:00Z`);
    return Math.floor((endMs - startMs) / 86400000);
};

const unwrapRows = async (sql: string, params: unknown[] = []) => {
    const [rows]: any = await pool.query(sql, params);
    return rows;
};

const getAuthorId = async () => {
    if (process.env.AI_DAILY_POST_AUTHOR_ID) {
        return Number(process.env.AI_DAILY_POST_AUTHOR_ID);
    }

    const rows = await unwrapRows(
        `SELECT id FROM users WHERE role IN ('superadmin', 'admin') ORDER BY id ASC LIMIT 1`
    );
    if (rows[0]?.id) return Number(rows[0].id);

    const fallback = await unwrapRows(`SELECT id FROM users ORDER BY id ASC LIMIT 1`);
    if (fallback[0]?.id) return Number(fallback[0].id);

    throw new Error('No author user found. Set AI_DAILY_POST_AUTHOR_ID or create an admin user.');
};

const ensureSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ai_daily_posts (
            id BIGSERIAL PRIMARY KEY,
            run_date DATE NOT NULL UNIQUE,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            blog_post_id BIGINT REFERENCES blog_posts(id) ON DELETE SET NULL,
            model VARCHAR(160) NOT NULL,
            prompt_version VARCHAR(40) NOT NULL DEFAULT 'v1',
            topic TEXT,
            error_message TEXT,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ai_daily_posts_status ON ai_daily_posts(status)`);
};

const topicForDay = (runDate: string, dayNumber: number) => {
    const topics = [
        'transparent social algorithms',
        'Recode DSL scoring rules',
        'auditable moderation workflows',
        'community-owned feed ranking',
        'safe plugin distribution',
        'developer trust and reproducible automation',
        'AI-assisted content governance',
    ];
    return `${topics[(dayNumber - 1) % topics.length]} - day ${dayNumber} (${runDate})`;
};

const markdownFallback = (raw: string, runDate: string, topic: string): DailyArticle => {
    const cleaned = raw.trim();
    const heading = cleaned.match(/^#\s+(.+)$/m)?.[1] || cleaned.match(/^(.{20,120})$/m)?.[1];
    const title = (heading || `Recode Daily: ${topic}`).replace(/["`]/g, '').slice(0, 220);
    const plain = cleaned
        .replace(/[#*_>`-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        title,
        summary: plain.slice(0, 260) || `Daily Recode note for ${runDate}.`,
        category: 'AI Workflows',
        content: cleaned || `# ${title}\n\nDaily Recode note for ${runDate}.\n\n${topic}`,
    };
};

const extractJson = (raw: string, runDate: string, topic: string): DailyArticle => {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    const source = fenced || raw;
    const jsonStart = source.indexOf('{');
    const jsonEnd = source.lastIndexOf('}');
    if (jsonStart < 0 || jsonEnd < jsonStart) {
        return markdownFallback(raw, runDate, topic);
    }

    let parsed: any;
    try {
        parsed = JSON.parse(source.slice(jsonStart, jsonEnd + 1));
    } catch (_error) {
        return markdownFallback(raw, runDate, topic);
    }

    if (!parsed.title || !parsed.summary || !parsed.content) {
        return markdownFallback(raw, runDate, topic);
    }

    return {
        title: String(parsed.title).slice(0, 220),
        summary: String(parsed.summary).slice(0, 500),
        category: String(parsed.category || 'AI Workflows').slice(0, 120),
        content: String(parsed.content),
    };
};

const generateArticle = async (runDate: string, dayNumber: number, topic: string): Promise<DailyArticle> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is required.');

    const prompt = `Create one factual daily SEO article for Recode.

Rules:
- Return JSON only with keys: title, summary, category, content.
- Use Markdown in content.
- Do not invent external news, statistics, customers, funding, benchmarks, or partnerships.
- The article date is ${runDate} in ${TIMEZONE}.
- The series started on ${START_DATE}; this is day ${dayNumber}.
- Topic: ${topic}.
- Focus on Recode DSL, transparent social algorithms, plugin safety, and developer operations.
- Include practical steps and a short FAQ.
- Keep it useful, accurate, and not clickbait.`;

    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            model: MODEL,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            max_tokens: MAX_TOKENS,
            temperature: 0.7,
        },
        {
            timeout: TIMEOUT_MS,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://recode.arteosocial.com',
                'X-Title': 'Recode Daily Blog Automation',
            },
        }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter returned an empty response.');
    return extractJson(content, runDate, topic);
};

const createUniqueSlug = async (title: string, runDate: string) => {
    const base = slugify(`${title}-${runDate}`) || `recode-daily-${runDate}`;
    let slug = base;
    for (let i = 2; i < 50; i += 1) {
        const rows = await unwrapRows(`SELECT id FROM blog_posts WHERE slug = ? LIMIT 1`, [slug]);
        if (rows.length === 0) return slug;
        slug = `${base}-${i}`;
    }
    throw new Error('Could not create a unique slug.');
};

const main = async () => {
    const runDate = process.env.AI_DAILY_POST_FORCE_DATE || getLocalDate();
    const dayOffset = daysBetween(START_DATE, runDate);

    if (!isEnabled()) {
        console.log(`[daily-ai-post] Disabled. Set AI_DAILY_POST_ENABLED=true to run.`);
        return;
    }
    if (dayOffset < 0) {
        console.log(`[daily-ai-post] Skipped. ${runDate} is before start date ${START_DATE}.`);
        return;
    }

    await ensureSchema();

    const lockRows = await unwrapRows(`SELECT pg_try_advisory_lock(520250503) AS locked`);
    if (!lockRows[0]?.locked) {
        console.log('[daily-ai-post] Another run is already active. Skipping.');
        return;
    }

    const dayNumber = dayOffset + 1;
    const topic = topicForDay(runDate, dayNumber);

    try {
        const existing = await unwrapRows(
            `SELECT * FROM ai_daily_posts WHERE run_date = ? AND status IN ('posted', 'dry_run') LIMIT 1`,
            [runDate]
        );
        if (existing.length > 0) {
            console.log(`[daily-ai-post] Already completed for ${runDate}. No API call made.`);
            return;
        }

        await pool.query(
            `INSERT INTO ai_daily_posts (run_date, status, model, prompt_version, topic, started_at)
             VALUES (?, 'running', ?, ?, ?, NOW())
             ON CONFLICT (run_date) DO UPDATE SET
                status = 'running',
                model = EXCLUDED.model,
                prompt_version = EXCLUDED.prompt_version,
                topic = EXCLUDED.topic,
                started_at = NOW(),
                error_message = NULL`,
            [runDate, MODEL, PROMPT_VERSION, topic]
        );

        const article = await generateArticle(runDate, dayNumber, topic);
        const slug = await createUniqueSlug(article.title, runDate);

        if (isDryRun()) {
            await pool.query(
                `UPDATE ai_daily_posts
                 SET status = 'dry_run', completed_at = NOW()
                 WHERE run_date = ?`,
                [runDate]
            );
            console.log(`[daily-ai-post] Dry run completed for ${runDate}: ${article.title}`);
            return;
        }

        const authorId = await getAuthorId();
        const insertRows = await unwrapRows(
            `INSERT INTO blog_posts (author_id, title, slug, summary, content, category, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
             RETURNING id`,
            [authorId, article.title, slug, article.summary, article.content, article.category]
        );
        const blogPostId = insertRows[0]?.id;

        await pool.query(
            `UPDATE ai_daily_posts
             SET status = 'posted', blog_post_id = ?, completed_at = NOW()
             WHERE run_date = ?`,
            [blogPostId, runDate]
        );

        console.log(`[daily-ai-post] Posted ${runDate}: /blog/${slug}`);
    } catch (error: any) {
        await pool.query(
            `UPDATE ai_daily_posts
             SET status = 'failed', error_message = ?, completed_at = NOW()
             WHERE run_date = ?`,
            [String(error?.message || error).slice(0, 2000), runDate]
        );
        throw error;
    } finally {
        await pool.query(`SELECT pg_advisory_unlock(520250503)`);
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('[daily-ai-post] Failed:', error.message);
        process.exit(1);
    });
