package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.TipRequest;
import com.novel.entity.Tip;
import com.novel.entity.User;
import com.novel.service.TipService;
import com.novel.service.UserService;
import com.novel.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/tips")
public class TipController {

    private static final Logger logger = LoggerFactory.getLogger(TipController.class);

    @Autowired
    private TipService tipService;
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

    @PostMapping
    public ApiResponse<Tip> createTip(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @jakarta.validation.Valid @RequestBody TipRequest request) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.error(401, "请先登录");
        try {
            Tip tip = tipService.createTip(userId, request.getAuthorId(), request.getBookId(),
                    request.getChapterId(), request.getAmount(), request.getMessage());
            return ApiResponse.success(tip);
        } catch (RuntimeException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/book/{bookId}")
    public ApiResponse<List<Tip>> getBookTips(@PathVariable Long bookId) {
        return ApiResponse.success(tipService.getBookTips(bookId));
    }

    @GetMapping("/received")
    public ApiResponse<List<Tip>> getReceivedTips(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getCurrentUserId(authHeader);
        if (userId == null) return ApiResponse.success(Collections.emptyList());
        return ApiResponse.success(tipService.getReceivedTips(userId));
    }
}
