package com.novel.interaction.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.dto.TipRequest;
import com.novel.common.entity.Tip;
import com.novel.common.security.CurrentUser;
import com.novel.interaction.service.TipService;
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

    @PostMapping
    public ApiResponse<Tip> createTip(
            @CurrentUser Long userId,
            @jakarta.validation.Valid @RequestBody TipRequest request) {
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
            @CurrentUser(required = false) Long userId) {
        if (userId == null) return ApiResponse.success(Collections.emptyList());
        return ApiResponse.success(tipService.getReceivedTips(userId));
    }
}
