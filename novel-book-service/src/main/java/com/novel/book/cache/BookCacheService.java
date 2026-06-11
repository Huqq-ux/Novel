package com.novel.book.cache;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.common.entity.Book;
import com.novel.common.entity.Chapter;
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
