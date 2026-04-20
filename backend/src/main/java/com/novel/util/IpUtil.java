package com.novel.util;

import jakarta.servlet.http.HttpServletRequest;

/**
 * IP地址工具类
 * 
 * 提供从HTTP请求中获取客户端真实IP地址的功能。
 * 支持通过代理服务器转发的请求。
 * 
 * 设计考量：
 * 1. 检查多种代理头，适配不同代理服务器
 * 2. 处理多IP情况（X-Forwarded-For可能包含多个IP）
 * 3. 兜底使用RemoteAddr
 */
public class IpUtil {

    /**
     * 可能包含客户端IP的HTTP头列表
     * 
     * 按优先级排列，优先检查常用的代理头。
     */
    private static final String[] IP_HEADER_CANDIDATES = {
        "X-Forwarded-For",
        "Proxy-Client-IP",
        "WL-Proxy-Client-IP",
        "HTTP_X_FORWARDED_FOR",
        "HTTP_X_FORWARDED",
        "HTTP_X_CLUSTER_CLIENT_IP",
        "HTTP_CLIENT_IP",
        "HTTP_FORWARDED_FOR",
        "HTTP_FORWARDED",
        "HTTP_VIA",
        "REMOTE_ADDR"
    };

    /**
     * 获取客户端真实IP地址
     * 
     * 功能描述：
     * 从HTTP请求中提取客户端的真实IP地址。
     * 
     * 实现逻辑：
     * 1. 按优先级遍历可能包含IP的请求头
     * 2. 找到有效IP则返回
     * 3. 处理多IP情况（取第一个）
     * 4. 所有头都无效则使用RemoteAddr
     * 
     * 设计考量：
     * - X-Forwarded-For最常用，优先检查
     * - 多IP时取第一个（原始客户端IP）
     * - 过滤"unknown"等无效值
     * - 兜底使用request.getRemoteAddr()
     * 
     * @param request HTTP请求对象
     * @return String 客户端IP地址
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        for (String header : IP_HEADER_CANDIDATES) {
            String ip = request.getHeader(header);
            if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
                if (ip.contains(",")) {
                    ip = ip.split(",")[0];
                }
                return ip.trim();
            }
        }
        return request.getRemoteAddr();
    }
}
