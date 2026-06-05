package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.BookListItemRequest;
import com.novel.dto.BookListRequest;
import com.novel.entity.BookList;
import com.novel.entity.BookListItem;
import com.novel.entity.User;
import com.novel.service.BookListService;
import com.novel.service.UserService;
import com.novel.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/book-lists")
public class BookListController {

    private static final Logger logger = LoggerFactory.getLogger(BookListController.class);

    @Autowired
    private BookListService bookListService;
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
            return null;
        }
    }

    @GetMapping
    public ApiResponse<List<BookList>> getPublicLists(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return ApiResponse.success(bookListService.getPublicLists(page, size, sort));
    }

    @GetMapping("/my")
    public ApiResponse<List<BookList>> getMyLists(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.success(Collections.emptyList());
        return ApiResponse.success(bookListService.getMyLists(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookList> getList(@PathVariable Long id) {
        BookList list = bookListService.getList(id);
        if (list == null) return ApiResponse.error(404, "书单不存在");
        return ApiResponse.success(list);
    }

    @GetMapping("/{id}/items")
    public ApiResponse<List<BookListItem>> getItems(@PathVariable Long id) {
        return ApiResponse.success(bookListService.getItems(id));
    }

    @PostMapping
    public ApiResponse<BookList> createList(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @jakarta.validation.Valid @RequestBody BookListRequest request) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        return ApiResponse.success(bookListService.createList(userId, request.getTitle(),
                request.getDescription(), request.getCover(), request.getIsPublic()));
    }

    @PutMapping("/{id}")
    public ApiResponse<BookList> updateList(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody BookListRequest request) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            return ApiResponse.success(bookListService.updateList(userId, id, request.getTitle(),
                    request.getDescription(), request.getCover(), request.getIsPublic()));
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteList(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            bookListService.deleteList(userId, id);
            return ApiResponse.success(null);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/items")
    public ApiResponse<BookListItem> addItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody BookListItemRequest request) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            return ApiResponse.success(bookListService.addItem(userId, id, request.getBookId()));
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/{listId}/items/{itemId}")
    public ApiResponse<Void> removeItem(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long listId,
            @PathVariable Long itemId) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            bookListService.removeItem(userId, listId, itemId);
            return ApiResponse.success(null);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
