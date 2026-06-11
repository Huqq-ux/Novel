package com.novel.gateway.filter;

import com.novel.common.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Set;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class JwtAuthFilter implements GlobalFilter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
        "/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/error"
    );

    private static final Set<String> PUBLIC_GET_PREFIXES = Set.of(
        "/api/books", "/api/uploads", "/api/ratings",
        "/api/bookmarks", "/api/tips/book", "/api/book-lists", "/api/coin/packages"
    );

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().name();

        if (HttpMethod.OPTIONS.name().equalsIgnoreCase(method)) {
            return chain.filter(exchange);
        }

        if (isPublicPath(path, method)) {
            return processPublicPath(exchange, chain);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try {
            String username = jwtUtil.getUsernameFromToken(token);
            Long userId = jwtUtil.getUserIdFromToken(token);
            String role = jwtUtil.getRoleFromToken(token);

            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", String.valueOf(userId))
                .header("X-User-Role", role)
                .header("X-Username", username)
                .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        } catch (ExpiredJwtException e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublicPath(String path, String method) {
        if (PUBLIC_PATHS.contains(path)) return true;
        if ("GET".equalsIgnoreCase(method)) {
            for (String prefix : PUBLIC_GET_PREFIXES) {
                if (path.startsWith(prefix)) return true;
            }
        }
        return false;
    }

    private Mono<Void> processPublicPath(ServerWebExchange exchange, GatewayFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                if (jwtUtil.validateToken(token)) {
                    Long userId = jwtUtil.getUserIdFromToken(token);
                    String role = jwtUtil.getRoleFromToken(token);
                    String username = jwtUtil.getUsernameFromToken(token);
                    ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                        .header("X-User-Id", String.valueOf(userId))
                        .header("X-User-Role", role)
                        .header("X-Username", username)
                        .build();
                    return chain.filter(exchange.mutate().request(modifiedRequest).build());
                }
            } catch (Exception ignored) {}
        }
        return chain.filter(exchange);
    }
}
