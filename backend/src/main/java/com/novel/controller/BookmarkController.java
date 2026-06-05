package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.BookmarkRequest;
import com.novel.entity.Bookmark;
import com.novel.entity.User;
import com.novel.service.BookmarkService;
import com.novel.service.UserService;
import com.novel.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookmarks")
public class BookmarkController {

    private static final Logger logger = LoggerFactory.getLogger(BookmarkController.class);

    @Autowired
    private BookmarkService bookmarkService;
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtil jwtUtil;

    private Long getCurrentUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            String token = authHeader.substring(7);
            String username = jwtUtil.getUsernameFromToken(token);
            if (!jwtUtil.validateToken(token)) return null;
            User user = userService.getUserByUsername(username);
            return user != null ? user.getId() : null;
        } catch (Exception e) {
            logger.error("Token parse error", e);
            return null;
        }
    }

    @GetMapping
    public ApiResponse<List<Bookmark>> getBookmarks(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam Long bookId) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.success(Collections.emptyList());
        return ApiResponse.success(bookmarkService.getBookmarks(userId, bookId));
    }

    @GetMapping("/check")
    public ApiResponse<Map<String, Boolean>> checkBookmark(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam Long bookId,
            @RequestParam Long chapterId) {
        Long userId = getCurrentUserId(authHeader);
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
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @jakarta.validation.Valid @RequestBody BookmarkRequest request) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        Bookmark bookmark = bookmarkService.addBookmark(userId, request.getBookId(), request.getChapterId(),
                request.getChapterTitle(), request.getPosition(), request.getNote());
        if (bookmark == null) return ApiResponse.error(400, "该章节已添加书签");
        return ApiResponse.success(bookmark);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteBookmark(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        bookmarkService.deleteBookmark(userId, id);
        return ApiResponse.success(null);
    }
}
