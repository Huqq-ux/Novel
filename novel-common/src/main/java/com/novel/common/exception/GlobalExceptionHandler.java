package com.novel.common.exception;

import com.novel.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 * 
 * 统一处理Controller层抛出的异常，返回标准化的错误响应。
 * 使用@RestControllerAdvice实现全局异常捕获。
 * 
 * 设计考量：
 * 1. 统一异常响应格式，便于前端处理
 * 2. 区分不同异常类型，返回适当HTTP状态码
 * 3. 记录异常日志，便于问题排查
 * 4. 避免敏感信息泄露到客户端
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理参数验证异常
     * 
     * 功能描述：
     * 处理@Valid注解触发的参数验证失败异常。
     * 
     * 实现逻辑：
     * 1. 提取所有字段验证错误
     * 2. 构建字段名到错误消息的映射
     * 3. 返回400状态码和错误详情
     * 
     * 设计考量：
     * - 返回所有字段错误，避免多次请求
     * - 错误消息来自验证注解，保持一致性
     * - 记录警告日志，便于监控异常输入
     * 
     * @param e 方法参数验证异常
     * @return ResponseEntity<ApiResponse<Map<String, String>>> 包含字段错误的响应
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        logger.warn("Validation failed: {}", errors);
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, "参数验证失败", errors));
    }

    /**
     * 处理通用异常
     * 
     * 功能描述：
     * 处理未被其他处理器捕获的异常，作为兜底处理。
     * 
     * 设计考量：
     * - 返回500状态码，表示服务器内部错误
     * - 不暴露异常详情，避免信息泄露
     * - 记录错误日志，便于排查问题
     * 
     * @param e 异常对象
     * @return ResponseEntity<ApiResponse<Void>> 错误响应
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        logger.error("Unhandled exception: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, "服务器内部错误"));
    }

    /**
     * 处理运行时异常
     * 
     * 功能描述：
     * 处理RuntimeException及其子类异常。
     * 
     * 设计考量：
     * - 运行时异常通常包含业务错误信息
     * - 返回500状态码
     * - 返回异常消息，便于前端提示用户
     * - 记录错误日志
     * 
     * @param e 运行时异常对象
     * @return ResponseEntity<ApiResponse<Void>> 错误响应
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException e) {
        logger.error("Runtime exception: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, e.getMessage()));
    }

    /**
     * 处理非法参数异常
     * 
     * 功能描述：
     * 处理IllegalArgumentException异常，表示参数不合法。
     * 
     * 设计考量：
     * - 返回400状态码，表示客户端错误
     * - 返回异常消息，提示正确的参数格式
     * - 记录错误日志
     * 
     * @param e 非法参数异常对象
     * @return ResponseEntity<ApiResponse<Void>> 错误响应
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        logger.error("Illegal argument: {}", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, e.getMessage()));
    }
}
