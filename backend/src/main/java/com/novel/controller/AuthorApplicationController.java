package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.AuthorApplicationDTO;
import com.novel.dto.AuthorApplicationRequest;
import com.novel.entity.AuthorApplication;
import com.novel.security.CurrentUser;
import com.novel.service.AuthorApplicationService;
import com.novel.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/author")
public class AuthorApplicationController {

    @Autowired
    private AuthorApplicationService applicationService;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getAuthorStatus(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("isAuthor", applicationService.isAuthor(userId));
        data.put("hasPendingApplication", applicationService.hasPendingApplication(userId));

        AuthorApplication latestApplication = applicationService.getLatestApplication(userId);
        if (latestApplication != null) {
            data.put("latestApplication", convertToSimpleDTO(latestApplication));
        }

        return ApiResponse.success(data);
    }

    @PostMapping("/apply")
    public ApiResponse<String> submitApplication(@CurrentUser Long userId, @RequestBody AuthorApplicationRequest applicationRequest) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }

        if (applicationService.isAuthor(userId)) {
            return ApiResponse.error(400, "您已经是作者了");
        }

        if (applicationService.hasPendingApplication(userId)) {
            return ApiResponse.error(400, "您已有待审核的申请");
        }

        boolean success = applicationService.submitApplication(userId, applicationRequest);
        if (success) {
            return ApiResponse.success("申请提交成功");
        }
        return ApiResponse.error("申请提交失败");
    }

    @PostMapping("/send-verify-code")
    public ApiResponse<Map<String, String>> sendVerifyCode(@CurrentUser Long userId, @RequestBody Map<String, String> body) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }

        String email = body.get("email");
        if (email == null || email.isEmpty()) {
            return ApiResponse.error(400, "邮箱不能为空");
        }

        String code = applicationService.sendVerifyCode(userId, email);
        if (code != null) {
            Map<String, String> data = new HashMap<>();
            data.put("message", "验证码已发送");
            return ApiResponse.success(data);
        }
        return ApiResponse.error("发送验证码失败");
    }

    @PostMapping("/verify-email")
    public ApiResponse<String> verifyEmail(@CurrentUser Long userId, @RequestBody Map<String, String> body) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }

        String code = body.get("code");
        if (code == null || code.isEmpty()) {
            return ApiResponse.error(400, "验证码不能为空");
        }

        boolean success = applicationService.verifyEmail(userId, code);
        if (success) {
            return ApiResponse.success("邮箱验证成功");
        }
        return ApiResponse.error("验证码无效或已过期");
    }

    @GetMapping("/application")
    public ApiResponse<AuthorApplicationDTO> getMyApplication(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "未登录");
        }

        AuthorApplication application = applicationService.getLatestApplication(userId);
        if (application == null) {
            return ApiResponse.error(404, "未找到申请记录");
        }

        return ApiResponse.success(applicationService.getApplicationDetail(application.getId()));
    }

    @GetMapping("/admin/applications")
    public ApiResponse<List<AuthorApplicationDTO>> getAllApplications(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限");
        }

        return ApiResponse.success(applicationService.getAllApplications());
    }

    @GetMapping("/admin/applications/pending")
    public ApiResponse<List<AuthorApplicationDTO>> getPendingApplications(HttpServletRequest request) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限");
        }

        return ApiResponse.success(applicationService.getPendingApplications());
    }

    @GetMapping("/admin/applications/{id}")
    public ApiResponse<AuthorApplicationDTO> getApplicationDetail(HttpServletRequest request, @PathVariable Long id) {
        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限");
        }

        AuthorApplicationDTO dto = applicationService.getApplicationDetail(id);
        if (dto == null) {
            return ApiResponse.error(404, "申请不存在");
        }
        return ApiResponse.success(dto);
    }

    @PostMapping("/admin/applications/{id}/approve")
    public ApiResponse<String> approveApplication(@CurrentUser Long auditorId, HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, String> body) {
        if (auditorId == null) {
            return ApiResponse.error(401, "未登录");
        }

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限");
        }

        String comment = body.get("comment");
        boolean success = applicationService.approveApplication(id, auditorId, comment);
        if (success) {
            return ApiResponse.success("审核通过");
        }
        return ApiResponse.error("操作失败");
    }

    @PostMapping("/admin/applications/{id}/reject")
    public ApiResponse<String> rejectApplication(@CurrentUser Long auditorId, HttpServletRequest request, @PathVariable Long id, @RequestBody Map<String, String> body) {
        if (auditorId == null) {
            return ApiResponse.error(401, "未登录");
        }

        if (!isAdmin(request)) {
            return ApiResponse.error(403, "无权限");
        }

        String comment = body.get("comment");
        boolean success = applicationService.rejectApplication(id, auditorId, comment);
        if (success) {
            return ApiResponse.success("已拒绝申请");
        }
        return ApiResponse.error("操作失败");
    }

    private boolean isAdmin(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
            try {
                String role = jwtUtil.getRoleFromToken(token);
                return "admin".equals(role);
            } catch (Exception e) {
                return false;
            }
        }
        return false;
    }

    private Map<String, Object> convertToSimpleDTO(AuthorApplication application) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", application.getId());
        dto.put("status", application.getStatus());
        dto.put("createTime", application.getCreateTime());
        return dto;
    }
}
