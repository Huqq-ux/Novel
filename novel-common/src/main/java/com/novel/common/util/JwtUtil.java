package com.novel.common.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

/**
 * JWT令牌工具类
 * 
 * 提供JWT令牌的生成、解析和验证功能。
 * 使用HMAC-SHA算法签名令牌。
 * 
 * 设计考量：
 * 1. 令牌包含用户名、用户ID和角色信息
 * 2. 令牌过期时间可配置，默认1小时
 * 3. 密钥使用Base64编码，支持任意长度
 * 4. 开发环境提供默认密钥，生产环境必须配置
 */
@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:3600000}")
    private Long expiration;

    /**
     * 初始化JWT工具类
     * 
     * 功能描述：
     * 检查密钥配置，未配置则使用开发默认密钥。
     * 
     * 设计考量：
     * - 开发环境提供默认密钥便于快速启动
     * - 生产环境必须配置独立密钥
     * - 记录警告日志提醒开发者
     */
    @PostConstruct
    public void init() {
        if (secret == null || secret.isEmpty()) {
            logger.error("JWT secret is not configured! Set the 'jwt.secret' property. Using default development key is insecure.");
            secret = "ZGVmYXVsdERldmVsb3BtZW50U2VjcmV0S2V5Rm9ySldUVG9rZW5HZW5lcmF0aW9uRG9Ob3RVc2VJblByb2R1Y3Rpb24=";
        }
        try {
            byte[] keyBytes = Base64.getDecoder().decode(secret);
            if (keyBytes.length < 32) {
                logger.error("JWT secret key is too short ({} bytes). Minimum 32 bytes required for HS256.", keyBytes.length);
            }
        } catch (IllegalArgumentException e) {
            logger.error("JWT secret is not valid Base64: {}", e.getMessage());
        }
        logger.info("JwtUtil initialized successfully");
    }

    /**
     * 获取签名密钥
     * 
     * 功能描述：
     * 将Base64编码的密钥字符串转换为HMAC签名密钥。
     * 
     * 设计考量：
     * - 使用Base64解码支持任意字符
     * - HMAC-SHA密钥长度影响安全性
     * 
     * @return SecretKey HMAC签名密钥
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * 生成JWT令牌（仅用户名）
     * 
     * 功能描述：
     * 根据用户名生成JWT令牌，包含基本声明。
     * 
     * 实现逻辑：
     * 1. 设置主题为用户名
     * 2. 设置签发时间为当前时间
     * 3. 设置过期时间
     * 4. 使用密钥签名
     * 
     * @param username 用户名
     * @return String JWT令牌字符串
     */
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * 生成JWT令牌（包含用户信息）
     * 
     * 功能描述：
     * 根据用户信息生成JWT令牌，包含用户ID和角色。
     * 
     * 实现逻辑：
     * 1. 设置主题为用户名
     * 2. 添加用户ID和角色声明
     * 3. 设置签发时间和过期时间
     * 4. 使用密钥签名
     * 
     * 设计考量：
     * - 令牌包含用户ID避免频繁查询数据库
     * - 角色信息用于权限控制
     * - 过期时间可配置
     * 
     * @param username 用户名
     * @param userId   用户ID
     * @param role     用户角色
     * @return String JWT令牌字符串
     */
    public String generateToken(String username, Long userId, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(username)
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * 从令牌中提取用户名
     * 
     * 功能描述：
     * 解析JWT令牌，获取主题（用户名）。
     * 
     * 设计考量：
     * - 主题字段存储用户名
     * - 解析失败抛出异常
     * 
     * @param token JWT令牌
     * @return String 用户名
     */
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    /**
     * 从令牌中提取用户ID
     * 
     * 功能描述：
     * 解析JWT令牌，获取用户ID声明。
     * 
     * 设计考量：
     * - 处理Integer和Long两种类型
     * - 未找到返回null
     * 
     * @param token JWT令牌
     * @return Long 用户ID，不存在返回null
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Object userId = claims.get("userId");
        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        } else if (userId instanceof Long) {
            return (Long) userId;
        }
        return null;
    }

    /**
     * 从令牌中提取角色
     * 
     * 功能描述：
     * 解析JWT令牌，获取角色声明。
     * 
     * 设计考量：
     * - 未找到角色返回默认值"user"
     * 
     * @param token JWT令牌
     * @return String 用户角色
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        Object role = claims.get("role");
        return role != null ? role.toString() : "user";
    }

    /**
     * 获取令牌过期时间配置
     * 
     * 功能描述：
     * 返回配置的令牌过期时间（毫秒）。
     * 
     * @return Long 过期时间（毫秒）
     */
    public Long getExpiration() {
        return expiration;
    }

    /**
     * 验证令牌有效性
     * 
     * 功能描述：
     * 验证JWT令牌签名和过期时间。
     * 
     * 实现逻辑：
     * 1. 使用密钥解析令牌
     * 2. 解析成功表示签名有效
     * 3. 自动检查过期时间
     * 
     * 设计考量：
     * - 验证失败记录警告日志
     * - 不抛出异常，返回boolean便于业务处理
     * - 包含签名验证和过期检查
     * 
     * @param token JWT令牌
     * @return boolean 有效返回true，无效返回false
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                    .parseClaimsJws(token);
            logger.debug("JWT token validated successfully");
            return true;
        } catch (Exception e) {
            logger.warn("JWT token validation failed: {}", e.getMessage());
            return false;
        }
    }
}
