package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.service.ImageIntegrityService;
import com.novel.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/images")
public class ImageIntegrityController {

    @Autowired
    private ImageIntegrityService imageIntegrityService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/check/{bookId}")
    public ApiResponse<Map<String, Object>> checkBookCover(
            HttpServletRequest request,
            @PathVariable Long bookId) {
        
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        Map<String, Object> result = imageIntegrityService.checkBookCover(bookId);
        return ApiResponse.success(result);
    }

    @GetMapping("/check-all")
    public ApiResponse<Map<String, Object>> checkAllBookCovers(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        Map<String, Object> result = imageIntegrityService.checkAllBookCovers();
        return ApiResponse.success(result);
    }

    @GetMapping("/invalid")
    public ApiResponse<List<Map<String, Object>>> getInvalidBooks(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        List<Map<String, Object>> books = imageIntegrityService.getInvalidBooks();
        return ApiResponse.success(books);
    }

    @PostMapping("/fix")
    public ApiResponse<Map<String, Object>> fixMissingCovers(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        int fixed = imageIntegrityService.fixMissingCovers();
        return ApiResponse.success(Map.of(
            "fixed", fixed,
            "message", "已修复 " + fixed + " 本书籍的封面"
        ));
    }

    @PostMapping("/clear-cache")
    public ApiResponse<String> clearCache(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        imageIntegrityService.clearCache();
        return ApiResponse.success("缓存已清除");
    }

    private boolean isAdmin(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            try {
                String role = jwtUtil.getRoleFromToken(token);
                return "admin".equals(role);
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }
}
