package com.novel.book.cache;

import com.novel.common.entity.Chapter;
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
