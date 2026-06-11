package com.novel.reading.service;

import com.novel.common.entity.Bookmark;

import java.util.List;

public interface BookmarkService {
    List<Bookmark> getBookmarks(Long userId, Long bookId);
    boolean isBookmarked(Long userId, Long bookId, Long chapterId);
    Bookmark addBookmark(Long userId, Long bookId, Long chapterId, String chapterTitle, Integer position, String note);
    void deleteBookmark(Long userId, Long bookmarkId);
}
