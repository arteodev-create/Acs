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

CREATE INDEX IF NOT EXISTS idx_daily_activity_runs_status ON daily_activity_runs(status);
