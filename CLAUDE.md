# CLAUDE.md — 土豆小说

小说阅读平台，基于 Spring Cloud Alibaba 微服务架构，包含小说浏览、沉浸式阅读器、书架管理、用户认证、评论评分、付费解锁、作者创作管理、管理后台和 AI 智能助手等功能。

## 架构

| 服务 | 端口 | 技术栈 |
|------|------|--------|
| novel-gateway | 8090 | Spring Cloud Gateway + JWT 鉴权 + StripPrefix |
| novel-user-service | 8081 | Spring Boot 3.5 + MyBatis-Plus 3.5.7 |
| novel-book-service | 8082 | Spring Boot 3.5 + MyBatis-Plus |
| novel-reading-service | 8083 | Spring Boot 3.5 + OpenFeign |
| novel-interaction-service | 8084 | Spring Boot 3.5 + MyBatis-Plus |
| novel-payment-service | 8085 | Spring Boot 3.5 + MyBatis-Plus |
| novel-admin-service | 8086 | Spring Boot 3.5 + MyBatis-Plus |
| ai-service | 8001 | FastAPI + LangGraph + DashScope |
| Nacos Server | 8848 | Nacos 3.2.1（注册/配置/A2A Registry） |

所有 Java 服务通过 `novel-common` 共享 DTO、Entity、Util。前端 Vite 代理 `/api` → Gateway `:8090`，Gateway 通过 Nacos 发现服务并做 StripPrefix 路由。

## 技术栈

- **前端**：React 18.3 + TypeScript 5.2, Vite 4.5, react-router-dom 6.22, axios, zustand 4.5, lucide-react, CSS Modules + CSS Variables
- **后端**：Spring Boot 3.5, Java 17, MyBatis-Plus 3.5.7, Spring Security + JWT (jjwt 0.11.5), MySQL 8.0 + Druid, Redis + Lettuce, Lombok, Maven
- **AI 服务**：FastAPI 0.115, LangChain + LangGraph, DashScope API (OpenAI 兼容协议), ChromaDB, SQLAlchemy 2.0 + PyMySQL
- **基础设施**：Nacos 3.2.1, MySQL 8.0, Redis 7, Docker Compose

## 开发命令

```bash
# 一键启动
#   Windows: start-dev.bat
#   Linux/Mac: start-dev.sh
# 一键停止: stop-dev.bat / stop-dev.sh

# 基础设施
docker-compose up -d nacos mysql redis      # 启动全部基础设施

# Java 服务（需要先安装 common 模块）
./mvnw clean install -pl novel-common -DskipTests
./mvnw spring-boot:run -pl novel-gateway
./mvnw spring-boot:run -pl novel-user-service
# ... 其余服务同理

# AI 服务
cd ai-service && pip install -r requirements.txt && bash start.sh

# 前端
cd frontend && npm install && npm run dev

# Docker 全栈部署
docker-compose up -d
```

## 后端 Java 规范

### 实体类
- Lombok `@Data`，`@TableName` 显式表名，`@TableId(type = IdType.AUTO)` 自增主键
- 字段全部使用包装类型（Long/Integer），`@TableField` 处理驼峰-下划线映射

### Controller
- `@RestController` + `@RequestMapping`，统一返回 `ApiResponse<T>`
- 静态工厂：`ApiResponse.success(data)` / `ApiResponse.error(code, message)`
- `@Valid` + DTO 做参数校验，复杂逻辑委托 Service 层

### Service
- 接口-实现分离：`service/XxxService` 接口 + `service/impl/XxxServiceImpl` 实现
- `@Autowired` 注入依赖
- 缓存查询：`cacheService.getXxx(id, () -> mapper.select(id))`

### 注释
- 核心类和方法用中文 Javadoc，关注 WHY 而非 WHAT

### 包结构
- 按层分包：entity / mapper / service / controller / dto / config / security

## 前端 React/TypeScript 规范

### 组件
- 14 个基础组件（Button/Card/Input/Tag/Modal/Toast/TabBar/Empty/Skeleton/SearchBar/BookCover/InfiniteScroll/PullToRefresh/StarRating）
- 每个组件目录：`types.ts` + `styles.module.css` + `index.tsx`
- 页面文件 PascalCase + 配套 `*.module.css`

### Design Token
- 所有颜色/间距/圆角/阴影通过 CSS 变量引用，禁止硬编码
- 梧桐调配色：金驼 `#c4a882`（primary）、松烟绿 `#4a6741`（accent）、朱砂 `#c0392b`（danger）、宣纸白 `#fbf9f7`（bg）、深棕 `#2c1f14`（text）

### API 调用
- 全部集中在 `services/api.ts`，按领域导出命名空间对象（`bookApi`、`userApi`）
- 类型定义集中在 `types/index.ts`
- 路由全部在 `App.tsx` 集中定义
- 图标只用 `lucide-react`

## AI 服务 Python 规范

- 所有函数使用类型注解，LangGraph 状态用 `TypedDict` + `Annotated[list, add]`
- 每个 AI 功能是独立的 `StateGraph`，模块级别编译为单例
- 配置用 pydantic `Settings` + 环境变量
- LLM 调用用 `ainvoke` 异步 API，FastAPI 路由用 `async def`

## 关键设计决策

1. **双 Token 认证**：Access Token（JWT, 1h）+ Refresh Token（UUID, 7d 持久化），前端 axios 拦截器 401 → 队列化刷新 → 重试
2. **统一响应格式**：`ApiResponse<T>` = `{ code, message, data }`，前端成功时自动解包 `response.data`
3. **Cache-Aside 缓存**：先 Redis → 未命中查 DB → 回写，分级 TTL（book: 1h, chapter: 30min, list: 5min），互斥锁防击穿、空值防穿透、随机过期防雪崩
4. **AI 工作流**：LangGraph 多节点有向图编排（如推荐：偏好提取 → 向量+DB 检索 → LLM 排序），非单次 LLM 调用
5. **Gateway StripPrefix**：前端请求 `/api/books` → Gateway 去掉 `/api` → 路由到 `novel-book-service:/books`
6. **自定义组件库**：CSS Variables（Design Tokens）→ CSS Modules（组件）→ 页面，三层架构
