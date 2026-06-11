package com.novel.user.controller;

import com.novel.common.dto.*;
import com.novel.common.entity.RefreshToken;
import com.novel.common.entity.User;
import com.novel.common.util.IpUtil;
import com.novel.common.util.JwtUtil;
import com.novel.user.service.AuditLogService;
import com.novel.user.service.RefreshTokenService;
import com.novel.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private AuditLogService auditLogService;

    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String ipAddress = IpUtil.getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        User user = userService.login(request.getUsername(), request.getPassword());
        if (user == null) {
            auditLogService.logLogin(null, request.getUsername(), ipAddress, userAgent, "FAILED");
            return ApiResponse.error(401, "用户名或密码错误");
        }

        String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole() != null ? user.getRole() : "user");
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        auditLogService.logLogin(user.getId(), user.getUsername(), ipAddress, userAgent, "SUCCESS");

        TokenResponse tokenResponse = new TokenResponse(
            accessToken,
            refreshToken.getToken(),
            jwtUtil.getExpiration(),
            convertToDTO(user)
        );

        return ApiResponse.success(tokenResponse);
    }

    @PostMapping("/register")
    public ApiResponse<TokenResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String ipAddress = IpUtil.getClientIpAddress(httpRequest);

        try {
            User user = userService.register(
                    request.getUsername(),
                    request.getPassword(),
                    request.getEmail()
            );

            String accessToken = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole() != null ? user.getRole() : "user");
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            auditLogService.logRegister(user.getId(), user.getUsername(), ipAddress, "SUCCESS");

            TokenResponse tokenResponse = new TokenResponse(
                accessToken,
                refreshToken.getToken(),
                jwtUtil.getExpiration(),
                convertToDTO(user)
            );

            return ApiResponse.success(tokenResponse);
        } catch (RuntimeException e) {
            auditLogService.logRegister(null, request.getUsername(), ipAddress, "FAILED");
            return ApiResponse.error(400, e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
            .map(refreshToken -> {
                if (!refreshTokenService.validateToken(refreshToken)) {
                    return ApiResponse.<TokenResponse>error(401, "刷新令牌已过期，请重新登录");
                }

                User user = userService.getUserById(refreshToken.getUserId());
                if (user == null) {
                    return ApiResponse.<TokenResponse>error(404, "用户不存在");
                }

                String newAccessToken = jwtUtil.generateToken(user.getUsername(), user.getId(), user.getRole() != null ? user.getRole() : "user");
                RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());

                TokenResponse tokenResponse = new TokenResponse(
                    newAccessToken,
                    newRefreshToken.getToken(),
                    jwtUtil.getExpiration(),
                    convertToDTO(user)
                );

                return ApiResponse.success(tokenResponse);
            })
            .orElse(ApiResponse.error(401, "无效的刷新令牌"));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) Long userIdHeader,
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = IpUtil.getClientIpAddress(httpRequest);

        if (request != null && request.getRefreshToken() != null) {
            refreshTokenService.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    refreshTokenService.revokeByUserId(token.getUserId());
                });
        }

        // Prefer X-User-Id header from gateway, fall back to parsing Authorization header
        if (userIdHeader != null) {
            refreshTokenService.revokeByUserId(userIdHeader);
            User user = userService.getUserById(userIdHeader);
            if (user != null) {
                auditLogService.logLogout(user.getId(), user.getUsername(), ipAddress);
            }
        } else if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtUtil.getUsernameFromToken(token);
                User user = userService.getUserByUsername(username);
                if (user != null) {
                    refreshTokenService.revokeByUserId(user.getId());
                    auditLogService.logLogout(user.getId(), user.getUsername(), ipAddress);
                }
            } catch (Exception e) {
                // Token parsing failed, ignore
            }
        }

        return ApiResponse.success(null);
    }

    private UserDTO convertToDTO(User user) {
        return new UserDTO(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getAvatar(),
            user.getGender(),
            user.getAge(),
            user.getRegisterTime(),
            user.getLastLoginTime(),
            user.getStatus(),
            user.getRole() != null ? user.getRole() : "user",
            user.getIsAuthor() != null ? user.getIsAuthor() : 0,
            user.getPenName(),
            user.getCoinBalance() != null ? user.getCoinBalance() : 0
        );
    }
}
