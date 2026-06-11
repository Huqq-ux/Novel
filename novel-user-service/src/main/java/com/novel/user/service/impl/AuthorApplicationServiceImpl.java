package com.novel.user.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.novel.common.dto.AuthorApplicationDTO;
import com.novel.common.dto.AuthorApplicationRequest;
import com.novel.common.entity.AuthorApplication;
import com.novel.common.entity.AuthorAuditRecord;
import com.novel.common.entity.Notification;
import com.novel.common.entity.User;
import com.novel.user.mapper.AuthorApplicationMapper;
import com.novel.user.mapper.AuthorAuditRecordMapper;
import com.novel.user.mapper.NotificationMapper;
import com.novel.user.mapper.UserMapper;
import com.novel.user.service.AuthorApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class AuthorApplicationServiceImpl implements AuthorApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthorApplicationServiceImpl.class);

    @Autowired
    private AuthorApplicationMapper applicationMapper;

    @Autowired
    private AuthorAuditRecordMapper auditRecordMapper;

    @Autowired
    private NotificationMapper notificationMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public AuthorApplication getLatestApplication(Long userId) {
        return applicationMapper.selectLatestByUserId(userId);
    }

    @Override
    public List<AuthorApplicationDTO> getPendingApplications() {
        List<AuthorApplication> applications = applicationMapper.selectByStatus(AuthorApplication.STATUS_PENDING);
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<AuthorApplicationDTO> getAllApplications() {
        List<AuthorApplication> applications = applicationMapper.selectList(null);
        return applications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public AuthorApplicationDTO getApplicationDetail(Long id) {
        AuthorApplication application = applicationMapper.selectById(id);
        if (application == null) {
            return null;
        }
        AuthorApplicationDTO dto = convertToDTO(application);

        List<AuthorAuditRecord> records = auditRecordMapper.selectByApplicationId(id);
        if (!records.isEmpty()) {
            AuthorAuditRecord latestRecord = records.get(0);
            dto.setAuditComment(latestRecord.getComment());
            if (latestRecord.getAuditorId() != null) {
                User auditor = userMapper.selectById(latestRecord.getAuditorId());
                if (auditor != null) {
                    dto.setAuditorName(auditor.getUsername());
                }
            }
        }

        return dto;
    }

    @Override
    @Transactional
    public boolean submitApplication(Long userId, AuthorApplicationRequest request) {
        if (hasPendingApplication(userId)) {
            logger.warn("User already has pending application: userId={}", userId);
            return false;
        }

        AuthorApplication application = new AuthorApplication();
        application.setUserId(userId);
        application.setRealName(request.getRealName());
        application.setPhone(request.getPhone());
        application.setEmail(request.getEmail());
        application.setPenName(request.getPenName());
        application.setSpecialty(request.getSpecialty());
        application.setIntroduction(request.getIntroduction());
        application.setStatus(AuthorApplication.STATUS_PENDING);
        application.setVerified(0);
        application.setCreateTime(LocalDateTime.now());

        try {
            application.setWorkSamples(objectMapper.writeValueAsString(request.getWorkSamples()));
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize work samples", e);
            application.setWorkSamples("[]");
        }

        int inserted = applicationMapper.insert(application);
        if (inserted > 0) {
            logger.info("Author application submitted: userId={}, applicationId={}", userId, application.getId());
            return true;
        }
        return false;
    }

    @Override
    public String sendVerifyCode(Long userId, String email) {
        AuthorApplication application = applicationMapper.selectLatestByUserId(userId);
        if (application == null) {
            application = new AuthorApplication();
            application.setUserId(userId);
            application.setEmail(email);
            application.setStatus(AuthorApplication.STATUS_DRAFT);
            application.setVerified(0);
            application.setCreateTime(LocalDateTime.now());
            applicationMapper.insert(application);
        }

        String code = generateVerifyCode();
        application.setVerifyCode(code);
        application.setVerifyExpired(LocalDateTime.now().plusMinutes(10));
        application.setEmail(email);

        int updated = applicationMapper.updateById(application);
        if (updated > 0) {
            logger.info("Verify code generated: userId={}, email={}, code={}", userId, email, code);
            return code;
        }
        return null;
    }

    @Override
    public boolean verifyEmail(Long userId, String code) {
        AuthorApplication application = applicationMapper.selectLatestByUserId(userId);
        if (application == null) {
            return false;
        }

        if (application.getVerifyCode() == null || !application.getVerifyCode().equals(code)) {
            return false;
        }

        if (application.getVerifyExpired() == null || application.getVerifyExpired().isBefore(LocalDateTime.now())) {
            return false;
        }

        application.setVerified(1);
        application.setVerifyCode(null);
        application.setVerifyExpired(null);

        int updated = applicationMapper.updateById(application);
        return updated > 0;
    }

    @Override
    @Transactional
    public boolean approveApplication(Long applicationId, Long auditorId, String comment) {
        AuthorApplication application = applicationMapper.selectById(applicationId);
        if (application == null || application.getStatus() != AuthorApplication.STATUS_PENDING) {
            return false;
        }

        application.setStatus(AuthorApplication.STATUS_APPROVED);
        application.setUpdateTime(LocalDateTime.now());
        applicationMapper.updateById(application);

        AuthorAuditRecord record = new AuthorAuditRecord();
        record.setApplicationId(applicationId);
        record.setAuditorId(auditorId);
        record.setAction(AuthorAuditRecord.ACTION_APPROVE);
        record.setComment(comment);
        record.setCreateTime(LocalDateTime.now());
        auditRecordMapper.insert(record);

        User user = userMapper.selectById(application.getUserId());
        if (user != null) {
            user.setIsAuthor(1);
            user.setAuthorLevel(0);
            user.setPenName(application.getPenName() != null ? application.getPenName() : user.getUsername());
            user.setAuthorApplyTime(LocalDateTime.now());
            userMapper.updateById(user);
        }

        sendNotification(application.getUserId(), "作者申请已通过",
            "恭喜您！您的作者申请已通过审核，现在可以开始发布作品了。");

        logger.info("Author application approved: applicationId={}, userId={}", applicationId, application.getUserId());
        return true;
    }

    @Override
    @Transactional
    public boolean rejectApplication(Long applicationId, Long auditorId, String comment) {
        AuthorApplication application = applicationMapper.selectById(applicationId);
        if (application == null || application.getStatus() != AuthorApplication.STATUS_PENDING) {
            return false;
        }

        application.setStatus(AuthorApplication.STATUS_REJECTED);
        application.setUpdateTime(LocalDateTime.now());
        applicationMapper.updateById(application);

        AuthorAuditRecord record = new AuthorAuditRecord();
        record.setApplicationId(applicationId);
        record.setAuditorId(auditorId);
        record.setAction(AuthorAuditRecord.ACTION_REJECT);
        record.setComment(comment);
        record.setCreateTime(LocalDateTime.now());
        auditRecordMapper.insert(record);

        sendNotification(application.getUserId(), "作者申请未通过",
            "很抱歉，您的作者申请未通过审核。原因：" + (comment != null ? comment : "无"));

        logger.info("Author application rejected: applicationId={}, userId={}", applicationId, application.getUserId());
        return true;
    }

    @Override
    public boolean hasPendingApplication(Long userId) {
        return applicationMapper.countPendingByUserId(userId) > 0;
    }

    @Override
    public boolean isAuthor(Long userId) {
        User user = userMapper.selectById(userId);
        return user != null && user.getIsAuthor() != null && user.getIsAuthor() == 1;
    }

    private AuthorApplicationDTO convertToDTO(AuthorApplication application) {
        AuthorApplicationDTO dto = new AuthorApplicationDTO();
        dto.setId(application.getId());
        dto.setUserId(application.getUserId());
        dto.setRealName(application.getRealName());
        dto.setPhone(application.getPhone());
        dto.setEmail(application.getEmail());
        dto.setPenName(application.getPenName());
        dto.setSpecialty(application.getSpecialty());
        dto.setIntroduction(application.getIntroduction());
        dto.setStatus(application.getStatus());
        dto.setVerified(application.getVerified());

        if (application.getCreateTime() != null) {
            dto.setCreateTime(application.getCreateTime().toString());
        }
        if (application.getUpdateTime() != null) {
            dto.setUpdateTime(application.getUpdateTime().toString());
        }

        try {
            if (application.getWorkSamples() != null) {
                dto.setWorkSamples(objectMapper.readValue(application.getWorkSamples(), new TypeReference<List<String>>() {}));
            }
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse work samples", e);
        }

        User user = userMapper.selectById(application.getUserId());
        if (user != null) {
            dto.setUsername(user.getUsername());
        }

        return dto;
    }

    private String generateVerifyCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            code.append(random.nextInt(10));
        }
        return code.toString();
    }

    private void sendNotification(Long userId, String title, String content) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType(Notification.TYPE_AUTHOR);
        notification.setIsRead(0);
        notification.setCreateTime(LocalDateTime.now());
        notificationMapper.insert(notification);
    }
}
