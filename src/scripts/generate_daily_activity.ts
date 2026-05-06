import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { slugify } from '../utils/slugUtils';

dotenv.config();

type UserRow = { id: number; username: string };
type CategoryRow = { id: number; slug: string; name: string };

const TZ = process.env.DAILY_ACTIVITY_TIMEZONE || 'Asia/Bangkok';

const config = {
    minUsers: Number(process.env.DAILY_ACTIVITY_MIN_USERS || 30),
    maxUsers: Number(process.env.DAILY_ACTIVITY_MAX_USERS || 100),
    minThreads: Number(process.env.DAILY_ACTIVITY_MIN_THREADS || 8),
    maxThreads: Number(process.env.DAILY_ACTIVITY_MAX_THREADS || 20),
    minReplies: Number(process.env.DAILY_ACTIVITY_MIN_REPLIES || 20),
    maxReplies: Number(process.env.DAILY_ACTIVITY_MAX_REPLIES || 80),
    minTemplates: Number(process.env.DAILY_ACTIVITY_MIN_TEMPLATES || 5),
    maxTemplates: Number(process.env.DAILY_ACTIVITY_MAX_TEMPLATES || 12),
    minBlogs: Number(process.env.DAILY_ACTIVITY_MIN_BLOGS || 1),
    maxBlogs: Number(process.env.DAILY_ACTIVITY_MAX_BLOGS || 2),
};

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const enabled = () => String(process.env.DAILY_ACTIVITY_ENABLED || 'false').toLowerCase() === 'true';

const localDate = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
};

const todayTimestamp = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - randInt(1, 600));
    return d;
};

const rows = async (sql: string, params: unknown[] = []) => {
    const [result]: any = await pool.query(sql, params);
    return result;
};

const ensureSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_activity_runs (
            id BIGSERIAL PRIMARY KEY,
            run_date DATE NOT NULL UNIQUE,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            users_created INTEGER NOT NULL DEFAULT 0,
            threads_created INTEGER NOT NULL DEFAULT 0,
            replies_created INTEGER NOT NULL DEFAULT 0,
            templates_created INTEGER NOT NULL DEFAULT 0,
            blogs_created INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
};

const ensureCategories = async () => {
    const seeds = [
        ['Engineering', 'engineering', 'Architecture, backend, frontend, and infrastructure discussions.', 'Code2', 2],
        ['AI Workflows', 'ai-workflows', 'Automation, agents, prompts, and AI operating notes.', 'Sparkles', 3],
        ['Showcase', 'showcase', 'Community builds, templates, and experiments.', 'Rocket', 4],
        ['Recode DSL', 'recode-dsl', 'Recode plugin syntax, scoring rules, and DSL learning notes.', 'Blocks', 5],
    ];
    for (const item of seeds) {
        await pool.query(
            `INSERT INTO categories (name, slug, description, icon_name, display_order)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
            item
        );
    }
    return rows(`SELECT id, slug, name FROM categories ORDER BY display_order ASC`) as Promise<CategoryRow[]>;
};

const makeUniqueSlug = async (table: string, title: string) => {
    const base = slugify(title) || `recode-${Date.now()}`;
    let slug = base;
    for (let i = 2; i < 100; i += 1) {
        const existing = await rows(`SELECT id FROM ${table} WHERE slug = ? LIMIT 1`, [slug]);
        if (existing.length === 0) return slug;
        slug = `${base}-${i}`;
    }
    return `${base}-${Date.now()}`;
};

const userNames = [
    'Ada Trace', 'Lin Pack', 'Nora Byte', 'Kai Vector', 'Mina Patch', 'Eli Schema',
    'Tao Runtime', 'Ivy Signal', 'Leo Parser', 'Rin Module', 'Zed Query', 'Amy Cache',
    'Noah Guard', 'Lia Worker', 'Owen Hook', 'Maya Token', 'Iris Node', 'Sam Relay',
];

const skills = [
    'Recode DSL', 'content scoring', 'plugin safety', 'React', 'Node.js',
    'PostgreSQL', 'moderation policy', 'SEO', 'system design', 'automation',
];

const createUsers = async (count: number, runDate: string) => {
    const passwordHash = await bcrypt.hash(`recode-demo-${runDate}`, 10);
    const created: UserRow[] = [];

    for (let i = 0; i < count; i += 1) {
        const display = pick(userNames);
        const suffix = `${runDate.replace(/-/g, '')}${String(i + 1).padStart(3, '0')}${randInt(10, 99)}`;
        const username = `recode_demo_${suffix}`;
        const email = `${username}@example.invalid`;
        const skillSet = JSON.stringify([pick(skills), pick(skills), 'synthetic demo account']);
        const avatarName = encodeURIComponent(display);
        const avatar = `https://ui-avatars.com/api/?name=${avatarName}&background=111827&color=fff&size=400&bold=true&format=png`;
        const headline = `Synthetic Recode learner profile for DSL examples`;

        const inserted = await rows(
            `INSERT INTO users (username, email, password_hash, avatar_url, is_verified, role, headline, company, location, skills, reputation_points, created_at, updated_at)
             VALUES (?, ?, ?, ?, false, 'user', ?, 'Recode Learning Lab', 'Remote Demo Network', ?::jsonb, ?, ?, ?)
             ON CONFLICT (username) DO NOTHING
             RETURNING id, username`,
            [username, email, passwordHash, avatar, headline, skillSet, randInt(5, 120), todayTimestamp(), todayTimestamp()]
        );
        if (inserted[0]) created.push(inserted[0]);
    }
    return created;
};

const recodeExamples = [
    {
        title: 'Quality Signal Booster',
        description: 'Boosts posts with useful technical detail while avoiding spammy engagement bait.',
        code: `plugin "QualitySignalBooster" {
    block "Score" {
        if post.content_length > 480 {
            boost 18
            log "Detailed post: +18"
        }
        if post.like_count > 25 {
            boost 8
            log "Healthy engagement: +8"
        }
        if post.content contains "free money" {
            filter
            log "Filtered obvious spam phrase"
        }
    }
}`,
        tags: 'ranking,quality,moderation',
    },
    {
        title: 'Beginner Friendly Recode Filter',
        description: 'A small DSL example for learners who want to understand filter and boost decisions.',
        code: `plugin "BeginnerFriendlyFilter" {
    block "LearnableRules" {
        if post.content contains "tutorial" {
            boost 20
            log "Tutorial content promoted"
        }
        if post.has_images == true {
            boost 6
            log "Visual explanation detected"
        }
    }
}`,
        tags: 'tutorial,beginner,dsl',
    },
    {
        title: 'Forum Trust Balancer',
        description: 'Balances author reputation with content depth so new users can still surface good posts.',
        code: `plugin "ForumTrustBalancer" {
    block "Balance" {
        if user.reputation > 100 {
            boost 10
        }
        if post.content_length > 700 {
            boost 16
        }
        if post.report_count > 3 {
            filter
        }
    }
}`,
        tags: 'forum,trust,ranking',
    },
];

const createTemplates = async (users: UserRow[], count: number, runDate: string) => {
    let created = 0;
    for (let i = 0; i < count; i += 1) {
        const template = pick(recodeExamples);
        const title = `${template.title} ${runDate} #${i + 1}`;
        const user = pick(users);
        await pool.query(
            `INSERT INTO recode_scripts (user_id, title, description, code_content, tags, stars, download_count, version, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, '1.0.0', ?, NOW())`,
            [user.id, title, template.description, template.code, template.tags, randInt(0, 25), randInt(0, 90), todayTimestamp()]
        );
        created += 1;
    }
    return created;
};

const threadTopics = [
    'How should I explain Recode DSL boost rules to a beginner?',
    'Checklist for reviewing a moderation plugin before install',
    'What makes a template safe enough for public sharing?',
    'How to write audit logs that normal users can understand',
    'When should a ranking rule filter instead of penalize?',
    'A small pattern for testing forum scoring rules locally',
    'How sitemap updates help new Recode tutorials get discovered',
    'Best way to structure a Recode plugin README',
];

const threadContent = (title: string) => `## Context

This is a synthetic learning discussion created by the Recode daily activity job. It is not a real user claim or customer story.

Topic: **${title}**

What I want to understand:

1. How to keep the rule transparent.
2. How to make the template safe for learners.
3. How to explain the tradeoff without inventing facts.

My current rule of thumb is to prefer small, testable Recode blocks with logs for every boost, filter, or penalty.`;

const createThreads = async (users: UserRow[], categories: CategoryRow[], count: number, runDate: string) => {
    const created: Array<{ id: number; title: string }> = [];
    for (let i = 0; i < count; i += 1) {
        const title = `${pick(threadTopics)} (${runDate} note ${i + 1})`;
        const slug = await makeUniqueSlug('threads', title);
        const category = pick(categories);
        const user = pick(users);
        const result = await rows(
            `INSERT INTO threads (category_id, user_id, title, slug, content, is_sticky, is_locked, view_count, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, false, false, ?, ?, NOW())
             RETURNING id, title`,
            [category.id, user.id, title, slug, threadContent(title), randInt(0, 300), todayTimestamp()]
        );
        if (result[0]) created.push(result[0]);
    }
    return created;
};

const replyTexts = [
    'I would keep the rule narrow and add a log line for each score change. That makes the behavior easier to audit.',
    'For learners, a tiny plugin with three clear conditions is better than a large clever one.',
    'A useful test is to run the same sample post through the rule before and after each edit.',
    'The template should explain inputs, expected outputs, and cases where the rule should not fire.',
    'I would avoid claiming the rule is universal. It is safer to document the context where it works.',
];

const createReplies = async (users: UserRow[], threads: Array<{ id: number }>, count: number) => {
    if (threads.length === 0) return 0;
    let created = 0;
    for (let i = 0; i < count; i += 1) {
        await pool.query(
            `INSERT INTO posts (thread_id, user_id, content, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [pick(threads).id, pick(users).id, pick(replyTexts), todayTimestamp()]
        );
        created += 1;
    }
    return created;
};

const blogTitles = [
    'How to Read a Recode DSL Template Before Installing It',
    'A Practical Checklist for Transparent Feed Scoring',
    'Why Small Moderation Rules Are Easier to Audit',
    'How Forum Discussions Improve Plugin Safety',
];

const blogContent = (title: string, runDate: string) => `# ${title}

This daily learning note was generated for ${runDate}. It uses accurate Recode concepts and avoids external claims, fake metrics, or fake partnerships.

## Key idea

Recode templates should be small, readable, and testable. A good template explains what it boosts, what it filters, and why each decision exists.

## Practical checklist

1. Read the plugin name and stated purpose.
2. Check every \`boost\`, \`filter\`, and \`log\` line.
3. Test with at least one positive, neutral, and risky sample post.
4. Keep a version number so learners know what changed.

## Example

\`\`\`recode
plugin "LearningChecklist" {
    block "Review" {
        if post.content contains "tutorial" {
            boost 12
            log "Tutorial content promoted"
        }
    }
}
\`\`\`

## FAQ

**Is this a real user story?**  
No. This is educational content produced by the Recode learning automation.

**Can users learn from it?**  
Yes. The DSL examples are intentionally small and inspectable.`;

const createBlogs = async (users: UserRow[], count: number, runDate: string) => {
    let created = 0;
    for (let i = 0; i < count; i += 1) {
        const title = `${pick(blogTitles)} - ${runDate} #${i + 1}`;
        const slug = await makeUniqueSlug('blog_posts', title);
        const content = blogContent(title, runDate);
        await pool.query(
            `INSERT INTO blog_posts (author_id, title, slug, summary, content, category, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'Recode Learning', ?, NOW())`,
            [pick(users).id, title, slug, 'A practical Recode learning note with safe DSL examples and audit guidance.', content, todayTimestamp()]
        );
        created += 1;
    }
    return created;
};

const getUserPool = async (newUsers: UserRow[]) => {
    const existing = await rows(`SELECT id, username FROM users ORDER BY created_at DESC LIMIT 300`);
    return [...newUsers, ...existing].filter((u: UserRow) => u?.id);
};

const main = async () => {
    const runDate = process.env.DAILY_ACTIVITY_FORCE_DATE || localDate();
    if (!enabled()) {
        console.log('[daily-activity] Disabled. Set DAILY_ACTIVITY_ENABLED=true to run.');
        return;
    }

    await ensureSchema();
    const lock = await rows(`SELECT pg_try_advisory_lock(520260503) AS locked`);
    if (!lock[0]?.locked) {
        console.log('[daily-activity] Another run is active. Skipping.');
        return;
    }

    try {
        const done = await rows(`SELECT id FROM daily_activity_runs WHERE run_date = ? AND status = 'completed' LIMIT 1`, [runDate]);
        if (done.length > 0) {
            console.log(`[daily-activity] Already completed for ${runDate}.`);
            return;
        }

        await pool.query(
            `INSERT INTO daily_activity_runs (run_date, status, started_at)
             VALUES (?, 'running', NOW())
             ON CONFLICT (run_date) DO UPDATE SET status = 'running', started_at = NOW(), error_message = NULL`,
            [runDate]
        );

        const categories = await ensureCategories();
        const newUsers = await createUsers(randInt(config.minUsers, config.maxUsers), runDate);
        const userPool = await getUserPool(newUsers);
        const templates = await createTemplates(userPool, randInt(config.minTemplates, config.maxTemplates), runDate);
        const threads = await createThreads(userPool, categories, randInt(config.minThreads, config.maxThreads), runDate);
        const replies = await createReplies(userPool, threads, randInt(config.minReplies, config.maxReplies));
        const blogs = await createBlogs(userPool, randInt(config.minBlogs, config.maxBlogs), runDate);

        await pool.query(
            `UPDATE daily_activity_runs
             SET status = 'completed',
                 users_created = ?,
                 threads_created = ?,
                 replies_created = ?,
                 templates_created = ?,
                 blogs_created = ?,
                 completed_at = NOW()
             WHERE run_date = ?`,
            [newUsers.length, threads.length, replies, templates, blogs, runDate]
        );

        console.log(`[daily-activity] Completed ${runDate}: users=${newUsers.length}, threads=${threads.length}, replies=${replies}, templates=${templates}, blogs=${blogs}`);
    } catch (error: any) {
        await pool.query(
            `UPDATE daily_activity_runs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE run_date = ?`,
            [String(error?.message || error).slice(0, 2000), runDate]
        );
        throw error;
    } finally {
        await pool.query(`SELECT pg_advisory_unlock(520260503)`);
    }
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('[daily-activity] Failed:', error.message);
        process.exit(1);
    });
