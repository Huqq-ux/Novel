<p align="center">
  <h1 align="center">墨语小说</h1>
  <p align="center">一个全栈微服务小说阅读平台</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-orange" alt="Java 17">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen" alt="Spring Boot 3.5">
  <img src="https://img.shields.io/badge/React-18.3-61dafb" alt="React 18">
  <img src="https://img.shields.io/badge/Python-3.x-blue" alt="Python 3">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License MIT">
</p>

---

## 简介

墨语小说是一个功能完备的小说阅读平台，采用微服务架构，支持小说浏览、沉浸式阅读、书架管理、评论评分、付费解锁、作者创作、管理后台和 AI 智能助手等功能。

采用**梧桐调**经典配色设计系统，金驼色为主色调，衬线字体标题，营造典雅的阅读氛围。

## 功能

### 读者端
- **首页推荐** — Banner 轮播 + 分类浏览 + 书籍网格
- **沉浸式阅读器** — 衬线正文字体 + 字号调节 + 章节导航 + 付费解锁墙
- **发现页** — 分类矩阵 + AI 推荐 + 排行榜
- **智能搜索** — 关键词搜索 + AI 语义搜索
- **书架管理** — 阅读进度跟踪 + 分类筛选
- **互动系统** — 评论/回复/点赞 + 星级评分
- **个人中心** — 登录注册 + 阅读历史 + 收藏 + 消息通知
- **书币充值** — 套餐购买 + 每日签到

### 作者端
- 申请成为作者
- 书籍/章节 CRUD 管理
- 付费章节与定价设置

### 管理后台
- 数据仪表盘
- 用户/书籍/付费管理
- 作者申请审核
- 系统设置

### AI 智能助手
- **智能推荐** — 基于偏好 + 向量检索 + LLM 排序
- **AI 搜索** — 语义理解 + 自然语言查询
- **智能客服** — 多轮对话 + 知识库问答
- **浮动助手** — 全局快捷入口

## 架构

```
┌─────────┐    ┌──────────────────────┐
│  Browser │───▶│  Nginx (:80)         │
│  (:3000) │    │  React SPA           │
└─────────┘    └──────┬───────────────┘
                      │ /api
                      ▼
              ┌──────────────────┐
              │  Gateway (:8090)  │
              │  Spring Cloud     │
              │  Gateway          │
              └────┬──┬──┬──┬──┬─┘
                   │  │  │  │  │
      ┌────────────┼──┼──┼──┼──┼───────────┐
      │            │  │  │  │  │             │
      ▼            ▼  ▼  ▼  ▼  ▼             ▼
┌──────────┐ ┌──────────────────────────┐ ┌──────────┐
│  Nacos   │ │  Java Microservices       │ │ AI 服务  │
│  (:8848) │ │                           │ │ (:8001)  │
│  Registry│ │ :8081 User     :8082 Book │ │ FastAPI  │
│  Config  │ │ :8083 Reading  :8084 Intr │ │ LangGraph│
│          │ │ :8085 Payment  :8086 Admin│ │ ChromaDB │
└──────────┘ └──────────┬───────────────┘ └────┬─────┘
                        │                      │
                        ▼                      │
              ┌──────────────────┐             │
              │  MySQL 8.0       │◀────────────┘
              │  Redis 7         │
              └──────────────────┘
```

| 服务 | 端口 | 说明 |
|------|------|------|
| **novel-gateway** | 8090 | 统一入口，JWT 鉴权，路由转发 |
| **novel-user-service** | 8081 | 用户认证、个人中心 |
| **novel-book-service** | 8082 | 书籍/章节管理、文件上传 |
| **novel-reading-service** | 8083 | 阅读记录、书架同步 |
| **novel-interaction-service** | 8084 | 评论、评分、点赞 |
| **novel-payment-service** | 8085 | 书币充值、章节解锁 |
| **novel-admin-service** | 8086 | 管理后台 API |
| **ai-service** | 8001 | AI 推荐/搜索/客服 |
| **Nacos** | 8848 | 服务注册 + 配置中心 |

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18.3, TypeScript 5.2, Vite 4.5, react-router-dom 6.22, axios, zustand 4.5, lucide-react, CSS Modules + CSS Variables |
| **网关** | Spring Cloud Gateway, JWT 鉴权, StripPrefix |
| **业务服务** | Spring Boot 3.5, Java 17, MyBatis-Plus 3.5.7, Spring Security, OpenFeign |
| **数据库** | MySQL 8.0, Druid 连接池 |
| **缓存** | Redis 7, Lettuce, Cache-Aside 模式 |
| **AI 服务** | FastAPI 0.115, LangChain + LangGraph, DashScope API, ChromaDB |
| **基础设施** | Nacos 3.2.1, Docker Compose |

## 快速开始

### 前置要求

- Java 17+ & Maven 3.6+
- Node.js 18+
- Docker & Docker Compose（用于基础设施）
- Python 3.x（AI 服务，可选）

### 方式一：一键启动（推荐）

```bash
# Windows
start-dev.bat

# Linux / macOS
bash start-dev.sh
```

### 方式二：Docker 全栈部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库密码、JWT 密钥等

# 启动全部服务
docker-compose up -d
```

### 方式三：手动逐步启动

```bash
# 1. 启动基础设施
docker-compose up -d nacos mysql redis

# 2. 安装公共模块
./mvnw clean install -pl novel-common -DskipTests

# 3. 依次启动微服务（每个开一个终端窗口）
./mvnw spring-boot:run -pl novel-user-service
./mvnw spring-boot:run -pl novel-book-service
./mvnw spring-boot:run -pl novel-reading-service
./mvnw spring-boot:run -pl novel-interaction-service
./mvnw spring-boot:run -pl novel-payment-service
./mvnw spring-boot:run -pl novel-admin-service

# 4. 启动网关
./mvnw spring-boot:run -pl novel-gateway

# 5. 启动前端
cd frontend && npm install && npm run dev

# 6. 启动 AI 服务（可选）
cd ai-service && pip install -r requirements.txt && bash start.sh
```

访问地址：
- 前端：http://localhost:3000
- 网关：http://localhost:8090
- Nacos：http://localhost:8848/nacos（用户名/密码：nacos/nacos）
- AI 服务：http://localhost:8001

## 设计系统

梧桐调典雅版配色，所有视觉元素通过 CSS 自定义属性统一管理：

| Token | 色值 | 用途 |
|-------|------|------|
| `--color-primary` | `#c4a882` | 金驼 — 主色调、品牌色 |
| `--color-accent` | `#4a6741` | 松烟绿 — 成功状态 |
| `--color-danger` | `#c0392b` | 朱砂 — 错误/危险 |
| `--color-bg` | `#fbf9f7` | 宣纸白 — 页面背景 |
| `--color-surface` | `#f5f0e8` | 羊皮纸 — 卡片背景 |
| `--color-text-primary` | `#2c1f14` | 深棕 — 主文字色 |

## 项目结构

```
Novel/
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── components/          # 14 个自定义组件
│   │   ├── pages/               # 29 个页面 + 管理后台
│   │   ├── services/api.ts      # API 调用
│   │   ├── styles/              # Design Tokens / Reset / 字体
│   │   ├── store/               # zustand 状态管理
│   │   └── types/               # TypeScript 类型
│   └── vite.config.ts
├── novel-gateway/               # Spring Cloud Gateway
├── novel-user-service/          # 用户微服务
├── novel-book-service/          # 书籍微服务
├── novel-reading-service/       # 阅读微服务
├── novel-interaction-service/   # 交互微服务
├── novel-payment-service/       # 支付微服务
├── novel-admin-service/         # 管理后台微服务
├── novel-common/                # 公共模块
├── ai-service/                  # AI 微服务 (Python)
├── docker-compose.yml           # 容器编排
└── novel_database.sql           # 数据库初始化脚本
```

## License

MIT
