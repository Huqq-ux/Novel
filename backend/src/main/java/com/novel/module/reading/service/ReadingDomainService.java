package com.novel.module.reading.service;

import com.novel.module.reading.entity.BookshelfEntity;

import java.util.List;
import java.util.Optional;

public interface ReadingDomainService {

    BookshelfEntity addToBookshelf(Long userId, Long bookId);
    
    Optional<BookshelfEntity> findByUserIdAndBookId(Long userId, Long bookId);
    
    List<BookshelfEntity> findByUserId(Long userId);
    
    void updateReadingProgress(Long userId, Long bookId, Long chapterId, Double progress);
    
    void removeFromBookshelf(Long userId, Long bookId);
    
    boolean isInBookshelf(Long userId, Long bookId);
    
    int getBookshelfCount(Long userId);
}
