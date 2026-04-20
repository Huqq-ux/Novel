package com.novel.module.content.cache;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.module.common.cache.CacheConstants;
import com.novel.module.common.cache.CacheProtectionService;
import com.novel.module.common.cache.CacheService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Supplier;

/**
 * 书籍缓存服务
 * 
 * 提供书籍相关数据的缓存操作封装，包括书籍详情、章节列表、搜索结果等。
 * 集成缓存保护机制，防止缓存穿透、击穿和雪崩问题。
 * 
 * 设计考量：
 * 1. 书籍详情缓存1小时，支持空值缓存防止穿透
 * 2. 章节列表缓存30分钟，相对稳定
 * 3. 搜索结果缓存5分钟，减少重复搜索压力
 * 4. 点击量计数使用独立缓存键，支持高并发更新
 */
@Service
public class BookCacheService {

    private static final Logger log = LoggerFactory.getLogger(BookCacheService.class);

    @Autowired
    private CacheService cacheService;

    @Autowired
    private CacheProtectionService cacheProtectionService;

    /**
     * 根据ID获取书籍详情
     * 
     * 功能描述：
     * 从缓存获取书籍详情，未命中则从数据库加载。
     * 
     * 实现逻辑：
     * 1. 构建缓存键：book:detail:{id}
     * 2. 使用空值保护策略获取缓存
     * 3. 缓存空值防止穿透
     * 
     * 设计考量：
     * - 书籍详情是高频访问数据，缓存显著提升性能
     * - 使用空值保护防止无效ID穿透到数据库
     * - 缓存过期时间1小时，随机偏移防止雪崩
     * 
     * @param id       书籍ID
     * @param dbLoader 数据库加载器
     * @return Book 书籍详情，不存在返回null
     */
    public Book getBookById(Long id, Supplier<Book> dbLoader) {
        String key = cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, id);
        return cacheProtectionService.getWithNullProtection(
            key, Book.class, dbLoader,
            CacheConstants.BOOK_DETAIL_TTL, CacheConstants.BOOK_DETAIL_UNIT, true
        );
    }

    /**
     * 缓存书籍详情
     * 
     * 功能描述：
     * 将书籍详情存入缓存，带随机过期时间。
     * 
     * @param book 书籍对象
     */
    public void cacheBook(Book book) {
        if (book != null && book.getId() != null) {
            String key = cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, book.getId());
            cacheProtectionService.setWithRandomExpire(
                key, book, 
                CacheConstants.BOOK_DETAIL_TTL, CacheConstants.BOOK_DETAIL_UNIT
            );
        }
    }

    /**
     * 清除书籍详情缓存
     * 
     * 功能描述：
     * 删除指定书籍的详情缓存。
     * 
     * @param bookId 书籍ID
     */
    public void evictBook(Long bookId) {
        String key = cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, bookId);
        cacheService.delete(key);
        log.debug("Evicted book cache: {}", key);
    }

    /**
     * 清除书籍相关所有缓存
     * 
     * 功能描述：
     * 删除书籍详情、章节列表和相关列表缓存。
     * 书籍信息变更时调用。
     * 
     * @param bookId 书籍ID
     */
    public void evictBookRelated(Long bookId) {
        cacheService.delete(cacheService.buildKey(CacheConstants.BOOK_DETAIL_PREFIX, bookId));
        cacheService.delete(cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId));
        cacheService.deleteByPattern(CacheConstants.BOOK_LIST_PREFIX + "*");
        log.debug("Evicted all related caches for book: {}", bookId);
    }

    /**
     * 获取书籍分页列表缓存
     * 
     * 功能描述：
     * 从缓存获取书籍分页列表，未命中则从数据库加载。
     * 
     * 实现逻辑：
     * 1. 构建缓存键：book:list:{cacheKey}
     * 2. 尝试从缓存获取Page对象
     * 3. 未命中则调用数据库加载器
     * 
     * 设计考量：
     * - 分页列表缓存时间较短（5分钟）
     * - 列表缓存键包含查询条件，避免混淆
     * - 使用随机过期时间防止雪崩
     * 
     * @param cacheKey 缓存键标识（通常包含查询条件）
     * @param dbLoader 数据库加载器
     * @return Page<Book> 分页书籍列表
     */
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

    /**
     * 缓存书籍分页列表
     * 
     * 功能描述：
     * 将书籍分页列表存入缓存。
     * 
     * @param cacheKey 缓存键标识
     * @param page     分页数据
     */
    public void cacheBookList(String cacheKey, Page<Book> page) {
        String key = cacheService.buildKey(CacheConstants.BOOK_LIST_PREFIX, cacheKey);
        cacheProtectionService.setWithRandomExpire(
            key, page,
            CacheConstants.BOOK_LIST_TTL, CacheConstants.BOOK_LIST_UNIT
        );
    }

    /**
     * 清除所有书籍列表缓存
     * 
     * 功能描述：
     * 删除所有书籍列表相关的缓存。
     * 书籍信息变更时调用。
     */
    public void evictBookList() {
        cacheService.deleteByPattern(CacheConstants.BOOK_LIST_PREFIX + "*");
        log.debug("Evicted all book list caches");
    }

    /**
     * 获取书籍章节列表缓存
     * 
     * 功能描述：
     * 从缓存获取书籍章节列表，未命中则从数据库加载。
     * 
     * 实现逻辑：
     * 1. 构建缓存键：book:chapters:{bookId}
     * 2. 尝试从缓存获取章节列表
     * 3. 未命中则调用数据库加载器
     * 
     * 设计考量：
     * - 章节列表相对稳定，适合缓存
     * - 缓存时间30分钟
     * - 书籍更新章节时需主动清除缓存
     * 
     * @param bookId   书籍ID
     * @param dbLoader 数据库加载器
     * @return List<Chapter> 章节列表
     */
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

    /**
     * 缓存书籍章节列表
     * 
     * 功能描述：
     * 将书籍章节列表存入缓存。
     * 
     * @param bookId   书籍ID
     * @param chapters 章节列表
     */
    public void cacheBookChapters(Long bookId, List<Chapter> chapters) {
        String key = cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId);
        cacheProtectionService.setWithRandomExpire(
            key, chapters,
            CacheConstants.BOOK_LIST_TTL, CacheConstants.BOOK_LIST_UNIT
        );
    }

    /**
     * 清除书籍章节列表缓存
     * 
     * 功能描述：
     * 删除指定书籍的章节列表缓存。
     * 
     * @param bookId 书籍ID
     */
    public void evictBookChapters(Long bookId) {
        String key = cacheService.buildKey(CacheConstants.BOOK_CHAPTERS_PREFIX, bookId);
        cacheService.delete(key);
        log.debug("Evicted book chapters cache: {}", key);
    }

    /**
     * 获取搜索结果缓存
     * 
     * 功能描述：
     * 从缓存获取搜索结果，未命中则从数据库加载。
     * 
     * 实现逻辑：
     * 1. 使用关键词hashCode构建缓存键
     * 2. 尝试从缓存获取搜索结果
     * 3. 未命中则调用数据库加载器
     * 
     * 设计考量：
     * - 使用hashCode避免关键词中的特殊字符问题
     * - 搜索结果缓存时间较短（5分钟）
     * - 减少重复搜索对数据库的压力
     * 
     * @param keyword  搜索关键词
     * @param dbLoader 数据库加载器
     * @return List<Book> 搜索结果列表
     */
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

    /**
     * 清除所有搜索缓存
     * 
     * 功能描述：
     * 删除所有搜索结果缓存。
     */
    public void evictSearchCache() {
        cacheService.deleteByPattern(CacheConstants.BOOK_SEARCH_PREFIX + "*");
        log.debug("Evicted all search caches");
    }

    /**
     * 递增书籍点击量
     * 
     * 功能描述：
     * 递增指定书籍的点击量计数器。
     * 
     * 设计考量：
     * - 点击量使用独立缓存键，支持高并发更新
     * - 定时任务同步到数据库
     * - 使用Redis原子递增操作保证并发安全
     * 
     * @param bookId 书籍ID
     */
    public void incrementClickCount(Long bookId) {
        String key = "book:click:" + bookId;
        cacheService.increment(key);
    }

    /**
     * 获取书籍点击量
     * 
     * 功能描述：
     * 获取指定书籍的点击量计数。
     * 
     * @param bookId 书籍ID
     * @return Long 点击量，不存在返回0
     */
    public Long getClickCount(Long bookId) {
        String key = "book:click:" + bookId;
        return cacheService.get(key, Long.class).orElse(0L);
    }
}
