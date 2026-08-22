package com.dayflow.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.sql.DataSource;
import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health Check Endpoints for Observability
 * 
 * Provides:
 * - Application health status
 * - Liveness probe (Kubernetes)
 * - Readiness probe (Kubernetes)
 * - Dependency health checks
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    /**
     * Basic health check - Application is running
     */
    @GetMapping
    public ResponseEntity<?> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("application", "dayflow-hrms");
        
        try {
            Map<String, Object> checks = new LinkedHashMap<>();
            
            // Database connectivity check
            if (dataSource != null) {
                boolean dbHealthy = checkDatabaseHealth();
                checks.put("database", dbHealthy ? "UP" : "DOWN");
            }
            
            // Memory check
            Runtime runtime = Runtime.getRuntime();
            long usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
            long maxMemory = runtime.maxMemory() / (1024 * 1024);
            checks.put("memory_used_mb", usedMemory);
            checks.put("memory_max_mb", maxMemory);
            
            response.put("checks", checks);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "DOWN");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Liveness probe - Is the application alive?
     * Used by Kubernetes to restart the pod if needed
     */
    @GetMapping("/live")
    public ResponseEntity<?> liveness() {
        return ResponseEntity.ok(new HealthStatus("UP", "Application is running"));
    }

    /**
     * Readiness probe - Is the application ready to serve requests?
     * Used by Kubernetes load balancer to route traffic
     */
    @GetMapping("/ready")
    public ResponseEntity<?> readiness() {
        try {
            if (dataSource != null && !checkDatabaseHealth()) {
                return ResponseEntity.status(503)
                    .body(new HealthStatus("DOWN", "Database not ready"));
            }
            return ResponseEntity.ok(new HealthStatus("UP", "Application ready"));
        } catch (Exception e) {
            return ResponseEntity.status(503)
                .body(new HealthStatus("DOWN", "Database check failed: " + e.getMessage()));
        }
    }

    /**
     * Detailed health information
     */
    @GetMapping("/detailed")
    public ResponseEntity<?> detailed() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("application", "dayflow-hrms");
        response.put("version", "0.0.1");
        
        try {
            // JVM Information
            Map<String, Object> jvm = new LinkedHashMap<>();
            Runtime runtime = Runtime.getRuntime();
            jvm.put("processors", runtime.availableProcessors());
            jvm.put("memory_free_mb", runtime.freeMemory() / (1024 * 1024));
            jvm.put("memory_total_mb", runtime.totalMemory() / (1024 * 1024));
            jvm.put("memory_max_mb", runtime.maxMemory() / (1024 * 1024));
            response.put("jvm", jvm);
            
            // Database Information
            if (dataSource != null) {
                Map<String, Object> database = new LinkedHashMap<>();
                database.put("connection_pool_size", "10 (max)");
                database.put("health", checkDatabaseHealth() ? "UP" : "DOWN");
                database.put("ssl_enabled", "true");
                response.put("database", database);
            }
            
            // Security Information
            Map<String, Object> security = new LinkedHashMap<>();
            security.put("authentication", "JWT");
            security.put("encryption", "BCrypt");
            security.put("rate_limiting", "enabled");
            response.put("security", security);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }

    /**
     * Check database connectivity
     */
    private boolean checkDatabaseHealth() {
        if (dataSource == null) {
            return false;
        }
        
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(2); // 2 second timeout
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Simple health status DTO
     */
    public static class HealthStatus {
        public String status;
        public String message;
        public long timestamp;

        public HealthStatus(String status, String message) {
            this.status = status;
            this.message = message;
            this.timestamp = System.currentTimeMillis();
        }
    }
}
