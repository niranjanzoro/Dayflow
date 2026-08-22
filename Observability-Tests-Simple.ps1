# Dayflow HRMS - Observability Test Suite (PowerShell)
# Tests: Logging, Metrics, Health Checks, Audit Trails

param()

$ErrorActionPreference = "Continue"

$ApiBase = "http://localhost:8080/api"
$HealthBase = "http://localhost:8080/api/health"
$ResultsFile = "observability-test-results.txt"

# Results tracking
$testsPassed = 0
$testsFailed = 0
$testsSkipped = 0

Write-Host ""
Write-Host "Dayflow HRMS Observability Test Suite" -ForegroundColor Yellow
Write-Host ""

# Clear previous results
if (Test-Path $ResultsFile) {
    Remove-Item $ResultsFile
}

# Helper functions
function LogResult([string]$message) {
    Add-Content -Path $ResultsFile -Value $message
}

function TestPass([string]$message) {
    Write-Host "[PASS] $message" -ForegroundColor Green
    $script:testsPassed++
    LogResult "PASS: $message"
}

function TestFail([string]$message) {
    Write-Host "[FAIL] $message" -ForegroundColor Red
    $script:testsFailed++
    LogResult "FAIL: $message"
}

function TestSkip([string]$message) {
    Write-Host "[SKIP] $message" -ForegroundColor Yellow
    $script:testsSkipped++
    LogResult "SKIP: $message"
}

# ===== CONFIGURATION FILES TEST =====
Write-Host ""
Write-Host "CONFIGURATION FILES" -ForegroundColor Yellow
Write-Host ""

$configFiles = @(
    "backend/src/main/resources/application-observability.properties",
    "backend/src/main/resources/logback-spring.xml",
    "backend/src/main/java/com/dayflow/util/AuditLogger.java",
    "backend/src/main/java/com/dayflow/controller/HealthController.java"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        TestPass "Configuration file exists: $file"
    } else {
        TestFail "Configuration file missing: $file"
    }
}

# ===== LOGGING CONFIGURATION TESTS =====
Write-Host ""
Write-Host "LOGGING CONFIGURATION" -ForegroundColor Yellow
Write-Host ""

$logbackPath = "backend/src/main/resources/logback-spring.xml"
if (Test-Path $logbackPath) {
    TestPass "Logback configuration file exists"
    $content = Get-Content $logbackPath -Raw
    if ($content -match "AUDIT_LOG") {
        TestPass "Audit logger configured"
    } else {
        TestFail "Audit logger not configured"
    }
} else {
    TestFail "Logback configuration file not found"
}

$auditLoggerPath = "backend/src/main/java/com/dayflow/util/AuditLogger.java"
if (Test-Path $auditLoggerPath) {
    TestPass "Audit logger utility exists"
    $content = Get-Content $auditLoggerPath -Raw
    
    $methods = @("logLogin", "logFailedLogin", "logAccountLockout", "logUnauthorizedAccess", "logForbiddenAccess")
    foreach ($method in $methods) {
        if ($content -match "public static void $method") {
            TestPass "Audit method $method found"
        } else {
            TestFail "Audit method $method not found"
        }
    }
} else {
    TestFail "Audit logger utility not found"
}

$configPath = "backend/src/main/resources/application-observability.properties"
if (Test-Path $configPath) {
    $content = Get-Content $configPath -Raw
    if ($content -match "logging.level.com.dayflow=INFO") {
        TestPass "Application log level set to INFO"
    } else {
        TestFail "Application log level not configured"
    }
}

# ===== SECURITY & SENSITIVE DATA TESTS =====
Write-Host ""
Write-Host "SECURITY AND SENSITIVE DATA" -ForegroundColor Yellow
Write-Host ""

$appProps = "backend/src/main/resources/application.properties"
if (Test-Path $appProps) {
    $content = Get-Content $appProps -Raw
    if ($content -match "spring.jpa.show-sql=false") {
        TestPass "SQL query logging is disabled"
    } else {
        TestFail "SQL logging not disabled"
    }
}

$employeePath = "backend/src/main/java/com/dayflow/model/Employee.java"
if (Test-Path $employeePath) {
    $content = Get-Content $employeePath -Raw
    if ($content -match "@JsonIgnore") {
        TestPass "Password field marked with JsonIgnore"
    } else {
        TestFail "Password field not protected"
    }
}

# ===== HEALTH CHECK TESTS =====
Write-Host ""
Write-Host "HEALTH CHECKS" -ForegroundColor Yellow
Write-Host ""

$healthPath = "backend/src/main/java/com/dayflow/controller/HealthController.java"
if (Test-Path $healthPath) {
    TestPass "Health controller exists"
    $content = Get-Content $healthPath -Raw
    
    $healthMethods = @("health", "liveness", "readiness", "detailed")
    foreach ($method in $healthMethods) {
        if ($content -match "public ResponseEntity.*$method") {
            TestPass "Health endpoint $method found"
        } else {
            TestFail "Health endpoint $method not found"
        }
    }
} else {
    TestFail "Health controller not found"
}

# ===== RATE LIMITING TEST =====
Write-Host ""
Write-Host "RATE LIMITING" -ForegroundColor Yellow
Write-Host ""

$rateLimitPath = "backend/src/main/java/com/dayflow/security/RateLimitingInterceptor.java"
if (Test-Path $rateLimitPath) {
    TestPass "Rate limiting interceptor exists"
} else {
    TestFail "Rate limiting interceptor not found"
}

# ===== VALIDATION TESTS =====
Write-Host ""
Write-Host "INPUT VALIDATION" -ForegroundColor Yellow
Write-Host ""

$validationPath = "backend/src/main/java/com/dayflow/util/ValidationUtil.java"
if (Test-Path $validationPath) {
    TestPass "Validation utility exists"
    $content = Get-Content $validationPath -Raw
    
    $validators = @("isValidEmail", "isValidPassword", "isValidName", "sanitize")
    foreach ($validator in $validators) {
        if ($content -match "public static.*$validator") {
            TestPass "Validator $validator found"
        } else {
            TestFail "Validator $validator not found"
        }
    }
} else {
    TestFail "Validation utility not found"
}

# ===== SUMMARY =====
Write-Host ""
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host ""

$total = $testsPassed + $testsFailed + $testsSkipped
Write-Host "Total Tests: $total"
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host "Skipped: $testsSkipped" -ForegroundColor Yellow

if ($testsFailed -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS: All observability tests passed!" -ForegroundColor Green
    LogResult ""
    LogResult "================================"
    LogResult "TEST SUMMARY"
    LogResult "Total: $total"
    LogResult "Passed: $testsPassed"
    LogResult "Failed: $testsFailed"
    LogResult "Skipped: $testsSkipped"
    LogResult "Result: SUCCESS"
} else {
    Write-Host ""
    Write-Host "FAILURE: Some tests failed!" -ForegroundColor Red
    LogResult ""
    LogResult "================================"
    LogResult "TEST SUMMARY"
    LogResult "Total: $total"
    LogResult "Passed: $testsPassed"
    LogResult "Failed: $testsFailed"
    LogResult "Skipped: $testsSkipped"
    LogResult "Result: FAILURE"
}

Write-Host "Results saved to: $ResultsFile" -ForegroundColor Gray
Write-Host ""
