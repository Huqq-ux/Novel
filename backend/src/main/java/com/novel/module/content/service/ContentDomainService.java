package com.novel.module.content.service;

import com.novel.module.content.entity.BookEntity;
import com.novel.module.content.entity.ChapterEntity;

import java.util.List;
import java.util.Optional;

public interface ContentDomainService {

    BookEntity createBook(BookEntity book);
    
    Optional<BookEntity> findBookById(Long id);
    
    BookEntity updateBook(BookEntity book);
    
    void updateBookRating(Long bookId, Double rating);
    
    void incrementClickCount(Long bookId);
    
    void incrementCollectCount(Long bookId);
    
    void decrementCollectCount(Long bookId);
    
    ChapterEntity createChapter(ChapterEntity chapter);
    
    Optional<ChapterEntity> findChapterById(Long id);
    
    List<ChapterEntity> findChaptersByBookId(Long bookId);
    
    ChapterEntity updateChapter(ChapterEntity chapter);
    
    boolean isChapterFree(Long bookId, Long chapterId);
    
    Integer getChapterPrice(Long bookId, Long chapterId);
}
