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

CREATE INDEX IF NOT EXISTS idx_ai_daily_posts_status ON ai_daily_posts(status);
