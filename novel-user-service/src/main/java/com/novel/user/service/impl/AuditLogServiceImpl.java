package com.novel.user.service.impl;

import com.novel.common.entity.AuditLog;
import com.novel.user.mapper.AuditLogMapper;
import com.novel.user.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    @Autowired
    private AuditLogMapper auditLogMapper;

    @Override
    public void log(Long userId, String username, String action, String resource, String ipAddress, String userAgent, String requestMethod, String requestUrl, String status) {
        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(userId);
        auditLog.setUsername(username);
        auditLog.setAction(action);
        auditLog.setResource(resource);
        auditLog.setIpAddress(ipAddress);
        auditLog.setUserAgent(userAgent);
        auditLog.setRequestMethod(requestMethod);
        auditLog.setRequestUrl(requestUrl);
        auditLog.setStatus(status);
        auditLog.setCreatedAt(LocalDateTime.now());
        auditLogMapper.insert(auditLog);
    }

    @Override
    public void logLogin(Long userId, String username, String ipAddress, String userAgent, String status) {
        log(userId, username, "LOGIN", "auth/login", ipAddress, userAgent, "POST", "/auth/login", status);
    }

    @Override
    public void logLogout(Long userId, String username, String ipAddress) {
        log(userId, username, "LOGOUT", "auth/logout", ipAddress, null, "POST", "/auth/logout", "SUCCESS");
    }

    @Override
    public void logRegister(Long userId, String username, String ipAddress, String status) {
        log(userId, username, "REGISTER", "auth/register", ipAddress, null, "POST", "/auth/register", status);
    }

    @Override
    public List<AuditLog> findByUserId(Long userId) {
        return auditLogMapper.findByUserId(userId);
    }

    @Override
    @Scheduled(cron = "0 0 4 * * ?")
    public void cleanOldLogs() {
        LocalDateTime threeMonthsAgo = LocalDateTime.now().minusMonths(3);
        auditLogMapper.deleteOldLogs(threeMonthsAgo);
    }
}
