# 墨语小说 - 小说阅读平台

墨语小说是一个全栈 Web 阅读平台，包含小说浏览、沉浸式阅读器、书架管理、用户认证、评论评分、付费解锁、作者创作管理、管理后台和 AI 智能助手等功能。

## 项目结构

```
Novel/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── App.tsx              # 路由定义 + TabBar 布局
│   │   ├── main.tsx             # 入口
│   │   ├── components/          # 自定义组件库（14 个）+ 业务组件
│   │   │   ├── Button/          # 按钮
│   │   │   ├── Card/            # 卡片容器
│   │   │   ├── Input/           # 输入框
│   │   │   ├── Tag/             # 标签
│   │   │   ├── Modal/           # 模态框
│   │   │   ├── Toast/           # 轻提示
│   │   │   ├── TabBar/          # 底部标签栏
│   │   │   ├── Empty/           # 空状态
│   │   │   ├── Skeleton/        # 骨架屏
│   │   │   ├── SearchBar/       # 搜索栏
│   │   │   ├── BookCover/       # 书籍封面
│   │   │   ├── InfiniteScroll/  # 无限滚动
│   │   │   ├── PullToRefresh/   # 下拉刷新
│   │   │   ├── StarRating/      # 星级评分
│   │   │   ├── AIFloatingAssistant.tsx  # AI 浮动助手
│   │   │   ├── BookRating.tsx   # 评分面板
│   │   │   └── ImageUploader.tsx # 图片上传
│   │   ├── pages/               # 页面组件（29 个）
│   │   │   ├── admin/           # 管理后台（7 个页面）
│   │   │   ├── Home.tsx         # 首页
│   │   │   ├── Bookshelf.tsx    # 书架
│   │   │   ├── Discover.tsx     # 发现
│   │   │   ├── User.tsx         # 个人中心
│   │   │   ├── BookDetail.tsx   # 书籍详情
│   │   │   ├── Reader.tsx       # 阅读器
│   │   │   ├── Search.tsx       # 搜索
│   │   │   └── ...              # 更多功能页面
│   │   ├── styles/              # 全局样式
│   │   │   ├── tokens.css       # Design Tokens
│   │   │   ├── reset.css        # CSS Reset
│   │   │   ├── typography.css   # 字体系统
│   │   │   └── utilities.css    # 工具类
│   │   ├── services/
│   │   │   └── api.ts           # API 调用
│   │   ├── store/               # 状态管理（zustand）
│   │   ├── types/               # TypeScript 类型定义
│   │   └── hooks/               # 自定义 Hooks
│   └── vite.config.ts
├── backend/                     # Spring Boot 后端
│   ├── src/main/java/com/novel/
│   │   ├── config/              # 配置类（Security, Redis, MyBatis-Plus, CORS）
│   │   ├── entity/              # 实体类（16 个）
│   │   ├── mapper/              # MyBatis-Plus Mapper
│   │   ├── service/             # 业务逻辑层
│   │   ├── controller/          # REST 控制器（15 个）
│   │   ├── dto/                 # 请求/响应 DTO
│   │   ├── security/            # JWT 过滤器 + 认证
│   │   ├── util/                # 工具类
│   │   ├── validation/          # 自定义校验注解
│   │   └── cache/               # 缓存服务（Cache-Aside + 分布式锁）
│   └── pom.xml
├── ai-service/                  # Python AI 微服务
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口
│   │   ├── api/                 # 对话路由（推荐/搜索/客服）
│   │   ├── core/                # LLM、向量存储、数据库、上下文管理
│   │   └── modules/             # LangGraph 工作流模块
│   └── requirements.txt
```

## 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| React 18.3 + TypeScript 5.2 | 函数组件 + Hooks |
| Vite 4.5 | SWC 编译，代理配置 |
| react-router-dom 6.22 | 客户端路由 |
| axios | HTTP 请求（拦截器 + 自动 Token 刷新） |
| zustand 4.5 | 轻量状态管理 + localStorage 持久化 |
| lucide-react | 图标库 |
| CSS Modules + CSS Variables | 梧桐调设计系统（金驼 #c4a882 主色调） |

### 后端
| 技术 | 说明 |
|------|------|
| Spring Boot 3.1 + Java 17 | REST API 服务 |
| MyBatis-Plus 3.5.7 | ORM + 物理分页 |
| Spring Security + JWT | 无状态认证（Access + Refresh 双 Token） |
| MySQL 8.0 + Druid | 数据库 + 连接池 |
| Redis + Lettuce | Cache-Aside 缓存（分级 TTL + 互斥锁防击穿） |

### AI 服务
| 技术 | 说明 |
|------|------|
| FastAPI 0.115 + Python 3.x | 异步 HTTP 服务 |
| LangChain + LangGraph | 多节点有向图 AI 工作流 |
| DashScope API | qwen3.6-plus 模型（OpenAI 兼容协议） |
| ChromaDB | 向量存储（text-embedding-v3） |
| Redis | 会话上下文存储 |

## 功能特性

### 读者功能
- 首页推荐：Banner 推荐 + 分类浏览 + 书籍网格
- 书籍详情：沉浸式 Hero + 章节列表 + 评分评论
- 阅读器：衬线正文字体 + 字号调节 + 章节导航 + 付费解锁
- 搜索：关键词搜索 + AI 智能搜索
- 书架管理：阅读进度跟踪 + 分类筛选
- 个人中心：登录注册 + 阅读历史 + 收藏 + 评论管理
- 书币充值 + 每日签到

### 作者功能
- 申请成为作者
- 书籍/章节管理（CRUD）
- 付费章节设置

### 管理后台
- 仪表盘数据概览
- 用户/书籍/付费管理
- 作者申请审核
- 系统设置

### AI 智能助手
- 智能书籍推荐（偏好提取 → 向量检索 → LLM 排序）
- AI 语义搜索
- 客服问答
- 浮动助手快速入口

## 快速开始

### 前置要求
- Node.js 18+
- Java 17+
- Maven 3.6+
- MySQL 8.0+
- Python 3.x（AI 服务可选）

### 1. 数据库初始化

```sql
CREATE DATABASE novel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

项目的数据库初始化脚本已由 MyBatis-Plus 管理，启动后端后会自动建表。

### 2. 启动后端

```bash
cd backend
# 修改 src/main/resources/application.yml 中的数据库连接和 JWT 密钥
mvn spring-boot:run
```

后端服务：http://localhost:8080

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务：http://localhost:3000

### 4. 启动 AI 服务（可选）

```bash
cd ai-service
pip install -r requirements.txt
bash start.sh
```

AI 服务：http://localhost:8001

## Vite 代理配置

| 前端路径 | 代理目标 | 说明 |
|----------|----------|------|
| `/api/ai` | `http://localhost:8001` | AI 服务（优先匹配） |
| `/api` | `http://localhost:8080` | Spring Boot 后端 |

## 设计系统

梧桐调典雅版配色方案：

| Token | 色值 | 用途 |
|-------|------|------|
| 金驼 `--color-primary` | `#c4a882` | 主色调、品牌色 |
| 松烟绿 `--color-accent` | `#4a6741` | 成功状态 |
| 朱砂 `--color-danger` | `#c0392b` | 危险/错误 |
| 宣纸白 `--color-bg` | `#fbf9f7` | 页面背景 |
| 羊皮纸 `--color-surface` | `#f5f0e8` | 卡片/表面背景 |
| 深棕 `--color-text-primary` | `#2c1f14` | 主文字色 |

所有颜色、间距、圆角、阴影通过 CSS 自定义属性引用，定义在 `frontend/src/styles/tokens.css`。

## 关键设计决策

1. **双 Token 认证**：Access Token（JWT 1h）+ Refresh Token（UUID 7d），axios 拦截器自动静默刷新
2. **统一 API 响应**：所有接口返回 `ApiResponse<T>`（`{ code, message, data }`）
3. **Cache-Aside 缓存架构**：分级 TTL（book: 1h, chapter: 30min, list: 5min），互斥锁防击穿、缓存空值防穿透、随机过期防雪崩
4. **AI 工作流编排**：LangGraph 多节点有向图替代单次 LLM 调用（推荐流程：偏好提取 → 向量+DB 检索 → LLM 排序推荐）
5. **自定义组件库**：14 个组件 + CSS Modules + Design Tokens 三层架构

## License

MIT
