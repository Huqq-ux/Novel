package com.novel.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.dto.ApiResponse;
import com.novel.entity.Book;
import com.novel.entity.User;
import com.novel.service.AdminService;
import com.novel.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/users")
    public ApiResponse<Map<String, Object>> getUsers(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer status) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        Page<User> userPage = adminService.getUsers(page, pageSize, keyword, role, status);

        List<Map<String, Object>> users = userPage.getRecords().stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("email", user.getEmail());
            map.put("avatar", user.getAvatar());
            map.put("role", user.getRole() != null ? user.getRole() : "user");
            map.put("isAuthor", user.getIsAuthor());
            map.put("status", user.getStatus());
            map.put("coinBalance", user.getCoinBalance() != null ? user.getCoinBalance() : 0);
            map.put("createTime", user.getRegisterTime());
            map.put("lastLoginTime", user.getLastLoginTime());
            return map;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("list", users);
        result.put("total", userPage.getTotal());
        result.put("page", page);
        result.put("pageSize", pageSize);

        return ApiResponse.success(result);
    }

    @PostMapping("/users/{id}/status")
    public ApiResponse<String> updateUserStatus(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        try {
            String msg = adminService.updateUserStatus(id, body.get("status"));
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/users/{id}/role")
    public ApiResponse<String> updateUserRole(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        try {
            String msg = adminService.updateUserRole(id, body.get("role"));
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }
        return ApiResponse.success(adminService.getStats());
    }

    @GetMapping("/books")
    public ApiResponse<Map<String, Object>> getBooks(
            HttpServletRequest request,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Integer priceType) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        Page<Book> bookPage = adminService.getBooks(page, pageSize, keyword, category, status, priceType);

        List<Map<String, Object>> books = bookPage.getRecords().stream().map(book -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", book.getId());
            map.put("title", book.getTitle());
            map.put("author", book.getAuthor());
            map.put("cover", book.getCover());
            map.put("category", book.getCategory());
            map.put("status", book.getStatus() != null ? book.getStatus() : 1);
            map.put("priceType", book.getPriceType() != null ? book.getPriceType() : 0);
            map.put("freeChapterCount", book.getFreeChapterCount() != null ? book.getFreeChapterCount() : 0);
            map.put("totalWords", book.getTotalWords() != null ? book.getTotalWords() : 0);
            map.put("description", book.getDescription());
            map.put("wordCount", 0);
            map.put("chapterCount", book.getChapterCount());
            map.put("clickCount", book.getClickCount());
            map.put("readCount", book.getClickCount());
            map.put("collectCount", book.getCollectCount());
            map.put("createTime", book.getCreateTime());
            map.put("updateTime", book.getUpdateTime());
            return map;
        }).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("list", books);
        result.put("total", bookPage.getTotal());
        result.put("page", page);
        result.put("pageSize", pageSize);

        return ApiResponse.success(result);
    }

    @PostMapping("/books/paid")
    public ApiResponse<Map<String, Object>> addPaidBook(
            HttpServletRequest request,
            @RequestBody Map<String, Object> body) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        try {
            Map<String, Object> result = adminService.addPaidBook(body);
            return ApiResponse.success(result);
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/books/paid/{id}")
    public ApiResponse<String> updatePaidBook(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        try {
            String msg = adminService.updatePaidBook(id, body);
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/books/{id}/status")
    public ApiResponse<String> updateBookStatus(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        try {
            String msg = adminService.updateBookStatus(id, body.get("status"));
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        }
    }

    @DeleteMapping("/books/{id}")
    public ApiResponse<String> deleteBook(
            HttpServletRequest request,
            @PathVariable Long id) {

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限访问");
        }

        try {
            String msg = adminService.deleteBook(id);
            return ApiResponse.success(msg);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        }
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
