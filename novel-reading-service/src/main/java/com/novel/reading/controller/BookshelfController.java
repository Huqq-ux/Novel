package com.novel.reading.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.entity.Bookshelf;
import com.novel.common.security.CurrentUser;
import com.novel.reading.dto.BookshelfRequest;
import com.novel.reading.service.BookshelfService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/bookshelf")
public class BookshelfController {

    private static final Logger logger = LoggerFactory.getLogger(BookshelfController.class);

    @Autowired
    private BookshelfService bookshelfService;

    @GetMapping
    public ApiResponse<List<Bookshelf>> getBookshelf(@CurrentUser(required = false) Long userId) {
        if (userId == null) {
            return ApiResponse.success(Collections.emptyList());
        }
        List<Bookshelf> bookshelf = bookshelfService.getBookshelf(userId);
        return ApiResponse.success(bookshelf);
    }

    @PostMapping("/add")
    public ApiResponse<Void> addToBookshelf(
            @CurrentUser Long userId,
            @jakarta.validation.Valid @RequestBody BookshelfRequest request) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            boolean added = bookshelfService.addToBookshelf(userId, request.getBookId());
            if (added) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(400, "该书籍已在书架中");
            }
        } catch (RuntimeException e) {
            logger.error("Failed to add book to bookshelf: userId={}, bookId={}", userId, request.getBookId(), e);
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @DeleteMapping("/{bookId}")
    public ApiResponse<Void> removeFromBookshelf(
            @CurrentUser Long userId,
            @PathVariable Long bookId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        bookshelfService.removeFromBookshelf(userId, bookId);
        return ApiResponse.success(null);
    }

    @PutMapping("/progress")
    public ApiResponse<Void> updateProgress(
            @CurrentUser Long userId,
            @jakarta.validation.Valid @RequestBody BookshelfRequest request) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        bookshelfService.updateProgress(userId, request.getBookId(), request.getChapterId());
        return ApiResponse.success(null);
    }
}
