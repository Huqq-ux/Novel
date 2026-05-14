# 架构优化 Spec — 2026-05-14

## 概述

对小说阅读平台进行结构性优化，去除冗余架构、统一代码风格、升级 AI 服务。

## 变更清单

### 1. 后端：删除 module/ 模块系统，迁移缓存层

**删除**：`backend/src/main/java/com/novel/module/` 下全部 ~50 个文件，包括：
- `AbstractModule.java`, `Module.java`, `ModuleContext.java`
- `config/ModuleInitializer.java`
- `event/ModuleEvent.java`, `event/ModuleEventBus.java`, `event/ModuleEventTypes.java`
- `spi/ContentServiceFacade.java`, `spi/UserServiceFacade.java`
- `content/` (Module, DomainService, Facade, Entity, Mapper — 不含 cache)
- `user/` (Module, DomainService, Facade, Entity, Mapper — 不含 cache)
- `reading/` (Module, DomainService, Entity, Mapper)
- `interaction/` (Module, DomainService, Entity, Mapper, EventHandler)
- `payment/` (Module, DomainService, Entity, Mapper)

**迁移**（移至 `com.novel.cache` 包，保留功能）：
- `module/common/cache/CacheConstants.java`
- `module/common/cache/CacheService.java`
- `module/common/cache/CacheServiceImpl.java`
- `module/common/cache/CacheProtectionService.java`
- `module/common/cache/DistributedLock.java`
- `module/content/cache/BookCacheService.java`
- `module/content/cache/ChapterCacheService.java`
- `module/user/cache/UserCacheService.java`

**修改**：
- `BookServiceImpl.java` — import 路径从 `com.novel.module.content.cache.*` 改为 `com.novel.cache.*`
- `UserServiceImpl.java` — import 路径从 `com.novel.module.user.cache.*` 改为 `com.novel.cache.*`
- `NovelApplication.java` — `@MapperScan` 去掉 `"com.novel.module.*.mapper"`

### 2. 后端：移除配置文件硬编码密码

`application.yml` 中 Redis 配置改为环境变量：
```yaml
redis:
  host: ${REDIS_HOST:localhost}
  port: ${REDIS_PORT:6379}
  password: ${REDIS_PASSWORD:}
  database: ${REDIS_DATABASE:0}
```

### 3. 后端：统一 Lombok 风格

`Bookshelf.java` — 手写 getter/setter (~80 行) 替换为 `@Data` 注解，与项目其余实体风格一致。

### 4. 前端：拆分 api.ts

`services/api.ts` (533 行) 拆分为：

| 新文件 | 内容 |
|---|---|
| `services/api/client.ts` | axios 实例、拦截器、Token 刷新 |
| `services/api/books.ts` | bookApi |
| `services/api/bookshelf.ts` | bookshelfApi |
| `services/api/user.ts` | userApi |
| `services/api/author.ts` | authorApi, authorBookApi |
| `services/api/comment.ts` | commentApi, ratingApi |
| `services/api/payment.ts` | coinApi, unlockApi |
| `services/api/admin.ts` | adminApi, notificationApi |
| `services/api/upload.ts` | uploadApi |
| `services/api/ai.ts` | aiApi, aiApiClient |
| `services/api/signin.ts` | signInApi |
| `services/api/index.ts` | 统一 re-export，保持向后兼容 |

### 5. 前端：路由懒加载

`App.tsx` 中非首屏页面改为 `React.lazy()` + `<Suspense fallback={...}>`。

保持静态导入：Home, Bookshelf, Discover, User（TabBar 4 个主页面）
懒加载：BookDetail, Reader, Search, BookComments, ReadingHistory, MyComments, MyFavorites, DailySignIn, Settings, HelpFeedback, BecomeAuthor, Notifications, Recharge, AuthorBooks, PaidBooks, AuthorAudit, AdminLayout + 所有 admin 子页面

### 6. AI 服务：切换至 DeepSeek API

- `config.py`：`DASHSCOPE_*` → `DEEPSEEK_*`，提供模板配置
- `llm.py`：`base_url` = `https://api.deepseek.com/v1`，模型 = `deepseek-v4-pro`
- `vector_store.py`：Embedding 改用本地 `sentence-transformers`（模型：`BAAI/bge-small-zh-v1.5`），通过 `chromadb.utils.embedding_functions.SentenceTransformerEmbeddingFunction`

### 7. AI 服务：知识库外置

`customer_service.py` 中 `KNOWLEDGE_BASE` 提取到 `app/data/knowledge_base.json`，启动时动态加载。

### 8. AI 服务：流式输出 (SSE)

**后端**：
- `chat.py` 三个接口改为 `StreamingResponse`，使用 `graph.astream_events()` 逐 token 产出 SSE 事件
- 响应格式：`data: {"token": "..."}\n\n`

**前端**：
- `useAIChat.ts` 改为 `fetch` + `ReadableStream` + `TextDecoder` 逐 token 更新
- `AIFloatingAssistant.tsx` 配合流式显示（打字效果）
