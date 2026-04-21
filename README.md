# 墨语小说 - 小说阅读平台

一个模仿番茄免费小说的Web应用，包含完整的前后端功能。

## 项目结构

```
Novel/
├── frontend/          # 前端项目 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── services/  # API服务
│   │   ├── store/     # 状态管理
│   │   ├── types/     # TypeScript类型定义
│   │   └── ...
│   └── package.json
├── backend/           # 后端项目 (Spring Boot + JPA)
│   ├── src/main/java/com/novel/
│   │   ├── entity/    # 实体类
│   │   ├── repository/# 数据访问层
│   │   ├── service/   # 业务逻辑层
│   │   ├── controller/# 控制器
│   │   ├── dto/       # 数据传输对象
│   │   └── config/    # 配置类
│   └── pom.xml
└── README.md
```

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Ant Design Mobile
- React Router
- Axios
- Zustand (状态管理)

### 后端
- Spring Boot 3.2
- Spring Data JPA
- MySQL
- Maven

## 功能特性

### 前端功能
- 📚 首页：展示热门小说推荐
- 📖 书架：管理已收藏的小说
- 🔍 搜索：按书名或作者搜索
- 📖 阅读器：支持字体大小调整、章节切换
- 🔍 发现：分类浏览、排行榜
- 👤 个人中心：用户信息管理

### 后端API
- 书籍管理：获取书籍列表、详情、章节
- 书架管理：添加/删除书籍、更新阅读进度
- 用户认证：登录、注册
- 搜索功能：按关键词搜索书籍

## 快速开始

### 前置要求
- Node.js 18+
- Java 17+
- MySQL 8.0+

### 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE novel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改后端配置文件 `backend/src/main/resources/application.yml` 中的数据库连接信息：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/novel?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password
```

### 启动后端

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

后端服务将在 http://localhost:8080 启动

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:3000 启动

## API接口文档

### 书籍相关
- `GET /api/books` - 获取书籍列表
- `GET /api/books/{id}` - 获取书籍详情
- `GET /api/books/{id}/chapters` - 获取书籍章节列表
- `GET /api/books/{bookId}/chapters/{chapterId}` - 获取章节内容
- `GET /api/books/search?keyword=xxx` - 搜索书籍

### 书架相关
- `GET /api/bookshelf` - 获取书架列表
- `POST /api/bookshelf/add` - 添加到书架
- `DELETE /api/bookshelf/{bookId}` - 从书架移除
- `PUT /api/bookshelf/progress` - 更新阅读进度

### 用户相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/user/info` - 获取用户信息

## 开发说明

### 前端开发
- 前端代码位于 `frontend/` 目录
- 使用 Vite 作为构建工具
- API请求通过 `src/services/api.ts` 统一管理
- 状态管理使用 Zustand

### 后端开发
- 后端代码位于 `backend/` 目录
- 使用 Spring Boot + JPA
- 实体类自动创建数据库表
- API接口统一返回 `ApiResponse` 格式

## 待实现功能

### 后端（需要您完成）
- [ ] 用户认证和JWT Token实现
- [ ] 密码加密（BCrypt）
- [ ] 书籍数据爬取或导入
- [ ] 阅读历史记录
- [ ] 评论系统
- [ ] 推荐算法
- [ ] 缓存优化（Redis）
- [ ] 文件上传（书籍封面）
- [ ] 权限管理
- [ ] API限流

### 前端（可选扩展）
- [ ] 用户登录注册界面
- [ ] 阅读历史页面
- [ ] 评论功能
- [ ] 夜间模式
- [ ] 阅读设置（字体、背景色等）
- [ ] 书签功能
- [ ] 离线阅读
- [ ] PWA支持

## 注意事项

1. 首次启动后端时，JPA会自动创建数据库表结构
2. 需要手动插入测试数据到数据库
3. 前端默认代理 `/api` 请求到后端 `http://localhost:8080`
4. 生产环境请修改JWT密钥和数据库密码

## 许可证

MIT License
