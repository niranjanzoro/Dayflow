# Observability Guide - Dayflow HRMS

## Overview

Observability encompasses three key pillars:
1. **Logging** - Detailed event records
2. **Metrics** - Performance and health data
3. **Tracing** - Request flow through the system

This guide describes the observability implementation in Dayflow HRMS.

---

## 1. Logging

### Configuration

**File:** `application-observability.properties`

```properties
# Log Levels
logging.level.root=WARN
logging.level.com.dayflow=INFO
logging.level.org.springframework.security=INFO

# Actuator endpoints for monitoring
management.endpoints.web.exposure.include=health,metrics,info,prometheus
```

**Logback Configuration:** `logback-spring.xml`

- **CONSOLE**: Real-time output (development)
- **FILE**: Application logs with rotation
- **AUDIT_LOG**: Security and compliance events
- **ERROR_FILE**: Error-specific logging

### Log Levels

| Level | When to Use | Example |
|-------|------------|---------|
| DEBUG | Detailed diagnostics | Method entry/exit, variable values |
| INFO | Important events | User login, data modifications |
| WARN | Warning conditions | Rate limit exceeded, deprecated usage |
| ERROR | Error conditions | Failed transactions, exceptions |

### Audit Logger

**Class:** `com.dayflow.util.AuditLogger`

#### Usage

```java
// Log successful login
AuditLogger.logLogin("user@example.com", "EMP001", request);

// Log failed login
AuditLogger.logFailedLogin("user@example.com", "Invalid password", request);

// Log unauthorized access
AuditLogger.logUnauthorizedAccess("/api/employees", "Missing token", request);

// Log data modification
AuditLogger.logDataModification("Employee", "UPDATE", "123", "Salary changed", request);
```

#### Audit Events Logged

```
LOGIN_SUCCESS | email=user@example.com | employeeId=EMP001 | ip=192.168.1.100
LOGIN_FAILED | email=user@example.com | reason=Invalid password | ip=192.168.1.100
ACCOUNT_LOCKED | email=user@example.com | failedAttempts=5 | ip=192.168.1.100
LOGOUT_SUCCESS | email=user@example.com | ip=192.168.1.100
UNAUTHORIZED_ACCESS | resource=/api/employees | reason=Missing token | ip=192.168.1.100
FORBIDDEN_ACCESS | resource=/api/employees | requiredRole=HR | email=user@example.com
DATA_MODIFIED | entity=Employee | action=UPDATE | entityId=123 | modifiedBy=admin@example.com
SUSPICIOUS_ACTIVITY | type=Rapid requests | details=12 attempts in 1 minute
RATE_LIMIT_EXCEEDED | endpoint=/api/auth/login | ip=192.168.1.100 | attempts=11
```

### Log File Locations

Development:
```
logs/
├── spring.log           # Application logs
├── audit.log           # Audit trail
└── error.log           # Errors only
```

Production:
```
/var/log/dayflow/
├── spring-YYYY-MM-DD.N.log
├── audit-YYYY-MM-DD.N.log
└── error-YYYY-MM-DD.N.log
```

### Viewing Logs

```bash
# Real-time application logs
tail -f logs/spring.log

# Security audit trail
tail -f logs/audit.log

# Errors only
tail -f logs/error.log

# Search for specific events
grep "LOGIN_FAILED" logs/audit.log
grep "FORBIDDEN_ACCESS" logs/audit.log
grep "ERROR" logs/error.log
```

---

## 2. Health Checks

### Health Endpoints

**Base Path:** `/api/health`

#### Basic Health
```
GET /api/health
```

**Response:**
```json
{
  "status": "UP",
  "timestamp": 1629634800000,
  "application": "dayflow-hrms",
  "checks": {
    "database": "UP",
    "memory_used_mb": 256,
    "memory_max_mb": 1024
  }
}
```

#### Liveness Probe (Kubernetes)
```
GET /api/health/live
```

Use this for K8s `livenessProbe`. Pod is restarted if this fails.

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
```

#### Readiness Probe (Kubernetes)
```
GET /api/health/ready
```

Use this for K8s `readinessProbe`. Pod removed from load balancer if this fails.

```yaml
readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
```

#### Detailed Health
```
GET /api/health/detailed
```

**Response:**
```json
{
  "application": "dayflow-hrms",
  "version": "0.0.1",
  "jvm": {
    "processors": 8,
    "memory_free_mb": 512,
    "memory_total_mb": 768,
    "memory_max_mb": 1024
  },
  "database": {
    "connection_pool_size": "10 (max)",
    "health": "UP",
    "ssl_enabled": "true"
  },
  "security": {
    "authentication": "JWT",
    "encryption": "BCrypt",
    "rate_limiting": "enabled"
  }
}
```

---

## 3. Metrics

### Available Metrics

**Actuator Endpoint:** `/api/actuator/metrics`

**Key Metrics:**
- `jvm.memory.used` - JVM memory usage
- `jvm.memory.max` - JVM max memory
- `jvm.threads.live` - Active threads
- `process.uptime` - Application uptime
- `http.server.requests` - HTTP requests
- `http.server.requests.count` - Request count
- `http.server.requests.max` - Max request time

### Prometheus Format

**Endpoint:** `/api/actuator/prometheus`

Use this for Prometheus scraping:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'dayflow-hrms'
    metrics_path: '/api/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8080']
```

### Grafana Dashboard

Import dashboard from metrics to visualize:
- Request latency
- Error rates
- JVM memory usage
- Thread count
- Database connections

---

## 4. Monitoring & Alerting

### Key Metrics to Monitor

**Application Health:**
- Uptime > 99.9%
- Response time < 1 second
- Error rate < 0.1%
- CPU usage < 80%
- Memory usage < 80%

**Security:**
- Failed login attempts (spike detection)
- Unauthorized access attempts
- Rate limit triggers
- Account lockouts
- Unusual IP addresses

**Performance:**
- Database connection pool utilization
- JVM heap usage
- Thread pool saturation
- Request queue depth

### Alert Rules

```
# High memory usage
alert: HighMemoryUsage
expr: jvm_memory_used_bytes / jvm_memory_max_bytes > 0.8

# High error rate
alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.001

# Database connection pool exhausted
alert: DBConnectionPoolExhausted
expr: hikari_connections_active == hikari_connections_max

# Suspicious login attempts
alert: SuspiciousLoginAttempts
expr: rate(auth_login_failed_total[5m]) > 10
```

---

## 5. Distributed Tracing (Future)

### Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
    <groupId>io.zipkin.reporter2</groupId>
    <artifactId>zipkin-reporter-spring-boot</artifactId>
</dependency>
```

### Configuration

```properties
# application.properties
management.tracing.sampling.probability=0.1  # Sample 10% of requests
spring.zipkin.base-url=http://localhost:9411
spring.zipkin.sender.type=web
```

### Viewing Traces

Access Zipkin UI at `http://localhost:9411/zipkin/`

---

## Testing Observability

### Run Observability Tests

**Windows (PowerShell):**
```powershell
.\Observability-Tests.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x observability-tests.sh
./observability-tests.sh
```

### Test Coverage

- ✓ Health endpoints
- ✓ Logging configuration
- ✓ Audit trail
- ✓ Sensitive data protection
- ✓ Performance metrics
- ✓ Rate limiting
- ✓ Security headers
- ✓ Database connectivity

---

## Troubleshooting

### Missing Logs

**Problem:** No logs appearing in files

**Solution:**
```bash
# Check log path
echo $LOG_PATH

# Verify permissions
ls -la logs/

# Check Logback configuration
cat src/main/resources/logback-spring.xml
```

### High Memory Usage

**Problem:** Memory usage increasing over time

**Solution:**
```bash
# Check memory metrics
curl http://localhost:8080/api/health/detailed | jq '.jvm'

# Enable heap dump
export JAVA_OPTS="-XX:+HeapDumpOnOutOfMemoryError"

# Restart application with larger heap
java -Xmx2g -jar dayflow-hrms.jar
```

### Slow Response Times

**Problem:** API responses slow

**Solution:**
```bash
# Check detailed health
curl http://localhost:8080/api/health/detailed

# Profile JVM
jps  # Get process ID
jstat -gc <PID> 1000  # GC stats every 1 second

# Check database performance
EXPLAIN SELECT * FROM employees;
```

---

## Best Practices

### 1. Logging
- ✓ Use structured logging (JSON format recommended)
- ✓ Include context (user ID, request ID)
- ✓ Never log sensitive data (passwords, tokens, PII)
- ✓ Use appropriate log levels
- ✓ Rotate logs regularly

### 2. Metrics
- ✓ Monitor business metrics, not just technical
- ✓ Set realistic alerting thresholds
- ✓ Track SLI (Service Level Indicators)
- ✓ Review metrics weekly

### 3. Health Checks
- ✓ Keep health checks fast (< 100ms)
- ✓ Check external dependencies
- ✓ Return meaningful status messages
- ✓ Use separate liveness and readiness probes

### 4. Security
- ✓ Audit all auth events
- ✓ Alert on suspicious patterns
- ✓ Maintain audit trail for compliance
- ✓ Encrypt logs in transit and at rest

---

## Observability Checklist

- [ ] Logging configured (logback-spring.xml)
- [ ] Audit logger integrated (AuditLogger.java)
- [ ] Health endpoints accessible
- [ ] Metrics collection enabled
- [ ] Logs rotated regularly
- [ ] Monitoring dashboard configured
- [ ] Alert rules configured
- [ ] Observability tests passing
- [ ] Log retention policy defined
- [ ] Incident response procedures documented

---

## Additional Resources

- [Spring Boot Actuator Docs](https://spring.io/guides/gs/actuator-service/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards)
- [Zipkin Documentation](https://zipkin.io/)
- [12-Factor App Logging](https://12factor.net/logs)

---

Last Updated: 2026-08-22  
Classification: Internal Use
