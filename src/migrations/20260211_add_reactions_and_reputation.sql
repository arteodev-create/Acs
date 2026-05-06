-- Migration: Add Reactions, Reputation and Optimize Indexes
-- Created: 2026-02-11

-- 1. Create Reactions Table
CREATE TABLE IF NOT EXISTS reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_type ENUM('thread', 'post') NOT NULL,
    target_id INT NOT NULL,
    reaction_type ENUM('like', 'insightful', 'helpful') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_reaction (user_id, target_type, target_id),
    CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Update Users table for Reputation
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_points INT DEFAULT 0;

-- 3. Database Index Optimization
-- Tối ưu tìm kiếm bài viết theo slug (SEO)
CREATE INDEX IF NOT EXISTS idx_threads_slug ON threads(slug);

-- Tối ưu lọc bài viết theo chuyên mục
CREATE INDEX IF NOT EXISTS idx_threads_category ON threads(category_id);

-- Tối ưu tìm kiếm bài viết của user
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);

-- Tối ưu truy vấn bình luận theo bài viết
CREATE INDEX IF NOT EXISTS idx_posts_thread ON posts(thread_id);

-- Tối ưu truy vấn reaction
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_type, target_id);

-- 4. Initial Reputation Seed (Optional - dựa trên bài đã đăng)
UPDATE users u 
SET reputation_points = (
    (SELECT COUNT(*) FROM threads t WHERE t.user_id = u.id) * 10 + 
    (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) * 5
);
