package com.novel.reading.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.entity.Bookmark;
import com.novel.common.security.CurrentUser;
import com.novel.reading.dto.BookmarkRequest;
import com.novel.reading.service.BookmarkService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookmarks")
public class BookmarkController {

    @Autowired
    private BookmarkService bookmarkService;

    @GetMapping
    public ApiResponse<List<Bookmark>> getBookmarks(
            @CurrentUser(required = false) Long userId,
            @RequestParam Long bookId) {
        if (userId == null) return ApiResponse.success(Collections.emptyList());
        return ApiResponse.success(bookmarkService.getBookmarks(userId, bookId));
    }

    @GetMapping("/check")
    public ApiResponse<Map<String, Boolean>> checkBookmark(
            @CurrentUser(required = false) Long userId,
            @RequestParam Long bookId,
            @RequestParam Long chapterId) {
        Map<String, Boolean> result = new HashMap<>();
        if (userId == null) {
            result.put("bookmarked", false);
        } else {
            result.put("bookmarked", bookmarkService.isBookmarked(userId, bookId, chapterId));
        }
        return ApiResponse.success(result);
    }

    @PostMapping
    public ApiResponse<Bookmark> addBookmark(
            @CurrentUser Long userId,
            @jakarta.validation.Valid @RequestBody BookmarkRequest request) {
        if (userId == null) return ApiResponse.error(401, "请先登录");
        Bookmark bookmark = bookmarkService.addBookmark(userId, request.getBookId(), request.getChapterId(),
                request.getChapterTitle(), request.getPosition(), request.getNote());
        if (bookmark == null) return ApiResponse.error(400, "该章节已添加书签");
        return ApiResponse.success(bookmark);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBookmark(
            @CurrentUser Long userId,
            @PathVariable Long id) {
        if (userId == null) return ApiResponse.error(401, "请先登录");
        bookmarkService.deleteBookmark(userId, id);
        return ApiResponse.success(null);
    }
}
