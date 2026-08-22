#!/bin/bash

# =========================================
# Dayflow HRMS - Observability Test Suite
# =========================================
# Tests: Logging, Metrics, Health Checks, Audit Trails
# Version: 1.0

set -e

API_BASE="http://localhost:8080/api"
HEALTH_BASE="http://localhost:8080/api/health"
TEST_RESULTS="./observability-test-results.txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Test user credentials
TEST_EMAIL="test.observability@example.com"
TEST_PASSWORD="TestPassword123"

# Output helpers
print_header() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}"
}

print_test() {
    echo -e "\n${YELLOW}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((TESTS_SKIPPED++))
}

log_result() {
    echo "$1" >> "$TEST_RESULTS"
}

# ===== HEALTH CHECK TESTS =====

test_health_basic() {
    print_test "Health Check - Basic Endpoint"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_BASE")
    
    if [ "$response" = "200" ]; then
        print_pass "Health check endpoint responds with 200"
        log_result "PASS: Health check basic endpoint"
    else
        print_fail "Expected 200, got $response"
        log_result "FAIL: Health check basic endpoint - HTTP $response"
    fi
}

test_health_detailed() {
    print_test "Health Check - Detailed Endpoint"
    
    response=$(curl -s "$HEALTH_BASE/detailed")
    
    if echo "$response" | grep -q '"jvm"'; then
        print_pass "Detailed health includes JVM metrics"
        log_result "PASS: Detailed health check includes JVM"
    else
        print_fail "JVM metrics not found in response"
        log_result "FAIL: Detailed health check missing JVM metrics"
    fi
    
    if echo "$response" | grep -q '"security"'; then
        print_pass "Detailed health includes security info"
        log_result "PASS: Detailed health check includes security"
    else
        print_fail "Security info not found in response"
        log_result "FAIL: Detailed health check missing security"
    fi
}

test_liveness_probe() {
    print_test "Liveness Probe - Kubernetes Check"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_BASE/live")
    
    if [ "$response" = "200" ]; then
        print_pass "Liveness probe responds"
        log_result "PASS: Liveness probe"
    else
        print_fail "Liveness probe failed with $response"
        log_result "FAIL: Liveness probe - HTTP $response"
    fi
}

test_readiness_probe() {
    print_test "Readiness Probe - Service Ready Check"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_BASE/ready")
    
    if [ "$response" = "200" ]; then
        print_pass "Readiness probe indicates service is ready"
        log_result "PASS: Readiness probe"
    else
        print_fail "Readiness probe failed with $response"
        log_result "FAIL: Readiness probe - HTTP $response"
    fi
}

# ===== LOGGING CONFIGURATION TESTS =====

test_logback_config() {
    print_test "Logging - Logback Configuration"
    
    if [ -f "backend/src/main/resources/logback-spring.xml" ]; then
        print_pass "Logback configuration file exists"
        log_result "PASS: Logback configuration file"
        
        if grep -q "AUDIT_LOG" "backend/src/main/resources/logback-spring.xml"; then
            print_pass "Audit logger configured"
            log_result "PASS: Audit logger configured"
        else
            print_fail "Audit logger not configured"
            log_result "FAIL: Audit logger not found in logback config"
        fi
    else
        print_fail "Logback configuration file not found"
        log_result "FAIL: logback-spring.xml not found"
    fi
}

test_audit_logger() {
    print_test "Logging - Audit Logger Utility"
    
    if [ -f "backend/src/main/java/com/dayflow/util/AuditLogger.java" ]; then
        print_pass "Audit logger utility exists"
        log_result "PASS: Audit logger utility"
        
        # Check for key audit logging methods
        required_methods=("logLogin" "logFailedLogin" "logAccountLockout" "logUnauthorizedAccess" "logForbiddenAccess")
        
        for method in "${required_methods[@]}"; do
            if grep -q "public static void $method" "backend/src/main/java/com/dayflow/util/AuditLogger.java"; then
                print_pass "Audit method $method found"
                log_result "PASS: Audit method $method"
            else
                print_fail "Audit method $method not found"
                log_result "FAIL: Audit method $method"
            fi
        done
    else
        print_fail "Audit logger utility not found"
        log_result "FAIL: AuditLogger.java not found"
    fi
}

test_log_levels() {
    print_test "Logging - Log Level Configuration"
    
    if grep -q "logging.level.com.dayflow=INFO" "backend/src/main/resources/application-observability.properties"; then
        print_pass "Application log level set to INFO"
        log_result "PASS: Application log level configured"
    else
        print_fail "Application log level not properly configured"
        log_result "FAIL: Application log level"
    fi
    
    if grep -q "logging.level.org.springframework.web=WARN" "backend/src/main/resources/application-observability.properties"; then
        print_pass "Framework log level set to WARN (prevents noise)"
        log_result "PASS: Framework log level configured"
    else
        print_fail "Framework log level not properly configured"
        log_result "FAIL: Framework log level"
    fi
}

# ===== SENSITIVE DATA LOGGING TESTS =====

test_no_password_logging() {
    print_test "Security - No Passwords in Logs"
    
    # Check if spring.jpa.show-sql is disabled
    if grep -q "spring.jpa.show-sql=false" "backend/src/main/resources/application.properties"; then
        print_pass "SQL query logging is disabled (prevents password exposure)"
        log_result "PASS: SQL logging disabled"
    else
        print_fail "SQL logging not disabled"
        log_result "FAIL: SQL logging enabled"
    fi
}

test_password_sanitization() {
    print_test "Security - Password Field Handling"
    
    if grep -q "@JsonIgnore" "backend/src/main/java/com/dayflow/model/Employee.java"; then
        print_pass "Password field marked with @JsonIgnore (won't appear in logs)"
        log_result "PASS: Password field protected"
    else
        print_fail "Password field not protected"
        log_result "FAIL: Password field protection"
    fi
}

test_error_handling() {
    print_test "Security - Error Message Safety"
    
    # Attempt login with invalid credentials
    response=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrong"}')
    
    # Check that error message doesn't leak data
    if echo "$response" | grep -q "Invalid email or password"; then
        print_pass "Error message is generic (doesn't leak user existence)"
        log_result "PASS: Error message safety"
    else
        print_fail "Error message may be leaking data"
        log_result "FAIL: Error message security"
    fi
    
    # Check that error message doesn't expose SQL
    if ! echo "$response" | grep -q "sql\|SQL\|database"; then
        print_pass "Error message doesn't expose SQL details"
        log_result "PASS: No SQL in error messages"
    else
        print_fail "Error message exposes SQL details"
        log_result "FAIL: SQL exposed in error messages"
    fi
}

# ===== PERFORMANCE MONITORING TESTS =====

test_response_time() {
    print_test "Performance - Response Time Check"
    
    # Measure health check response time
    start_time=$(date +%s%N)
    curl -s "$HEALTH_BASE" > /dev/null
    end_time=$(date +%s%N)
    
    response_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_ms -lt 1000 ]; then
        print_pass "Health check responds in ${response_ms}ms (< 1 second)"
        log_result "PASS: Health check performance - ${response_ms}ms"
    else
        print_fail "Health check slow: ${response_ms}ms"
        log_result "WARN: Health check performance - ${response_ms}ms"
    fi
}

test_memory_metrics() {
    print_test "Performance - Memory Metrics"
    
    response=$(curl -s "$HEALTH_BASE/detailed")
    
    if echo "$response" | grep -q "memory_used_mb"; then
        memory_used=$(echo "$response" | grep -o '"memory_used_mb":[0-9]*' | grep -o '[0-9]*')
        print_pass "Memory metrics available: ${memory_used}MB used"
        log_result "PASS: Memory metrics - ${memory_used}MB used"
    else
        print_fail "Memory metrics not available"
        log_result "FAIL: Memory metrics"
    fi
}

# ===== RATE LIMITING TESTS =====

test_rate_limiting() {
    print_test "Security - Rate Limiting Active"
    
    # Attempt multiple rapid requests (should hit rate limit)
    echo "Sending 12 rapid requests to test rate limiting..."
    
    rate_limited=0
    for i in {1..12}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"test"}')
        
        if [ "$response" = "429" ]; then
            ((rate_limited++))
        fi
    done
    
    if [ $rate_limited -gt 0 ]; then
        print_pass "Rate limiting triggered ($rate_limited responses with 429)"
        log_result "PASS: Rate limiting active"
    else
        print_fail "Rate limiting not triggered"
        log_result "WARN: Rate limiting not active"
    fi
}

# ===== DATABASE HEALTH TESTS =====

test_database_health() {
    print_test "Infrastructure - Database Connectivity"
    
    response=$(curl -s "$HEALTH_BASE/detailed")
    
    if echo "$response" | grep -q '"database"'; then
        if echo "$response" | grep -q '"ssl_enabled": "true"'; then
            print_pass "Database connection uses SSL"
            log_result "PASS: Database SSL enabled"
        else
            print_fail "Database SSL not confirmed"
            log_result "WARN: Database SSL not confirmed"
        fi
    else
        print_fail "Database health check unavailable"
        log_result "SKIP: Database health check"
    fi
}

# ===== SECURITY HEADERS TESTS =====

test_security_headers() {
    print_test "Security - HTTP Response Headers"
    
    response_headers=$(curl -s -D - "$API_BASE/employees" 2>/dev/null | head -20)
    
    if echo "$response_headers" | grep -q "X-Content-Type-Options"; then
        print_pass "X-Content-Type-Options header present"
        log_result "PASS: X-Content-Type-Options header"
    else
        print_fail "X-Content-Type-Options header missing"
        log_result "FAIL: X-Content-Type-Options header"
    fi
}

# ===== MAIN TEST EXECUTION =====

main() {
    print_header "Dayflow HRMS Observability Test Suite"
    echo "Start time: $(date)"
    echo "API Base: $API_BASE"
    
    # Clear previous results
    > "$TEST_RESULTS"
    
    # Health Checks
    print_header "HEALTH CHECKS"
    test_health_basic
    test_health_detailed
    test_liveness_probe
    test_readiness_probe
    
    # Logging Configuration
    print_header "LOGGING CONFIGURATION"
    test_logback_config
    test_audit_logger
    test_log_levels
    
    # Security & Sensitive Data
    print_header "SECURITY & SENSITIVE DATA"
    test_no_password_logging
    test_password_sanitization
    test_error_handling
    test_security_headers
    
    # Performance
    print_header "PERFORMANCE MONITORING"
    test_response_time
    test_memory_metrics
    
    # Rate Limiting
    print_header "RATE LIMITING"
    test_rate_limiting
    
    # Database
    print_header "INFRASTRUCTURE"
    test_database_health
    
    # Summary
    print_header "TEST SUMMARY"
    TOTAL=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
    echo -e "Total Tests: $TOTAL"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ All observability tests passed!${NC}"
        log_result "================================"
        log_result "TEST SUMMARY"
        log_result "Passed: $TESTS_PASSED"
        log_result "Failed: $TESTS_FAILED"
        log_result "Skipped: $TESTS_SKIPPED"
        log_result "Result: SUCCESS"
        exit 0
    else
        echo -e "\n${RED}✗ Some observability tests failed!${NC}"
        log_result "================================"
        log_result "TEST SUMMARY"
        log_result "Passed: $TESTS_PASSED"
        log_result "Failed: $TESTS_FAILED"
        log_result "Skipped: $TESTS_SKIPPED"
        log_result "Result: FAILURE"
        exit 1
    fi
}

# Run tests
main
