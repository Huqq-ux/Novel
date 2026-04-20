package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.dto.BookshelfRequest;
import com.novel.entity.Bookshelf;
import com.novel.entity.User;
import com.novel.service.BookshelfService;
import com.novel.service.UserService;
import com.novel.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * 书架控制器
 * 
 * 管理用户个人书架的所有操作，包括添加书籍、移除书籍、更新阅读进度等。
 * 书架数据与用户绑定，支持跨设备同步阅读进度。
 * 
 * 设计考量：
 * 1. 书架数据按用户隔离，确保数据安全
 * 2. 阅读进度实时更新，支持断点续读
 * 3. 重复添加书籍自动忽略，避免数据冗余
 * 4. 书架列表按最近阅读时间排序
 */
@RestController
@RequestMapping("/bookshelf")
public class BookshelfController {

    private static final Logger logger = LoggerFactory.getLogger(BookshelfController.class);

    @Autowired
    private BookshelfService bookshelfService;

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
     * 获取用户书架列表
     * 
     * 功能描述：
     * 获取当前用户书架中的所有书籍，包含书籍基本信息和阅读进度。
     * 
     * 实现逻辑：
     * 1. 验证用户登录状态
     * 2. 查询用户书架数据
     * 3. 关联查询书籍详细信息
     * 4. 按最近阅读时间倒序排列
     * 
     * 设计考量：
     * - 未登录用户返回空列表而非错误，提升用户体验
     * - 书架数据包含阅读进度百分比，便于前端展示
     * - 使用LEFT JOIN关联书籍信息，避免N+1查询
     * 
     * @param authHeader Authorization请求头
     * @return ApiResponse<List<Bookshelf>> 书架列表，未登录返回空列表
     */
    @GetMapping
    public ApiResponse<List<Bookshelf>> getBookshelf(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Long userId = getCurrentUserIdFromToken(authHeader);
        if (userId == null) {
            return ApiResponse.success(Collections.emptyList());
        }
        List<Bookshelf> bookshelf = bookshelfService.getBookshelf(userId);
        return ApiResponse.success(bookshelf);
    }

    /**
     * 添加书籍到书架
     * 
     * 功能描述：
     * 将指定书籍添加到当前用户的书架中。
     * 
     * 实现逻辑：
     * 1. 验证用户登录状态
     * 2. 检查书籍是否已在书架中
     * 3. 创建书架记录并关联书籍
     * 
     * 设计考量：
     * - 重复添加返回友好提示而非错误
     * - 使用数据库唯一索引防止并发重复添加
     * - 添加成功后自动更新最近阅读时间
     * - 书籍ID有效性校验在Service层完成
     * 
     * @param authHeader Authorization请求头
     * @param request    书架请求体，包含bookId
     * @return ApiResponse<Void> 添加成功返回null，已存在返回400错误
     */
    @PostMapping("/add")
    public ApiResponse<Void> addToBookshelf(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @jakarta.validation.Valid @RequestBody BookshelfRequest request) {
        Long userId = getCurrentUserIdFromToken(authHeader);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        try {
            boolean added = bookshelfService.addToBookshelf(userId, request.getBookId());
            if (added) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(400, "该书籍已在书架中");
            }
        } catch (RuntimeException e) {
            logger.error("Failed to add book to bookshelf: userId={}, bookId={}", userId, request.getBookId(), e);
            return ApiResponse.error(500, e.getMessage());
        }
    }

    /**
     * 从书架移除书籍
     * 
     * 功能描述：
     * 从当前用户书架中移除指定书籍。
     * 
     * 实现逻辑：
     * 1. 验证用户登录状态
     * 2. 删除用户与书籍的书架关联记录
     * 3. 阅读进度数据同步删除
     * 
     * 设计考量：
     * - 移除操作幂等，不存在的记录静默处理
     * - 删除书架记录不影响书籍本身
     * - 不校验书籍是否存在，直接删除关联记录
     * 
     * @param authHeader Authorization请求头
     * @param bookId     要移除的书籍ID
     * @return ApiResponse<Void> 移除成功返回null
     */
    @DeleteMapping("/{bookId}")
    public ApiResponse<Void> removeFromBookshelf(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long bookId) {
        Long userId = getCurrentUserIdFromToken(authHeader);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        bookshelfService.removeFromBookshelf(userId, bookId);
        return ApiResponse.success(null);
    }

    /**
     * 更新阅读进度
     * 
     * 功能描述：
     * 更新用户在指定书籍中的阅读进度，支持断点续读。
     * 
     * 实现逻辑：
     * 1. 验证用户登录状态
     * 2. 更新书架记录中的当前章节ID
     * 3. 更新最近阅读时间
     * 4. 计算并更新阅读进度百分比
     * 
     * 设计考量：
     * - 进度更新频率较高，考虑使用异步处理
     * - 章节ID用于断点续读，跳转到上次阅读位置
     * - 最近阅读时间用于书架排序
     * - 进度百分比 = 当前章节序号 / 总章节数
     * 
     * @param authHeader Authorization请求头
     * @param request    进度更新请求，包含bookId和chapterId
     * @return ApiResponse<Void> 更新成功返回null
     */
    @PutMapping("/progress")
    public ApiResponse<Void> updateProgress(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @jakarta.validation.Valid @RequestBody BookshelfRequest request) {
        Long userId = getCurrentUserIdFromToken(authHeader);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }
        bookshelfService.updateProgress(userId, request.getBookId(), request.getChapterId());
        return ApiResponse.success(null);
    }
}
