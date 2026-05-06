import path from 'path';

// ═══════════════════════════════════════════════════════════
// ECOSYSTEM GENERATOR — Central Configuration
// ═══════════════════════════════════════════════════════════

// --- Scale ---
export const TOTAL_USERS = 60_000;
export const TOTAL_THREADS = 24_000;
export const TOTAL_POSTS = 180_000;
export const TOTAL_REACTIONS = 300_000;
export const TOTAL_FOLLOWS = 240_000;
export const TOTAL_NOTIFICATIONS = 150_000;
export const TOTAL_BLOG_POSTS = 1_500;
export const TOTAL_RECODE_SCRIPTS = 6_000;

// --- 2 Phases ---
export const PHASE_A = {
    label: '26-1-2026 14-2-2026',
    start: new Date('2026-01-26T00:00:00+07:00'),
    end: new Date('2026-02-14T00:00:00+07:00'),
    ratio: 0.35, // 35% of data falls here (early adopters)
};

export const PHASE_B = {
    label: '14-2-2026 14-4-2026',
    start: new Date('2026-02-14T00:00:00+07:00'),
    end: new Date('2026-04-14T23:59:59+07:00'),
    ratio: 0.65, // 65% of data falls here (growth period)
};

// --- Output Paths ---
export const BASE_OUTPUT = 'C:/Users/Huy/Downloads/App/Dữ Liệu';

export const OUTPUT_DIRS = {
    phaseA: {
        users: path.join(BASE_OUTPUT, PHASE_A.label, 'người dùng'),
        categories: path.join(BASE_OUTPUT, PHASE_A.label, 'chuyên mục'),
        threads: path.join(BASE_OUTPUT, PHASE_A.label, 'threads'),
        posts: path.join(BASE_OUTPUT, PHASE_A.label, 'posts'),
        reactions: path.join(BASE_OUTPUT, PHASE_A.label, 'reactions'),
        follows: path.join(BASE_OUTPUT, PHASE_A.label, 'follows'),
        notifications: path.join(BASE_OUTPUT, PHASE_A.label, 'notifications'),
        blogPosts: path.join(BASE_OUTPUT, PHASE_A.label, 'blog_posts'),
        recodeScripts: path.join(BASE_OUTPUT, PHASE_A.label, 'recode_scripts'),
        systemStatus: path.join(BASE_OUTPUT, PHASE_A.label, 'system_status'),
    },
    phaseB: {
        users: path.join(BASE_OUTPUT, PHASE_B.label, 'người dùng'),
        categories: path.join(BASE_OUTPUT, PHASE_B.label, 'chuyên mục'),
        threads: path.join(BASE_OUTPUT, PHASE_B.label, 'threads'),
        posts: path.join(BASE_OUTPUT, PHASE_B.label, 'posts'),
        reactions: path.join(BASE_OUTPUT, PHASE_B.label, 'reactions'),
        follows: path.join(BASE_OUTPUT, PHASE_B.label, 'follows'),
        notifications: path.join(BASE_OUTPUT, PHASE_B.label, 'notifications'),
        blogPosts: path.join(BASE_OUTPUT, PHASE_B.label, 'blog_posts'),
        recodeScripts: path.join(BASE_OUTPUT, PHASE_B.label, 'recode_scripts'),
        systemStatus: path.join(BASE_OUTPUT, PHASE_B.label, 'system_status'),
    },
};

// --- Shared password hash (bcrypt of "ReCode2026!") ---
export const SHARED_PASSWORD_HASH =
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

// --- SQL batch size (rows per INSERT statement) ---
export const SQL_BATCH_SIZE = 500;

// --- Categories ---
export const CATEGORIES = [
    { id: 1, name: 'General Discussion', slug: 'general-discussion', description: 'Pair programming, water cooler chat, and everything in between.', icon: 'MessageCircle', order: 1 },
    { id: 2, name: 'Web Development', slug: 'web-development', description: 'React, Vue, Angular, Svelte, Next.js, and frontend architecture.', icon: 'Globe', order: 2 },
    { id: 3, name: 'Backend & APIs', slug: 'backend-apis', description: 'Node.js, Python, Go, Rust — server-side engineering and API design.', icon: 'Server', order: 3 },
    { id: 4, name: 'DevOps & Cloud', slug: 'devops-cloud', description: 'Docker, Kubernetes, AWS, CI/CD pipelines, and infrastructure.', icon: 'Cloud', order: 4 },
    { id: 5, name: 'Mobile Development', slug: 'mobile-development', description: 'React Native, Flutter, Swift, Kotlin — building for iOS & Android.', icon: 'Smartphone', order: 5 },
    { id: 6, name: 'AI & Machine Learning', slug: 'ai-machine-learning', description: 'LLMs, transformers, MLOps, computer vision, and applied AI.', icon: 'Brain', order: 6 },
    { id: 7, name: 'Database & Architecture', slug: 'database-architecture', description: 'PostgreSQL, MongoDB, Redis, system design, and data modeling.', icon: 'Database', order: 7 },
    { id: 8, name: 'Security & Privacy', slug: 'security-privacy', description: 'AppSec, penetration testing, zero-trust, and compliance.', icon: 'Shield', order: 8 },
    { id: 9, name: 'Career & Jobs', slug: 'career-jobs', description: 'Interview prep, salary negotiation, remote work, and career growth.', icon: 'Briefcase', order: 9 },
    { id: 10, name: 'Showcase & Projects', slug: 'showcase-projects', description: 'Show off what you built, get feedback, and inspire others.', icon: 'Rocket', order: 10 },
];

// --- Blog categories ---
export const BLOG_CATEGORIES = [
    'Engineering', 'DevOps', 'Security', 'AI', 'Culture', 'Tutorial',
    'Open Source', 'Performance', 'Architecture', 'Career',
];

// --- Reaction distribution ---
export const REACTION_WEIGHTS = {
    like: 0.70,
    insightful: 0.20,
    helpful: 0.10,
};

// --- Role distribution ---
export const ROLE_DISTRIBUTION = {
    user: 0.990,
    moderator: 0.008,
    admin: 0.002,
};
