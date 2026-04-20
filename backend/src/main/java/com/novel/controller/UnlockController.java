package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.security.CurrentUser;
import com.novel.service.UnlockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/unlock")
public class UnlockController {

    @Autowired
    private UnlockService unlockService;

    @GetMapping("/status/{bookId}/{chapterId}")
    public ApiResponse<Map<String, Object>> getUnlockStatus(
            @CurrentUser(required = false) Long userId,
            @PathVariable Long bookId,
            @PathVariable Long chapterId) {
        try {
            Map<String, Object> result = unlockService.getUnlockStatus(userId, bookId, chapterId);
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        }
    }

    @PostMapping("/chapter/{chapterId}")
    public ApiResponse<Map<String, Object>> unlockChapter(
            @CurrentUser Long userId,
            @PathVariable Long chapterId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            Map<String, Object> result = unlockService.unlockChapter(userId, chapterId);
            return ApiResponse.success(result);
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @GetMapping("/list/{bookId}")
    public ApiResponse<List<Long>> getUnlockedChapters(
            @CurrentUser(required = false) Long userId,
            @PathVariable Long bookId) {
        List<Long> chapterIds = unlockService.getUnlockedChapterIds(userId, bookId);
        return ApiResponse.success(chapterIds);
    }
}
