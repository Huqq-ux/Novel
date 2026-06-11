package com.novel.reading.service;

import java.util.List;
import java.util.Map;

public interface UnlockService {
    Map<String, Object> getUnlockStatus(Long userId, Long bookId, Long chapterId);
    Map<String, Object> unlockChapter(Long userId, Long chapterId);
    List<Long> getUnlockedChapterIds(Long userId, Long bookId);
    boolean isChapterUnlocked(Long userId, Long chapterId);
}
