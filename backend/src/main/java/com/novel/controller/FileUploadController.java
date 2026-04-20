package com.novel.controller;

import com.novel.dto.ApiResponse;
import com.novel.service.FileUploadService;
import com.novel.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/upload")
public class FileUploadController {

    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${server.port:8080}")
    private String serverPort;

    @PostMapping("/cover")
    public ApiResponse<Map<String, Object>> uploadBookCover(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file) {
        
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        try {
            String fileUrl = fileUploadService.uploadBookCover(file);
            String fullUrl = getBaseUrl(request) + fileUrl;

            Map<String, Object> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("fullUrl", fullUrl);
            result.put("filename", file.getOriginalFilename());
            result.put("size", file.getSize());

            logger.info("User {} uploaded book cover: {}", userId, fileUrl);
            return ApiResponse.success(result);
        } catch (IOException e) {
            logger.error("Failed to upload book cover: {}", e.getMessage());
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during file upload: {}", e.getMessage());
            return ApiResponse.error(500, "文件上传失败");
        }
    }

    @PostMapping("/avatar")
    public ApiResponse<Map<String, Object>> uploadAvatar(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file) {
        
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        try {
            String fileUrl = fileUploadService.uploadUserAvatar(file);
            String fullUrl = getBaseUrl(request) + fileUrl;

            Map<String, Object> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("fullUrl", fullUrl);
            result.put("filename", file.getOriginalFilename());
            result.put("size", file.getSize());

            logger.info("User {} uploaded avatar: {}", userId, fileUrl);
            return ApiResponse.success(result);
        } catch (IOException e) {
            logger.error("Failed to upload avatar: {}", e.getMessage());
            return ApiResponse.error(400, e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error during avatar upload: {}", e.getMessage());
            return ApiResponse.error(500, "头像上传失败");
        }
    }

    @DeleteMapping
    public ApiResponse<String> deleteFile(
            HttpServletRequest request,
            @RequestParam String url) {
        
        Long userId = getCurrentUserId(request);
        if (userId == null) {
            return ApiResponse.error(401, "请先登录");
        }

        boolean deleted = fileUploadService.deleteFile(url);
        if (deleted) {
            logger.info("User {} deleted file: {}", userId, url);
            return ApiResponse.success("文件删除成功");
        } else {
            return ApiResponse.error(400, "文件删除失败或文件不存在");
        }
    }

    @GetMapping("/validate")
    public ApiResponse<Map<String, Object>> validateImageUrl(@RequestParam String url) {
        boolean valid = fileUploadService.isValidImageUrl(url);
        
        Map<String, Object> result = new HashMap<>();
        result.put("valid", valid);
        result.put("url", url);
        
        return ApiResponse.success(result);
    }

    private Long getCurrentUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        try {
            if (!jwtUtil.validateToken(token)) {
                return null;
            }
            return jwtUtil.getUserIdFromToken(token);
        } catch (Exception e) {
            return null;
        }
    }

    private String getBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int port = request.getServerPort();
        
        StringBuilder baseUrl = new StringBuilder();
        baseUrl.append(scheme).append("://").append(serverName);
        
        if ((scheme.equals("http") && port != 80) || (scheme.equals("https") && port != 443)) {
            baseUrl.append(":").append(port);
        }
        
        return baseUrl.toString();
    }
}
