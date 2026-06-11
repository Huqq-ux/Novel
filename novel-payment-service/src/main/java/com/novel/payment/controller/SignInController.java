package com.novel.payment.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.dto.SignInStatusDTO;
import com.novel.common.security.CurrentUser;
import com.novel.payment.service.SignInService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/signin")
public class SignInController {

    private static final Logger logger = LoggerFactory.getLogger(SignInController.class);

    @Autowired
    private SignInService signInService;

    @GetMapping("/status")
    public ApiResponse<SignInStatusDTO> getSignInStatus(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        try {
            SignInStatusDTO status = signInService.getSignInStatus(userId);
            return ApiResponse.success(status);
        } catch (Exception e) {
            logger.error("Error getting sign in status: {}", e.getMessage());
            return ApiResponse.error(500, "获取签到状态失败");
        }
    }

    @PostMapping("/do")
    public ApiResponse<SignInStatusDTO> signIn(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        try {
            boolean success = signInService.signIn(userId);
            if (success) {
                SignInStatusDTO status = signInService.getSignInStatus(userId);
                return ApiResponse.success(status);
            } else {
                return ApiResponse.error(400, "今日已签到");
            }
        } catch (Exception e) {
            logger.error("Error signing in: {}", e.getMessage());
            return ApiResponse.error(500, "签到失败");
        }
    }
}
