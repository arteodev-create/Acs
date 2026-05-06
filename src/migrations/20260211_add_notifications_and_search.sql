-- Migration: Add Notifications and Full-text Search
-- Created: 2026-02-11

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    actor_id INT NOT NULL,
    type ENUM('reply', 'reaction') NOT NULL,
    target_type ENUM('thread', 'post') NOT NULL,
    target_id INT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add Full-text Indexes for Search
-- Tối ưu tìm kiếm thread theo tiêu đề và nội dung
ALTER TABLE threads ADD FULLTEXT idx_threads_fulltext (title, content);

-- Tối ưu tìm kiếm post (comment) theo nội dung
ALTER TABLE posts ADD FULLTEXT idx_posts_fulltext (content);

-- 3. Optimization Indexes for Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
