package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.entity.Notification;
import com.novel.security.CurrentUser;
import com.novel.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ApiResponse<Map<String, Object>> getNotifications(
            @CurrentUser Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }

        int offset = (page - 1) * pageSize;
        List<Notification> notifications = notificationService.getByUserId(userId, pageSize, offset);
        int unreadCount = notificationService.countUnread(userId);

        Map<String, Object> data = new HashMap<>();
        data.put("list", notifications);
        data.put("unreadCount", unreadCount);
        data.put("page", page);
        data.put("pageSize", pageSize);

        return ApiResponse.success(data);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Integer> getUnreadCount(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }
        int count = notificationService.countUnread(userId);
        return ApiResponse.success(count);
    }

    @PostMapping("/{id}/read")
    public ApiResponse<String> markAsRead(@CurrentUser Long userId, @PathVariable Long id) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }
        try {
            notificationService.markAsRead(userId, id);
            return ApiResponse.success("已标记为已读");
        } catch (IllegalArgumentException e) {
            return ApiResponse.error(404, e.getMessage());
        }
    }

    @PostMapping("/read-all")
    public ApiResponse<String> markAllAsRead(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }
        notificationService.markAllAsRead(userId);
        return ApiResponse.success("已全部标记为已读");
    }
}
