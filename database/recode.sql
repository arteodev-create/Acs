
-- 1. Bảng Người dùng
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Professional Profile
    headline VARCHAR(255),
    company VARCHAR(100),
    location VARCHAR(100),
    github_handle VARCHAR(50),
    twitter_handle VARCHAR(50),
    skills JSON,
    reputation_points INT DEFAULT 0,
    last_indexed_at DATETIME NULL
);

-- 2. Bảng Chuyên mục Diễn đàn
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50), -- Tên icon từ lucide-react
    display_order INT DEFAULT 0
);

-- 3. Bảng Chủ đề (Threads)
CREATE TABLE IF NOT EXISTS threads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    is_sticky BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_indexed_at DATETIME NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Bảng Phản hồi (Posts/Replies)
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_parent FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- 5. Bảng Lưu trữ Kịch bản (Recode Scripts Showcase)
CREATE TABLE IF NOT EXISTS recode_scripts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    code_content TEXT NOT NULL,
    tags VARCHAR(255), -- Lưu dạng "Security,Filtering"
    stars INT DEFAULT 0, -- Số sao đánh giá
    download_count INT DEFAULT 0,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Bảng Nhật ký Bảo mật (Security Logs)
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- 'sandbox_execution', 'auth_failure', 'rate_limit', 'system_update'
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    message TEXT NOT NULL,
    metadata JSON, -- Lưu thông tin chi tiết (IP, User Agent, Script ID)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bảng Cảm xúc (Reactions)
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

-- 12. Bảng Theo dõi (Follows)
CREATE TABLE IF NOT EXISTS follows (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Bảng Bài viết Blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT,
    content LONGTEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'Engineering',
    is_published BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_indexed_at DATETIME NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Bảng Thông báo (Notifications)
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

-- 6. Bảng Trạng thái Hệ thống
CREATE TABLE IF NOT EXISTS system_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    status ENUM('operational', 'degraded', 'partial_outage', 'major_outage') DEFAULT 'operational',
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Indexes for SEO & Performance
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_threads_updated_at ON threads(updated_at);
CREATE INDEX idx_threads_slug ON threads(slug);
CREATE INDEX idx_threads_category ON threads(category_id);
CREATE INDEX idx_threads_user ON threads(user_id);
CREATE INDEX idx_posts_thread ON posts(thread_id);
CREATE INDEX idx_posts_parent ON posts(parent_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_reactions_target ON reactions(target_type, target_id);

-- 8. Full-text Search Indexes
ALTER TABLE threads ADD FULLTEXT idx_threads_fulltext (title, content);
ALTER TABLE posts ADD FULLTEXT idx_posts_fulltext (content);

