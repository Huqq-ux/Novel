# Novel Backend

Spring Boot后端服务

## 环境要求
- Java 17+
- Maven 3.6+
- MySQL 8.0+

## 配置说明

### 数据库配置
修改 `src/main/resources/application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/novel
    username: your_username
    password: your_password
```

### JWT配置
修改 `application.yml` 中的JWT配置：

```yaml
jwt:
  secret: your-secret-key-change-this-in-production
  expiration: 86400000
```

## 运行方式

### 方式一：使用Maven
```bash
mvn clean install
mvn spring-boot:run
```

### 方式二：使用IDE
直接运行 `NovelApplication.java` 的main方法

## API文档

服务启动后访问：http://localhost:8080

### 主要接口
- 书籍相关：`/api/books/*`
- 书架相关：`/api/bookshelf/*`
- 用户相关：`/api/user/*`
- 认证相关：`/api/auth/*`

## 开发说明

### 实体类（Entity）
- Book：书籍实体
- Chapter：章节实体
- User：用户实体
- Bookshelf：书架实体

### 数据访问层（Mapper）
使用MyBatis-Plus，继承BaseMapper

### 服务（Service）
业务逻辑层，处理核心业务

### 控制器（Controller）
RESTful API接口

## 待实现功能

- [ ] JWT Token认证
- [ ] 密码加密（BCrypt）
- [ ] Redis缓存
- [ ] 文件上传
- [ ] 数据导入
- [ ] 推荐算法
- [ ] 评论系统
- [ ] 阅读历史