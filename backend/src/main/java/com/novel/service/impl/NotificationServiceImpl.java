package com.novel.service.impl;

import com.novel.entity.Notification;
import com.novel.mapper.NotificationMapper;
import com.novel.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationMapper notificationMapper;

    @Override
    public List<Notification> getByUserId(Long userId, int limit, int offset) {
        return notificationMapper.selectByUserId(userId, limit, offset);
    }

    @Override
    public int countUnread(Long userId) {
        return notificationMapper.countUnreadByUserId(userId);
    }

    @Override
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationMapper.selectById(notificationId);
        if (notification == null || !notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("通知不存在");
        }
        notification.setIsRead(1);
        notificationMapper.updateById(notification);
    }

    @Override
    public void markAllAsRead(Long userId) {
        notificationMapper.markAllAsRead(userId);
    }

    @Override
    public void createNotification(Long userId, String title, String content, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType(type);
        notification.setIsRead(0);
        notification.setCreateTime(LocalDateTime.now());
        notificationMapper.insert(notification);
    }
}
