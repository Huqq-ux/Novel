package com.novel.interaction.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.dto.BookListItemRequest;
import com.novel.common.dto.BookListRequest;
import com.novel.common.entity.BookList;
import com.novel.common.entity.BookListItem;
import com.novel.common.security.CurrentUser;
import com.novel.interaction.service.BookListService;
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

    @GetMapping
    public ApiResponse<List<BookList>> getPublicLists(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return ApiResponse.success(bookListService.getPublicLists(page, size, sort));
    }

    @GetMapping("/my")
    public ApiResponse<List<BookList>> getMyLists(
            @CurrentUser(required = false) Long userId) {
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
            @CurrentUser Long userId,
            @jakarta.validation.Valid @RequestBody BookListRequest request) {
        if (userId == null) return ApiResponse.error(401, "请先登录");
        return ApiResponse.success(bookListService.createList(userId, request.getTitle(),
                request.getDescription(), request.getCover(), request.getIsPublic()));
    }

    @PutMapping("/{id}")
    public ApiResponse<BookList> updateList(
            @CurrentUser Long userId,
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody BookListRequest request) {
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
            @CurrentUser Long userId,
            @PathVariable Long id) {
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
            @CurrentUser Long userId,
            @PathVariable Long id,
            @jakarta.validation.Valid @RequestBody BookListItemRequest request) {
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            return ApiResponse.success(bookListService.addItem(userId, id, request.getBookId()));
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/{listId}/items/{itemId}")
    public ApiResponse<Void> removeItem(
            @CurrentUser Long userId,
            @PathVariable Long listId,
            @PathVariable Long itemId) {
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            bookListService.removeItem(userId, listId, itemId);
            return ApiResponse.success(null);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
}
