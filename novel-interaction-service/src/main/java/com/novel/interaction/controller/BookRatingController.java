package com.novel.interaction.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.dto.RatingStats;
import com.novel.common.entity.BookRating;
import com.novel.common.security.CurrentUser;
import com.novel.interaction.service.BookRatingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/ratings")
public class BookRatingController {

    @Autowired
    private BookRatingService bookRatingService;

    @PostMapping("/{bookId}")
    public ApiResponse<Map<String, Object>> submitRating(
            @CurrentUser Long userId,
            @PathVariable Long bookId,
            @RequestBody Map<String, Integer> body) {

        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        Integer rating = body.get("rating");
        if (rating == null || rating < 1 || rating > 5) {
            return ApiResponse.error(400, "评分必须在1-5之间");
        }

        try {
            BookRating bookRating = bookRatingService.submitRating(bookId, userId, rating);
            RatingStats stats = bookRatingService.getBookRatingStats(bookId);

            Map<String, Object> result = new HashMap<>();
            result.put("rating", bookRating);
            result.put("stats", stats);

            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("评分提交失败: " + e.getMessage());
        }
    }

    @GetMapping("/{bookId}/user")
    public ApiResponse<Map<String, Object>> getUserRating(
            @CurrentUser(required = false) Long userId,
            @PathVariable Long bookId) {

        Map<String, Object> result = new HashMap<>();
        result.put("isLoggedIn", userId != null);

        if (userId != null) {
            BookRating rating = bookRatingService.getUserRating(bookId, userId);
            result.put("rating", rating);
        }

        return ApiResponse.success(result);
    }

    @GetMapping("/{bookId}/stats")
    public ApiResponse<RatingStats> getBookRatingStats(@PathVariable Long bookId) {
        RatingStats stats = bookRatingService.getBookRatingStats(bookId);
        return ApiResponse.success(stats);
    }

    @DeleteMapping("/{bookId}")
    public ApiResponse<String> deleteRating(
            @CurrentUser Long userId,
            @PathVariable Long bookId) {

        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        boolean deleted = bookRatingService.deleteRating(bookId, userId);
        if (deleted) {
            return ApiResponse.success("评分已删除");
        }
        return ApiResponse.error("删除失败");
    }
}
