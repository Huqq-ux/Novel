# 土豆小说微服务架构迁移方案

## 概述

将当前 Spring Boot 3.1 单体后端 + 独立 Python AI 服务，迁移为基于 **Spring Cloud Alibaba + Nacos 3.2 A2A Registry** 的微服务架构。拆分为 7 个微服务 + 1 个网关，AI 服务通过 A2A 协议注册为 Agent。初期保持共享数据库，后续逐步解耦。

## 技术选型

| 组件 | 选型 | 版本 | 说明 |
|------|------|------|------|
| 基础框架 | Spring Boot | **3.5.x**（从 3.1 升级） | Nacos 3.x 最低要求 |
| 微服务治理 | Spring Cloud Alibaba | **2025.0.x** | BOM 统一管理 |
| 注册 / 配置中心 | Nacos Server | **3.2.1** | A2A Registry 1.0 |
| AI Agent 注册 | Nacos A2A Registry | **1.0**（内置于 Nacos 3.2.1） | AgentCard v1 协议 |
| 网关 | Spring Cloud Gateway | 2025.x | 兼容 Spring Boot 3.5 |
| 服务调用（Java-Java） | OpenFeign + LoadBalancer | Spring Cloud 默认 | 同步 REST 调用 |
| 服务调用（Java-AI） | Spring AI Alibaba A2aRemoteAgent | **1.0.0.4+** | A2A 协议调用 AI Agent |
| AI 服务框架 | AgentScope (Python) | latest | 暴露 A2A 端点 + 注册 AgentCard |
| 认证 | Gateway 统一 JWT 鉴权 | jjwt 0.11.5（沿用） | 需验证 Spring Boot 3.5 兼容性 |
| 数据库 | MySQL 8.0 共享 | 现有 | 初期共享，后续拆分 |
| 缓存 | Redis 共享 | 现有 | Key 命名规范隔离 |
| ORM | MyBatis-Plus | 3.5.7（沿用） | 需验证 Spring Boot 3.5 兼容性 |
| 构建 | Maven 多模块 | 父 POM 聚合 | Spring Boot 3.5 要求 Maven 3.6.3+ |

## 架构图

```
                     ┌──────────────────────────┐
                     │   Frontend (React :3000)  │
                     └────────────┬─────────────┘
                                  │ /api/*
                     ┌────────────▼─────────────┐
                     │  novel-gateway (:8080)    │
                     │  Spring Cloud Gateway     │
                     │  - JWT 统一鉴权            │
                     │  - 路由转发                │
                     │  - CORS / 限流             │
                     └────────────┬─────────────┘
                                  │ 服务发现 (Nacos Discovery)
                     ┌────────────▼─────────────┐
                     │   Nacos 3.2.1 Server      │
                     │  ┌─────────────────────┐  │
                     │  │ Service Registry    │  │  ← Java 微服务注册
                     │  │ A2A Agent Registry  │  │  ← AI Agent 注册 (AgentCard)
                     │  │ Config Center       │  │
                     │  └─────────────────────┘  │
                     └────────────┬─────────────┘
                                  │
    ┌──────┬──────┬──────┬──────┬──────┼──────┬──────┐
    │      │      │      │      │      │      │      │
┌───▼──┐┌──▼─┐┌──▼─┐┌──▼─┐┌──▼─┐ │ ┌───▼──┐┌──▼──────┐
│ User ││Book││Read││Int ││Pay │ │ │Admin ││   AI    │
│:8081 ││:8082││:8083││:8084││:8085│ │ │:8086 ││ :8001   │
│Java  ││Java││Java││Java││Java│ │ │Java  ││ Python  │
└──────┘└────┘└────┘└────┘└────┘ │ └──────┘│FastAPI  │
    │      │      │      │      │      │      │AgentScope│
    │      │      │      │      │      │      │A2A Agent│
    └──────┴──────┴──────┴──────┴──────┴──────┘│Card     │
                     │                         └─────────┘
            ┌────────▼────────┐                   ▲
            │   MySQL (共享)   │                   │
            │   Redis (共享)   │         A2A 协议调用 AI Agent
            └─────────────────┘         (Spring AI Alibaba)
```

## 端口分配

| 服务 | 端口 | Application Name | 注册方式 |
|------|------|------------------|----------|
| novel-gateway | 8080 | novel-gateway | Nacos Discovery |
| novel-user-service | 8081 | novel-user-service | Nacos Discovery |
| novel-book-service | 8082 | novel-book-service | Nacos Discovery |
| novel-reading-service | 8083 | novel-reading-service | Nacos Discovery |
| novel-interaction-service | 8084 | novel-interaction-service | Nacos Discovery |
| novel-payment-service | 8085 | novel-payment-service | Nacos Discovery |
| novel-admin-service | 8086 | novel-admin-service | Nacos Discovery |
| novel-ai-service | 8001 | novel-ai-agent | **Nacos A2A Registry**（AgentCard） |

## 服务职责

### 1. novel-gateway（网关 :8080）

- JWT 校验：验签 + 解析 userId/role，注入请求头 `X-User-Id`、`X-User-Role`
- 路由规则（基于路径前缀）：
  - `/api/auth/**` → novel-user-service
  - `/api/user/**` → novel-user-service
  - `/api/notifications/**` → novel-user-service
  - `/api/author/**` → novel-user-service
  - `/api/books/**` → novel-book-service
  - `/api/author/books/**` → novel-book-service
  - `/api/upload/**` → novel-book-service
  - `/api/bookshelf/**` → novel-reading-service
  - `/api/bookmarks/**` → novel-reading-service
  - `/api/unlock/**` → novel-reading-service
  - `/api/comments/**` → novel-interaction-service
  - `/api/ratings/**` → novel-interaction-service
  - `/api/tips/**` → novel-interaction-service
  - `/api/book-lists/**` → novel-interaction-service
  - `/api/coin/**` → novel-payment-service
  - `/api/signin/**` → novel-payment-service
  - `/api/admin/**` → novel-admin-service
  - `/api/ai/**` → novel-ai-service（A2A Agent，通过 Nacos A2A Registry 发现）
- CORS 全局配置、请求日志、限流（可选）

### 2. novel-user-service（用户服务 :8081）

迁移现有 Controller：AuthController、UserController、NotificationController、AuthorApplicationController

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| POST `/auth/login` | 登录 | 无 |
| POST `/auth/register` | 注册 | 无 |
| POST `/auth/refresh` | 刷新 Token | 无 |
| POST `/auth/logout` | 登出 | 需登录 |
| GET `/user/info` | 用户信息 | 需登录 |
| PUT `/user/info` | 更新用户信息 | 需登录 |
| PUT `/user/avatar` | 上传头像 | 需登录 |
| PUT `/user/password` | 修改密码 | 需登录 |
| GET `/user/settings` | 个人设置 | 需登录 |
| PUT `/user/settings` | 更新设置 | 需登录 |
| GET `/notifications` | 通知列表 | 需登录 |
| GET `/notifications/unread-count` | 未读数 | 需登录 |
| POST `/notifications/{id}/read` | 标记已读 | 需登录 |
| POST `/notifications/read-all` | 全部已读 | 需登录 |
| GET `/author/status` | 作者状态 | 需登录 |
| POST `/author/apply` | 申请作者 | 需登录 |
| POST `/author/send-verify-code` | 发送验证码 | 需登录 |
| POST `/author/verify-email` | 验证邮箱 | 需登录 |
| GET `/author/application` | 我的申请 | 需登录 |
| GET `/author/admin/applications` | 申请列表 | 管理员 |
| POST `/author/admin/applications/{id}/approve` | 通过申请 | 管理员 |
| POST `/author/admin/applications/{id}/reject` | 驳回申请 | 管理员 |

### 3. novel-book-service（书籍服务 :8082）

迁移现有 Controller：BookController、AuthorBookController、FileUploadController

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| GET `/books` | 书籍列表（分页/分类/筛选） | 无 |
| GET `/books/{id}` | 书籍详情 | 无 |
| GET `/books/{id}/chapters` | 章节列表 | 无 |
| GET `/books/{bookId}/chapters/{chapterId}` | 章节内容 | 无 |
| GET `/books/search` | 搜索 | 无 |
| GET `/author/books` | 我的书籍列表 | 作者 |
| POST `/author/books` | 创建书籍 | 作者 |
| PUT `/author/books/{bookId}` | 编辑书籍 | 作者 |
| DELETE `/author/books/{bookId}` | 删除书籍 | 作者 |
| GET `/author/books/{bookId}/chapters` | 获取章节 | 作者 |
| POST `/author/books/{bookId}/chapters` | 创建章节 | 作者 |
| PUT `/author/books/{bookId}/chapters/{chapterId}` | 编辑章节 | 作者 |
| DELETE `/author/books/{bookId}/chapters/{chapterId}` | 删除章节 | 作者 |
| GET `/author/books/{bookId}/stats` | 书籍统计 | 作者 |
| POST `/upload/cover` | 上传封面 | 作者 |
| POST `/upload/avatar` | 上传头像 | 需登录 |
| DELETE `/upload` | 删除文件 | 需登录 |

### 4. novel-reading-service（阅读服务 :8083）

迁移现有 Controller：BookshelfController、BookmarkController、UnlockController

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| GET `/bookshelf` | 书架列表 | 需登录 |
| POST `/bookshelf/add` | 加入书架 | 需登录 |
| DELETE `/bookshelf/{bookId}` | 移出书架 | 需登录 |
| PUT `/bookshelf/progress` | 更新阅读进度 | 需登录 |
| GET `/bookmarks` | 书签列表 | 需登录 |
| GET `/bookmarks/check` | 检查是否已加书签 | 需登录 |
| POST `/bookmarks` | 添加书签 | 需登录 |
| DELETE `/bookmarks/{id}` | 删除书签 | 需登录 |
| GET `/unlock/status/{bookId}/{chapterId}` | 解锁状态 | 需登录 |
| POST `/unlock/chapter/{chapterId}` | 解锁章节 | 需登录 |
| GET `/unlock/list/{bookId}` | 已解锁列表 | 需登录 |

### 5. novel-interaction-service（交互服务 :8084）

迁移现有 Controller：CommentController、BookRatingController、TipController、BookListController

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| GET `/comments/my` | 我的评论 | 需登录 |
| GET `/comments/book/{bookId}` | 书籍评论列表 | 无 |
| POST `/comments/add` | 发表评论 | 需登录 |
| DELETE `/comments/{id}` | 删除评论 | 需登录 |
| POST `/comments/{id}/like` | 点赞评论 | 需登录 |
| POST `/ratings/{bookId}` | 提交评分 | 需登录 |
| GET `/ratings/{bookId}/user` | 我的评分 | 需登录 |
| GET `/ratings/{bookId}/stats` | 评分统计 | 无 |
| DELETE `/ratings/{bookId}` | 删除评分 | 需登录 |
| POST `/tips` | 打赏作者 | 需登录 |
| GET `/tips/book/{bookId}` | 书籍打赏记录 | 无 |
| GET `/tips/received` | 收到的打赏 | 作者 |
| GET `/book-lists` | 书单列表 | 无 |
| GET `/book-lists/my` | 我的书单 | 需登录 |
| GET `/book-lists/{id}` | 书单详情 | 无 |
| POST `/book-lists` | 创建书单 | 需登录 |
| PUT `/book-lists/{id}` | 编辑书单 | 需登录 |
| DELETE `/book-lists/{id}` | 删除书单 | 需登录 |
| POST `/book-lists/{id}/items` | 添加书籍到书单 | 需登录 |
| DELETE `/book-lists/{listId}/items/{itemId}` | 移除书单书籍 | 需登录 |

### 6. novel-payment-service（支付服务 :8085）

迁移现有 Controller：CoinController、SignInController

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| GET `/coin/packages` | 充值套餐列表 | 需登录 |
| POST `/coin/recharge` | 充值 | 需登录 |
| GET `/coin/balance` | 余额查询 | 需登录 |
| GET `/coin/records` | 充值记录 | 需登录 |
| GET `/signin/status` | 签到状态 | 需登录 |
| POST `/signin/do` | 执行签到 | 需登录 |

### 7. novel-admin-service（管理后台 :8086）

迁移现有 Controller：AdminController、ImageIntegrityController

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| GET `/admin/users` | 用户列表 | 管理员 |
| POST `/admin/users/{id}/status` | 封禁/解封用户 | 管理员 |
| POST `/admin/users/{id}/role` | 修改角色 | 管理员 |
| GET `/admin/stats` | 数据仪表盘 | 管理员 |
| GET `/admin/books` | 书籍管理列表 | 管理员 |
| POST `/admin/books/paid` | 添加付费书籍 | 管理员 |
| PUT `/admin/books/paid/{id}` | 编辑付费设置 | 管理员 |
| POST `/admin/books/{id}/status` | 上下架 | 管理员 |
| DELETE `/admin/books/{id}` | 删除书籍 | 管理员 |
| GET `/admin/images/check/{bookId}` | 检查封面 | 管理员 |
| GET `/admin/images/check-all` | 全量检查封面 | 管理员 |
| GET `/admin/images/invalid` | 无效封面列表 | 管理员 |
| POST `/admin/images/fix` | 修复封面 | 管理员 |
| POST `/admin/images/clear-cache` | 清除缓存 | 管理员 |

### 8. novel-ai-service（AI 服务 :8001，Python + AgentScope）

**核心变更**：AI 服务从普通 HTTP 服务升级为 **A2A Agent**，通过 AgentScope 暴露 A2A 协议端点，注册 AgentCard 到 Nacos A2A Registry。

**AgentCard 定义：**

```python
from a2a.types import AgentCard, AgentCapabilities, AgentSkill
from agentscope_runtime.engine.deployers.adapter.a2a.nacos_a2a_registry import NacosRegistry

agent_card = AgentCard(
    name="novel-ai-agent",
    description="土豆小说 AI 智能助手，提供推荐、搜索、客服和封面生成能力",
    version="1.0.0",
    url="http://novel-ai-service:8001",
    capabilities=AgentCapabilities(
        streaming=True,          # 支持 SSE 流式响应
        push_notifications=False,
    ),
    default_input_modes=["text/plain"],
    default_output_modes=["text/plain"],
    skills=[
        AgentSkill(
            id="recommend",
            name="智能推荐",
            description="根据用户偏好和阅读历史，推荐合适的小说",
            input_modes=["text/plain"],
            output_modes=["text/plain"],
            tags=["ai", "recommend", "streaming"],
        ),
        AgentSkill(
            id="search",
            name="智能搜索",
            description="基于语义理解的智能小说搜索",
            input_modes=["text/plain"],
            output_modes=["text/plain"],
            tags=["ai", "search", "streaming"],
        ),
        AgentSkill(
            id="customer_service",
            name="AI 客服",
            description="回答用户关于平台使用、充值、会员等常见问题",
            input_modes=["text/plain"],
            output_modes=["text/plain"],
            tags=["ai", "customer-service", "streaming"],
        ),
        AgentSkill(
            id="generate_cover",
            name="封面生成",
            description="根据书籍信息AI生成封面图片",
            input_modes=["text/plain"],
            output_modes=["image/png"],
            tags=["ai", "image-generation"],
        ),
    ],
)
```

**A2A 协议端点（AgentScope 自动暴露）：**

| A2A 端点 | 功能 |
|----------|------|
| `GET /.well-known/agent.json` | 返回 AgentCard JSON |
| `POST /a2a/message` | A2A 标准消息接口（接收任务、流式返回） |

**兼容现有 HTTP 端点（保持前端兼容）：**

| API 路径 | 功能 | 鉴权 |
|----------|------|------|
| POST `/api/ai/recommend` | 智能推荐（SSE 流式） | 需登录 |
| POST `/api/ai/search` | 智能搜索（SSE 流式） | 无需 |
| POST `/api/ai/customer-service` | AI 客服（SSE 流式） | 无需 |
| POST `/api/ai/generate-cover` | 封面生成 | 作者 |
| DELETE `/api/ai/session/{id}` | 清除会话 | 需登录 |
| GET `/api/ai/session/{id}` | 获取会话上下文 | 需登录 |

## 服务间调用

### 调用关系矩阵

```
              ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
              │ User │ Book │ Read │ Int  │ Pay  │Admin │  AI  │
┌──────┬──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ User │  -   │  -   │  -   │  -   │  -   │  -   │  -   │
│ Book │  -   │  -   │  -   │  -   │  -   │  -   │  -   │
│ Read │  -   │  ✓   │  -   │  -   │  ✓   │  -   │  -   │
│ Int  │  ✓   │  ✓   │  -   │  -   │  -   │  -   │  -   │
│ Pay  │  ✓   │  -   │  -   │  -   │  -   │  -   │  -   │
│ Admin│  ✓   │  ✓   │  -   │  -   │  ✓   │  -   │  -   │
│  AI  │  -   │  ✓   │  -   │  -   │  -   │  -   │  -   │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

调用方式：
  Java ↔ Java : OpenFeign + LoadBalancer (Nacos Discovery)
  Java → AI   : Spring AI Alibaba A2aRemoteAgent (Nacos A2A Registry)
  AI   → Book : HTTP REST (通过 Nacos Discovery 发现 IP:Port)
```

### Java 服务调用 AI Agent（A2A 方式）

```java
// 通过 Nacos A2A Registry 发现 AI Agent
@Bean
public A2aRemoteAgent aiAgent(NacosAgentCardProvider cardProvider) {
    return A2aRemoteAgent.builder()
        .agentCardProvider(cardProvider)
        .agentName("novel-ai-agent")
        .skillId("recommend")  // 按技能过滤
        .build();
}

// 调用
String result = aiAgent.sendMessage("推荐几本仙侠小说");
```

### Java 服务间调用（OpenFeign 方式）

```java
@FeignClient(name = "novel-book-service")
public interface BookFeignClient {
    @GetMapping("/books/{id}")
    ApiResponse<BookDTO> getBook(@PathVariable Long id);
}

@FeignClient(name = "novel-payment-service")
public interface PaymentFeignClient {
    @PostMapping("/coin/deduct")
    ApiResponse<Boolean> deductCoins(@RequestBody DeductRequest request);
}
```

## 认证流程

```
1. 客户端 POST /api/auth/login → Gateway → User Service
2. User Service 返回 { accessToken, refreshToken }
3. 客户端后续请求携带 Header: Authorization: Bearer <accessToken>
4. Gateway 拦截请求：
   a. 检查白名单（/auth/login, /auth/register, /books 查询等）
   b. 白名单外的请求：JWT 验签 → 解析 userId, role
   c. 注入请求头：X-User-Id, X-User-Role
5. 下游服务通过 @RequestHeader 或 CurrentUser 注解获取用户上下文
6. Token 过期 → 客户端用 refreshToken 换取新 accessToken
```

## 公共模块 novel-common

```
novel-common/
├── dto/
│   ├── ApiResponse.java
│   ├── PageResponse.java
│   ├── LoginRequest.java
│   ├── RegisterRequest.java
│   ├── TokenResponse.java
│   └── ...
├── entity/
│   ├── User.java
│   ├── Book.java
│   ├── Chapter.java
│   ├── Comment.java
│   └── ...（共享 DB 时所有服务可见）
├── exception/
│   ├── BusinessException.java
│   └── GlobalExceptionHandler.java
├── util/
│   ├── JwtUtil.java
│   └── ...
└── config/
    └── ...
```

## 项目目录结构

```
Novel/
├── pom.xml                          # 父 POM（Spring Boot 3.5 + Spring Cloud Alibaba 2025.0.x BOM）
├── novel-common/                    # 公共模块
├── novel-gateway/                   # Gateway
├── novel-user-service/              # 用户服务
├── novel-book-service/              # 书籍服务
├── novel-reading-service/           # 阅读服务
├── novel-interaction-service/       # 交互服务
├── novel-payment-service/           # 支付服务
├── novel-admin-service/             # 管理后台服务
├── ai-service/                      # Python AI 服务（新增 AgentScope A2A 集成）
├── frontend/                        # React 前端
└── docs/
```

## 迁移策略

### 阶段 0：Spring Boot 3.1 → 3.5 升级（前置）
1. 升级 Spring Boot 依赖到 3.5.x
2. 解决兼容性问题（Spring Security API 变更、javax→jakarta 迁移等）
3. 验证 MyBatis-Plus 3.5.7 + Druid + jjwt 在 3.5 下的兼容性
4. 运行完整测试套件，确保单体应用正常运行

### 阶段 1：基础设施搭建
1. 搭建 Nacos 3.2.1 Server（Standalone 模式开发，集群模式生产）
2. 创建父 POM，引入 Spring Cloud Alibaba 2025.0.x BOM
3. 创建 novel-common 模块，提取公共代码
4. 搭建 novel-gateway，实现 JWT 鉴权 + 路由转发 + Nacos 服务发现

### 阶段 2：逐服务拆分
按依赖关系从底层到上层依次拆分：
1. **novel-user-service**（无外部依赖，最先拆分）
2. **novel-book-service**（无外部依赖）
3. **novel-payment-service**（依赖 User）
4. **novel-reading-service**（依赖 Book、Payment）
5. **novel-interaction-service**（依赖 Book、User）
6. **novel-admin-service**（依赖 User、Book、Payment）

### 阶段 3：AI 服务 A2A 集成
1. 安装 AgentScope + nacos-sdk-python
2. 定义 AgentCard（技能：recommend、search、customer_service、generate_cover）
3. 通过 AgentScope Runtime 暴露 A2A 端点（`/.well-known/agent.json`、`/a2a/message`）
4. AI 服务启动时自动注册 AgentCard 到 Nacos A2A Registry
5. AI 服务通过 Nacos Discovery 发现 novel-book-service
6. Java 服务通过 Spring AI Alibaba `A2aRemoteAgent` 调用 AI Agent
7. Gateway 路由 `/api/ai/**` → novel-ai-service（A2A 端点直接由 AgentScope 处理）

### 阶段 4：前端适配
1. 前端 Vite 代理改为统一指向 Gateway :8080
2. 移除 `/api/ai` 单独代理规则
3. 回归测试所有页面

## 风险与注意事项

1. **Spring Boot 3.5 升级风险**：最大的单点风险。Spring Security 6.x 配置方式变更较大，需仔细处理。建议在拆分微服务之前先完成升级，确保单体应用稳定运行。
2. **A2A Registry 成熟度**：Nacos A2A Registry 1.0 于 2026 年 4 月发布，是较新的功能。Python 侧依赖 AgentScope 框架作为桥接层，需验证 AgentScope + nacos-sdk-python 的版本兼容性。
3. **共享数据库耦合**：初期共享 MySQL 降低迁移风险，但需确保不出现跨服务 JOIN 查询。后续逐步拆分数据库。
4. **分布式事务**：暂不引入 Seata。解锁章节等涉及扣费+记录的场景，在 Reading Service 内通过 Feign 调用 Payment 完成，保持单服务内事务。
5. **缓存 Key 命名规范**：Redis 共享时各服务需统一命名规范 `{service}:{entity}:{id}`，避免 Key 冲突。
6. **AgentScope 学习成本**：团队需熟悉 AgentScope 框架和 A2A 协议概念，这是相比普通 HTTP 注册额外增加的复杂度。
