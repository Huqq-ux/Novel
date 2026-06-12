# 土豆小说微服务架构迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Spring Boot 3.1 单体后端 + 独立 Python AI 服务迁移为 Spring Cloud Alibaba + Nacos 3.2 A2A Registry 微服务架构（7 服务 + 1 网关）

**Architecture:** Maven 多模块项目，父 POM 管理版本，novel-common 共享模块，novel-gateway 统一鉴权路由，各业务服务按领域拆分，共享 MySQL/Redis，AI 服务通过 AgentScope + A2A Registry 注册为 Agent

**Tech Stack:** Spring Boot 3.5, Spring Cloud Alibaba 2025.0.x, Nacos 3.2.1, Spring Cloud Gateway, OpenFeign, Spring AI Alibaba 1.0.0.4+, MyBatis-Plus 3.5.7, AgentScope (Python)

**Spec:** `docs/superpowers/specs/2026-06-11-microservices-migration-design.md`

---

## 文件结构总览

### 新建模块
```
Novel/pom.xml                                    # 父 POM（聚合 + 版本管理）
Novel/novel-common/pom.xml                       # 公共模块 POM
Novel/novel-common/src/main/java/com/novel/common/
├── dto/                                         # 共享 DTO（ApiResponse, PageResponse, LoginRequest 等）
├── entity/                                      # 共享实体（User, Book, Chapter 等）
├── exception/BusinessException.java             # 业务异常
├── exception/GlobalExceptionHandler.java        # 全局异常处理
├── util/JwtUtil.java                            # JWT 工具类
├── util/ImageValidator.java                     # 图片校验工具
├── util/IpUtil.java                             # IP 工具
└── validation/                                  # 校验注解

Novel/novel-gateway/src/main/java/com/novel/gateway/
├── GatewayApplication.java                      # 启动类
├── config/GatewayConfig.java                    # 路由配置
├── config/CorsConfig.java                       # CORS 配置
├── filter/JwtAuthFilter.java                    # JWT 鉴权过滤器
└── resources/application.yml

Novel/novel-user-service/src/main/java/com/novel/user/
├── UserServiceApplication.java
├── controller/AuthController.java
├── controller/UserController.java
├── controller/NotificationController.java
├── controller/AuthorApplicationController.java
├── service/ + impl/
├── mapper/  (UserMapper, RefreshTokenMapper, NotificationMapper,
│             AuthorApplicationMapper, AuthorAuditRecordMapper, AuditLogMapper)
└── resources/application.yml

Novel/novel-book-service/src/main/java/com/novel/book/
├── BookServiceApplication.java
├── controller/BookController.java
├── controller/AuthorBookController.java
├── controller/FileUploadController.java
├── service/ + impl/
├── mapper/  (BookMapper, ChapterMapper)
└── resources/application.yml

Novel/novel-reading-service/src/main/java/com/novel/reading/
├── ReadingServiceApplication.java
├── controller/BookshelfController.java
├── controller/BookmarkController.java
├── controller/UnlockController.java
├── service/ + impl/
├── feign/BookFeignClient.java
├── feign/PaymentFeignClient.java
├── mapper/  (BookshelfMapper, BookmarkMapper, ChapterUnlockMapper)
└── resources/application.yml

Novel/novel-interaction-service/src/main/java/com/novel/interaction/
├── InteractionServiceApplication.java
├── controller/CommentController.java
├── controller/BookRatingController.java
├── controller/TipController.java
├── controller/BookListController.java
├── service/ + impl/
├── mapper/  (CommentMapper, CommentLikeMapper, BookRatingMapper,
│             TipMapper, BookListMapper, BookListItemMapper)
└── resources/application.yml

Novel/novel-payment-service/src/main/java/com/novel/payment/
├── PaymentServiceApplication.java
├── controller/CoinController.java
├── controller/SignInController.java
├── service/ + impl/
├── mapper/  (RechargePackageMapper, CoinRechargeRecordMapper, SignInMapper)
└── resources/application.yml

Novel/novel-admin-service/src/main/java/com/novel/admin/
├── AdminServiceApplication.java
├── controller/AdminController.java
├── controller/ImageIntegrityController.java
├── service/ + impl/
├── feign/UserFeignClient.java
├── feign/BookFeignClient.java
├── feign/PaymentFeignClient.java
├── mapper/  (无独立 Mapper，通过 Feign + 共享 Entity 直接查)
└── resources/application.yml
```

### 修改文件
```
backend/pom.xml → 删除（被父 POM 替代）
backend/src/main/java/com/novel/NovelApplication.java → 删除（拆分到各服务）
backend/src/main/java/com/novel/config/SecurityConfig.java → 迁移到 Gateway
ai-service/app/main.py → 新增 AgentScope A2A 端点
ai-service/requirements.txt → 新增 nacos-sdk-python, agentscope
frontend/vite.config.ts → 代理改为统一指向 Gateway :8080
```

---

## 阶段 0：Spring Boot 3.1 → 3.5 升级（前置条件）

### Task 0.1: 升级 Spring Boot 版本

**Files:**
- Modify: `backend/pom.xml`

- [ ] **Step 1: 修改 parent 版本**

将 `backend/pom.xml` 中的 Spring Boot 版本从 3.1.0 升级到 3.5.0：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.0</version>
    <relativePath/>
</parent>
```

- [ ] **Step 2: 执行 Maven 编译检查兼容性**

```bash
cd backend && mvn clean compile -DskipTests
```

观察编译错误。Spring Boot 3.5 相比 3.1 的可能兼容性问题：
- `ServerHttpSecurity.headers()` 等 Security 6.x API 变更
- 废弃 API 被移除的警告

- [ ] **Step 3: 修复编译错误（如有）**

常见修复：
- Security 6.x 中 `authorizeHttpRequests` 的 Lambda DSL 可能有调整
- jjwt 0.11.5 使用 `javax.xml.bind` 相关 API，确认 Jakarta 迁移无影响

- [ ] **Step 4: 验证应用能正常启动**

```bash
cd backend && mvn spring-boot:run
```

确认：
- 数据库连接正常（Druid）
- Redis 连接正常（Lettuce）
- MyBatis-Plus 分页插件正常
- Security 过滤器链加载正常
- 所有 Controller 映射正常

检查启动日志无 ERROR。

- [ ] **Step 5: 验证所有 API 端点**

```bash
# 测试几个关键端点
curl http://localhost:8080/books
curl http://localhost:8080/actuator/health
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" -d '{"username":"test","password":"123456"}'
```

- [ ] **Step 6: 提交**

```bash
git add backend/pom.xml
git commit -m "chore: upgrade Spring Boot from 3.1.0 to 3.5.0

Preparation for microservices migration with Nacos 3.2.1 A2A Registry."
```

---

## 阶段 1：基础设施搭建

### Task 1.1: 搭建 Nacos Server

**Files:**
- Create: `docker-compose.yml`（项目根目录）

- [ ] **Step 1: 创建 docker-compose.yml 用于 Nacos 开发环境**

```yaml
version: "3.8"
services:
  nacos:
    image: nacos/nacos-server:v3.2.1
    container_name: nacos-standalone
    environment:
      - MODE=standalone
      - PREFER_HOST_MODE=hostname
    ports:
      - "8848:8848"
      - "9848:9848"
      - "9849:9849"
    volumes:
      - nacos_data:/home/nacos/data
volumes:
  nacos_data:
```

- [ ] **Step 2: 启动 Nacos**

```bash
docker-compose up -d nacos
```

- [ ] **Step 3: 验证 Nacos 可访问**

浏览器打开 `http://localhost:8848/nacos`，默认用户名密码 `nacos/nacos`。

- [ ] **Step 4: 提交**

```bash
git add docker-compose.yml
git commit -m "chore: add Nacos 3.2.1 standalone via docker-compose"
```

### Task 1.2: 创建父 POM 和模块结构

**Files:**
- Create: `pom.xml`（项目根目录，父 POM）
- Create: `novel-common/pom.xml`
- Modify: `backend/pom.xml`（调整为从父 POM 继承，暂保留）

- [ ] **Step 1: 创建根目录父 POM**

`pom.xml`（Novel/ 根目录）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.novel</groupId>
    <artifactId>novel-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    <name>Novel Microservices Parent</name>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.0</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

        <spring-cloud-alibaba.version>2025.0.1</spring-cloud-alibaba.version>
        <spring-ai-alibaba.version>1.0.0.4</spring-ai-alibaba.version>
        <mybatis-plus.version>3.5.7</mybatis-plus.version>
        <druid.version>1.2.20</druid.version>
        <jjwt.version>0.11.5</jjwt.version>
    </properties>

    <modules>
        <module>novel-common</module>
        <!-- 后续阶段逐步添加 -->
    </modules>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.alibaba.cloud</groupId>
                <artifactId>spring-cloud-alibaba-dependencies</artifactId>
                <version>${spring-cloud-alibaba.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <dependency>
                <groupId>com.novel</groupId>
                <artifactId>novel-common</artifactId>
                <version>${project.version}</version>
            </dependency>

            <dependency>
                <groupId>com.baomidou</groupId>
                <artifactId>mybatis-plus-boot-starter</artifactId>
                <version>${mybatis-plus.version}</version>
            </dependency>

            <dependency>
                <groupId>com.alibaba</groupId>
                <artifactId>druid-spring-boot-starter</artifactId>
                <version>${druid.version}</version>
            </dependency>

            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-api</artifactId>
                <version>${jjwt.version}</version>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-impl</artifactId>
                <version>${jjwt.version}</version>
                <scope>runtime</scope>
            </dependency>
            <dependency>
                <groupId>io.jsonwebtoken</groupId>
                <artifactId>jjwt-jackson</artifactId>
                <version>${jjwt.version}</version>
                <scope>runtime</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 2: 创建 novel-common/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.novel</groupId>
        <artifactId>novel-parent</artifactId>
        <version>1.0.0</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>novel-common</artifactId>
    <packaging>jar</packaging>
    <name>Novel Common Module</name>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
</project>
```

- [ ] **Step 3: 从 backend 复制代码到 novel-common**

```bash
# 创建目录结构
mkdir -p novel-common/src/main/java/com/novel/common/{dto,entity,exception,util,validation}

# 复制 DTO
cp backend/src/main/java/com/novel/dto/ApiResponse.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/PageResponse.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/LoginRequest.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/RegisterRequest.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/TokenResponse.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/RefreshTokenRequest.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/UserDTO.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/BookshelfRequest.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/AuthorApplicationDTO.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/AuthorApplicationRequest.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/RatingStats.java novel-common/src/main/java/com/novel/common/dto/
cp backend/src/main/java/com/novel/dto/SignInStatusDTO.java novel-common/src/main/java/com/novel/common/dto/

# 复制 Entity
cp backend/src/main/java/com/novel/entity/*.java novel-common/src/main/java/com/novel/common/entity/

# 复制工具类
cp backend/src/main/java/com/novel/util/JwtUtil.java novel-common/src/main/java/com/novel/common/util/
cp backend/src/main/java/com/novel/util/ImageValidator.java novel-common/src/main/java/com/novel/common/util/
cp backend/src/main/java/com/novel/util/IpUtil.java novel-common/src/main/java/com/novel/common/util/

# 复制校验
cp backend/src/main/java/com/novel/validation/*.java novel-common/src/main/java/com/novel/common/validation/

# 复制异常处理（稍后提取）
cp backend/src/main/java/com/novel/config/GlobalExceptionHandler.java novel-common/src/main/java/com/novel/common/exception/
```

- [ ] **Step 4: 修改 novel-common 中所有 Java 文件的 package 声明**

将 `package com.novel.dto;` 改为 `package com.novel.common.dto;`，依此类推。

```bash
find novel-common/src/main/java -name "*.java" -exec sed -i 's/^package com\.novel\.\(.*\);/package com.novel.common.\1;/' {} \;
```

同时修复所有内部 import：
```bash
find novel-common/src/main/java -name "*.java" -exec sed -i 's/import com\.novel\.dto\./import com.novel.common.dto./g' {} \;
find novel-common/src/main/java -name "*.java" -exec sed -i 's/import com\.novel\.entity\./import com.novel.common.entity./g' {} \;
find novel-common/src/main/java -name "*.java" -exec sed -i 's/import com\.novel\.util\./import com.novel.common.util./g' {} \;
find novel-common/src/main/java -name "*.java" -exec sed -i 's/import com\.novel\.validation\./import com.novel.common.validation./g' {} \;
```

- [ ] **Step 5: 编译 novel-common**

```bash
cd novel-common && mvn clean compile
```

修复编译错误直至通过。

- [ ] **Step 6: 安装到本地 Maven 仓库**

```bash
mvn clean install -DskipTests
```

- [ ] **Step 7: 提交**

```bash
git add pom.xml novel-common/
git commit -m "feat: create parent POM and novel-common shared module

Extract shared DTOs, entities, utilities, and validation from backend
into novel-common. All microservices depend on this module."
```

### Task 1.3: 搭建 novel-gateway

**Files:**
- Create: `novel-gateway/pom.xml`
- Create: `novel-gateway/src/main/java/com/novel/gateway/GatewayApplication.java`
- Create: `novel-gateway/src/main/java/com/novel/gateway/config/GatewayConfig.java`
- Create: `novel-gateway/src/main/java/com/novel/gateway/config/CorsConfig.java`
- Create: `novel-gateway/src/main/java/com/novel/gateway/filter/JwtAuthFilter.java`
- Create: `novel-gateway/src/main/resources/application.yml`

- [ ] **Step 1: 创建 novel-gateway/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.novel</groupId>
        <artifactId>novel-parent</artifactId>
        <version>1.0.0</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>novel-gateway</artifactId>
    <packaging>jar</packaging>
    <name>Novel Gateway</name>

    <dependencies>
        <dependency>
            <groupId>com.novel</groupId>
            <artifactId>novel-common</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-gateway</artifactId>
        </dependency>

        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-loadbalancer</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建启动类 GatewayApplication.java**

```java
package com.novel.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 application.yml**

```yaml
spring:
  application:
    name: novel-gateway
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_ADDR:localhost:8848}
        namespace: ${NACOS_NAMESPACE:}
    gateway:
      discovery:
        locator:
          enabled: true
          lower-case-service-id: true
      routes:
        # User Service
        - id: user-service-auth
          uri: lb://novel-user-service
          predicates:
            - Path=/api/auth/**
        - id: user-service-user
          uri: lb://novel-user-service
          predicates:
            - Path=/api/user/**
        - id: user-service-notifications
          uri: lb://novel-user-service
          predicates:
            - Path=/api/notifications/**
        - id: user-service-author
          uri: lb://novel-user-service
          predicates:
            - Path=/api/author/**
        # Book Service
        - id: book-service
          uri: lb://novel-book-service
          predicates:
            - Path=/api/books/**
        - id: book-service-author-books
          uri: lb://novel-book-service
          predicates:
            - Path=/api/author/books/**
        - id: book-service-upload
          uri: lb://novel-book-service
          predicates:
            - Path=/api/upload/**
        # Reading Service
        - id: reading-service-bookshelf
          uri: lb://novel-reading-service
          predicates:
            - Path=/api/bookshelf/**
        - id: reading-service-bookmarks
          uri: lb://novel-reading-service
          predicates:
            - Path=/api/bookmarks/**
        - id: reading-service-unlock
          uri: lb://novel-reading-service
          predicates:
            - Path=/api/unlock/**
        # Interaction Service
        - id: interaction-service-comments
          uri: lb://novel-interaction-service
          predicates:
            - Path=/api/comments/**
        - id: interaction-service-ratings
          uri: lb://novel-interaction-service
          predicates:
            - Path=/api/ratings/**
        - id: interaction-service-tips
          uri: lb://novel-interaction-service
          predicates:
            - Path=/api/tips/**
        - id: interaction-service-book-lists
          uri: lb://novel-interaction-service
          predicates:
            - Path=/api/book-lists/**
        # Payment Service
        - id: payment-service-coin
          uri: lb://novel-payment-service
          predicates:
            - Path=/api/coin/**
        - id: payment-service-signin
          uri: lb://novel-payment-service
          predicates:
            - Path=/api/signin/**
        # Admin Service
        - id: admin-service
          uri: lb://novel-admin-service
          predicates:
            - Path=/api/admin/**
        # AI Service
        - id: ai-service
          uri: lb://novel-ai-service
          predicates:
            - Path=/api/ai/**

server:
  port: 8080

jwt:
  secret: ${JWT_SECRET:}
  expiration: ${JWT_EXPIRATION:3600000}
```

- [ ] **Step 4: 创建 JWT 鉴权过滤器**

`novel-gateway/src/main/java/com/novel/gateway/filter/JwtAuthFilter.java`：

```java
package com.novel.gateway.filter;

import com.novel.common.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class JwtAuthFilter implements GlobalFilter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
        "/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/error"
    );

    private static final Set<String> PUBLIC_PREFIXES_GET = Set.of(
        "/api/books", "/api/uploads", "/api/ratings",
        "/api/bookmarks", "/api/tips/book", "/api/book-lists", "/api/coin/packages"
    );

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        if (HttpMethod.OPTIONS.name().equalsIgnoreCase(method)) {
            return chain.filter(exchange);
        }

        if (isPublicPath(path, method)) {
            return processPublicPath(exchange, chain);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try {
            String username = jwtUtil.getUsernameFromToken(token);
            Long userId = jwtUtil.getUserIdFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);

            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", String.valueOf(userId))
                .header("X-User-Role", role)
                .header("X-Username", username)
                .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        } catch (ExpiredJwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublicPath(String path, String method) {
        if (PUBLIC_PATHS.contains(path)) return true;
        if ("GET".equalsIgnoreCase(method)) {
            for (String prefix : PUBLIC_PREFIXES_GET) {
                if (path.startsWith(prefix)) return true;
            }
        }
        return false;
    }

    private Mono<Void> processPublicPath(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                if (jwtUtil.validateToken(token)) {
                    Long userId = jwtUtil.getUserIdFromToken(token);
                    String role = jwtUtil.getRoleFromToken(token);
                    String username = jwtUtil.getUsernameFromToken(token);
                    ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                        .header("X-User-Id", String.valueOf(userId))
                        .header("X-User-Role", role)
                        .header("X-Username", username)
                        .build();
                    return chain.filter(exchange.mutate().request(modifiedRequest).build());
                }
            } catch (Exception ignored) {}
        }
        return chain.filter(exchange);
    }
}
```

- [ ] **Step 5: 创建 CORS 配置**

`novel-gateway/src/main/java/com/novel/gateway/config/CorsConfig.java`：

```java
package com.novel.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
```

- [ ] **Step 6: 编译验证**

```bash
cd novel-gateway && mvn clean compile
```

- [ ] **Step 7: 启动 Gateway 验证注册到 Nacos**

```bash
mvn spring-boot:run
```

验证：
- Gateway 启动在 8080 端口
- 在 Nacos 控制台 `http://localhost:8848/nacos` 服务列表中可见 `novel-gateway`

- [ ] **Step 8: 提交**

```bash
git add novel-gateway/
git commit -m "feat: create novel-gateway with JWT auth and Nacos service discovery"
```

---

## 阶段 2：逐服务拆分

### Task 2.1: 提取 novel-user-service（用户服务）

**Files:**
- Create: `novel-user-service/pom.xml`
- Create: `novel-user-service/src/main/java/com/novel/user/UserServiceApplication.java`
- Create: `novel-user-service/src/main/java/com/novel/user/controller/AuthController.java`
- Create: `novel-user-service/src/main/java/com/novel/user/controller/UserController.java`
- Create: `novel-user-service/src/main/java/com/novel/user/controller/NotificationController.java`
- Create: `novel-user-service/src/main/java/com/novel/user/controller/AuthorApplicationController.java`
- Create: `novel-user-service/src/main/java/com/novel/user/service/*.java` + `impl/*.java`
- Create: `novel-user-service/src/main/resources/application.yml`

**Mappers 迁移：** UserMapper, RefreshTokenMapper, NotificationMapper, AuthorApplicationMapper, AuthorAuditRecordMapper, AuditLogMapper

- [ ] **Step 1: 创建 novel-user-service/pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.novel</groupId>
        <artifactId>novel-parent</artifactId>
        <version>1.0.0</version>
        <relativePath>../pom.xml</relativePath>
    </parent>

    <artifactId>novel-user-service</artifactId>
    <name>Novel User Service</name>

    <dependencies>
        <dependency>
            <groupId>com.novel</groupId>
            <artifactId>novel-common</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba.cloud</groupId>
            <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
        </dependency>
        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid-spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-pool2</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建 application.yml**

```yaml
spring:
  application:
    name: novel-user-service
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_ADDR:localhost:8848}
      config:
        server-addr: ${NACOS_ADDR:localhost:8848}
        file-extension: yaml
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: ${DB_URL:jdbc:mysql://localhost:3306/novel?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:123456}
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: 0
      timeout: 3000ms
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 2

mybatis-plus:
  mapper-locations: classpath:mapper/**/*.xml
  type-aliases-package: com.novel.common.entity
  configuration:
    map-underscore-to-camel-case: true

server:
  port: 8081

jwt:
  secret: ${JWT_SECRET:}
  expiration: ${JWT_EXPIRATION:3600000}
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800000}
```

- [ ] **Step 3: 创建启动类**

```java
package com.novel.user;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(scanBasePackages = {
    "com.novel.user",
    "com.novel.common"
})
@EnableDiscoveryClient
@MapperScan("com.novel.user.mapper")
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

- [ ] **Step 4: 迁移 Mapper 接口**

从 `backend/src/main/java/com/novel/mapper/` 复制到 `novel-user-service/src/main/java/com/novel/user/mapper/`：

```
UserMapper.java
RefreshTokenMapper.java
NotificationMapper.java
AuthorApplicationMapper.java
AuthorAuditRecordMapper.java
AuditLogMapper.java
```

复制后修改 package 声明 `com.novel.mapper` → `com.novel.user.mapper`。

- [ ] **Step 5: 迁移 Service 接口和实现**

从 backend 复制到 novel-user-service：

```
service/UserService.java → novel-user-service/.../service/UserService.java
service/RefreshTokenService.java → novel-user-service/.../service/RefreshTokenService.java
service/NotificationService.java → novel-user-service/.../service/NotificationService.java (如存在)
service/AuthorApplicationService.java → novel-user-service/.../service/AuthorApplicationService.java
service/AuditLogService.java → novel-user-service/.../service/AuditLogService.java

service/impl/UserServiceImpl.java
service/impl/RefreshTokenServiceImpl.java
service/impl/NotificationServiceImpl.java (如存在)
service/impl/AuthorApplicationServiceImpl.java
service/impl/AuditLogServiceImpl.java
```

修改 package 声明和 import，将 `com.novel.mapper.` 改为 `com.novel.user.mapper.`，`com.novel.dto.` 改为 `com.novel.common.dto.`，`com.novel.entity.` 改为 `com.novel.common.entity.`。

- [ ] **Step 6: 迁移 Controller**

从 backend 复制到 novel-user-service：

```
AuthController.java → novel-user-service/.../controller/AuthController.java
UserController.java → novel-user-service/.../controller/UserController.java
NotificationController.java → novel-user-service/.../controller/NotificationController.java
AuthorApplicationController.java → novel-user-service/.../controller/AuthorApplicationController.java
```

修改 package 和 import。注意 Controller 中的 `@CurrentUser` 注解：Gateway 已注入 `X-User-Id` 请求头，需修改 `CurrentUserResolver` 逻辑，改为从请求头读取而非从 Token 解析。

- [ ] **Step 7: 创建从请求头读取 userId 的 CurrentUserResolver**

```java
package com.novel.user.security;

import com.novel.common.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class CurrentUserResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
            && parameter.getParameterType().equals(Long.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        String userId = request.getHeader("X-User-Id");
        if (userId != null) {
            return Long.valueOf(userId);
        }
        return null;
    }
}
```

注意：`CurrentUser` 注解需要从 `com.novel.security` 移到 `com.novel.common.security`。

- [ ] **Step 8: 编译 novel-user-service**

```bash
cd novel-user-service && mvn clean compile
```

修复所有编译错误直至通过。

- [ ] **Step 9: 更新父 POM modules**

在根 `pom.xml` 的 `<modules>` 中添加：
```xml
<module>novel-user-service</module>
```

- [ ] **Step 10: 启动验证**

```bash
mvn spring-boot:run -pl novel-user-service
```

确认：
- 服务启动在 8081 端口
- Nacos 控制台可见 `novel-user-service`
- 通过 Gateway 访问 `curl http://localhost:8080/api/auth/login`

- [ ] **Step 11: 提交**

```bash
git add novel-user-service/ pom.xml
git commit -m "feat: extract novel-user-service from monolith

Migrates Auth, User, Notification, AuthorApplication controllers
and their service/mapper layers. Gateway injects user context via
X-User-Id/X-User-Role headers."
```

### Task 2.2: 提取 novel-book-service（书籍服务）

**Files:**
- Create: `novel-book-service/pom.xml`
- Create: `novel-book-service/src/main/java/com/novel/book/BookServiceApplication.java`
- Create: `novel-book-service/src/main/java/com/novel/book/controller/BookController.java`
- Create: `novel-book-service/src/main/java/com/novel/book/controller/AuthorBookController.java`
- Create: `novel-book-service/src/main/java/com/novel/book/controller/FileUploadController.java`
- Create: `novel-book-service/src/main/java/com/novel/book/service/*.java` + `impl/*.java`
- Create: `novel-book-service/src/main/resources/application.yml`

**Mappers 迁移：** BookMapper, ChapterMapper

- [ ] **Step 1: 创建 novel-book-service/pom.xml**（同 user-service 结构，略）

- [ ] **Step 2: 创建 application.yml**（端口 8082，application name: novel-book-service）

- [ ] **Step 3: 创建启动类 + 迁移 Mapper/Service/Controller**

参照 Task 2.1 的模式，迁移 BookController、AuthorBookController、FileUploadController 及其依赖的 BookService、AuthorBookService、FileUploadService、BookCacheService、ChapterCacheService。

Mappers: BookMapper, ChapterMapper 及其 XML 文件。

- [ ] **Step 4: 处理文件上传路径**

FileUploadController 依赖本地文件系统路径 `uploads/`。确认文件上传目录在各服务间共享或通过 Gateway 统一路由 `/uploads/**`。

- [ ] **Step 5: 编译、启动验证、提交**

### Task 2.3: 提取 novel-payment-service（支付服务）

**Files:** 新建模块，端口 8085。

**Mappers 迁移：** RechargePackageMapper, CoinRechargeRecordMapper, SignInMapper, UserMapper（仅用于读取用户余额）

**注意：** CoinServiceImpl 依赖 UserMapper 操作用户余额字段（`user.coins`）。共享数据库下可以直接操作 UserMapper，但长期应通过 Feign 调用 User Service。

- [ ] **Step 1: 创建模块、pom.xml、application.yml**

- [ ] **Step 2: 迁移 CoinController、SignInController 及对应 Service/Mapper**

- [ ] **Step 3: 编译、启动验证、提交**

### Task 2.4: 提取 novel-reading-service（阅读服务）

**Files:** 新建模块，端口 8083。

**Mappers 迁移：** BookshelfMapper, BookmarkMapper, ChapterUnlockMapper

**服务间调用（Feign）：**
- `BookFeignClient` — 获取书籍/章节信息（替代直接注入 BookMapper、ChapterMapper）
- `PaymentFeignClient` — 解锁扣费（替代直接操作 UserMapper）

- [ ] **Step 1: 创建 Feign 接口**

`novel-reading-service/src/main/java/com/novel/reading/feign/BookFeignClient.java`：

```java
package com.novel.reading.feign;

import com.novel.common.dto.ApiResponse;
import com.novel.common.entity.Chapter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "novel-book-service")
public interface BookFeignClient {

    @GetMapping("/api/books/{bookId}/chapters/{chapterId}")
    ApiResponse<Chapter> getChapter(@PathVariable Long bookId, @PathVariable Long chapterId);

    @GetMapping("/api/books/{id}")
    ApiResponse<?> getBook(@PathVariable Long id);
}
```

`novel-reading-service/src/main/java/com/novel/reading/feign/PaymentFeignClient.java`：

```java
package com.novel.reading.feign;

import com.novel.common.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "novel-payment-service")
public interface PaymentFeignClient {

    @PostMapping("/api/coin/deduct")
    ApiResponse<Boolean> deductCoins(@RequestBody Map<String, Object> request);
}
```

- [ ] **Step 2: 修改 UnlockServiceImpl**

原来直接注入 `UserMapper` 修改用户余额，改为调用 `PaymentFeignClient.deductCoins()`。
原来直接注入 `ChapterMapper` 查询章节，改为调用 `BookFeignClient.getChapter()`。

- [ ] **Step 3: 编译、启动验证**

由于阅读服务依赖 Book 和 Payment 服务已经先启动，需按顺序验证。

- [ ] **Step 4: 提交**

### Task 2.5: 提取 novel-interaction-service（交互服务）

**Files:** 新建模块，端口 8084。

**Mappers 迁移：** CommentMapper, CommentLikeMapper, BookRatingMapper, TipMapper, BookListMapper, BookListItemMapper

**注意：** TipServiceImpl 依赖 UserMapper 和 CoinRechargeRecordMapper。共享数据库下直接保留 Mapper，后续解耦。

- [ ] **Step 1-4: 创建模块、迁移代码、编译、提交**

### Task 2.6: 提取 novel-admin-service（管理后台服务）

**Files:** 新建模块，端口 8086。

**服务间调用（Feign）：**
- `UserFeignClient` — 获取用户列表、修改用户状态
- `BookFeignClient` — 获取书籍列表、上下架
- `PaymentFeignClient` — 获取充值数据

**注意：** AdminServiceImpl 原来直接依赖多个 Mapper（UserMapper, BookMapper, ChapterMapper, CommentMapper），拆分后需改为 Feign 调用或保留只读 Mapper 直接查 DB（推荐后者，因为 Admin 主要是聚合查询）。

- [ ] **Step 1-4: 创建模块、迁移代码、编译、提交**

---

## 阶段 3：AI 服务 A2A 集成

### Task 3.1: 安装 AgentScope 和 nacos-sdk-python

**Files:**
- Modify: `ai-service/requirements.txt`

- [ ] **Step 1: 添加依赖到 requirements.txt**

```
nacos-sdk-python>=2.0.0
agentscope>=1.0.0
a2a>=0.1.0
```

- [ ] **Step 2: 安装依赖**

```bash
cd ai-service && pip install -r requirements.txt
```

- [ ] **Step 3: 验证安装**

```bash
python -c "import agentscope; import nacos; print('OK')"
```

- [ ] **Step 4: 提交**

```bash
git add ai-service/requirements.txt
git commit -m "feat: add AgentScope and nacos-sdk-python for A2A integration"
```

### Task 3.2: 定义 AgentCard 并注册到 Nacos A2A Registry

**Files:**
- Create: `ai-service/app/a2a/__init__.py`
- Create: `ai-service/app/a2a/agent_card.py`
- Create: `ai-service/app/a2a/registry.py`
- Modify: `ai-service/app/main.py`

- [ ] **Step 1: 创建 AgentCard 定义**

`ai-service/app/a2a/agent_card.py`：

```python
from a2a.types import AgentCard, AgentCapabilities, AgentSkill

def build_agent_card(host: str = "localhost", port: int = 8001) -> AgentCard:
    return AgentCard(
        name="novel-ai-agent",
        description="土豆小说 AI 智能助手，提供推荐、搜索、客服和封面生成能力",
        version="1.0.0",
        url=f"http://{host}:{port}",
        capabilities=AgentCapabilities(
            streaming=True,
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

- [ ] **Step 2: 创建 Nacos A2A 注册器**

`ai-service/app/a2a/registry.py`：

```python
import logging
import nacos
from app.a2a.agent_card import build_agent_card

logger = logging.getLogger(__name__)

class NacosA2ARegistry:
    def __init__(self, nacos_addr: str = "localhost:8848",
                 service_name: str = "novel-ai-agent",
                 service_port: int = 8001,
                 namespace: str = ""):
        self.client = nacos.NacosClient(
            server_addresses=nacos_addr,
            namespace=namespace,
        )
        self.service_name = service_name
        self.service_port = service_port
        self.nacos_addr = nacos_addr

    def register(self):
        host = self._get_local_ip()
        self.client.add_naming_instance(
            service_name=self.service_name,
            ip=host,
            port=self.service_port,
            metadata={
                "agent_card": build_agent_card(host, self.service_port).model_dump_json(),
                "a2a_version": "1.0",
                "protocol": "a2a",
            }
        )
        logger.info(f"Registered A2A Agent [{self.service_name}] to Nacos at {self.nacos_addr}")

    def deregister(self):
        host = self._get_local_ip()
        self.client.remove_naming_instance(
            service_name=self.service_name,
            ip=host,
            port=self.service_port,
        )
        logger.info(f"Deregistered A2A Agent [{self.service_name}] from Nacos")

    def _get_local_ip(self) -> str:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
        except Exception:
            return "127.0.0.1"
        finally:
            s.close()

registry = NacosA2ARegistry(
    nacos_addr="localhost:8848",
    service_name="novel-ai-agent",
    service_port=8001,
)
```

- [ ] **Step 3: 在 main.py 中集成 A2A 注册**

在 `lifespan` 函数中添加注册和注销逻辑：

```python
from app.a2a.registry import registry

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Service starting up...")
    try:
        vector_store.index_books()
        logger.info("Vector store indexing completed")
    except Exception as e:
        logger.warning(f"Vector store indexing failed: {e}")

    # Register as A2A Agent to Nacos
    try:
        registry.register()
        logger.info("A2A Agent registered to Nacos")
    except Exception as e:
        logger.warning(f"Failed to register A2A Agent: {e}")

    yield

    # Deregister on shutdown
    try:
        registry.deregister()
    except Exception:
        pass
    logger.info("AI Service shutting down...")
```

- [ ] **Step 4: 启动 AI 服务验证注册**

```bash
cd ai-service && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

验证 Nacos 控制台服务列表中可见 `novel-ai-agent`。

- [ ] **Step 5: 提交**

```bash
git add ai-service/
git commit -m "feat: register AI service as A2A Agent in Nacos A2A Registry"
```

---

## 阶段 4：前端适配

### Task 4.1: 修改 Vite 代理配置

**Files:**
- Modify: `frontend/vite.config.ts`

- [ ] **Step 1: 简化代理为统一指向 Gateway**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

移除 `/api/ai` 单独代理规则，所有请求统一走 Gateway。

- [ ] **Step 2: 验证前端功能**

```bash
cd frontend && npm run dev
```

测试：
- 首页书籍列表
- 登录/注册
- 书架管理
- AI 推荐/搜索/客服
- 评论/评分
- 管理后台

- [ ] **Step 3: 提交**

```bash
git add frontend/vite.config.ts
git commit -m "refactor: unify Vite proxy to Gateway :8080"
```

---

## 阶段 5：清理与收尾

### Task 5.1: 移除旧 backend 模块

- [ ] **Step 1: 删除 backend 目录**

```bash
rm -rf backend/
```

- [ ] **Step 2: 从父 POM 移除 backend 相关引用（如有）**

- [ ] **Step 3: 提交**

```bash
git rm -r backend/
git commit -m "chore: remove monolith backend, replaced by microservices"
```

### Task 5.2: 创建 README 微服务启动说明

**Files:**
- Modify: 项目 README（如存在）

- [ ] **Step 1: 添加微服务启动命令到 README**

- [ ] **Step 2: 提交**

---

## 执行顺序总结

```
阶段 0: Spring Boot 3.5 升级（单体验证通过）
    ↓
阶段 1: Nacos + 父 POM + novel-common + novel-gateway
    ↓
阶段 2:
  ├── 2.1 novel-user-service    (无依赖，先拆)
  ├── 2.2 novel-book-service    (无依赖，先拆)
  ├── 2.3 novel-payment-service (依赖 User)
  ├── 2.4 novel-reading-service  (依赖 Book + Payment)
  ├── 2.5 novel-interaction-service (依赖 Book + User)
  └── 2.6 novel-admin-service    (依赖 User + Book + Payment)
    ↓
阶段 3: AI 服务 A2A 集成 (依赖 Nacos)
    ↓
阶段 4: 前端适配 (依赖所有服务)
    ↓
阶段 5: 清理旧代码
```
