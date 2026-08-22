package com.dayflow.security;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Rate Limiting Interceptor - Prevents brute force attacks
 * 
 * Implements simple IP-based rate limiting:
 * - 10 requests per minute for /api/auth/login
 * - 5 requests per minute for /api/auth/register
 * - Logging suspicious activity
 */
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private static final long RATE_LIMIT_WINDOW = 60_000; // 1 minute
    private static final int LOGIN_LIMIT = 10;
    private static final int REGISTER_LIMIT = 5;

    // Track requests per IP: ip -> queue of timestamps
    private final ConcurrentHashMap<String, ConcurrentLinkedQueue<Long>> requestCounts = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String endpoint = request.getRequestURI();
        
        // Only apply rate limiting to auth endpoints
        if (!endpoint.startsWith("/api/auth/")) {
            return true;
        }

        String clientIp = getClientIp(request);
        int limit = endpoint.contains("login") ? LOGIN_LIMIT : 
                   endpoint.contains("register") ? REGISTER_LIMIT : 
                   Integer.MAX_VALUE;

        if (!isAllowed(clientIp, limit)) {
            response.setStatus(429); // SC_TOO_MANY_REQUESTS
            response.setContentType("application/json");
            response.getWriter().write("{\"message\": \"Too many requests. Please try again in a minute.\"}");
            return false;
        }

        return true;
    }

    private boolean isAllowed(String clientIp, int limit) {
        long now = System.currentTimeMillis();
        ConcurrentLinkedQueue<Long> timestamps = requestCounts.computeIfAbsent(clientIp, k -> new ConcurrentLinkedQueue<>());

        // Remove old requests outside the rate limit window
        timestamps.removeIf(timestamp -> now - timestamp > RATE_LIMIT_WINDOW);

        // Check if limit exceeded
        if (timestamps.size() >= limit) {
            return false;
        }

        // Add current request
        timestamps.add(now);
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip.split(",")[0].trim();
    }
}
