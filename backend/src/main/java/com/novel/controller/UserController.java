package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.UserDTO;
import com.novel.entity.User;
import com.novel.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 * 
 * 提供用户个人信息相关的API接口，包括获取当前登录用户信息等。
 * 所有接口均需要用户认证，通过Spring Security进行权限控制。
 * 
 * 设计考量：
 * 1. 用户信息从SecurityContext获取，确保数据来源安全
 * 2. 返回DTO而非实体，过滤敏感信息
 * 3. 配合JWT认证机制，实现无状态用户信息获取
 */
@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 获取当前登录用户信息
     * 
     * 功能描述：
     * 获取当前已认证用户的详细信息，包括基本信息、统计数据等。
     * 
     * 实现逻辑：
     * 1. 从Spring Security上下文获取当前认证信息
     * 2. 验证用户是否已认证
     * 3. 根据用户名查询用户完整信息
     * 4. 转换为DTO并返回
     * 
     * 设计考量：
     * - 使用SecurityContext获取用户身份，避免前端传递用户ID
     * - 防止用户越权访问他人信息
     * - 用户信息可能被缓存，需注意缓存一致性
     * - 未认证返回401，用户不存在返回404
     * 
     * @return ApiResponse<UserDTO> 用户信息DTO，包含非敏感字段
     */
    @GetMapping("/info")
    public ApiResponse<UserDTO> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return ApiResponse.error(401, "用户未认证");
        }
        
        String username = authentication.getName();
        User user = userService.getUserByUsername(username);
        if (user == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        
        UserDTO userDTO = new UserDTO(
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
        return ApiResponse.success(userDTO);
    }
}
