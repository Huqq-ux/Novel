package com.novel.security;

import com.novel.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/auth/login", "/auth/register", "/auth/refresh", "/error"
    );

    private static final Set<String> PUBLIC_PREFIXES = Set.of(
            "/books", "/uploads", "/ratings", "/actuator"
    );

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            chain.doFilter(request, response);
            return;
        }

        if (isPublicPath(path, method)) {
            trySetAuthenticationFromToken(request);
            chain.doFilter(request, response);
            return;
        }

        final String requestTokenHeader = request.getHeader("Authorization");

        if (requestTokenHeader == null || !requestTokenHeader.startsWith("Bearer ")) {
            logger.warn("No valid Authorization header for protected path: {}", path);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            return;
        }

        String jwtToken = requestTokenHeader.substring(7);
        String username = null;

        try {
            username = jwtUtil.getUsernameFromToken(jwtToken);
        } catch (ExpiredJwtException e) {
            logger.warn("JWT Token has expired");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token expired");
            return;
        } catch (Exception e) {
            logger.warn("JWT Token parsing failed: {}", e.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            boolean isValid = jwtUtil.validateToken(jwtToken);
            if (isValid) {
                Long userId = jwtUtil.getUserIdFromToken(jwtToken);
                String role = jwtUtil.getRoleFromToken(jwtToken);
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                logger.debug("Authentication set for user: {} with role: {}", username, role);
            } else {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isPublicPath(String path, String method) {
        if (PUBLIC_PATHS.contains(path)) {
            return true;
        }
        if ("GET".equalsIgnoreCase(method)) {
            for (String prefix : PUBLIC_PREFIXES) {
                if (path.startsWith(prefix)) {
                    return true;
                }
            }
            if (path.startsWith("/coin/packages")) {
                return true;
            }
        }
        return false;
    }

    private void trySetAuthenticationFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        try {
            String jwtToken = authHeader.substring(7);
            if (jwtUtil.validateToken(jwtToken)) {
                String username = jwtUtil.getUsernameFromToken(jwtToken);
                String role = jwtUtil.getRoleFromToken(jwtToken);
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            logger.debug("Optional token parsing failed for public path, continuing as anonymous");
        }
    }
}
