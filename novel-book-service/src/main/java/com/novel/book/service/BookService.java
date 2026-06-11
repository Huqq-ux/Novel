package com.novel.book.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.common.entity.Book;
import com.novel.common.entity.Chapter;

import java.util.List;

public interface BookService {

    Page<Book> getAllBooksPage(Integer page, Integer size, String category, String sort, Boolean isFinished, Integer priceType);

    Book getBookById(Long id);

    List<Chapter> getChaptersByBookId(Long bookId);

    Chapter getChapterById(Long bookId, Long chapterId);

    List<Book> searchBooks(String keyword);
}
