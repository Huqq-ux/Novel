package com.novel.service;

import com.novel.entity.AuditLog;

import java.util.List;

public interface AuditLogService {
    void log(Long userId, String username, String action, String resource, String ipAddress, String userAgent, String requestMethod, String requestUrl, String status);
    void logLogin(Long userId, String username, String ipAddress, String userAgent, String status);
    void logLogout(Long userId, String username, String ipAddress);
    void logRegister(Long userId, String username, String ipAddress, String status);
    List<AuditLog> findByUserId(Long userId);
    void cleanOldLogs();
}
