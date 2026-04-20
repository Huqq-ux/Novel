package com.novel.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import com.novel.entity.Chapter;

import java.util.List;

/**
 * 书籍服务接口
 */
public interface BookService {
    /**
     * 获取书籍列表（分页）
     */
    Page<Book> getAllBooksPage(Integer page, Integer size, String category, String sort, Boolean isFinished, Integer priceType);

    /**
     * 根据ID获取书籍详情
     */
    Book getBookById(Long id);

    /**
     * 根据书籍ID获取章节列表
     */
    List<Chapter> getChaptersByBookId(Long bookId);

    /**
     * 根据章节ID获取章节内容
     */
    Chapter getChapterById(Long bookId, Long chapterId);

    /**
     * 搜索书籍
     */
    List<Book> searchBooks(String keyword);
}
