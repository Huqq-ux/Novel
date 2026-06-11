package com.novel.book.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.book.service.BookService;
import com.novel.common.dto.ApiResponse;
import com.novel.common.entity.Book;
import com.novel.common.entity.Chapter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping
    public ApiResponse<Page<Book>> getAllBooks(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Boolean isFinished,
            @RequestParam(required = false) Integer priceType) {
        Page<Book> result = bookService.getAllBooksPage(page, size, category, sort, isFinished, priceType);
        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<Book> getBookById(@PathVariable Long id) {
        Book book = bookService.getBookById(id);
        if (book == null) {
            return ApiResponse.error(404, "书籍不存在");
        }
        return ApiResponse.success(book);
    }

    @GetMapping("/{id}/chapters")
    public ApiResponse<List<Chapter>> getChaptersByBookId(@PathVariable Long id) {
        List<Chapter> chapters = bookService.getChaptersByBookId(id);
        return ApiResponse.success(chapters);
    }

    @GetMapping("/{bookId}/chapters/{chapterId}")
    public ApiResponse<Chapter> getChapterById(@PathVariable Long bookId, @PathVariable Long chapterId) {
        Chapter chapter = bookService.getChapterById(bookId, chapterId);
        if (chapter == null) {
            return ApiResponse.error(404, "章节不存在");
        }
        return ApiResponse.success(chapter);
    }

    @GetMapping("/search")
    public ApiResponse<List<Book>> searchBooks(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ApiResponse.success(java.util.Collections.emptyList());
        }
        List<Book> books = bookService.searchBooks(keyword.trim());
        return ApiResponse.success(books);
    }
}
