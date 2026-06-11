package com.novel.book.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.book.cache.BookCacheService;
import com.novel.book.cache.ChapterCacheService;
import com.novel.book.mapper.BookMapper;
import com.novel.book.mapper.ChapterMapper;
import com.novel.book.service.BookService;
import com.novel.common.entity.Book;
import com.novel.common.entity.Chapter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookServiceImpl implements BookService {

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private BookCacheService bookCacheService;

    @Autowired
    private ChapterCacheService chapterCacheService;

    @Override
    public Page<Book> getAllBooksPage(Integer page, Integer size, String category, String sort, Boolean isFinished, Integer priceType) {
        Page<Book> bookPage = new Page<>(page != null ? page : 1, size != null ? size : 10);

        QueryWrapper<Book> queryWrapper = new QueryWrapper<>();

        if (category != null && !category.isEmpty()) {
            queryWrapper.eq("category", category);
        }

        if (isFinished != null && isFinished) {
            queryWrapper.eq("is_finished", isFinished);
        }

        if (priceType != null) {
            queryWrapper.eq("price_type", priceType);
        }

        if (sort != null && !sort.isEmpty()) {
            if ("clickCount".equals(sort)) {
                queryWrapper.orderByDesc("click_count").orderByDesc("id");
            } else if ("createTime".equals(sort)) {
                queryWrapper.orderByDesc("create_time").orderByDesc("id");
            } else if ("rating".equals(sort)) {
                queryWrapper.orderByDesc("rating").orderByDesc("id");
            } else {
                queryWrapper.orderByDesc("create_time").orderByDesc("id");
            }
        } else {
            queryWrapper.orderByDesc("create_time").orderByDesc("id");
        }

        return bookMapper.selectPage(bookPage, queryWrapper);
    }

    @Override
    public Book getBookById(Long id) {
        return bookCacheService.getBookById(id, () -> bookMapper.selectById(id));
    }

    @Override
    public List<Chapter> getChaptersByBookId(Long bookId) {
        return bookCacheService.getBookChapters(bookId, () -> chapterMapper.selectByBookIdOrderByOrderNum(bookId));
    }

    @Override
    public Chapter getChapterById(Long bookId, Long chapterId) {
        return chapterCacheService.getChapterById(bookId, chapterId, () -> chapterMapper.selectById(chapterId));
    }

    @Override
    public List<Book> searchBooks(String keyword) {
        return bookCacheService.getSearchResults(keyword, () -> bookMapper.searchBooks(keyword));
    }
}
