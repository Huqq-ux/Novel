package com.novel.reading.service;

import com.novel.common.entity.Bookshelf;

import java.util.List;

public interface BookshelfService {
    List<Bookshelf> getBookshelf(Long userId);

    boolean addToBookshelf(Long userId, Long bookId);

    void removeFromBookshelf(Long userId, Long bookId);

    void updateProgress(Long userId, Long bookId, Long chapterId);
}
