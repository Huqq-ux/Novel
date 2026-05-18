package com.novel.controller;

import com.novel.dto.*;
import com.novel.entity.RefreshToken;
import com.novel.entity.User;
import com.novel.service.AuditLogService;
import com.novel.service.RefreshTokenService;
import com.novel.service.UserService;
import com.novel.util.IpUtil;
import com.novel.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 
 * 处理用户身份认证相关的所有操作，包括登录、注册、令牌刷新和登出。
 * 采用JWT（JSON Web Token）进行无状态身份验证，配合Refresh Token机制实现长期登录。
 * 
 * 设计考量：
 * 1. JWT无状态认证：服务端无需存储会话信息，便于水平扩展
 * 2. 双Token机制：Access Token短期有效（1小时），Refresh Token长期有效（7天）
 * 3. 安全审计：所有登录行为记录审计日志，便于安全分析
 * 4. IP追踪：记录用户登录IP，支持异常登录检测
 */
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

    /**
     * 用户登录
     * 
     * 功能描述：
     * 验证用户凭证并颁发访问令牌，支持用户名/密码登录方式。
     * 
     * 实现逻辑：
     * 1. 获取客户端IP和User-Agent用于审计
     * 2. 调用UserService验证用户名和密码
     * 3. 验证成功：生成JWT Access Token和Refresh Token
     * 4. 验证失败：记录失败日志，返回401错误
     * 5. 记录登录审计日志（成功/失败）
     * 
     * 设计考量：
     * - 密码验证使用BCrypt加密，防止明文存储
     * - 登录失败不区分"用户不存在"和"密码错误"，防止用户名枚举攻击
     * - 返回完整用户信息，减少前端额外请求
     * - 刷新令牌存储于数据库，支持主动撤销
     * 
     * @param request    登录请求体，包含username和password
     * @param httpRequest HTTP请求对象，用于获取客户端信息
     * @return ApiResponse<TokenResponse> 包含Access Token、Refresh Token和用户信息
     */
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

    /**
     * 用户注册
     * 
     * 功能描述：
     * 创建新用户账户并自动登录，返回认证令牌。
     * 
     * 实现逻辑：
     * 1. 获取客户端IP用于审计
     * 2. 调用UserService创建用户（包含用户名/邮箱唯一性校验）
     * 3. 创建成功：生成JWT令牌并返回
     * 4. 创建失败：记录失败日志，返回错误信息
     * 
     * 设计考量：
     * - 注册成功后自动登录，提升用户体验
     * - 使用@Valid注解进行参数校验，确保数据完整性
     * - 密码强度校验通过自定义注解@PasswordStrength实现
     * - 用户名和邮箱的唯一性检查在Service层完成
     * - 默认角色为"user"，管理员需后台手动分配
     * 
     * @param request    注册请求体，包含username、password、email
     * @param httpRequest HTTP请求对象，用于获取客户端IP
     * @return ApiResponse<TokenResponse> 包含认证令牌和用户信息
     */
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

    /**
     * 刷新访问令牌
     * 
     * 功能描述：
     * 使用Refresh Token获取新的Access Token，实现无感刷新登录状态。
     * 
     * 实现逻辑：
     * 1. 验证Refresh Token是否存在且有效
     * 2. 检查Token是否过期
     * 3. 获取关联的用户信息
     * 4. 生成新的Access Token和Refresh Token（旧Token自动失效）
     * 
     * 设计考量：
     * - 每次刷新生成新的Refresh Token，实现"一次一密"
     * - 旧Token自动失效，防止Token重放攻击
     * - Refresh Token存储于数据库，支持主动撤销（如异地登录检测）
     * - Token过期返回401，前端应跳转登录页
     * 
     * @param request 刷新令牌请求体，包含refreshToken
     * @return ApiResponse<TokenResponse> 新的Access Token和Refresh Token
     */
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

    /**
     * 用户登出
     * 
     * 功能描述：
     * 撤销用户的Refresh Token，使当前会话失效。
     * 
     * 实现逻辑：
     * 1. 从请求体获取Refresh Token并撤销
     * 2. 从Authorization头解析Access Token获取用户信息
     * 3. 撤销该用户的所有Refresh Token
     * 4. 记录登出审计日志
     * 
     * 设计考量：
     * - JWT Access Token无法主动失效（无状态特性），但可通过短期有效期限制
     * - 撤销Refresh Token可阻止用户继续刷新Token
     * - 支持仅传Refresh Token或仅传Access Token两种登出方式
     * - Token解析失败静默处理，不影响登出流程
     * 
     * @param authHeader  Authorization请求头，格式：Bearer {token}
     * @param request     登出请求体，可选，包含refreshToken
     * @param httpRequest HTTP请求对象，用于获取客户端IP
     * @return ApiResponse<Void> 登出成功返回null
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = IpUtil.getClientIpAddress(httpRequest);
        
        if (request != null && request.getRefreshToken() != null) {
            refreshTokenService.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    refreshTokenService.revokeByUserId(token.getUserId());
                });
        }
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtUtil.getUsernameFromToken(token);
                User user = userService.getUserByUsername(username);
                if (user != null) {
                    refreshTokenService.revokeByUserId(user.getId());
                    auditLogService.logLogout(user.getId(), user.getUsername(), ipAddress);
                }
            } catch (Exception e) {
                // Token解析失败，忽略
            }
        }
        
        return ApiResponse.success(null);
    }

    /**
     * 用户实体转DTO
     * 
     * 功能描述：
     * 将User实体对象转换为UserDTO数据传输对象，过滤敏感信息。
     * 
     * 实现逻辑：
     * 1. 提取User实体中的非敏感字段
     * 2. 处理可能为null的字段（role、coinBalance）
     * 3. 构造并返回UserDTO对象
     * 
     * 设计考量：
     * - 不返回密码等敏感信息
     * - 使用DTO模式解耦内部实体与外部接口
     * - null值使用默认值替代，避免前端空指针
     * 
     * @param user 用户实体对象
     * @return UserDTO 用户数据传输对象
     */
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
