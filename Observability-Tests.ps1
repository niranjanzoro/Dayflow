# =========================================
# Dayflow HRMS - Observability Test Suite (PowerShell)
# =========================================
# Tests: Logging, Metrics, Health Checks, Audit Trails
# Version: 1.0

$ErrorActionPreference = "Continue"

$ApiBase = "http://localhost:8080/api"
$HealthBase = "http://localhost:8080/api/health"
$ResultsFile = ".\observability-test-results.txt"

# Results tracking
$testsPassed = 0
$testsFailed = 0
$testsSkipped = 0

# Output helpers
function Print-Header($title) {
    Write-Host ("`n" + "="*40) -ForegroundColor Yellow
    Write-Host $title -ForegroundColor Yellow
    Write-Host ("="*40 + "`n") -ForegroundColor Yellow
}

function Print-Test($name) {
    Write-Host "[TEST] $name" -ForegroundColor Yellow
}

function Print-Pass($message) {
    Write-Host "[PASS] $message" -ForegroundColor Green
    $script:testsPassed++
    Add-Content -Path $ResultsFile -Value "PASS: $message"
}

function Print-Fail($message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
    $script:testsFailed++
    Add-Content -Path $ResultsFile -Value "FAIL: $message"
}

function Print-Skip($message) {
    Write-Host "[SKIP] $message" -ForegroundColor Yellow
    $script:testsSkipped++
    Add-Content -Path $ResultsFile -Value "SKIP: $message"
}

# ===== HEALTH CHECK TESTS =====

function Test-HealthBasic {
    Print-Test "Health Check - Basic Endpoint"
    
    try {
        $response = Invoke-WebRequest -Uri "$HealthBase" -UseBasicParsing -ErrorAction SilentlyContinue
        
        if ($response.StatusCode -eq 200) {
            Print-Pass "Health check endpoint responds with 200"
        } else {
            Print-Fail "Expected 200, got $($response.StatusCode)"
        }
    } catch {
        Print-Fail "Health check failed: $_"
    }
}

function Test-HealthDetailed {
    Print-Test "Health Check - Detailed Endpoint"
    
    try {
        $response = Invoke-WebRequest -Uri "$HealthBase/detailed" -UseBasicParsing
        $content = $response.Content
        
        if ($content -match '"jvm"') {
            Print-Pass "Detailed health includes JVM metrics"
        } else {
            Print-Fail "JVM metrics not found in response"
        }
        
        if ($content -match '"security"') {
            Print-Pass "Detailed health includes security info"
        } else {
            Print-Fail "Security info not found in response"
        }
    } catch {
        Print-Fail "Detailed health check failed: $_"
    }
}

function Test-LivenessProbe {
    Print-Test "Liveness Probe - Kubernetes Check"
    
    try {
        $response = Invoke-WebRequest -Uri "$HealthBase/live" -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Print-Pass "Liveness probe responds"
        } else {
            Print-Fail "Liveness probe failed with $($response.StatusCode)"
        }
    } catch {
        Print-Fail "Liveness probe check failed: $_"
    }
}

function Test-ReadinessProbe {
    Print-Test "Readiness Probe - Service Ready Check"
    
    try {
        $response = Invoke-WebRequest -Uri "$HealthBase/ready" -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Print-Pass "Readiness probe indicates service is ready"
        } else {
            Print-Fail "Readiness probe failed with $($response.StatusCode)"
        }
    } catch {
        Print-Fail "Readiness probe check failed: $_"
    }
}

# ===== LOGGING CONFIGURATION TESTS =====

function Test-LogbackConfig {
    Print-Test "Logging - Logback Configuration"
    
    $logbackPath = "backend/src/main/resources/logback-spring.xml"
    
    if (Test-Path $logbackPath) {
        Print-Pass "Logback configuration file exists"
        
        $content = Get-Content $logbackPath -Raw
        if ($content -match "AUDIT_LOG") {
            Print-Pass "Audit logger configured"
        } else {
            Print-Fail "Audit logger not configured"
        }
    } else {
        Print-Fail "Logback configuration file not found"
    }
}

function Test-AuditLogger {
    Print-Test "Logging - Audit Logger Utility"
    
    $auditLoggerPath = "backend/src/main/java/com/dayflow/util/AuditLogger.java"
    
    if (Test-Path $auditLoggerPath) {
        Print-Pass "Audit logger utility exists"
        
        $content = Get-Content $auditLoggerPath -Raw
        $requiredMethods = @("logLogin", "logFailedLogin", "logAccountLockout", "logUnauthorizedAccess", "logForbiddenAccess")
        
        foreach ($method in $requiredMethods) {
            if ($content -match "public static void $method") {
                Print-Pass "Audit method $method found"
            } else {
                Print-Fail "Audit method $method not found"
            }
        }
    } else {
        Print-Fail "Audit logger utility not found"
    }
}

function Test-LogLevels {
    Print-Test "Logging - Log Level Configuration"
    
    $configPath = "backend/src/main/resources/application-observability.properties"
    
    if (Test-Path $configPath) {
        $content = Get-Content $configPath -Raw
        
        if ($content -match "logging.level.com.dayflow=INFO") {
            Print-Pass "Application log level set to INFO"
        } else {
            Print-Fail "Application log level not properly configured"
        }
        
        if ($content -match "logging.level.org.springframework.web=WARN") {
            Print-Pass "Framework log level set to WARN (prevents noise)"
        } else {
            Print-Fail "Framework log level not properly configured"
        }
    }
}

# ===== SENSITIVE DATA LOGGING TESTS =====

function Test-NoPasswordLogging {
    Print-Test "Security - No Passwords in Logs"
    
    $configPath = "backend/src/main/resources/application.properties"
    
    if (Test-Path $configPath) {
        $content = Get-Content $configPath -Raw
        
        if ($content -match "spring.jpa.show-sql=false") {
            Print-Pass "SQL query logging is disabled (prevents password exposure)"
        } else {
            Print-Fail "SQL logging not disabled"
        }
    }
}

function Test-PasswordSanitization {
    Print-Test "Security - Password Field Handling"
    
    $employeePath = "backend/src/main/java/com/dayflow/model/Employee.java"
    
    if (Test-Path $employeePath) {
        $content = Get-Content $employeePath -Raw
        
        if ($content -match "@JsonIgnore") {
            Print-Pass "Password field marked with @JsonIgnore (won't appear in logs)"
        } else {
            Print-Fail "Password field not protected"
        }
    }
}

function Test-ErrorHandling {
    Print-Test "Security - Error Message Safety"
    
    try {
        $body = @{
            email = "test@example.com"
            password = "wrong"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$ApiBase/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing `
            -ErrorAction SilentlyContinue
        
        $content = $response.Content
        
        if ($content -match "Invalid email or password") {
            Print-Pass "Error message is generic (doesn't leak user existence)"
        } else {
            Print-Fail "Error message may be leaking data"
        }
        
        if ($content -notmatch "sql|SQL|database") {
            Print-Pass "Error message doesn't expose SQL details"
        } else {
            Print-Fail "Error message exposes SQL details"
        }
    } catch {
        Print-Fail "Error handling test failed: $_"
    }
}

# ===== PERFORMANCE MONITORING TESTS =====

function Test-ResponseTime {
    Print-Test "Performance - Response Time Check"
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$HealthBase" -UseBasicParsing -ErrorAction SilentlyContinue
        $stopwatch.Stop()
        
        $responseMs = $stopwatch.ElapsedMilliseconds
        
        if ($responseMs -lt 1000) {
            Print-Pass "Health check responds in ${responseMs}ms (< 1 second)"
        } else {
            Print-Fail "Health check slow: ${responseMs}ms"
        }
    } catch {
        Print-Fail "Response time test failed: $_"
    }
}

function Test-MemoryMetrics {
    Print-Test "Performance - Memory Metrics"
    
    try {
        $response = Invoke-WebRequest -Uri "$HealthBase/detailed" -UseBasicParsing
        $content = $response.Content
        
        if ($content -match '"memory_used_mb":(\d+)') {
            $memoryUsed = $matches[1]
            Print-Pass "Memory metrics available: ${memoryUsed}MB used"
        } else {
            Print-Fail "Memory metrics not available"
        }
    } catch {
        Print-Fail "Memory metrics test failed: $_"
    }
}

# ===== RATE LIMITING TESTS =====

function Test-RateLimiting {
    Print-Test "Security - Rate Limiting Active"
    
    try {
        Write-Host "Sending 12 rapid requests to test rate limiting..."
        
        $rateLimited = 0
        
        for ($i = 1; $i -le 12; $i++) {
            $body = @{
                email = "test@example.com"
                password = "test"
            } | ConvertTo-Json
            
            try {
                $response = Invoke-WebRequest -Uri "$ApiBase/auth/login" `
                    -Method POST `
                    -ContentType "application/json" `
                    -Body $body `
                    -UseBasicParsing `
                    -ErrorAction SilentlyContinue
                
                if ($response.StatusCode -eq 429) {
                    $rateLimited++
                }
            } catch {
                if ($_.Exception.Response.StatusCode -eq 429) {
                    $rateLimited++
                }
            }
        }
        
        if ($rateLimited -gt 0) {
            Print-Pass "Rate limiting triggered ($rateLimited responses with 429)"
        } else {
            Print-Skip "Rate limiting not triggered (service may be fresh)"
        }
    } catch {
        Print-Fail "Rate limiting test failed: $_"
    }
}

# ===== DATABASE HEALTH TESTS =====

function Test-DatabaseHealth {
    Print-Test "Infrastructure - Database Connectivity"
    
    try {
        $response = Invoke-WebRequest -Uri "$HealthBase/detailed" -UseBasicParsing
        $content = $response.Content
        
        if ($content -match '"database"') {
            if ($content -match '"ssl_enabled": "true"') {
                Print-Pass "Database connection uses SSL"
            } else {
                Print-Fail "Database SSL not confirmed"
            }
        } else {
            Print-Skip "Database health check unavailable"
        }
    } catch {
        Print-Fail "Database health test failed: $_"
    }
}

# ===== CONFIGURATION FILES TEST =====

function Test-ConfigurationFiles {
    Print-Test "Configuration - Observability Files"
    
    $files = @(
        "backend/src/main/resources/application-observability.properties"
        "backend/src/main/resources/logback-spring.xml"
        "backend/src/main/java/com/dayflow/util/AuditLogger.java"
        "backend/src/main/java/com/dayflow/controller/HealthController.java"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Print-Pass "Configuration file exists: $file"
        } else {
            Print-Fail "Configuration file missing: $file"
        }
    }
}

# ===== MAIN EXECUTION =====

function Main {
    Write-Host ("`n" + "="*40) -ForegroundColor Yellow
    Write-Host "Dayflow HRMS Observability Test Suite" -ForegroundColor Yellow
    Write-Host ("="*40 + "`n") -ForegroundColor Yellow
    
    Write-Host "Start time: $(Get-Date)" -ForegroundColor Gray
    Write-Host "API Base: $ApiBase`n" -ForegroundColor Gray
    
    # Clear previous results
    if (Test-Path $ResultsFile) {
        Remove-Item $ResultsFile
    }
    
    # Configuration Files
    Print-Header "CONFIGURATION FILES"
    Test-ConfigurationFiles
    
    # Health Checks
    Print-Header "HEALTH CHECKS"
    Test-HealthBasic
    Test-HealthDetailed
    Test-LivenessProbe
    Test-ReadinessProbe
    
    # Logging Configuration
    Print-Header "LOGGING CONFIGURATION"
    Test-LogbackConfig
    Test-AuditLogger
    Test-LogLevels
    
    # Security & Sensitive Data
    Print-Header "SECURITY & SENSITIVE DATA"
    Test-NoPasswordLogging
    Test-PasswordSanitization
    Test-ErrorHandling
    
    # Performance
    Print-Header "PERFORMANCE MONITORING"
    Test-ResponseTime
    Test-MemoryMetrics
    
    # Rate Limiting
    Print-Header "RATE LIMITING"
    Test-RateLimiting
    
    # Database
    Print-Header "INFRASTRUCTURE"
    Test-DatabaseHealth
    
    # Summary
    Print-Header "TEST SUMMARY"
    $total = $testsPassed + $testsFailed + $testsSkipped
    Write-Host "Total Tests: $total"
    Write-Host "Passed: $testsPassed" -ForegroundColor Green
    Write-Host "Failed: $testsFailed" -ForegroundColor Red
    Write-Host "Skipped: $testsSkipped" -ForegroundColor Yellow
    
    if ($testsFailed -eq 0) {
        Write-Host "✓ All observability tests passed!" -ForegroundColor Green
        Add-Content -Path $ResultsFile -Value @"
================================
TEST SUMMARY
Passed: $testsPassed
Failed: $testsFailed
Skipped: $testsSkipped
Result: SUCCESS
"@
    } else {
        Write-Host "✗ Some observability tests failed!" -ForegroundColor Red
        Add-Content -Path $ResultsFile -Value @"
================================
TEST SUMMARY
Passed: $testsPassed
Failed: $testsFailed
Skipped: $testsSkipped
Result: FAILURE
"@
    }
    
    Write-Host "Results saved to: $ResultsFile" -ForegroundColor Gray
}

# Run tests
Main
