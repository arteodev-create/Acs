CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    role VARCHAR(32) NOT NULL DEFAULT 'user',
    headline VARCHAR(255),
    company VARCHAR(255),
    location VARCHAR(255),
    github_handle VARCHAR(120),
    twitter_handle VARCHAR(120),
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    reputation_points INTEGER NOT NULL DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    slug VARCHAR(140) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(80),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS threads (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(240) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    is_sticky BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES posts(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(240) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    category VARCHAR(120),
    view_count INTEGER NOT NULL DEFAULT 0,
    last_indexed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

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
);

CREATE TABLE IF NOT EXISTS recode_scripts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(240) NOT NULL,
    description TEXT,
    code_content TEXT NOT NULL,
    tags TEXT,
    stars INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    version VARCHAR(40) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('thread', 'post')),
    target_id BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'insightful', 'helpful')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id BIGINT NOT NULL,
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_status (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(120) NOT NULL UNIQUE,
    status VARCHAR(40) NOT NULL DEFAULT 'operational',
    uptime_percentage NUMERIC(5,2) NOT NULL DEFAULT 100,
    last_checked TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threads_category_id ON threads(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_thread_id ON posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_daily_posts_status ON ai_daily_posts(status);
CREATE INDEX IF NOT EXISTS idx_daily_activity_runs_status ON daily_activity_runs(status);
CREATE INDEX IF NOT EXISTS idx_recode_scripts_created_at ON recode_scripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

INSERT INTO categories (name, slug, description, icon_name, display_order)
VALUES
    ('Announcements', 'announcements', 'Official Recode updates and releases.', 'Megaphone', 1),
    ('Engineering', 'engineering', 'Architecture, backend, frontend, and infrastructure discussions.', 'Code2', 2),
    ('AI Workflows', 'ai-workflows', 'Automation, agents, prompts, and AI operating notes.', 'Sparkles', 3),
    ('Showcase', 'showcase', 'Community builds, templates, and experiments.', 'Rocket', 4)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon_name = EXCLUDED.icon_name,
    display_order = EXCLUDED.display_order;

INSERT INTO system_status (service_name, status, uptime_percentage)
VALUES
    ('API Server', 'operational', 100),
    ('PostgreSQL Database', 'operational', 100),
    ('Static Frontend', 'operational', 100)
ON CONFLICT (service_name) DO UPDATE SET
    status = EXCLUDED.status,
    uptime_percentage = EXCLUDED.uptime_percentage,
    last_checked = NOW();
