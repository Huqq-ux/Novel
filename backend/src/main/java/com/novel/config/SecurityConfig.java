package com.novel.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security安全配置类
 * 
 * 配置应用的安全策略，包括认证、授权、CORS和CSRF等。
 * 
 * 设计考量：
 * 1. 使用JWT无状态认证，不依赖Session
 * 2. 配置CORS支持前后端分离架构
 * 3. 公开API和受保护API分离配置
 * 4. 使用BCrypt加密用户密码
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private com.novel.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    /**
     * 创建密码编码器Bean
     * 
     * 功能描述：
     * 提供BCrypt密码加密器，用于用户密码加密和验证。
     * 
     * 设计考量：
     * - BCrypt是安全的单向哈希算法
     * - 自动加盐，防止彩虹表攻击
     * - 强度可调，默认强度10
     * 
     * @return PasswordEncoder 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 创建CORS配置源Bean
     * 
     * 功能描述：
     * 配置跨域资源共享策略，允许前端应用访问后端API。
     * 
     * 实现逻辑：
     * 1. 从配置文件读取允许的源
     * 2. 配置允许的HTTP方法
     * 3. 配置允许的请求头
     * 4. 启用凭证支持
     * 
     * 设计考量：
     * - 允许的源从配置文件读取，便于环境切换
     * - 支持凭证传递，用于Cookie和认证头
     * - 预检请求缓存1小时
     * 
     * @return CorsConfigurationSource CORS配置源
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * 创建安全过滤链Bean
     * 
     * 功能描述：
     * 配置HTTP安全策略，定义请求授权规则。
     * 
     * 实现逻辑：
     * 1. 启用CORS配置
     * 2. 禁用CSRF（使用JWT不需要）
     * 3. 配置无状态Session
     * 4. 定义URL访问权限
     * 5. 添加JWT认证过滤器
     * 
     * 设计考量：
     * - 无状态架构，适合分布式部署
     * - 公开API无需认证，提升用户体验
     * - OPTIONS请求放行，支持CORS预检
     * - JWT过滤器在用户名密码过滤器之前执行
     * 
     * @param http HttpSecurity配置对象
     * @return SecurityFilterChain 安全过滤链
     * @throws Exception 配置异常
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers.disable())
            .anonymous(anonymous -> anonymous.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/login", "/auth/register", "/auth/refresh").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/books/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/ratings/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/coin/packages").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
