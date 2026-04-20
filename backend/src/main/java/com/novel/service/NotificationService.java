package com.novel.service;

import com.novel.entity.Notification;

import java.util.List;

public interface NotificationService {
    List<Notification> getByUserId(Long userId, int limit, int offset);
    int countUnread(Long userId);
    void markAsRead(Long userId, Long notificationId);
    void markAllAsRead(Long userId);
    void createNotification(Long userId, String title, String content, String type);
}
