# 墨语小说 - 小说阅读平台

墨语小说阅读平台的全栈 Web 应用，包含小说浏览、阅读器、书架管理、用户认证、评论评分、付费解锁、作者创作管理、管理后台和 AI 智能助手等功能。

## 技术栈

### 前端 (`frontend/`)
- React 18.3 + TypeScript 5.2
- Vite 4.5（SWC 插件编译）
- react-router-dom 6.22（客户端路由）
- axios（HTTP 请求，拦截器 + 自动 Token 刷新）
- zustand 4.5 + persist 中间件（状态管理，localStorage 持久化）
- 自定义组件库（14 个组件，CSS Modules + CSS Variables）
- lucide-react（图标）
- 梧桐调设计系统（金驼 #c4a882 主色调，衬线标题，暖色阴影）

### 后端 (`backend/`)
- Spring Boot 3.1 + Java 17
- MyBatis-Plus 3.5.7（ORM，物理分页 + 代码生成）
- Spring Security + JWT（jjwt 0.11.5，无状态认证）
- MySQL 8.0 + Druid 1.2.20（连接池）
- Redis + Lettuce（缓存，Cache-Aside 模式）
- Lombok（实体类简化）
- Maven（构建工具）

### AI 服务 (`ai-service/`)
- FastAPI 0.115 + Python 3.x
- LangChain + LangGraph（状态图驱动的 AI 工作流）
- DashScope API（qwen3.6-plus 模型，OpenAI 兼容协议）
- ChromaDB（向量存储，text-embedding-v3 嵌入）
- SQLAlchemy 2.0 + PyMySQL（数据库读取）
- Redis（会话上下文存储）

## 项目结构

```
Novel/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── App.tsx              # 路由定义 + TabBar 布局
│   │   ├── main.tsx             # 入口
│   │   ├── components/          # 自定义组件库（14 个）+ 业务组件
│   │   │   ├── Button/           # 按钮（primary/secondary/text, sm/md/lg, danger/loading/block）
│   │   │   ├── Card/             # 卡片容器
│   │   │   ├── Input/            # 输入框（受控 value + onChange）
│   │   │   ├── Tag/              # 标签（color: default/primary/accent/danger/warning/info）
│   │   │   ├── Modal/            # 模态框（header/body/footer 三区块 + 遮罩）
│   │   │   ├── Toast/            # 轻提示（Toast.success/error/info + Toast.show/Toast.hide）
│   │   │   ├── TabBar/           # 底部标签栏
│   │   │   ├── Empty/            # 空状态插画 + 描述
│   │   │   ├── Skeleton/         # 骨架屏加载态
│   │   │   ├── SearchBar/        # 搜索栏（受控 + onSearch 回调）
│   │   │   ├── BookCover/        # 书籍封面（占位渐变 + 标题缩写）
│   │   │   ├── InfiniteScroll/   # 无限滚动加载
│   │   │   ├── PullToRefresh/    # 下拉刷新
│   │   │   ├── StarRating/       # 星级评分（交互式 + 只读）
│   │   │   ├── AIFloatingAssistant.tsx  # AI 浮动助手（业务组件）
│   │   │   ├── BookRating.tsx           # 评分面板（业务组件）
│   │   │   └── ImageUploader.tsx        # 图片上传（业务组件）
│   │   ├── hooks/
│   │   │   └── useAIChat.ts     # AI 聊天 Hook
│   │   ├── styles/              # 全局样式（Design Tokens + Reset + 字体）
│   │   │   ├── tokens.css       # CSS 自定义属性（调色板、间距、圆角、阴影、字体）
│   │   │   ├── reset.css        # CSS Reset（box-sizing、margin/padding 清零）
│   │   │   ├── typography.css   # 字体系统（衬线标题 + 无衬线正文）
│   │   │   └── utilities.css    # 通用工具类（text-ellipsis、visually-hidden 等）
│   │   ├── pages/               # 页面组件（每个页面配 *.module.css）
│   │   │   ├── admin/           # 管理后台（7 个页面：Dashboard, AuthorAuditNew, UserManagement, BookManagement, PaidBookManagement, DataReports, SystemSettings）
│   │   │   ├── index.ts         # 页面统一导出
│   │   │   ├── Home.tsx         # 首页（Banner + 分类 + 书籍网格）
│   │   │   ├── Bookshelf.tsx    # 书架（过滤器 + 阅读进度）
│   │   │   ├── Discover.tsx     # 发现（分类矩阵 + AI 推荐卡片 + 排行榜）
│   │   │   ├── User.tsx         # 个人中心（头像 + 菜单 + 登录/注册 Modal）
│   │   │   ├── BookDetail.tsx   # 书籍详情（沉浸式 Hero + 章节列表 + 评论）
│   │   │   ├── Reader.tsx       # 阅读器（正文 + 工具栏 + 付费解锁墙 + 字号设置）
│   │   │   ├── Search.tsx       # 搜索（搜索栏 + AI 搜索 + 结果列表）
│   │   │   ├── BookComments.tsx # 书评（评论卡片 + 回复嵌套）
│   │   │   ├── DailySignIn.tsx  # 每日签到
│   │   │   ├── Notifications.tsx# 通知列表
│   │   │   ├── Recharge.tsx     # 书币充值
│   │   │   ├── Settings.tsx     # 个人设置
│   │   │   ├── PaidBooks.tsx    # 付费书籍管理
│   │   │   ├── ReadingHistory.tsx# 阅读历史
│   │   │   ├── HelpFeedback.tsx # 帮助与反馈
│   │   │   ├── BecomeAuthor.tsx # 申请成为作者
│   │   │   ├── AuthorBooks.tsx  # 作者书籍管理
│   │   │   ├── AuthorAudit.tsx  # 作者申请审核
│   │   │   ├── MyComments.tsx   # 我的评论
│   │   │   ├── MyFavorites.tsx  # 我的收藏
│   │   │   └── CustomerService.tsx # 客服对话
│   │   ├── services/
│   │   │   └── api.ts           # 所有 API 调用（按领域命名空间导出）
│   │   ├── store/
│   │   │   └── bookshelf.ts     # 书架状态（zustand + persist）
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript 类型定义
│   │   └── utils/
│   │       └── passwordValidation.ts
│   └── vite.config.ts           # Vite 配置（代理 + 路径别名）
├── backend/                     # Spring Boot 后端
│   ├── src/main/java/com/novel/
│   │   ├── NovelApplication.java    # 启动类
│   │   ├── config/                   # 配置类
│   │   │   ├── SecurityConfig.java   # Spring Security + CORS
│   │   │   ├── RedisConfig.java      # Redis 缓存管理器
│   │   │   ├── MyBatisPlusConfig.java # 分页插件
│   │   │   ├── WebMvcConfig.java     # 参数解析器注册
│   │   │   ├── GlobalExceptionHandler.java  # 全局异常处理
│   │   │   └── FileUploadConfig.java
│   │   ├── entity/               # 实体类（16 个，对应数据库表）
│   │   ├── mapper/               # MyBatis-Plus Mapper 接口（16 个）
│   │   ├── service/              # 服务接口 + impl/ 实现层
│   │   ├── controller/           # REST 控制器（17 个）
│   │   ├── dto/                  # 请求/响应 DTO
│   │   ├── security/             # JWT 过滤器、CurrentUser 注解
│   │   ├── util/                 # JwtUtil、ImageValidator、IpUtil
│   │   ├── validation/           # 自定义校验注解
│   │   └── module/               # 模块化架构层
│   │       ├── Module.java       # 模块生命周期接口
│   │       ├── AbstractModule.java  # 抽象基类
│   │       ├── ModuleContext.java   # 模块注册中心
│   │       ├── ModuleInitializer.java # 应用启动后初始化
│   │       ├── event/            # 模块事件总线
│   │       ├── spi/              # 跨模块接口（Facade）
│   │       ├── common/cache/     # 通用缓存 + 分布式锁
│   │       ├── content/          # 内容模块（书籍/章节）
│   │       ├── user/             # 用户模块
│   │       ├── reading/          # 阅读/书架模块
│   │       ├── interaction/      # 交互模块（评论/评分）
│   │       └── payment/          # 付费/解锁模块
│   └── pom.xml
├── ai-service/                   # Python AI 微服务
│   ├── app/
│   │   ├── main.py              # FastAPI 应用入口
│   │   ├── config.py            # Settings（环境变量配置）
│   │   ├── api/
│   │   │   ├── chat.py          # AI 对话路由（/recommend, /search, /customer-service）
│   │   │   └── admin.py         # 管理接口
│   │   ├── core/
│   │   │   ├── llm.py           # LLM 工厂（ChatOpenAI 兼容 DashScope）
│   │   │   ├── vector_store.py  # ChromaDB 向量存储 + 索引
│   │   │   ├── database.py      # SQLAlchemy 引擎
│   │   │   ├── repository.py    # 数据访问层
│   │   │   └── context.py       # 对话上下文管理（Redis）
│   │   └── modules/
│   │       ├── recommend.py     # 推荐模块（LangGraph 3 节点图）
│   │       ├── search.py        # 搜索模块（LangGraph 3 节点图）
│   │       └── customer_service.py  # 客服模块（LangGraph 3 节点图）
│   ├── tests/
│   ├── requirements.txt
│   └── start.sh / start.bat
├── demo/                        # 独立的 Jetty Servlet 演示项目（无关）
└── novel_database.sql           # 完整数据库初始化脚本（16 张表 + 测试数据）
```

## 开发命令

```bash
# 前端
cd frontend && npm install && npm run dev       # 开发服务器 :3000
cd frontend && npm run build                     # 生产构建

# 后端
cd backend && mvn spring-boot:run                # 开发服务器 :8080
cd backend && mvn clean install                  # 构建

# AI 服务
cd ai-service && pip install -r requirements.txt # 安装依赖
cd ai-service && bash start.sh                   # 开发服务器 :8001
```

## Vite 代理配置

| 前端路径 | 代理目标 | 说明 |
|---|---|---|
| `/api` | `http://localhost:8080`（去掉 `/api` 前缀） | Spring Boot 后端 |
| `/api/ai` | `http://localhost:8001` | AI 服务，优先级高于 `/api` |

## 数据库

MySQL 8.0，数据库名 `novel`，字符集 `utf8mb4`。

核心表（16 张）：`users`, `books`, `chapters`, `bookshelf`, `comments`, `comment_likes`, `book_ratings`, `chapter_unlocks`, `coin_recharge_records`, `recharge_packages`, `sign_in_records`, `refresh_tokens`, `notifications`, `audit_logs`, `author_applications`, `author_audit_records`

## 代码规范

### 后端 Java

- **实体类**：使用 Lombok `@Data` 注解，`@TableName` 显式指定表名，`@TableId(type = IdType.AUTO)` 自增主键，`@TableField` 处理驼峰/下划线映射；字段使用包装类型（Long/Integer）支持 null
- **Controller**：`@RestController` + `@RequestMapping`，**统一返回** `ApiResponse<T>`（静态工厂方法 `ApiResponse.success(data)` / `ApiResponse.error(code, message)`）；使用 `@Valid` + DTO 做请求参数校验；复杂业务逻辑委托给 Service 层
- **Service**：接口-实现分离，`interface` 定义在 `service/` 包，`@Service` 标注的实现在 `service/impl/` 包；`@Autowired` 注入依赖；缓存查询使用 Lambda 惰性求值：`cacheService.getXxx(id, () -> mapper.select(id))`
- **注释风格**：核心类和方法使用中文 Javadoc，包含 `功能描述`、`实现逻辑`、`设计考量` 三段式结构（关注 WHY 而非 WHAT）
- **包结构**：遵循按层分包（entity/mapper/service/controller/dto），模块化代码在 `module/` 下按领域分包
- **命名**：类名 PascalCase，方法/字段 camelCase，包名全小写；Mapper 方法使用 MyBatis-Plus 命名约定

### 前端 TypeScript/React

- **页面文件**：`PascalCase` 文件名，函数组件 + React Hooks，默认导出；每个页面配有 `*.module.css`（CSS Modules），文件命名如 `Home.tsx` + `Home.module.css`
- **组件架构**：14 个基础组件（Button/Card/Input/Tag/Modal/Toast/TabBar/Empty/Skeleton/SearchBar/BookCover/InfiniteScroll/PullToRefresh/StarRating），每个组件目录包含 `types.ts`（Props 类型）、`styles.module.css`（CSS Modules）、`index.tsx`（实现 + 默认导出）
- **Design Token**：所有颜色、间距、圆角、阴影通过 CSS 自定义属性引用（`var(--color-primary)`、`var(--space-md)`、`var(--radius-lg)`、`var(--shadow-sm)`），定义在 `styles/tokens.css`，禁止硬编码色值或像素值
- **调色板**：梧桐调典雅版 — 金驼 `#c4a882`（primary）、松烟绿 `#4a6741`（accent/success）、朱砂 `#c0392b`（danger）、宣纸白 `#fbf9f7`（bg）、羊皮纸 `#f5f0e8`（surface）、深棕 `#2c1f14`（text-primary）；暖色系阴影 `rgba(44, 31, 20, ...)`
- **CSS Modules**：类名使用 camelCase（`.bookCard`、`.headerTitle`），composes 复用基类；全局工具类放在 `styles/utilities.css`
- **组件 API 约定**：
  - `Button`：`variant="primary"|"secondary"|"text"`，`size="sm"|"md"|"lg"`，`danger`，`loading`，`disabled`，`block`，`onClick`
  - `Tag`：`color="default"|"primary"|"accent"|"danger"|"warning"|"info"`（非 `variant`）
  - `Toast`：静态方法 `Toast.success(msg)` / `Toast.error(msg)` / `Toast.info(msg)`，或命令式 `Toast.show({ content })` / `Toast.hide()`
  - `Input`：受控组件，`value` + `onChange(value: string)`，`rows` 控制多行，`onEnterPress` 键盘回调
  - `Modal`：`visible` + `onClose` + `header`/`body`/`footer` 三区块
- **图标**：使用 `lucide-react`（`import { Home, ArrowLeft, Search } from 'lucide-react'`），禁止 @ant-design/icons
- **确认弹窗**：使用浏览器原生 `window.confirm()` 替代 antd-mobile `Dialog.confirm()`
- **API 调用**：全部集中在 `services/api.ts`，按领域分组为命名空间导出对象（如 `bookApi`、`userApi`），组件中不直接调用 axios
- **类型定义**：集中在 `types/index.ts`，以 `interface` 为主
- **路由**：全部在 `App.tsx` 的 `<Routes>` 中集中定义，路径参数使用 `:param` 语法
- **状态管理**：轻量使用 zustand，仅书架状态全局持久化；其余组件内部 useState
- **路径别名**：`@/` 映射到 `src/`

### AI 服务 Python

- **类型注解**：所有函数和方法使用类型注解，LangGraph 状态使用 `TypedDict` + `Annotated[list, add]`
- **模块设计**：每个 AI 功能模块是独立的 LangGraph `StateGraph`，模块级别编译为单例
- **配置**：使用 `pydantic` `Settings` 类 + `python-dotenv`，环境变量通过 `Settings` 属性访问
- **日志**：标准 `logging` 模块，每个文件 `logger = logging.getLogger(__name__)`
- **异步**：LLM 调用使用 `ainvoke` 异步 API，FastAPI 路由函数使用 `async def`

## 关键设计决策

1. **双 Token 认证**：Access Token（JWT，1h 过期，无状态） + Refresh Token（UUID，7d 过期，持久化到 DB），前端 axios 拦截器自动处理 401 → 队列化刷新 → 重试失败请求
2. **统一 API 响应**：所有后端接口返回 `ApiResponse<T>` 包装（`{ code, message, data }`）格式，前端拦截器对成功响应自动解包 `response.data`
3. **Cache-Aside 缓存策略**：先查 Redis → 未命中查 DB → 回写缓存；不同数据分级 TTL（book: 1h, chapter: 30min, list: 5min）；使用互斥锁防缓存击穿、缓存空值防穿透、随机过期防雪崩
4. **模块化架构**：在传统 Controller-Service-Mapper 分层基础上，叠加了基于事件总线的模块系统（ModuleContext + ModuleEventBus），5 个业务模块在 `ApplicationReadyEvent` 时初始化，通过 SPI Facade 跨模块调用
5. **AI 工作流**：每个 AI 功能（推荐/搜索/客服）使用 LangGraph 多节点有向图编排，而非单次 LLM 调用，如推荐流程为"偏好提取 → 向量+DB 检索 → LLM 排序推荐"
6. **代理路径优先级**：Vite 配置中 `/api/ai` 代理规则先于 `/api` 匹配，确保 AI 请求不经过后端 Spring Boot
7. **自定义组件库 + CSS Modules 设计系统**：移除 antd-mobile 依赖，自建 14 个组件库（Button/Card/Input/Tag/Modal/Toast/TabBar/Empty/Skeleton/SearchBar/BookCover/InfiniteScroll/PullToRefresh/StarRating），采用三层架构：Design Tokens（CSS Variables）→ 组件库（CSS Modules）→ 页面。梧桐调（金驼 #c4a882）典雅配色，衬线标题 + 暖色阴影 + 大圆角 + 宽松留白。每个组件 `components/Name/{types.ts, styles.module.css, index.tsx}` 独立封装，页面通过 `*.module.css` 搭配使用。业务组件（AIFloatingAssistant/BookRating/ImageUploader）保留扁平单文件结构
