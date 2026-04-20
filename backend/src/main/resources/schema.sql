-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    avatar VARCHAR(255) COMMENT '头像',
    gender VARCHAR(10) COMMENT '性别',
    age INT COMMENT '年龄',
    register_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    last_login_time DATETIME COMMENT '最后登录时间',
    status INT DEFAULT 1 COMMENT '账号状态：1-正常，0-禁用',
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建书籍表
CREATE TABLE IF NOT EXISTS books (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '书籍ID',
    title VARCHAR(255) NOT NULL COMMENT '书名',
    author VARCHAR(100) NOT NULL COMMENT '作者',
    cover VARCHAR(500) COMMENT '封面图片',
    category VARCHAR(50) COMMENT '分类',
    description TEXT COMMENT '简介',
    chapter_count INT DEFAULT 0 COMMENT '总章节数',
    is_finished BOOLEAN DEFAULT FALSE COMMENT '是否完结',
    rating DOUBLE DEFAULT 0.0 COMMENT '评分',
    click_count INT DEFAULT 0 COMMENT '点击量',
    collect_count INT DEFAULT 0 COMMENT '收藏数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    latest_chapter_name VARCHAR(255) COMMENT '最新章节名称',
    latest_chapter_update_time DATETIME COMMENT '最新章节更新时间',
    INDEX idx_category (category),
    INDEX idx_rating (rating),
    INDEX idx_click_count (click_count),
    INDEX idx_collect_count (collect_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书籍表';

-- 创建章节表
CREATE TABLE IF NOT EXISTS chapters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '章节ID',
    book_id BIGINT NOT NULL COMMENT '书籍ID',
    title VARCHAR(255) NOT NULL COMMENT '章节标题',
    content TEXT NOT NULL COMMENT '章节内容',
    order_num INT NOT NULL COMMENT '章节序号',
    word_count INT DEFAULT 0 COMMENT '字数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_book_id (book_id),
    INDEX idx_order_num (order_num),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='章节表';

-- 创建书架表
CREATE TABLE IF NOT EXISTS bookshelf (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '书架ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    book_id BIGINT NOT NULL COMMENT '书籍ID',
    last_chapter_id BIGINT COMMENT '最后阅读章节ID',
    last_read_time DATETIME COMMENT '最后阅读时间',
    add_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    read_progress INT DEFAULT 0 COMMENT '阅读进度（章节序号）',
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    UNIQUE KEY uk_user_book (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书架表';

-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    book_id BIGINT NOT NULL COMMENT '书籍ID',
    parent_id BIGINT DEFAULT 0 COMMENT '父评论ID',
    content TEXT NOT NULL COMMENT '评论内容',
    likes INT DEFAULT 0 COMMENT '点赞数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_parent_id (parent_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 创建签到记录表
CREATE TABLE IF NOT EXISTS sign_in_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '签到ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    sign_date DATE NOT NULL COMMENT '签到日期',
    continuous_days INT DEFAULT 1 COMMENT '连续签到天数',
    reward INT DEFAULT 0 COMMENT '奖励金币数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_date (user_id, sign_date),
    INDEX idx_user_id (user_id),
    INDEX idx_sign_date (sign_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';

-- 创建刷新令牌表
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '令牌ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    token VARCHAR(500) NOT NULL COMMENT '刷新令牌',
    expires_at DATETIME NOT NULL COMMENT '过期时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    revoked BOOLEAN DEFAULT FALSE COMMENT '是否已撤销',
    INDEX idx_user_id (user_id),
    INDEX idx_token (token(255)),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';

-- 创建书籍评分表
CREATE TABLE IF NOT EXISTS book_ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评分ID',
    book_id BIGINT NOT NULL COMMENT '书籍ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    rating INT NOT NULL COMMENT '评分(1-5星)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_user_book (user_id, book_id),
    INDEX idx_book_id (book_id),
    INDEX idx_user_id (user_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='书籍评分表';

-- 创建章节解锁表
CREATE TABLE IF NOT EXISTS chapter_unlocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '解锁ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    book_id BIGINT NOT NULL COMMENT '书籍ID',
    chapter_id BIGINT NOT NULL COMMENT '章节ID',
    price INT DEFAULT 0 COMMENT '花费金币',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_chapter (user_id, chapter_id),
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='章节解锁表';
