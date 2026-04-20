package com.novel.service;

import com.novel.dto.AuthorApplicationDTO;
import com.novel.dto.AuthorApplicationRequest;
import com.novel.entity.AuthorApplication;

import java.util.List;

public interface AuthorApplicationService {
    AuthorApplication getLatestApplication(Long userId);
    List<AuthorApplicationDTO> getPendingApplications();
    List<AuthorApplicationDTO> getAllApplications();
    AuthorApplicationDTO getApplicationDetail(Long id);
    boolean submitApplication(Long userId, AuthorApplicationRequest request);
    String sendVerifyCode(Long userId, String email);
    boolean verifyEmail(Long userId, String code);
    boolean approveApplication(Long applicationId, Long auditorId, String comment);
    boolean rejectApplication(Long applicationId, Long auditorId, String comment);
    boolean hasPendingApplication(Long userId);
    boolean isAuthor(Long userId);
}
