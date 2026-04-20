package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.RatingStats;
import com.novel.entity.BookRating;
import com.novel.service.BookRatingService;
import com.novel.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 书籍评分控制器
 */
@RestController
@RequestMapping("/ratings")
public class BookRatingController {

    @Autowired
    private BookRatingService bookRatingService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 提交或更新评分
     */
    @PostMapping("/{bookId}")
    public ApiResponse<Map<String, Object>> submitRating(
            HttpServletRequest request,
            @PathVariable Long bookId,
            @RequestBody Map<String, Integer> body) {
        
        Long userId = getUserIdFromRequest(request);
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

    /**
     * 获取用户对书籍的评分
     */
    @GetMapping("/{bookId}/user")
    public ApiResponse<Map<String, Object>> getUserRating(
            HttpServletRequest request,
            @PathVariable Long bookId) {
        
        Long userId = getUserIdFromRequest(request);
        
        Map<String, Object> result = new HashMap<>();
        result.put("isLoggedIn", userId != null);
        
        if (userId != null) {
            BookRating rating = bookRatingService.getUserRating(bookId, userId);
            result.put("rating", rating);
        }
        
        return ApiResponse.success(result);
    }

    /**
     * 获取书籍的评分统计
     */
    @GetMapping("/{bookId}/stats")
    public ApiResponse<RatingStats> getBookRatingStats(@PathVariable Long bookId) {
        RatingStats stats = bookRatingService.getBookRatingStats(bookId);
        return ApiResponse.success(stats);
    }

    /**
     * 删除评分
     */
    @DeleteMapping("/{bookId}")
    public ApiResponse<String> deleteRating(
            HttpServletRequest request,
            @PathVariable Long bookId) {
        
        Long userId = getUserIdFromRequest(request);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        boolean deleted = bookRatingService.deleteRating(bookId, userId);
        if (deleted) {
            return ApiResponse.success("评分已删除");
        }
        return ApiResponse.error("删除失败");
    }

    /**
     * 从请求中获取用户ID
     */
    private Long getUserIdFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            try {
                return jwtUtil.getUserIdFromToken(token);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }
}
