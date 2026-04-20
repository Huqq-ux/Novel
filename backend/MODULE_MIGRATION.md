# 模块化单体架构迁移文档

## 一、架构概述

### 1.1 迁移目标
将原有的单体架构重构为模块化单体架构，实现以下目标：
- 高内聚低耦合的模块划分
- 清晰的模块边界和接口定义
- 统一的模块间通信机制
- 为未来微服务演进奠定基础

### 1.2 模块架构图

```
com.novel.module/
├── Module.java                    # 模块接口
├── AbstractModule.java            # 抽象模块基类
├── ModuleContext.java             # 模块上下文
├── event/                         # 事件系统
│   ├── ModuleEvent.java
│   ├── ModuleEventBus.java
│   └── ModuleEventTypes.java
├── spi/                           # 服务门面接口
│   ├── UserServiceFacade.java
│   └── ContentServiceFacade.java
├── config/                        # 模块配置
│   └── ModuleInitializer.java
├── user/                          # 用户模块
├── content/                       # 内容模块
├── reading/                       # 阅读模块
├── interaction/                   # 互动模块
└── payment/                       # 支付模块
```

## 二、模块详细说明

### 2.1 用户模块 (user-module)

**职责范围：**
- 用户注册、登录、认证
- 用户信息管理
- 作者认证
- 书币余额管理

**核心组件：**
| 组件 | 说明 |
|------|------|
| UserModule | 模块入口类 |
| UserEntity | 用户实体 |
| UserDomainService | 领域服务接口 |
| UserDomainServiceImpl | 领域服务实现 |
| UserServiceFacadeImpl | 服务门面实现 |

**对外接口：**
```java
UserServiceFacade:
  - existsById(userId)
  - getUserInfo(userId)
  - getUserByUsername(username)
  - deductCoins(userId, amount)
  - addCoins(userId, amount)
  - getCoinBalance(userId)
  - isAuthor(userId)
```

### 2.2 内容模块 (content-module)

**职责范围：**
- 书籍管理
- 章节管理
- 分类管理
- 内容审核

**核心组件：**
| 组件 | 说明 |
|------|------|
| ContentModule | 模块入口类 |
| BookEntity | 书籍实体 |
| ChapterEntity | 章节实体 |
| ContentDomainService | 领域服务接口 |
| ContentDomainServiceImpl | 领域服务实现 |
| ContentServiceFacadeImpl | 服务门面实现 |

**对外接口：**
```java
ContentServiceFacade:
  - existsBookById(bookId)
  - getBookInfo(bookId)
  - getChapterInfo(chapterId)
  - getChaptersByBookId(bookId)
  - isChapterFree(bookId, chapterId)
  - getChapterPrice(bookId, chapterId)
  - updateBookRating(bookId, rating)
```

### 2.3 阅读模块 (reading-module)

**职责范围：**
- 书架管理
- 阅读进度追踪
- 阅读历史记录

**核心组件：**
| 组件 | 说明 |
|------|------|
| ReadingModule | 模块入口类 |
| BookshelfEntity | 书架实体 |
| ReadingDomainService | 领域服务接口 |
| ReadingDomainServiceImpl | 领域服务实现 |

### 2.4 互动模块 (interaction-module)

**职责范围：**
- 评论管理
- 评分系统
- 点赞功能

**核心组件：**
| 组件 | 说明 |
|------|------|
| InteractionModule | 模块入口类 |
| CommentEntity | 评论实体 |
| RatingEntity | 评分实体 |
| InteractionDomainService | 领域服务接口 |
| InteractionDomainServiceImpl | 领域服务实现 |

### 2.5 支付模块 (payment-module)

**职责范围：**
- 书币充值
- 章节解锁
- 交易记录

**核心组件：**
| 组件 | 说明 |
|------|------|
| PaymentModule | 模块入口类 |
| RechargeRecordEntity | 充值记录实体 |
| ChapterUnlockEntity | 章节解锁实体 |
| PaymentDomainService | 领域服务接口 |
| PaymentDomainServiceImpl | 领域服务实现 |

## 三、模块间通信机制

### 3.1 同步通信 (Service Facade)

模块间通过Service Facade接口进行同步调用：

```java
// 支付模块调用用户模块扣减书币
@Autowired
private UserServiceFacade userServiceFacade;

public boolean unlockChapter(Long userId, Long chapterId, Integer price) {
    return userServiceFacade.deductCoins(userId, price);
}
```

### 3.2 异步通信 (Event Bus)

模块间通过事件总线进行异步通信：

```java
// 发布事件
eventBus.publish(ModuleEventTypes.RATING_SUBMITTED, ratingData);

// 订阅事件
@PostConstruct
public void init() {
    eventBus.subscribe(ModuleEventTypes.RATING_SUBMITTED, this::handleRatingSubmitted);
}
```

### 3.3 预定义事件类型

| 事件类型 | 说明 | 发布者 | 订阅者 |
|----------|------|--------|--------|
| user.registered | 用户注册 | user-module | notification-module |
| user.coin.changed | 书币变动 | user-module | - |
| book.published | 书籍发布 | content-module | notification-module |
| book.rating.updated | 评分更新 | interaction-module | content-module |
| chapter.unlocked | 章节解锁 | payment-module | - |
| rating.submitted | 评分提交 | interaction-module | content-module |
| signin.completed | 签到完成 | - | payment-module |

## 四、迁移步骤

### 4.1 第一阶段：基础设施搭建 ✅

1. 创建模块接口和抽象基类
2. 实现模块上下文管理
3. 实现事件总线
4. 定义服务门面接口

### 4.2 第二阶段：模块重构 ✅

1. 用户模块重构
2. 内容模块重构
3. 阅读模块重构
4. 互动模块重构
5. 支付模块重构

### 4.3 第三阶段：集成测试

1. 单元测试编写
2. 集成测试编写
3. 端到端测试

### 4.4 第四阶段：渐进迁移

1. 新功能使用新模块
2. 旧功能逐步迁移
3. 删除冗余代码

## 五、测试策略

### 5.1 单元测试

每个模块的领域服务需要编写单元测试：

```java
@SpringBootTest
class UserDomainServiceTest {
    
    @Autowired
    private UserDomainService userService;
    
    @Test
    void testCreateUser() {
        UserEntity user = new UserEntity();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        
        UserEntity saved = userService.create(user);
        
        assertNotNull(saved.getId());
        assertEquals("testuser", saved.getUsername());
    }
}
```

### 5.2 集成测试

测试模块间通信：

```java
@SpringBootTest
class ModuleIntegrationTest {
    
    @Autowired
    private ModuleEventBus eventBus;
    
    @Autowired
    private InteractionDomainService interactionService;
    
    @Autowired
    private ContentServiceFacade contentService;
    
    @Test
    void testRatingUpdatesBookRating() {
        Long bookId = 1L;
        Long userId = 1L;
        
        interactionService.submitRating(bookId, userId, 5);
        
        ContentServiceFacade.BookInfo book = contentService.getBookInfo(bookId).orElse(null);
        assertNotNull(book);
        assertTrue(book.getRating() > 0);
    }
}
```

### 5.3 模块隔离测试

测试模块的独立性和边界：

```java
@SpringBootTest
class ModuleIsolationTest {
    
    @Autowired
    private ModuleContext moduleContext;
    
    @Test
    void testAllModulesInitialized() {
        Map<String, Module> modules = moduleContext.getAllModules();
        
        assertTrue(modules.containsKey("user-module"));
        assertTrue(modules.containsKey("content-module"));
        assertTrue(modules.containsKey("reading-module"));
        assertTrue(modules.containsKey("interaction-module"));
        assertTrue(modules.containsKey("payment-module"));
    }
}
```

## 六、注意事项

### 6.1 数据库兼容

- 新模块使用独立的Entity类，但映射到相同的数据库表
- 保持与原有数据的兼容性
- 不修改现有表结构

### 6.2 渐进迁移

- 新功能优先使用新模块
- 旧功能保持不变，逐步迁移
- 避免大爆炸式重构

### 6.3 事务边界

- 单模块内操作使用本地事务
- 跨模块操作需要考虑最终一致性
- 使用事件机制实现补偿

## 七、未来演进

### 7.1 微服务拆分路径

当需要拆分为微服务时：

1. 每个模块可独立部署为服务
2. Service Facade接口转换为Feign客户端
3. Event Bus替换为消息队列

### 7.2 模块独立化

1. 每个模块可拆分为独立的Maven模块
2. 定义明确的API依赖
3. 独立版本管理

---

**文档版本：** 1.0  
**更新日期：** 2026-03-27  
**作者：** AI Assistant
