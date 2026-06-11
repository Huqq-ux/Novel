package com.novel.book.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.common.entity.Book;
import com.novel.common.entity.Chapter;

import java.util.Map;

public interface AuthorBookService {
    Page<Book> getMyBooks(Long userId, int page, int pageSize);
    Map<String, Object> createBook(Long userId, Map<String, Object> body);
    String updateBook(Long userId, Long bookId, Map<String, Object> body);
    Page<Chapter> getChapters(Long userId, Long bookId, int page, int pageSize);
    Map<String, Object> addChapter(Long userId, Long bookId, Map<String, Object> body);
    String updateChapter(Long userId, Long bookId, Long chapterId, Map<String, Object> body);
    String deleteChapter(Long userId, Long bookId, Long chapterId);
    String deleteBook(Long userId, Long bookId);
    Map<String, Object> getBookStats(Long userId, Long bookId);
}
