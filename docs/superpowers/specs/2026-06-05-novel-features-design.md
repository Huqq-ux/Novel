# 土豆小说 — 新功能设计文档

日期: 2026-06-05

## 功能清单

| # | 功能 | 新增表 | API | 页面 | 复杂度 |
|---|------|--------|-----|------|--------|
| 1 | CustomerService 路由修复 | 0 | 0 | 0 | 极低 |
| 2 | 阅读主题 | 0 | 0 | 0 | 低 |
| 3 | 阅读模式 | 0 | 0 | 0 | 低 |
| 4 | 阅读书签 | 1 | 4 | 0 | 中 |
| 5 | 打赏作者 | 1 | 3 | 0 | 中 |
| 6 | 书单/书荒广场 | 2 | 8 | 2 | 高 |

---

## 1. CustomerService 路由修复

App.tsx 中补充 `<Route path="/customer-service" element={<CustomerService />} />`。

## 2. 阅读主题

扩展现有 4 色主题为 6 色：白色(默认)、护眼绿(#c8d6b8)、羊皮纸(#f0e6d3)、浅灰(#d9d2c5)、深灰(#3c3c3c)、纯黑(#1a1a1a)。

localStorage key: `readerTheme`（已存在）。CSS Variables 驱动阅读器容器背景和文字颜色。

## 3. 阅读模式

两种模式，localStorage key: `readerMode`。

- **翻页模式**（默认）：当前行为，上一章/下一章导航
- **滚动模式**：当前章节内连续滚动，上下章按钮置顶/置底

不做跨章自动加载（需多章节 API 调用，压力大）。

## 4. 阅读书签

### 现状
前端 Reader.tsx 已有完整 UI（书签按钮 + 抽屉列表），数据存 localStorage，换设备丢失。

### 新表 `bookmarks`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT PK | 主键 |
| user_id | BIGINT NOT NULL | 用户 ID |
| book_id | BIGINT NOT NULL | 书籍 ID |
| chapter_id | BIGINT NOT NULL | 章节 ID |
| chapter_title | VARCHAR(255) | 章节标题快照 |
| position | INT DEFAULT 0 | 滚动位置 |
| note | VARCHAR(500) | 备注 |
| create_time | DATETIME | 创建时间 |

索引: unique(user_id, book_id, chapter_id), index(user_id)

### API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /bookmarks?bookId= | 某书的所有书签 |
| POST | /bookmarks | 添加书签 |
| DELETE | /bookmarks/:id | 删除书签 |
| GET | /bookmarks/check?bookId=&chapterId= | 检查章节是否已标记 |

### 前端改动
- 替换 localStorage 为 API 调用
- 首次加载时迁移旧 localStorage 数据到服务端
- 书签列表增加备注显示

## 5. 打赏作者

### 新表 `tips`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT PK | 主键 |
| user_id | BIGINT NOT NULL | 打赏者 ID |
| author_id | BIGINT NOT NULL | 被打赏作者 ID |
| book_id | BIGINT NOT NULL | 被打赏书籍 ID |
| chapter_id | BIGINT | 打赏章节（可空） |
| amount | INT NOT NULL | 打赏书币数 |
| message | VARCHAR(500) | 打赏留言 |
| create_time | DATETIME | 打赏时间 |

索引: index(book_id), index(author_id)

### 后端逻辑（@Transactional）
1. 校验余额 ≥ 金额
2. 打赏者扣款
3. 作者余额增加
4. 写入 tips 记录
5. 写入两条 coin_recharge_records 流水
6. 给作者发送通知

### API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /tips | 创建打赏 |
| GET | /tips/book/:bookId | 书籍打赏列表 |
| GET | /tips/received | 我收到的打赏（作者） |

### 前端
- Reader 工具栏增加打赏按钮 → 金额选择 Modal → 确认扣款
- BookDetail 展示最新打赏列表

## 6. 书单/书荒广场

### 新表 `book_lists`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT PK | 主键 |
| user_id | BIGINT NOT NULL | 创建者 |
| title | VARCHAR(200) | 书单标题 |
| description | VARCHAR(1000) | 简介 |
| cover | VARCHAR(500) | 封面图 |
| is_public | TINYINT DEFAULT 1 | 是否公开 |
| like_count | INT DEFAULT 0 | 点赞数 |
| book_count | INT DEFAULT 0 | 书籍数 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### 新表 `book_list_items`
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT AUTO_INCREMENT PK | 主键 |
| list_id | BIGINT NOT NULL | 书单 ID |
| book_id | BIGINT NOT NULL | 书籍 ID |
| sort_order | INT DEFAULT 0 | 排序 |
| add_time | DATETIME | 添加时间 |

唯一约束: unique(list_id, book_id)，索引: index(list_id)

### API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /book-lists?page=&size=&sort= | 书荒广场（公开书单） |
| GET | /book-lists/my | 我的书单 |
| GET | /book-lists/:id | 书单详情 |
| POST | /book-lists | 创建书单 |
| PUT | /book-lists/:id | 编辑书单 |
| DELETE | /book-lists/:id | 删除书单 |
| POST | /book-lists/:id/items | 添加书籍 |
| DELETE | /book-lists/:id/items/:itemId | 移除书籍 |

### 新增页面
- **BookListSquare** (`/book-lists`): 书荒广场，公开书单网格
- **BookListDetail** (`/book-lists/:id`): 书单详情 + 书籍列表

### 现有页面改动
- BookDetail: 增加「添加到书单」按钮
- Discover: 增加书单入口卡片
