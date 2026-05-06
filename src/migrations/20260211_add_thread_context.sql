-- Migration: Add Thread Context Support
-- Created: 2026-02-11

-- 1. Add parent_id to posts table
ALTER TABLE posts ADD COLUMN parent_id INT DEFAULT NULL;

-- 2. Add foreign key for parent_id
ALTER TABLE posts ADD CONSTRAINT fk_post_parent FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE SET NULL;

-- 3. Add index for faster context lookup
CREATE INDEX idx_posts_parent ON posts(parent_id);

-- 4. Add index for Deep Linking to specific posts
CREATE INDEX idx_posts_id_thread ON posts(id, thread_id);
