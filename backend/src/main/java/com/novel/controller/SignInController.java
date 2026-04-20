package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.SignInStatusDTO;
import com.novel.entity.User;
import com.novel.service.SignInService;
import com.novel.service.UserService;
import com.novel.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 签到控制器
 * 
 * 处理用户每日签到相关的所有操作，包括签到状态查询和执行签到。
 * 签到系统采用连续签到奖励机制，鼓励用户每日活跃。
 * 
 * 设计考量：
 * 1. 签到记录持久化存储，支持历史查询
 * 2. 连续签到奖励递增，中断后重新计算
 * 3. 防重复签到：同一天只能签到一次
 * 4. 书币奖励实时到账，同步更新用户余额
 */
@RestController
@RequestMapping("/signin")
public class SignInController {

    private static final Logger logger = LoggerFactory.getLogger(SignInController.class);

    @Autowired
    private SignInService signInService;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 从Authorization头解析当前用户ID
     * 
     * 功能描述：
     * 解析JWT Token获取当前登录用户的唯一标识。
     * 
     * 实现逻辑：
     * 1. 校验Authorization头格式（Bearer Token）
     * 2. 提取并验证JWT Token有效性
     * 3. 根据用户名查询用户ID
     * 
     * 设计考量：
     * - 封装Token解析逻辑，避免代码重复
     * - 异常情况返回null，由调用方处理
     * - Token验证失败不抛出异常，保持接口友好
     * 
     * @param authHeader Authorization请求头，格式：Bearer {token}
     * @return Long 用户ID，解析失败返回null
     */
    private Long getCurrentUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        
        try {
            String username = jwtUtil.getUsernameFromToken(token);
            
            boolean isValid = jwtUtil.validateToken(token);
            
            if (!isValid) {
                return null;
            }
            
            User user = userService.getUserByUsername(username);
            if (user == null) {
                return null;
            }
            
            return user.getId();
        } catch (Exception e) {
            logger.error("Error processing token");
            return null;
        }
    }

    /**
     * 获取签到状态
     * 
     * 功能描述：
     * 查询当前用户的签到状态，包括今日是否已签到、连续签到天数、本月签到记录等。
     * 
     * 实现逻辑：
     * 1. 验证用户登录状态
     * 2. 查询用户签到记录
     * 3. 计算连续签到天数和本月签到情况
     * 4. 返回签到状态DTO
     * 
     * 设计考量：
     * - 返回完整的签到信息，减少前端多次请求
     * - 连续签到天数从最近一次签到开始计算
     * - 本月签到记录用于日历展示
     * 
     * @param authHeader Authorization请求头
     * @return ApiResponse<SignInStatusDTO> 签到状态信息
     */
    @GetMapping("/status")
    public ApiResponse<SignInStatusDTO> getSignInStatus(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getCurrentUserIdFromToken(authHeader);
        
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

    /**
     * 执行签到
     * 
     * 功能描述：
     * 为当前用户执行每日签到操作，发放签到奖励。
     * 
     * 实现逻辑：
     * 1. 验证用户登录状态
     * 2. 检查今日是否已签到（防止重复签到）
     * 3. 记录签到数据并计算奖励
     * 4. 发放书币奖励到用户账户
     * 5. 返回更新后的签到状态
     * 
     * 设计考量：
     * - 使用数据库唯一索引防止并发重复签到
     * - 签到奖励根据连续签到天数递增
     * - 签到成功后刷新用户缓存中的书币余额
     * - 返回最新状态，便于前端更新UI
     * 
     * @param authHeader Authorization请求头
     * @return ApiResponse<SignInStatusDTO> 签到后的状态信息
     */
    @PostMapping("/do")
    public ApiResponse<SignInStatusDTO> signIn(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getCurrentUserIdFromToken(authHeader);
        
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
