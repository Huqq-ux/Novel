# Architecture Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove dead module architecture, unify code style, split monolithic API file, add lazy loading, switch AI service to DeepSeek, add streaming and externalize knowledge base.

**Architecture:** 8 independent tasks across backend (Java), frontend (React/TS), and AI service (Python). Tasks have no shared state and can run in parallel within each service layer.

**Tech Stack:** Java 17 / Spring Boot 3.1 / MyBatis-Plus, React 18 + TypeScript, FastAPI + LangChain/LangGraph, DeepSeek API

---

### Task 1: Backend — Delete module system, migrate cache to com.novel.cache

**Files:**
- Create: `backend/src/main/java/com/novel/cache/CacheConstants.java`
- Create: `backend/src/main/java/com/novel/cache/CacheService.java`
- Create: `backend/src/main/java/com/novel/cache/CacheServiceImpl.java`
- Create: `backend/src/main/java/com/novel/cache/CacheProtectionService.java`
- Create: `backend/src/main/java/com/novel/cache/DistributedLock.java`
- Create: `backend/src/main/java/com/novel/cache/BookCacheService.java`
- Create: `backend/src/main/java/com/novel/cache/ChapterCacheService.java`
- Create: `backend/src/main/java/com/novel/cache/UserCacheService.java`
- Modify: `backend/src/main/java/com/novel/service/impl/BookServiceImpl.java:9-10`
- Modify: `backend/src/main/java/com/novel/service/impl/UserServiceImpl.java:5`
- Modify: `backend/src/main/java/com/novel/NovelApplication.java:9`
- Delete: `backend/src/main/java/com/novel/module/` (entire directory, ~50 files)

- [ ] **Step 1: Create cache package and migrate files**

Copy 8 cache files from module to new `com.novel.cache` package, updating their package declarations.

Create `backend/src/main/java/com/novel/cache/CacheConstants.java`:
```java
package com.novel.cache;

import java.util.concurrent.TimeUnit;

public final class CacheConstants {

    private CacheConstants() {}

    public static final String BOOK_DETAIL_PREFIX = "book:detail:";
    public static final String BOOK_LIST_PREFIX = "book:list:";
    public static final String BOOK_CHAPTERS_PREFIX = "book:chapters:";
    public static final String BOOK_SEARCH_PREFIX = "book:search:";

    public static final String CHAPTER_CONTENT_PREFIX = "chapter:content:";

    public static final String USER_INFO_PREFIX = "user:info:";
    public static final String USER_COIN_PREFIX = "user:coin:";

    public static final String RATING_STAT_PREFIX = "rating:stat:";
    public static final String RATING_USER_PREFIX = "rating:user:";

    public static final long BOOK_DETAIL_TTL = 1;
    public static final TimeUnit BOOK_DETAIL_UNIT = TimeUnit.HOURS;

    public static final long CHAPTER_CONTENT_TTL = 30;
    public static final TimeUnit CHAPTER_CONTENT_UNIT = TimeUnit.MINUTES;

    public static final long BOOK_LIST_TTL = 5;
    public static final TimeUnit BOOK_LIST_UNIT = TimeUnit.MINUTES;

    public static final long USER_INFO_TTL = 30;
    public static final TimeUnit USER_INFO_UNIT = TimeUnit.MINUTES;

    public static final long RATING_STAT_TTL = 10;
    public static final TimeUnit RATING_STAT_UNIT = TimeUnit.MINUTES;

    public static final long SEARCH_RESULT_TTL = 5;
    public static final TimeUnit SEARCH_RESULT_UNIT = TimeUnit.MINUTES;

    public static final String NULL_CACHE_VALUE = "NULL";
    public static final long NULL_CACHE_TTL = 5;
    public static final TimeUnit NULL_CACHE_UNIT = TimeUnit.MINUTES;
}
```

Create `backend/src/main/java/com/novel/cache/CacheService.java` — copy from `module/common/cache/CacheService.java`, change package to `com.novel.cache`:
```java
package com.novel.cache;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

public interface CacheService {

    void set(String key, Object value);

    void set(String key, Object value, long timeout, TimeUnit unit);

    <T> Optional<T> get(String key, Class<T> type);

    <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader);

    <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader, long timeout, TimeUnit unit);

    void delete(String key);

    void deleteByPattern(String pattern);

    boolean hasKey(String key);

    boolean expire(String key, long timeout, TimeUnit unit);

    long getExpire(String key);

    void increment(String key);

    void increment(String key, long delta);

    void decrement(String key);

    void decrement(String key, long delta);

    <T> boolean setIfAbsent(String key, T value, long timeout, TimeUnit unit);

    String buildKey(String prefix, Object... parts);
}
```

Create `backend/src/main/java/com/novel/cache/CacheServiceImpl.java` — copy from `module/common/cache/CacheServiceImpl.java`, change package to `com.novel.cache`, remove old module import:
```java
package com.novel.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
public class CacheServiceImpl implements CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheServiceImpl.class);

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Override
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("Redis set error for key: {}", key, e);
        }
    }

    @Override
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
        } catch (Exception e) {
            log.error("Redis set with TTL error for key: {}", key, e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null && type.isInstance(value)) {
                return Optional.of((T) value);
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Redis get error for key: {}", key, e);
            return Optional.empty();
        }
    }

    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader) {
        return getOrLoad(key, type, loader, 30, TimeUnit.MINUTES);
    }

    @Override
    public <T> T getOrLoad(String key, Class<T> type, Supplier<T> loader, long timeout, TimeUnit unit) {
        Optional<T> cached = get(key, type);
        if (cached.isPresent()) {
            log.debug("Cache hit for key: {}", key);
            return cached.get();
        }
        log.debug("Cache miss for key: {}, loading from source", key);
        T value = loader.get();
        if (value != null) {
            set(key, value, timeout, unit);
        }
        return value;
    }

    @Override
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
        } catch (Exception e) {
            log.error("Redis delete error for key: {}", key, e);
        }
    }

    @Override
    public void deleteByPattern(String pattern) {
        try {
            var keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.error("Redis delete by pattern error for pattern: {}", pattern, e);
        }
    }

    @Override
    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Redis hasKey error for key: {}", key, e);
            return false;
        }
    }

    @Override
    public boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, unit));
        } catch (Exception e) {
            log.error("Redis expire error for key: {}", key, e);
            return false;
        }
    }

    @Override
    public long getExpire(String key) {
        try {
            Long expire = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            return expire != null ? expire : -2;
        } catch (Exception e) {
            log.error("Redis getExpire error for key: {}", key, e);
            return -2;
        }
    }

    @Override
    public void increment(String key) {
        increment(key, 1);
    }

    @Override
    public void increment(String key, long delta) {
        try {
            redisTemplate.opsForValue().increment(key, delta);
        } catch (Exception e) {
            log.error("Redis increment error for key: {}", key, e);
        }
    }

    @Override
    public void decrement(String key) {
        decrement(key, 1);
    }

    @Override
    public void decrement(String key, long delta) {
        try {
            redisTemplate.opsForValue().decrement(key, delta);
        } catch (Exception e) {
            log.error("Redis decrement error for key: {}", key, e);
        }
    }

    @Override
    public <T> boolean setIfAbsent(String key, T value, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(key, value, timeout, unit)
            );
        } catch (Exception e) {
            log.error("Redis setIfAbsent error for key: {}", key, e);
            return false;
        }
    }

    @Override
    public String buildKey(String prefix, Object... parts) {
        StringBuilder sb = new StringBuilder(prefix);
        for (Object part : parts) {
            sb.append(":").append(part);
        }
        return sb.toString();
    }
}
```

Create `backend/src/main/java/com/novel/cache/CacheProtectionService.java` — copy from `module/common/cache/CacheProtectionService.java`, change package and internal import references from `com.novel.module.common.cache.CacheConstants` to `com.novel.cache.CacheConstants`:
```java
package com.novel.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Component
public class CacheProtectionService {

    private static final Logger log = LoggerFactory.getLogger(CacheProtectionService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private DistributedLock distributedLock;

    public <T> T getWithNullProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit) {
        return getWithNullProtection(key, type, dbLoader, ttl, unit, false);
    }

    @SuppressWarnings("unchecked")
    public <T> T getWithNullProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit, boolean cacheNull) {
        try {
            Object cached = cacheService.get(key, Object.class).orElse(null);

            if (cached != null) {
                if (CacheConstants.NULL_CACHE_VALUE.equals(cached.toString())) {
                    log.debug("Null cache hit for key: {}", key);
                    return null;
                }
                if (type.isInstance(cached)) {
                    log.debug("Cache hit for key: {}", key);
                    return (T) cached;
                }
            }

            log.debug("Cache miss for key: {}, loading from database", key);
            T value = dbLoader.get();

            if (value != null) {
                long randomTtl = addRandomJitter(ttl, unit);
                cacheService.set(key, value, randomTtl, unit);
            } else if (cacheNull) {
                cacheService.set(key, CacheConstants.NULL_CACHE_VALUE,
                    CacheConstants.NULL_CACHE_TTL, CacheConstants.NULL_CACHE_UNIT);
            }

            return value;
        } catch (Exception e) {
            log.error("Cache protection error for key: {}", key, e);
            return dbLoader.get();
        }
    }

    public <T> T getWithLockProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit) {
        return getWithLockProtection(key, type, dbLoader, ttl, unit, false);
    }

    public <T> T getWithLockProtection(String key, Class<T> type, Supplier<T> dbLoader,
                                        long ttl, TimeUnit unit, boolean cacheNull) {
        try {
            Object cached = cacheService.get(key, Object.class).orElse(null);

            if (cached != null) {
                if (CacheConstants.NULL_CACHE_VALUE.equals(cached.toString())) {
                    return null;
                }
                if (type.isInstance(cached)) {
                    return type.cast(cached);
                }
            }

            String lockValue = distributedLock.tryLockWithWait(key, 5, 30, TimeUnit.SECONDS);

            if (lockValue != null) {
                try {
                    cached = cacheService.get(key, Object.class).orElse(null);
                    if (cached != null && type.isInstance(cached)) {
                        return type.cast(cached);
                    }

                    T value = dbLoader.get();

                    if (value != null) {
                        long randomTtl = addRandomJitter(ttl, unit);
                        cacheService.set(key, value, randomTtl, unit);
                    } else if (cacheNull) {
                        cacheService.set(key, CacheConstants.NULL_CACHE_VALUE,
                            CacheConstants.NULL_CACHE_TTL, CacheConstants.NULL_CACHE_UNIT);
                    }

                    return value;
                } finally {
                    distributedLock.unlock(key, lockValue);
                }
            } else {
                log.warn("Could not acquire lock for key: {}, fallback to direct DB load", key);
                return dbLoader.get();
            }
        } catch (Exception e) {
            log.error("Lock protection error for key: {}", key, e);
            return dbLoader.get();
        }
    }

    public <T> void setWithRandomExpire(String key, T value, long baseTtl, TimeUnit unit) {
        long randomTtl = addRandomJitter(baseTtl, unit);
        cacheService.set(key, value, randomTtl, unit);
    }

    private long addRandomJitter(long baseTtl, TimeUnit unit) {
        long baseSeconds = unit.toSeconds(baseTtl);
        long jitter = ThreadLocalRandom.current().nextLong(0, Math.max(60, baseSeconds / 10));
        return baseSeconds + jitter;
    }

    public void evict(String key) {
        cacheService.delete(key);
    }

    public void evictByPattern(String pattern) {
        cacheService.deleteByPattern(pattern);
    }
}
```

Create `backend/src/main/java/com/novel/cache/DistributedLock.java` — copy from `module/common/cache/DistributedLock.java`, change package to `com.novel.cache`:
```java
package com.novel.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class DistributedLock {

    private static final Logger log = LoggerFactory.getLogger(DistributedLock.class);

    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_EXPIRE_TIME = 30;
    private static final long DEFAULT_WAIT_TIME = 5000;
    private static final long DEFAULT_RETRY_INTERVAL = 100;

    private static final String UNLOCK_SCRIPT =
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "return redis.call('del', KEYS[1]) " +
        "else return 0 end";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public String tryLock(String key) {
        return tryLock(key, DEFAULT_EXPIRE_TIME, TimeUnit.SECONDS);
    }

    public String tryLock(String key, long expireTime, TimeUnit unit) {
        String lockKey = LOCK_PREFIX + key;
        String lockValue = UUID.randomUUID().toString();
        try {
            boolean acquired = Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, expireTime, unit)
            );
            if (acquired) {
                log.debug("Lock acquired: {}", lockKey);
                return lockValue;
            }
            return null;
        } catch (Exception e) {
            log.error("Error acquiring lock: {}", lockKey, e);
            return null;
        }
    }

    public String tryLockWithWait(String key, long waitTime, long expireTime, TimeUnit unit) {
        String lockKey = LOCK_PREFIX + key;
        String lockValue = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        long waitMillis = unit.toMillis(waitTime);

        while (System.currentTimeMillis() - startTime < waitMillis) {
            try {
                boolean acquired = Boolean.TRUE.equals(
                    redisTemplate.opsForValue().setIfAbsent(lockKey, lockValue, expireTime, unit)
                );
                if (acquired) {
                    log.debug("Lock acquired with wait: {}", lockKey);
                    return lockValue;
                }
                Thread.sleep(DEFAULT_RETRY_INTERVAL);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Lock wait interrupted: {}", lockKey);
                return null;
            } catch (Exception e) {
                log.error("Error acquiring lock with wait: {}", lockKey, e);
                return null;
            }
        }
        log.warn("Lock acquisition timeout: {}", lockKey);
        return null;
    }

    public boolean unlock(String key, String lockValue) {
        String lockKey = LOCK_PREFIX + key;
        try {
            DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(UNLOCK_SCRIPT, Long.class);
            Long result = redisTemplate.execute(
                redisScript,
                Collections.singletonList(lockKey),
                lockValue
            );
            boolean success = result != null && result > 0;
            if (success) {
                log.debug("Lock released: {}", lockKey);
            } else {
                log.warn("Lock release failed (not owner or expired): {}", lockKey);
            }
            return success;
        } catch (Exception e) {
            log.error("Error releasing lock: {}", lockKey, e);
            return false;
        }
    }

    public boolean isLocked(String key) {
        String lockKey = LOCK_PREFIX + key;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(lockKey));
        } catch (Exception e) {
            log.error("Error checking lock status: {}", lockKey, e);
            return false;
        }
    }
}
```

Create `backend/src/main/java/com/novel/cache/BookCacheService.java` — copy from `module/content/cache/BookCacheService.java`, change package to `com.novel.cache`, update internal CacheConstants/CacheService/CacheProtectionService references to same-package:
```java
package com.novel.cache;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Supplier;

@Service
public class BookCacheService {

    private static final Logger log = LoggerFactory.getLogger(BookCacheService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProtectionService cacheProtectionService;

    public Book getBookById(Long id, Supplier<Book> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, id);
        return cacheProtectionService.getWithNullProtection(
            key, Book.class, dbLoader,
            CacheConstants.BOOK_DETAIL_TTL, CacheConstants.BOOK_DETAIL_UNIT, true
        );
    }

    public void cacheBook(Book book) {
        if (book != null && book.getId() != null) {
            String key = cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, book.getId());
            cacheProtectionService.setWithRandomExpire(
                key, book,
                CacheConstants.BOOK_DETAIL_TTL, CacheConstants.BOOK_DETAIL_UNIT
            );
        }
    }

    public void evictBook(Long bookId) {
        String key = cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, bookId);
        cacheService.delete(key);
        log.debug("Evicted book cache: {}", key);
    }

    public void evictBookRelated(Long bookId) {
        cacheService.delete(cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, bookId));
        cacheService.delete(cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId));
        cacheService.deleteByPattern(CacheConstants.BOOK_LIST_PREFIX + "*");
        log.debug("Evicted all related caches for book: {}", bookId);
    }

    @SuppressWarnings("unchecked")
    public Page<Book> getBookList(String cacheKey, Supplier<Page<Book>> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.BOOK_LIST_PREFIX, cacheKey);
        Object cached = cacheService.get(key, Object.class).orElse(null);
        if (cached instanceof Page) {
            return (Page<Book>) cached;
        }
        Page<Book> result = dbLoader.get();
        if (result != null) {
            cacheProtectionService.setWithRandomExpire(key, result,
                CacheConstants.BOOK_LIST_TTL, CacheConstants.BOOK_LIST_UNIT);
        }
        return result;
    }

    public void cacheBookList(String cacheKey, Page<Book> page) {
        String key = cacheService.buildKey(CacheConstants.BOOK_LIST_PREFIX, cacheKey);
        cacheProtectionService.setWithRandomExpire(
            key, page,
            CacheConstants.BOOK_LIST_TTL, CacheConstants.BOOK_LIST_UNIT
        );
    }

    public void evictBookList() {
        cacheService.deleteByPattern(CacheConstants.BOOK_LIST_PREFIX + "*");
        log.debug("Evicted all book list caches");
    }

    @SuppressWarnings("unchecked")
    public List<Chapter> getBookChapters(Long bookId, Supplier<List<Chapter>> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId);
        Object cached = cacheService.get(key, Object.class).orElse(null);
        if (cached instanceof List) {
            return (List<Chapter>) cached;
        }
        List<Chapter> result = dbLoader.get();
        if (result != null) {
            cacheProtectionService.setWithRandomExpire(key, result,
                CacheConstants.BOOK_LIST_TTL, CacheConstants.BOOK_LIST_UNIT);
        }
        return result;
    }

    public void cacheBookChapters(Long bookId, List<Chapter> chapters) {
        String key = cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId);
        cacheProtectionService.setWithRandomExpire(
            key, chapters,
            CacheConstants.BOOK_LIST_TTL, CacheConstants.BOOK_LIST_UNIT
        );
    }

    public void evictBookChapters(Long bookId) {
        String key = cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId);
        cacheService.delete(key);
        log.debug("Evicted book chapters cache: {}", key);
    }

    @SuppressWarnings("unchecked")
    public List<Book> getSearchResults(String keyword, Supplier<List<Book>> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.BOOK_SEARCH_PREFIX, keyword.hashCode());
        Object cached = cacheService.get(key, Object.class).orElse(null);
        if (cached instanceof List) {
            return (List<Book>) cached;
        }
        List<Book> result = dbLoader.get();
        if (result != null) {
            cacheProtectionService.setWithRandomExpire(key, result,
                CacheConstants.SEARCH_RESULT_TTL, CacheConstants.SEARCH_RESULT_UNIT);
        }
        return result;
    }

    public void evictSearchCache() {
        cacheService.deleteByPattern(CacheConstants.BOOK_SEARCH_PREFIX + "*");
        log.debug("Evicted all search caches");
    }

    public void incrementClickCount(Long bookId) {
        String key = "book:click:" + bookId;
        cacheService.increment(key);
    }

    public Long getClickCount(Long bookId) {
        String key = "book:click:" + bookId;
        return cacheService.get(key, Long.class).orElse(0L);
    }
}
```

Create `backend/src/main/java/com/novel/cache/ChapterCacheService.java` — copy from `module/content/cache/ChapterCacheService.java`, update package and internal refs:
```java
package com.novel.cache;

import com.novel.entity.Chapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

@Service
public class ChapterCacheService {

    private static final Logger log = LoggerFactory.getLogger(ChapterCacheService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProtectionService cacheProtectionService;

    public Chapter getChapterById(Long bookId, Long chapterId, Supplier<Chapter> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.CHAPTER_CONTENT_PREFIX, bookId, chapterId);
        return cacheProtectionService.getWithLockProtection(
            key, Chapter.class, dbLoader,
            CacheConstants.CHAPTER_CONTENT_TTL, CacheConstants.CHAPTER_CONTENT_UNIT, true
        );
    }

    public void cacheChapter(Long bookId, Chapter chapter) {
        if (chapter != null && chapter.getId() != null) {
            String key = cacheService.buildKey(CacheConstants.CHAPTER_CONTENT_PREFIX, bookId, chapter.getId());
            cacheProtectionService.setWithRandomExpire(
                key, chapter,
                CacheConstants.CHAPTER_CONTENT_TTL, CacheConstants.CHAPTER_CONTENT_UNIT
            );
        }
    }

    public void evictChapter(Long bookId, Long chapterId) {
        String key = cacheService.buildKey(CacheConstants.CHAPTER_CONTENT_PREFIX, bookId, chapterId);
        cacheService.delete(key);
        log.debug("Evicted chapter cache: {}", key);
    }

    public void evictBookAllChapters(Long bookId) {
        cacheService.deleteByPattern(CacheConstants.CHAPTER_CONTENT_PREFIX + bookId + ":*");
        log.debug("Evicted all chapters cache for book: {}", bookId);
    }

    public boolean isChapterCached(Long bookId, Long chapterId) {
        String key = cacheService.buildKey(CacheConstants.CHAPTER_CONTENT_PREFIX, bookId, chapterId);
        return cacheService.hasKey(key);
    }

    public void warmupChapter(Long bookId, Chapter chapter) {
        cacheChapter(bookId, chapter);
        log.info("Warmed up chapter cache: book={}, chapter={}", bookId, chapter.getId());
    }

    public void warmupChapters(Long bookId, Iterable<Chapter> chapters) {
        for (Chapter chapter : chapters) {
            cacheChapter(bookId, chapter);
        }
        log.info("Warmed up chapters cache for book: {}", bookId);
    }
}
```

Create `backend/src/main/java/com/novel/cache/UserCacheService.java` — copy from `module/user/cache/UserCacheService.java`, update package and internal refs:
```java
package com.novel.cache;

import com.novel.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.function.Supplier;

@Service
public class UserCacheService {

    private static final Logger log = LoggerFactory.getLogger(UserCacheService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProtectionService cacheProtectionService;

    public User getUserById(Long userId, Supplier<User> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.USER_INFO_PREFIX, userId);
        return cacheProtectionService.getWithNullProtection(
            key, User.class, dbLoader,
            CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT, true
        );
    }

    public void cacheUser(User user) {
        if (user != null && user.getId() != null) {
            String key = cacheService.buildKey(CacheConstants.USER_INFO_PREFIX, user.getId());
            cacheProtectionService.setWithRandomExpire(
                key, user,
                CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT
            );
        }
    }

    public void evictUser(Long userId) {
        String key = cacheService.buildKey(CacheConstants.USER_INFO_PREFIX, userId);
        cacheService.delete(key);
        log.debug("Evicted user cache: {}", key);
    }

    public Integer getCoinBalance(Long userId, Supplier<Integer> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        return cacheProtectionService.getWithNullProtection(
            key, Integer.class, dbLoader,
            CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT, false
        );
    }

    public void cacheCoinBalance(Long userId, Integer balance) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        cacheService.set(key, balance, CacheConstants.USER_INFO_TTL, CacheConstants.USER_INFO_UNIT);
    }

    public void evictCoinBalance(Long userId) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        cacheService.delete(key);
        log.debug("Evicted user coin balance cache: {}", key);
    }

    public void evictUserAll(Long userId) {
        evictUser(userId);
        evictCoinBalance(userId);
        log.debug("Evicted all user caches: {}", userId);
    }

    public boolean deductCoins(Long userId, Integer amount, Supplier<Boolean> deductOperation) {
        String lockKey = "coin:deduct:" + userId;
        String lockValue = cacheService.getOrLoad(lockKey, String.class, () -> null);

        if (lockValue != null) {
            log.warn("Coin deduction already in progress for user: {}", userId);
            return false;
        }

        boolean acquired = cacheService.setIfAbsent(lockKey, "1", 10, java.util.concurrent.TimeUnit.SECONDS);
        if (!acquired) {
            log.warn("Could not acquire lock for coin deduction: {}", userId);
            return false;
        }

        try {
            boolean success = deductOperation.get();
            if (success) {
                evictCoinBalance(userId);
            }
            return success;
        } finally {
            cacheService.delete(lockKey);
        }
    }

    public void incrementCoinBalance(Long userId, Integer amount) {
        String key = cacheService.buildKey(CacheConstants.USER_COIN_PREFIX, userId);
        cacheService.increment(key, amount);
    }
}
```

- [ ] **Step 2: Update BookServiceImpl imports**

In `backend/src/main/java/com/novel/service/impl/BookServiceImpl.java`, change lines 9-10:
```java
// Before:
import com.novel.module.content.cache.BookCacheService;
import com.novel.module.content.cache.ChapterCacheService;

// After:
import com.novel.cache.BookCacheService;
import com.novel.cache.ChapterCacheService;
```

- [ ] **Step 3: Update UserServiceImpl imports**

In `backend/src/main/java/com/novel/service/impl/UserServiceImpl.java`, change line 5:
```java
// Before:
import com.novel.module.user.cache.UserCacheService;

// After:
import com.novel.cache.UserCacheService;
```

- [ ] **Step 4: Update NovelApplication MapperScan**

In `backend/src/main/java/com/novel/NovelApplication.java`, change line 9:
```java
// Before:
@MapperScan({"com.novel.mapper", "com.novel.module.*.mapper"})

// After:
@MapperScan("com.novel.mapper")
```

- [ ] **Step 5: Delete the entire module directory**

```bash
rm -rf D:/TRAE/Novel/backend/src/main/java/com/novel/module/
```

- [ ] **Step 6: Verify compilation**

```bash
cd D:/TRAE/Novel/backend && mvn compile -q 2>&1 | tail -20
```
Expected: BUILD SUCCESS with no errors.

- [ ] **Step 7: Commit**

```bash
cd D:/TRAE/Novel && git add backend/src/main/java/com/novel/cache/ backend/src/main/java/com/novel/service/impl/BookServiceImpl.java backend/src/main/java/com/novel/service/impl/UserServiceImpl.java backend/src/main/java/com/novel/NovelApplication.java backend/src/main/java/com/novel/module/
git commit -m "refactor: remove module system, migrate cache to com.novel.cache

Keep Controller-Service-Mapper three-layer architecture.
Cache layer (CacheConstants, CacheService, CacheProtectionService,
DistributedLock, BookCacheService, ChapterCacheService, UserCacheService)
moved from com.novel.module.*.cache to com.novel.cache.
All module system dead code (~50 files) deleted."
```

---

### Task 2: Backend — Remove hardcoded passwords from config

**Files:**
- Modify: `backend/src/main/resources/application.yml:53-58`

- [ ] **Step 1: Update application.yml Redis config**

In `backend/src/main/resources/application.yml`, replace lines 53-58:
```yaml
# Before:
  data:
    redis:
      host: 192.168.159.128
      port: 6379
      password: 123456
      database: 0
      timeout: 3000ms

# After:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      database: ${REDIS_DATABASE:0}
      timeout: 3000ms
```

- [ ] **Step 2: Commit**

```bash
cd D:/TRAE/Novel && git add backend/src/main/resources/application.yml
git commit -m "fix: use environment variables for Redis connection in application.yml"
```

---

### Task 3: Backend — Unify Lombok style on Bookshelf.java

**Files:**
- Modify: `backend/src/main/java/com/novel/entity/Bookshelf.java`

- [ ] **Step 1: Rewrite Bookshelf.java with @Data**

Replace the entire file content:

```java
package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("bookshelf")
public class Bookshelf {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("book_id")
    private Long bookId;

    @TableField("last_chapter_id")
    private Long lastChapterId;

    @TableField("last_read_time")
    private LocalDateTime lastReadTime;

    @TableField("read_progress")
    private Integer progress;

    @TableField(exist = false)
    private LocalDateTime addTime;

    @TableField(exist = false)
    private Book book;
}
```

- [ ] **Step 2: Verify compilation**

```bash
cd D:/TRAE/Novel/backend && mvn compile -q 2>&1 | tail -10
```
Expected: BUILD SUCCESS.

- [ ] **Step 3: Commit**

```bash
cd D:/TRAE/Novel && git add backend/src/main/java/com/novel/entity/Bookshelf.java
git commit -m "refactor: use @Data in Bookshelf, consistent with other entities"
```

---

### Task 4: Frontend — Split services/api.ts

**Files:**
- Create: `frontend/src/services/api/client.ts`
- Create: `frontend/src/services/api/books.ts`
- Create: `frontend/src/services/api/bookshelf.ts`
- Create: `frontend/src/services/api/user.ts`
- Create: `frontend/src/services/api/author.ts`
- Create: `frontend/src/services/api/comment.ts`
- Create: `frontend/src/services/api/payment.ts`
- Create: `frontend/src/services/api/admin.ts`
- Create: `frontend/src/services/api/upload.ts`
- Create: `frontend/src/services/api/ai.ts`
- Create: `frontend/src/services/api/signin.ts`
- Create: `frontend/src/services/api/index.ts`
- Modify: `frontend/src/services/api.ts` (reduce to re-export from index.ts)

- [ ] **Step 1: Create client.ts**

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

const aiApiClient = axios.create({
  baseURL: '/api/ai',
  timeout: 60000,
})

aiApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

aiApiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('AI API Error:', error)
    return Promise.reject(error)
  }
)

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/user'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefreshToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/user'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export { api, aiApiClient }
export default api
```

- [ ] **Step 2: Create domain API files**

Create `frontend/src/services/api/books.ts`:
```typescript
import api from './client'

export const bookApi = {
  getBooks: (params?: { page?: number; size?: number; category?: string; sort?: string; priceType?: number }) => {
    return api.get('/books', { params })
  },

  getBookDetail: (id: number) => {
    return api.get(`/books/${id}`)
  },

  getChapters: (bookId: number) => {
    return api.get(`/books/${bookId}/chapters`)
  },

  getChapterContent: (bookId: number, chapterId: number) => {
    return api.get(`/books/${bookId}/chapters/${chapterId}`)
  },

  searchBooks: (keyword: string) => {
    return api.get('/books/search', { params: { keyword } })
  },

  getAllBooks: (params: { page?: number; pageSize?: number; keyword?: string; category?: string; status?: number }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.pageSize) query.append('pageSize', params.pageSize.toString())
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.category) query.append('category', params.category)
    if (params.status !== undefined) query.append('status', params.status.toString())
    return api.get(`/books?${query.toString()}`)
  },

  getBookById: (id: number) => {
    return api.get(`/books/${id}`)
  },
}
```

Create `frontend/src/services/api/bookshelf.ts`:
```typescript
import api from './client'

export const bookshelfApi = {
  getBookshelf: () => {
    return api.get('/bookshelf')
  },

  addToBookshelf: (bookId: number) => {
    return api.post('/bookshelf/add', { bookId })
  },

  removeFromBookshelf: (bookId: number) => {
    return api.delete(`/bookshelf/${bookId}`)
  },

  updateProgress: (bookId: number, chapterId: number) => {
    return api.put('/bookshelf/progress', { bookId, chapterId })
  },
}
```

Create `frontend/src/services/api/user.ts`:
```typescript
import api from './client'

export const userApi = {
  login: (username: string, password: string) => {
    return api.post('/auth/login', { username, password })
  },

  register: (username: string, password: string, email: string) => {
    return api.post('/auth/register', { username, password, email })
  },

  getUserInfo: () => {
    return api.get('/user/info')
  },

  logout: () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken })
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    return Promise.resolve()
  },
}
```

Create `frontend/src/services/api/author.ts`:
```typescript
import api from './client'

export const authorApi = {
  getStatus: () => {
    return api.get('/author/status')
  },

  apply: (data: {
    realName: string
    phone: string
    email: string
    penName: string
    specialty: string
    workSamples: string[]
    introduction: string
  }) => {
    return api.post('/author/apply', data)
  },

  sendVerifyCode: (email: string) => {
    return api.post('/author/send-verify-code', { email })
  },

  verifyEmail: (code: string) => {
    return api.post('/author/verify-email', { code })
  },

  getMyApplication: () => {
    return api.get('/author/application')
  },

  getPendingApplications: () => {
    return api.get('/author/admin/applications/pending')
  },

  getAllApplications: () => {
    return api.get('/author/admin/applications')
  },

  getApplicationDetail: (id: number) => {
    return api.get(`/author/admin/applications/${id}`)
  },

  approveApplication: (id: number, comment?: string) => {
    return api.post(`/author/admin/applications/${id}/approve`, { comment })
  },

  rejectApplication: (id: number, comment?: string) => {
    return api.post(`/author/admin/applications/${id}/reject`, { comment })
  },
}

export const authorBookApi = {
  getMyBooks: (page: number = 1, pageSize: number = 10) => {
    return api.get(`/author/books?page=${page}&pageSize=${pageSize}`)
  },

  createBook: (data: {
    title: string
    category: string
    description: string
    cover?: string
    priceType?: number
    freeChapterCount?: number
  }) => {
    return api.post('/author/books', data)
  },

  updateBook: (bookId: number, data: {
    title?: string
    category?: string
    description?: string
    cover?: string
    priceType?: number
    freeChapterCount?: number
    isFinished?: boolean
  }) => {
    return api.put(`/author/books/${bookId}`, data)
  },

  getChapters: (bookId: number, page: number = 1, pageSize: number = 20) => {
    return api.get(`/author/books/${bookId}/chapters?page=${page}&pageSize=${pageSize}`)
  },

  addChapter: (bookId: number, data: {
    title: string
    content: string
    price?: number
    isFree?: number
  }) => {
    return api.post(`/author/books/${bookId}/chapters`, data)
  },

  updateChapter: (bookId: number, chapterId: number, data: {
    title?: string
    content?: string
    price?: number
    isFree?: number
  }) => {
    return api.put(`/author/books/${bookId}/chapters/${chapterId}`, data)
  },

  deleteChapter: (bookId: number, chapterId: number) => {
    return api.delete(`/author/books/${bookId}/chapters/${chapterId}`)
  },

  getBookStats: (bookId: number) => {
    return api.get(`/author/books/${bookId}/stats`)
  },
}
```

Create `frontend/src/services/api/comment.ts`:
```typescript
import api from './client'

export const commentApi = {
  getMyComments: () => {
    return api.get('/comments/my')
  },

  getBookComments: (bookId: number) => {
    return api.get(`/comments/book/${bookId}`)
  },

  deleteComment: (id: number) => {
    return api.delete(`/comments/${id}`)
  },

  addComment: (bookId: number, content: string, parentId?: number) => {
    return api.post('/comments/add', { bookId, content, parentId })
  },

  toggleLike: (commentId: number) => {
    return api.post(`/comments/${commentId}/like`)
  },
}

export const ratingApi = {
  submitRating: (bookId: number, rating: number) => {
    return api.post(`/ratings/${bookId}`, { rating })
  },

  getUserRating: (bookId: number) => {
    return api.get(`/ratings/${bookId}/user`)
  },

  getRatingStats: (bookId: number) => {
    return api.get(`/ratings/${bookId}/stats`)
  },

  deleteRating: (bookId: number) => {
    return api.delete(`/ratings/${bookId}`)
  },
}
```

Create `frontend/src/services/api/payment.ts`:
```typescript
import api from './client'

export const coinApi = {
  getPackages: () => {
    return api.get('/coin/packages')
  },

  recharge: (packageId: number) => {
    return api.post('/coin/recharge', { packageId })
  },

  getBalance: () => {
    return api.get('/coin/balance')
  },

  getRecords: () => {
    return api.get('/coin/records')
  },
}

export const unlockApi = {
  getStatus: (bookId: number, chapterId: number) => {
    return api.get(`/unlock/status/${bookId}/${chapterId}`)
  },

  unlockChapter: (chapterId: number) => {
    return api.post(`/unlock/chapter/${chapterId}`)
  },

  getUnlockedChapters: (bookId: number) => {
    return api.get(`/unlock/list/${bookId}`)
  },
}
```

Create `frontend/src/services/api/admin.ts`:
```typescript
import api from './client'

export const adminApi = {
  getUsers: (params: { page?: number; pageSize?: number; keyword?: string; role?: string; status?: number }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.pageSize) query.append('pageSize', params.pageSize.toString())
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.role) query.append('role', params.role)
    if (params.status !== undefined) query.append('status', params.status.toString())
    return api.get(`/admin/users?${query.toString()}`)
  },

  updateUserStatus: (id: number, status: number) => {
    return api.post(`/admin/users/${id}/status`, { status })
  },

  updateUserRole: (id: number, role: string) => {
    return api.post(`/admin/users/${id}/role`, { role })
  },

  getStats: () => {
    return api.get('/admin/stats')
  },

  updateBookStatus: (id: number, status: number) => {
    return api.post(`/admin/books/${id}/status`, { status })
  },

  deleteBook: (id: number) => {
    return api.delete(`/admin/books/${id}`)
  },

  getBooks: (params: { page?: number; pageSize?: number; keyword?: string; category?: string; status?: number; priceType?: number }) => {
    const query = new URLSearchParams()
    if (params.page) query.append('page', params.page.toString())
    if (params.pageSize) query.append('pageSize', params.pageSize.toString())
    if (params.keyword) query.append('keyword', params.keyword)
    if (params.category) query.append('category', params.category)
    if (params.status !== undefined) query.append('status', params.status.toString())
    if (params.priceType !== undefined) query.append('priceType', params.priceType.toString())
    return api.get(`/admin/books?${query.toString()}`)
  },

  addPaidBook: (data: {
    title: string
    author: string
    category: string
    description: string
    cover?: string
    freeChapterCount?: number
    totalWords?: number
    priceType: number
    status: number
  }) => {
    return api.post('/admin/books/paid', data)
  },

  updatePaidBook: (id: number, data: {
    title?: string
    author?: string
    category?: string
    description?: string
    cover?: string
    freeChapterCount?: number
    totalWords?: number
  }) => {
    return api.put(`/admin/books/paid/${id}`, data)
  },
}

export const notificationApi = {
  getNotifications: (page: number = 1, pageSize: number = 20) => {
    return api.get(`/notifications?page=${page}&pageSize=${pageSize}`)
  },

  getUnreadCount: () => {
    return api.get('/notifications/unread-count')
  },

  markAsRead: (id: number) => {
    return api.post(`/notifications/${id}/read`)
  },

  markAllAsRead: () => {
    return api.post('/notifications/read-all')
  },
}
```

Create `frontend/src/services/api/upload.ts`:
```typescript
import api from './client'

export const uploadApi = {
  uploadCover: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  deleteFile: (url: string) => {
    return api.delete('/upload', { params: { url } })
  },

  validateUrl: (url: string) => {
    return api.get('/upload/validate', { params: { url } })
  },
}
```

Create `frontend/src/services/api/ai.ts`:
```typescript
import { aiApiClient } from './client'

export const aiApi = {
  recommend: (message: string, sessionId?: string, userId?: number) => {
    return aiApiClient.post('/recommend', { message, session_id: sessionId, user_id: userId })
  },

  search: (message: string, sessionId?: string, userId?: number) => {
    return aiApiClient.post('/search', { message, session_id: sessionId, user_id: userId })
  },

  customerService: (message: string, sessionId?: string, userId?: number) => {
    return aiApiClient.post('/customer-service', { message, session_id: sessionId, user_id: userId })
  },

  clearSession: (sessionId: string) => {
    return aiApiClient.delete(`/session/${sessionId}`)
  },

  getSession: (sessionId: string) => {
    return aiApiClient.get(`/session/${sessionId}`)
  },
}
```

Create `frontend/src/services/api/signin.ts`:
```typescript
import api from './client'

export const signInApi = {
  getStatus: () => {
    return api.get('/signin/status')
  },

  signIn: () => {
    return api.post('/signin/do')
  },
}
```

Create `frontend/src/services/api/index.ts`:
```typescript
export { bookApi } from './books'
export { bookshelfApi } from './bookshelf'
export { userApi } from './user'
export { authorApi, authorBookApi } from './author'
export { commentApi, ratingApi } from './comment'
export { coinApi, unlockApi } from './payment'
export { adminApi, notificationApi } from './admin'
export { uploadApi } from './upload'
export { aiApi } from './ai'
export { signInApi } from './signin'
```

- [ ] **Step 2: Update services/api.ts to re-export**

Replace `frontend/src/services/api.ts` content:
```typescript
export {
  bookApi,
  bookshelfApi,
  userApi,
  authorApi,
  authorBookApi,
  commentApi,
  ratingApi,
  coinApi,
  unlockApi,
  adminApi,
  notificationApi,
  uploadApi,
  aiApi,
  signInApi,
} from './api/index'
export { default as api, default } from './api/client'
```

- [ ] **Step 3: Verify frontend build**

```bash
cd D:/TRAE/Novel/frontend && npx tsc --noEmit 2>&1 | tail -20
```
Expected: No errors related to imports.

- [ ] **Step 4: Commit**

```bash
cd D:/TRAE/Novel && git add frontend/src/services/
git commit -m "refactor: split services/api.ts into domain-specific modules

api.ts (533 lines) split into:
- client.ts: axios instances, interceptors, token refresh
- books.ts, bookshelf.ts, user.ts, author.ts
- comment.ts, payment.ts, admin.ts
- upload.ts, ai.ts, signin.ts
- index.ts: unified re-export, backward compatible"
```

---

### Task 5: Frontend — Add React.lazy route splitting

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Replace static imports with lazy loading**

In `frontend/src/App.tsx`, replace the top section:

```tsx
import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { TabBar, SpinLoading } from 'antd-mobile'
import { HomeOutlined, BookOutlined, CompassOutlined, UserOutlined } from '@ant-design/icons'

// Static imports for TabBar main pages (always needed for first paint)
import { Home, Bookshelf, Discover, User } from './pages'
import AIFloatingAssistant from './components/AIFloatingAssistant'

// Lazy-loaded pages
const BookDetail = lazy(() => import('./pages/BookDetail'))
const Reader = lazy(() => import('./pages/Reader'))
const Search = lazy(() => import('./pages/Search'))
const ReadingHistory = lazy(() => import('./pages/ReadingHistory'))
const MyComments = lazy(() => import('./pages/MyComments'))
const MyFavorites = lazy(() => import('./pages/MyFavorites'))
const DailySignIn = lazy(() => import('./pages/DailySignIn'))
const Settings = lazy(() => import('./pages/Settings'))
const HelpFeedback = lazy(() => import('./pages/HelpFeedback'))
const BookComments = lazy(() => import('./pages/BookComments'))
const BecomeAuthor = lazy(() => import('./pages/BecomeAuthor'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Recharge = lazy(() => import('./pages/Recharge'))
const AuthorBooks = lazy(() => import('./pages/AuthorBooks'))
const PaidBooks = lazy(() => import('./pages/PaidBooks'))
const AuthorAudit = lazy(() => import('./pages/AuthorAudit'))

// Lazy-loaded admin pages as a group
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AuthorAuditNew = lazy(() => import('./pages/admin/AuthorAuditNew'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))
const BookManagement = lazy(() => import('./pages/admin/BookManagement'))
const DataReports = lazy(() => import('./pages/admin/DataReports'))
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'))
const PaidBookManagement = lazy(() => import('./pages/admin/PaidBookManagement'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <SpinLoading color="primary" />
  </div>
)
```

Then wrap all `<Routes>` content in `<Suspense fallback={<PageLoader />}>`:

```tsx
<Suspense fallback={<PageLoader />}>
  <Routes>
    {/* ... same route definitions ... */}
  </Routes>
</Suspense>
```

- [ ] **Step 2: Update pages/index.ts to remove exports of lazy-loaded pages**

In `frontend/src/pages/index.ts`, keep only the 4 main page exports:
```typescript
export { default as Home } from './Home'
export { default as Bookshelf } from './Bookshelf'
export { default as Discover } from './Discover'
export { default as User } from './User'
```

Lazy-loaded pages don't need barrel exports — they're imported directly with `lazy(() => import(...))`.

- [ ] **Step 3: Verify build**

```bash
cd D:/TRAE/Novel/frontend && npx tsc --noEmit 2>&1 | tail -10
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd D:/TRAE/Novel && git add frontend/src/App.tsx frontend/src/pages/index.ts
git commit -m "perf: add React.lazy code splitting for non-TabBar routes

TabBar main pages (Home, Bookshelf, Discover, User) stay static.
All other pages load lazily with Suspense spinner fallback.
Reduces initial bundle size significantly."
```

---

### Task 6: AI Service — Switch to DeepSeek API

**Files:**
- Modify: `ai-service/app/config.py`
- Modify: `ai-service/app/core/llm.py`
- Modify: `ai-service/app/core/vector_store.py`
- Modify: `ai-service/requirements.txt`

- [ ] **Step 1: Update config.py**

Replace `ai-service/app/config.py`:
```python
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # DeepSeek API
    DEEPSEEK_API_KEY: str = os.environ.get("DEEPSEEK_API_KEY", "")
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-v4-pro"

    # Database
    DB_HOST: str = os.environ.get("DB_HOST", "localhost")
    DB_PORT: int = int(os.environ.get("DB_PORT", "3306"))
    DB_NAME: str = os.environ.get("DB_NAME", "novel")
    DB_USER: str = os.environ.get("DB_USER", "root")
    DB_PASSWORD: str = os.environ.get("DB_PASSWORD", "123456")

    # Redis
    REDIS_HOST: str = os.environ.get("REDIS_HOST", "192.168.159.128")
    REDIS_PORT: int = int(os.environ.get("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.environ.get("REDIS_PASSWORD", "123456")
    REDIS_DB: int = 0

    # Service
    AI_SERVICE_PORT: int = int(os.environ.get("AI_SERVICE_PORT", "8001"))

    # ChromaDB
    CHROMA_PERSIST_DIR: str = os.path.join(os.path.dirname(__file__), "chroma_data")

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            f"?charset=utf8mb4"
        )

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()
```

- [ ] **Step 2: Update .env.example**

```bash
# DeepSeek API (fill in your key)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=novel
DB_USER=root
DB_PASSWORD=123456

# Redis
REDIS_HOST=192.168.159.128
REDIS_PORT=6379
REDIS_PASSWORD=123456

# Service
AI_SERVICE_PORT=8001
```

- [ ] **Step 3: Update llm.py**

Replace `ai-service/app/core/llm.py`:
```python
from langchain_openai import ChatOpenAI
from app.config import settings


def get_llm(streaming: bool = True, temperature: float = 0.7) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.DEEPSEEK_MODEL,
        base_url=settings.DEEPSEEK_BASE_URL,
        api_key=settings.DEEPSEEK_API_KEY,
        streaming=streaming,
        temperature=temperature,
    )
```

Remove `get_embeddings()` — it's no longer used; embeddings are handled by vector_store.py directly.

- [ ] **Step 4: Update vector_store.py — switch to local sentence-transformers**

In `ai-service/app/core/vector_store.py`, replace the embedding setup:
```python
import json
import logging
from typing import List, Optional, Dict, Any

import chromadb
from chromadb.utils import embedding_functions

from app.config import settings
from app.core.repository import novel_repo

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self):
        self._client: Optional[chromadb.PersistentClient] = None
        self._collection = None
        self._initialized = False

    def _ensure_init(self):
        if self._initialized:
            return
        self._client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

        self._embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="BAAI/bge-small-zh-v1.5",
        )

        self._collection = self._client.get_or_create_collection(
            name="novel_books",
            embedding_function=self._embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        self._initialized = True

    # ... rest remains the same (index_books, search, _build_book_text) ...
```

Also remove the import of `get_embeddings` in vector_store.py line 9: delete `from app.core.llm import get_embeddings`.

The `index_books`, `search`, and `_build_book_text` methods remain identical.

- [ ] **Step 5: Update requirements.txt**

Replace `ai-service/requirements.txt`:
```
langchain>=0.3.0
langchain-core>=0.3.0
langchain-community>=0.3.0
langchain-openai>=0.2.0
langgraph>=0.2.0
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.0.0
python-dotenv>=1.0.0
pymysql>=1.1.0
sqlalchemy>=2.0.0
redis>=5.0.0
chromadb>=0.5.0
sentence-transformers>=3.0.0
httpx>=0.27.0
sse-starlette>=2.0.0
pytest>=8.0.0
pytest-asyncio>=0.24.0
```

(NumPy removed — it's a transitive dependency of sentence-transformers.)

- [ ] **Step 6: Commit**

```bash
cd D:/TRAE/Novel && git add ai-service/
git commit -m "feat: switch AI service from DashScope to DeepSeek API

- Model: deepseek-v4-pro via https://api.deepseek.com/v1
- Embedding: local sentence-transformers (BAAI/bge-small-zh-v1.5)
- API key configured via DEEPSEEK_API_KEY environment variable
- Removed DashScope-specific code and OpenAIEmbeddings dependency"
```

---

### Task 7: AI Service — Externalize knowledge base to JSON

**Files:**
- Create: `ai-service/app/data/knowledge_base.json`
- Modify: `ai-service/app/modules/customer_service.py`

- [ ] **Step 1: Create knowledge_base.json**

Create `ai-service/app/data/` directory and `knowledge_base.json`:
```json
{
  "account": {
    "register": "注册步骤：1. 打开APP点击'注册'；2. 输入用户名、邮箱和密码；3. 密码需包含大小写字母和数字，至少8位；4. 点击'注册'完成。",
    "login": "登录方式：1. 用户名+密码登录；2. 如忘记密码，可通过注册邮箱重置；3. 登录后建议绑定手机号提高安全性。",
    "password_reset": "密码重置：1. 在登录页点击'忘记密码'；2. 输入注册邮箱；3. 收到重置链接后设置新密码；4. 新密码需满足安全要求。",
    "account_security": "账号安全建议：1. 使用强密码（大小写+数字+特殊字符）；2. 不要与他人共享账号；3. 定期修改密码；4. 如发现异常登录，请立即修改密码并联系客服。"
  },
  "reading": {
    "search": "搜索书籍：1. 点击首页搜索图标；2. 输入书名、作者或关键词；3. 可按分类筛选；4. 支持模糊搜索和热门推荐。",
    "bookshelf": "书架功能：1. 在书籍详情页点击'加入书架'；2. 书架自动记录阅读进度；3. 支持书籍排序和分类管理；4. 长按可删除书籍。",
    "chapter": "章节阅读：1. 在书籍详情页选择章节；2. 左右滑动翻页；3. 点击中间区域显示菜单；4. 支持调节字体大小和背景色。",
    "reading_settings": "阅读设置：1. 点击阅读页面中间打开菜单；2. 可调节字体大小、行距、背景色；3. 支持夜间模式；4. 可设置自动翻页。"
  },
  "payment": {
    "recharge": "书币充值：1. 进入'我的'->'充值'页面；2. 选择充值套餐；3. 确认支付；4. 充值成功后书币即时到账。",
    "unlock": "付费章节解锁：1. 阅读付费章节时点击'解锁'；2. 每章需消耗一定书币；3. 解锁后永久可读；4. 部分书籍有免费试读章节。",
    "refund": "退款政策：1. 虚拟商品（书币、解锁章节）一经购买不支持退款；2. 如遇系统问题导致重复扣费，请联系客服处理；3. 充值未到账请提供订单截图联系客服。"
  },
  "author": {
    "apply": "成为作者：1. 进入'我的'->'成为作者'；2. 填写真实姓名、笔名、擅长类型等信息；3. 提供作品样本；4. 等待审核（1-3个工作日）；5. 审核通过后即可发布作品。",
    "publish": "发布作品：1. 进入作者后台；2. 点击'新建作品'；3. 填写作品信息（标题、分类、简介、封面）；4. 添加章节内容；5. 发布后等待审核。",
    "manage": "管理章节：1. 在作者后台选择作品；2. 可添加、编辑、删除章节；3. 可设置章节为免费或付费；4. 可查看作品数据统计。"
  },
  "technical": {
    "loading": "页面加载问题：1. 检查网络连接；2. 清除APP缓存；3. 更新到最新版本；4. 如仍无法解决，请卸载重装。",
    "error": "错误提示处理：1. 记录错误代码和提示信息；2. 尝试退出重新进入；3. 清除缓存后重试；4. 如持续出现，请联系客服并提供错误截图。"
  }
}
```

- [ ] **Step 2: Update customer_service.py**

In `ai-service/app/modules/customer_service.py`, add JSON loading and remove the hardcoded dict:

Add at top (after imports):
```python
import json
from pathlib import Path

# Load knowledge base from external JSON file
_kb_path = Path(__file__).parent.parent / "data" / "knowledge_base.json"
with open(_kb_path, "r", encoding="utf-8") as f:
    KNOWLEDGE_BASE = json.load(f)
```

Delete the entire `KNOWLEDGE_BASE = { ... }` hardcoded dict block (lines 55-82 in original).

The rest of `customer_service.py` remains unchanged — `KNOWLEDGE_BASE` variable name stays the same.

- [ ] **Step 3: Commit**

```bash
cd D:/TRAE/Novel && git add ai-service/app/data/ ai-service/app/modules/customer_service.py
git commit -m "refactor: externalize AI knowledge base to JSON file

KNOWLEDGE_BASE dict moved from customer_service.py to
app/data/knowledge_base.json. Loaded at module import time.
Allows non-code updates to FAQ content."
```

---

### Task 8: AI + Frontend — Add SSE streaming

**Files:**
- Modify: `ai-service/app/api/chat.py`
- Modify: `frontend/src/hooks/useAIChat.ts`
- Modify: `frontend/src/components/AIFloatingAssistant.tsx`

- [ ] **Step 1: Update chat.py — three endpoints to SSE streaming**

Replace `ai-service/app/api/chat.py`:
```python
import uuid
import json
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.modules.recommend import recommend_graph
from app.modules.search import search_graph
from app.modules.customer_service import cs_graph
from app.core.context import context_manager

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="用户消息")
    session_id: Optional[str] = Field(None, description="会话ID，不传则新建")
    user_id: Optional[int] = Field(None, description="用户ID")


async def stream_graph(graph, initial_state: dict, session_id: str, module: str) -> AsyncGenerator[str, None]:
    """Generic helper: stream LangGraph output as SSE events."""
    yield f"data: {json.dumps({'type': 'session', 'session_id': session_id, 'module': module})}\n\n"

    try:
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
            elif kind == "on_custom_event":
                yield f"data: {json.dumps({'type': 'event', 'name': event['name'], 'data': event['data']})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/recommend", summary="AI智能推荐（流式）")
async def recommend(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    ctx = context_manager.get_context(session_id)
    ctx.module = "recommend"
    ctx.user_id = request.user_id
    ctx.add_message("user", request.message)

    initial_state = {
        "messages": [{"role": "user", "content": request.message}],
        "user_id": request.user_id,
        "user_preference": "",
        "candidate_books": [],
        "recommendation_reason": "",
        "final_response": "",
    }

    async def event_generator():
        full_response = ""
        async for sse in stream_graph(recommend_graph, initial_state, session_id, "recommend"):
            if "token" in sse:
                try:
                    data = json.loads(sse.replace("data: ", ""))
                    if data.get("type") == "token":
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
            yield sse

        ctx.add_message("assistant", full_response)
        context_manager.save_context(ctx)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/search", summary="AI智能搜索（流式）")
async def search(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    ctx = context_manager.get_context(session_id)
    ctx.module = "search"
    ctx.user_id = request.user_id
    ctx.add_message("user", request.message)

    initial_state = {
        "messages": [{"role": "user", "content": request.message}],
        "query": "",
        "search_results": [],
        "search_type": "",
        "final_response": "",
    }

    async def event_generator():
        full_response = ""
        async for sse in stream_graph(search_graph, initial_state, session_id, "search"):
            if "token" in sse:
                try:
                    data = json.loads(sse.replace("data: ", ""))
                    if data.get("type") == "token":
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
            yield sse

        ctx.add_message("assistant", full_response)
        context_manager.save_context(ctx)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/customer-service", summary="AI客服（流式）")
async def customer_service_chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    ctx = context_manager.get_context(session_id)
    ctx.module = "customer_service"
    ctx.user_id = request.user_id
    ctx.add_message("user", request.message)

    initial_state = {
        "messages": [{"role": "user", "content": request.message}],
        "user_id": request.user_id,
        "intent": "",
        "entities": {},
        "knowledge_response": "",
        "final_response": "",
    }

    async def event_generator():
        full_response = ""
        async for sse in stream_graph(cs_graph, initial_state, session_id, "customer_service"):
            if "token" in sse:
                try:
                    data = json.loads(sse.replace("data: ", ""))
                    if data.get("type") == "token":
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
            yield sse

        ctx.add_message("assistant", full_response)
        context_manager.save_context(ctx)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/session/{session_id}", summary="清除会话")
async def clear_session(session_id: str):
    context_manager.delete_context(session_id)
    return {"session_id": session_id, "message": "会话已清除"}


@router.get("/session/{session_id}", summary="获取会话上下文")
async def get_session(session_id: str):
    ctx = context_manager.get_context(session_id)
    return ctx.to_dict()
```

**Important note**: `astream_events` may not be the exact API for every LangGraph version. If the graph uses `ainvoke` only, an alternative approach is to wrap the LLM call inside the graph node to yield tokens. The key point is that each endpoint returns `StreamingResponse` with SSE media type.

- [ ] **Step 2: Update useAIChat.ts for streaming**

Replace `frontend/src/hooks/useAIChat.ts`:
```typescript
import { useState, useRef, useCallback } from 'react'

type AIModule = 'recommend' | 'search' | 'customer_service'

interface Message {
  id: number
  type: 'user' | 'assistant'
  content: string
  time: string
}

function formatTime() {
  const now = new Date()
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
}

const API_ENDPOINTS: Record<AIModule, string> = {
  recommend: '/api/ai/recommend',
  search: '/api/ai/search',
  customer_service: '/api/ai/customer-service',
}

export function useAIChat(module: AIModule) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const sessionIdRef = useRef<string | undefined>()
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = { id: Date.now(), type: 'user', content, time: formatTime() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setStreamingContent('')

    const userId = parseInt(localStorage.getItem('userId') || '0') || undefined
    abortRef.current = new AbortController()

    try {
      const response = await fetch(API_ENDPOINTS[module], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          session_id: sessionIdRef.current,
          user_id: userId,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullText = ''
      let returnedSessionId: string | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'session' && data.session_id) {
              returnedSessionId = data.session_id
            } else if (data.type === 'token') {
              fullText += data.content
              setStreamingContent(fullText)
            } else if (data.type === 'error') {
              fullText = `抱歉，服务暂时不可用：${data.message}`
              setStreamingContent(fullText)
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }

      if (returnedSessionId && !sessionIdRef.current) {
        sessionIdRef.current = returnedSessionId
      }

      const finalText = fullText || '抱歉，服务暂时不可用，请稍后再试。'
      const botMsg: Message = { id: Date.now() + 1, type: 'assistant', content: finalText, time: formatTime() }
      setMessages(prev => [...prev, botMsg])
      setStreamingContent('')
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const errorMsg: Message = {
          id: Date.now() + 1,
          type: 'assistant',
          content: '抱歉，AI服务暂时不可用，请稍后再试。',
          time: formatTime(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
    } finally {
      setLoading(false)
    }
  }, [module, loading])

  const clearMessages = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setStreamingContent('')
    sessionIdRef.current = undefined
  }, [])

  return { messages, loading, streamingContent, sendMessage, clearMessages }
}
```

- [ ] **Step 3: Update AIFloatingAssistant.tsx for streaming display**

In `frontend/src/components/AIFloatingAssistant.tsx`, update to show streaming content:

Change line 9 from:
```tsx
const { messages, loading, sendMessage } = useAIChat('customer_service')
```
to:
```tsx
const { messages, loading, streamingContent, sendMessage } = useAIChat('customer_service')
```

After the messages loop (before the loading indicator, around line 157), add a streaming preview:
```tsx
{loading && streamingContent && (
  <div
    style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '10px',
    }}
  >
    <div
      style={{
        maxWidth: '80%',
        padding: '8px 12px',
        borderRadius: '14px 14px 14px 4px',
        backgroundColor: '#f5f5f5',
        color: '#333',
        fontSize: '13px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
      }}
    >
      {streamingContent}
      <span style={{
        display: 'inline-block',
        width: '2px',
        height: '14px',
        backgroundColor: '#1677ff',
        marginLeft: '2px',
        animation: 'blink 1s infinite',
        verticalAlign: 'text-bottom',
      }} />
    </div>
  </div>
)}
```

Replace the old loading line (which showed "AI正在思考...") with:
```tsx
{loading && !streamingContent && (
  <div style={{ color: '#999', fontSize: '12px', padding: '4px 8px' }}>AI正在思考...</div>
)}
```

Add a simple CSS animation to `frontend/src/index.css`:
```css
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/TRAE/Novel && git add ai-service/app/api/chat.py frontend/src/hooks/useAIChat.ts frontend/src/components/AIFloatingAssistant.tsx frontend/src/index.css
git commit -m "feat: add SSE streaming for AI service and frontend

Backend: three AI endpoints now return StreamingResponse (SSE).
Frontend: useAIChat uses fetch+ReadableStream for real-time
token-by-token rendering with blinking cursor effect.

Note: LangGraph streaming requires graph nodes to use LLM with
streaming=True for on_chat_model_stream events to fire."
```

---

### Verification

After all tasks complete:

```bash
# Backend compile check
cd D:/TRAE/Novel/backend && mvn compile -q 2>&1 | grep -E "BUILD|ERROR"

# Frontend type check
cd D:/TRAE/Novel/frontend && npx tsc --noEmit 2>&1 | tail -5

# AI service syntax check
cd D:/TRAE/Novel/ai-service && python -m py_compile app/main.py && echo "OK"
```
