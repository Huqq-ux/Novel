-- ============================================
-- 土豆小说 - 数据库初始化脚本
-- 数据库: novel, 字符集: utf8mb4
-- ============================================

CREATE DATABASE IF NOT EXISTS novel DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE novel;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    avatar VARCHAR(500),
    gender VARCHAR(10),
    age INT,
    register_time DATETIME,
    last_login_time DATETIME,
    status INT DEFAULT 1 COMMENT '0:禁用 1:正常',
    role VARCHAR(20) DEFAULT 'user',
    is_author INT DEFAULT 0 COMMENT '0:否 1:是',
    author_level INT DEFAULT 0,
    pen_name VARCHAR(50),
    author_apply_time DATETIME,
    coin_balance INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. 书籍表
-- ============================================
CREATE TABLE IF NOT EXISTS books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(50),
    cover VARCHAR(500),
    category VARCHAR(50),
    description TEXT,
    chapter_count INT DEFAULT 0,
    is_finished TINYINT(1) DEFAULT 0,
    rating DOUBLE DEFAULT 0,
    click_count INT DEFAULT 0,
    collect_count INT DEFAULT 0,
    status INT DEFAULT 1 COMMENT '0:下架 1:上架',
    price_type INT DEFAULT 0 COMMENT '0:免费 1:付费',
    author_id BIGINT,
    free_chapter_count INT DEFAULT 0,
    total_words INT DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME,
    latest_chapter_name VARCHAR(200),
    latest_chapter_update_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. 章节表
-- ============================================
CREATE TABLE IF NOT EXISTS chapters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    title VARCHAR(200),
    content LONGTEXT,
    order_num INT,
    word_count INT DEFAULT 0,
    price INT DEFAULT 0,
    is_free INT DEFAULT 1 COMMENT '0:付费 1:免费',
    create_time DATETIME,
    update_time DATETIME,
    INDEX idx_book_id (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. 书架表
-- ============================================
CREATE TABLE IF NOT EXISTS bookshelf (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    last_chapter_id BIGINT,
    last_read_time DATETIME,
    read_progress INT DEFAULT 0,
    INDEX idx_user_id (user_id),
    UNIQUE KEY uk_user_book (user_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. 评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    parent_id BIGINT DEFAULT 0,
    content TEXT,
    likes INT DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME,
    INDEX idx_book_id (book_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. 评论点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    comment_id BIGINT NOT NULL,
    create_time DATETIME,
    UNIQUE KEY uk_user_comment (user_id, comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. 书籍评分表
-- ============================================
CREATE TABLE IF NOT EXISTS book_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT COMMENT '1-5星',
    create_time DATETIME,
    update_time DATETIME,
    UNIQUE KEY uk_book_user (book_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. 章节解锁表
-- ============================================
CREATE TABLE IF NOT EXISTS chapter_unlocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT NOT NULL,
    price INT DEFAULT 0,
    create_time DATETIME,
    INDEX idx_user_book (user_id, book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. 书币充值记录表
-- ============================================
CREATE TABLE IF NOT EXISTS coin_recharge_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount INT,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status INT DEFAULT 0 COMMENT '0:待支付 1:成功 2:失败',
    create_time DATETIME,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. 充值套餐表
-- ============================================
CREATE TABLE IF NOT EXISTS recharge_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    coins INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    bonus INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active INT DEFAULT 1,
    create_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. 签到记录表
-- ============================================
CREATE TABLE IF NOT EXISTS sign_in_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sign_date DATE,
    continuous_days INT DEFAULT 1,
    reward INT DEFAULT 0,
    create_time DATETIME,
    UNIQUE KEY uk_user_date (user_id, sign_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. Refresh Token 表
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME,
    revoked TINYINT(1) DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. 通知表
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200),
    content TEXT,
    type VARCHAR(20) COMMENT 'system/author',
    is_read INT DEFAULT 0,
    create_time DATETIME,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. 审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    action VARCHAR(50),
    resource VARCHAR(200),
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    request_method VARCHAR(10),
    request_url VARCHAR(200),
    status VARCHAR(20),
    created_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. 作者申请表
-- ============================================
CREATE TABLE IF NOT EXISTS author_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    real_name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    pen_name VARCHAR(50),
    specialty VARCHAR(200),
    work_samples TEXT,
    introduction TEXT,
    id_card VARCHAR(18),
    status INT DEFAULT 0 COMMENT '-1:草稿 0:待审核 1:通过 2:拒绝',
    verify_code VARCHAR(10),
    verify_expired DATETIME,
    verified INT DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. 作者审核记录表
-- ============================================
CREATE TABLE IF NOT EXISTS author_audit_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    auditor_id BIGINT,
    action INT COMMENT '1:通过 2:拒绝',
    comment VARCHAR(500),
    create_time DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 阅读书签
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT NOT NULL,
    chapter_title VARCHAR(255),
    position INT DEFAULT 0,
    note VARCHAR(500),
    create_time DATETIME,
    UNIQUE KEY uk_user_book_chapter (user_id, book_id, chapter_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 打赏记录
-- ============================================
CREATE TABLE IF NOT EXISTS tips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    chapter_id BIGINT,
    amount INT NOT NULL,
    message VARCHAR(500),
    create_time DATETIME,
    INDEX idx_book_id (book_id),
    INDEX idx_author_id (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 书单
-- ============================================
CREATE TABLE IF NOT EXISTS book_lists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    cover VARCHAR(500),
    is_public TINYINT DEFAULT 1,
    like_count INT DEFAULT 0,
    book_count INT DEFAULT 0,
    create_time DATETIME,
    update_time DATETIME,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 书单-书籍关联
-- ============================================
CREATE TABLE IF NOT EXISTS book_list_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    list_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    sort_order INT DEFAULT 0,
    add_time DATETIME,
    UNIQUE KEY uk_list_book (list_id, book_id),
    INDEX idx_list_id (list_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 初始数据：充值套餐
-- ============================================
INSERT INTO recharge_packages (coins, price, bonus, sort_order, is_active, create_time) VALUES
(100, 10.00, 0, 1, 1, NOW()),
(500, 50.00, 30, 2, 1, NOW()),
(1000, 100.00, 100, 3, 1, NOW()),
(2000, 200.00, 300, 4, 1, NOW()),
(5000, 500.00, 1000, 5, 1, NOW());

-- ============================================
-- 初始数据：示例书籍
-- ============================================
INSERT INTO books (title, author, cover, category, description, chapter_count, is_finished, rating, click_count, collect_count, status, price_type, author_id, free_chapter_count, total_words, create_time, update_time, latest_chapter_name, latest_chapter_update_time) VALUES
('剑道独尊', '土豆作者', NULL, '玄幻', '一个少年持剑走天涯的故事...', 0, 0, 4.5, 1200, 350, 1, 0, 1, 30, 0, NOW(), NOW(), NULL, NULL),
('都市修仙传', '土豆作者', NULL, '都市', '现代都市中的修仙传奇...', 0, 0, 4.2, 800, 220, 1, 1, 1, 20, 0, NOW(), NOW(), NULL, NULL),
('星河战纪', '土豆作者', NULL, '科幻', '星际战争中的英雄史诗...', 0, 1, 4.8, 2500, 680, 1, 0, 1, 50, 0, NOW(), NOW(), NULL, NULL),
('花间集', '土豆作者', NULL, '言情', '花开花落间的爱情故事...', 0, 0, 4.0, 600, 180, 1, 0, 1, 40, 0, NOW(), NOW(), NULL, NULL);
