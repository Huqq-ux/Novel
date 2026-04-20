package com.novel.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.dto.ApiResponse;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.security.CurrentUser;
import com.novel.service.AuthorBookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/author/books")
public class AuthorBookController {

    @Autowired
    private AuthorBookService authorBookService;

    @GetMapping
    public ApiResponse<Map<String, Object>> getMyBooks(
            @CurrentUser Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Page<Book> bookPage = authorBookService.getMyBooks(userId, page, pageSize);

            List<Map<String, Object>> books = new ArrayList<>();
            for (Book book : bookPage.getRecords()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", book.getId());
                map.put("title", book.getTitle());
                map.put("cover", book.getCover());
                map.put("category", book.getCategory());
                map.put("status", book.getStatus());
                map.put("priceType", book.getPriceType());
                map.put("chapterCount", book.getChapterCount());
                map.put("totalWords", book.getTotalWords());
                map.put("clickCount", book.getClickCount());
                map.put("collectCount", book.getCollectCount());
                map.put("isFinished", book.getIsFinished());
                map.put("createTime", book.getCreateTime());
                map.put("updateTime", book.getUpdateTime());
                books.add(map);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("list", books);
            result.put("total", bookPage.getTotal());
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(403, e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createBook(
            @CurrentUser Long userId,
            @RequestBody Map<String, Object> body) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Map<String, Object> result = authorBookService.createBook(userId, body);
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PutMapping("/{bookId}")
    public ApiResponse<String> updateBook(
            @CurrentUser Long userId,
            @PathVariable Long bookId,
            @RequestBody Map<String, Object> body) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            String msg = authorBookService.updateBook(userId, bookId, body);
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(403, e.getMessage());
        }
    }

    @GetMapping("/{bookId}/chapters")
    public ApiResponse<Map<String, Object>> getChapters(
            @CurrentUser Long userId,
            @PathVariable Long bookId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Page<Chapter> chapterPage = authorBookService.getChapters(userId, bookId, page, pageSize);

            List<Map<String, Object>> chapters = new ArrayList<>();
            for (Chapter chapter : chapterPage.getRecords()) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", chapter.getId());
                map.put("title", chapter.getTitle());
                map.put("orderNum", chapter.getOrderNum());
                map.put("wordCount", chapter.getWordCount());
                map.put("price", chapter.getPrice());
                map.put("isFree", chapter.getIsFree());
                map.put("createTime", chapter.getCreateTime());
                chapters.add(map);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("list", chapters);
            result.put("total", chapterPage.getTotal());
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(403, e.getMessage());
        }
    }

    @PostMapping("/{bookId}/chapters")
    public ApiResponse<Map<String, Object>> addChapter(
            @CurrentUser Long userId,
            @PathVariable Long bookId,
            @RequestBody Map<String, Object> body) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Map<String, Object> result = authorBookService.addChapter(userId, bookId, body);
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PutMapping("/{bookId}/chapters/{chapterId}")
    public ApiResponse<String> updateChapter(
            @CurrentUser Long userId,
            @PathVariable Long bookId,
            @PathVariable Long chapterId,
            @RequestBody Map<String, Object> body) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            String msg = authorBookService.updateChapter(userId, bookId, chapterId, body);
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @DeleteMapping("/{bookId}/chapters/{chapterId}")
    public ApiResponse<String> deleteChapter(
            @CurrentUser Long userId,
            @PathVariable Long bookId,
            @PathVariable Long chapterId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            String msg = authorBookService.deleteChapter(userId, bookId, chapterId);
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/{bookId}/stats")
    public ApiResponse<Map<String, Object>> getBookStats(
            @CurrentUser Long userId,
            @PathVariable Long bookId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Map<String, Object> stats = authorBookService.getBookStats(userId, bookId);
            return ApiResponse.success(stats);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(403, e.getMessage());
        }
    }
}
