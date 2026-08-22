package com.dayflow.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Audit Logger - Logs security and compliance events
 * 
 * Events logged:
 * - Authentication attempts (success/failure)
 * - Authorization denials
 * - Data access patterns
 * - System configuration changes
 * - Suspicious activities
 */
public class AuditLogger {

    private static final Logger auditLogger = LoggerFactory.getLogger("com.dayflow.security.audit");
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * Log successful login
     */
    public static void logLogin(String email, String employeeId, HttpServletRequest request) {
        String message = String.format(
            "LOGIN_SUCCESS | email=%s | employeeId=%s | ip=%s | timestamp=%s",
            sanitize(email),
            sanitize(employeeId),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.info(message);
    }

    /**
     * Log failed login attempt
     */
    public static void logFailedLogin(String email, String reason, HttpServletRequest request) {
        String message = String.format(
            "LOGIN_FAILED | email=%s | reason=%s | ip=%s | timestamp=%s",
            sanitize(email),
            sanitize(reason),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.warn(message);
    }

    /**
     * Log account lockout
     */
    public static void logAccountLockout(String email, int failedAttempts, HttpServletRequest request) {
        String message = String.format(
            "ACCOUNT_LOCKED | email=%s | failedAttempts=%d | ip=%s | timestamp=%s",
            sanitize(email),
            failedAttempts,
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.warn(message);
    }

    /**
     * Log successful logout
     */
    public static void logLogout(String email, HttpServletRequest request) {
        String message = String.format(
            "LOGOUT_SUCCESS | email=%s | ip=%s | timestamp=%s",
            sanitize(email),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.info(message);
    }

    /**
     * Log unauthorized access attempt
     */
    public static void logUnauthorizedAccess(String resource, String reason, HttpServletRequest request) {
        String message = String.format(
            "UNAUTHORIZED_ACCESS | resource=%s | reason=%s | ip=%s | timestamp=%s",
            sanitize(resource),
            sanitize(reason),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.warn(message);
    }

    /**
     * Log forbidden access (authenticated but insufficient permissions)
     */
    public static void logForbiddenAccess(String resource, String requiredRole, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : "UNKNOWN";
        
        String message = String.format(
            "FORBIDDEN_ACCESS | resource=%s | requiredRole=%s | email=%s | ip=%s | timestamp=%s",
            sanitize(resource),
            sanitize(requiredRole),
            sanitize(email),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.warn(message);
    }

    /**
     * Log data modification
     */
    public static void logDataModification(String entity, String action, String entityId, String details, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : "UNKNOWN";
        
        String message = String.format(
            "DATA_MODIFIED | entity=%s | action=%s | entityId=%s | modifiedBy=%s | details=%s | ip=%s | timestamp=%s",
            sanitize(entity),
            sanitize(action),
            sanitize(entityId),
            sanitize(email),
            sanitize(details),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.info(message);
    }

    /**
     * Log suspicious activity
     */
    public static void logSuspiciousActivity(String activityType, String details, HttpServletRequest request) {
        String message = String.format(
            "SUSPICIOUS_ACTIVITY | type=%s | details=%s | ip=%s | timestamp=%s",
            sanitize(activityType),
            sanitize(details),
            getClientIp(request),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.error(message);
    }

    /**
     * Log configuration change
     */
    public static void logConfigurationChange(String setting, String oldValue, String newValue, String changedBy) {
        String message = String.format(
            "CONFIG_CHANGED | setting=%s | oldValue=%s | newValue=%s | changedBy=%s | timestamp=%s",
            sanitize(setting),
            sanitize(oldValue),
            sanitize(newValue),
            sanitize(changedBy),
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.warn(message);
    }

    /**
     * Log rate limit trigger
     */
    public static void logRateLimitExceeded(String endpoint, String ip, int attempts) {
        String message = String.format(
            "RATE_LIMIT_EXCEEDED | endpoint=%s | ip=%s | attempts=%d | timestamp=%s",
            sanitize(endpoint),
            ip,
            attempts,
            LocalDateTime.now().format(ISO_FORMATTER)
        );
        auditLogger.warn(message);
    }

    /**
     * Get client IP address from request
     */
    private static String getClientIp(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip.split(",")[0].trim();
    }

    /**
     * Sanitize log messages to prevent log injection
     */
    private static String sanitize(String input) {
        if (input == null) return "NULL";
        return input
            .replaceAll("[\\r\\n]", " ")  // Remove line breaks
            .replaceAll("[\\t]", " ")      // Remove tabs
            .trim();
    }
}
