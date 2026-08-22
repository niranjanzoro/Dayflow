# Dayflow HRMS - Security Configuration Guide

## Quick Start: Setting Up Secure Environment

### 1. Create Environment File

```bash
# Copy the template
cp .env.example .env

# Edit with your actual values
# NEVER commit .env file!
```

### 2. Generate Secure JWT Secret

```bash
# Generate a random 32-byte base64 string
openssl rand -base64 32

# Output example: 
# abcDefGH1IJKlmNoPqRstuvWxyZ123/456+789==

# Add to .env:
JWT_SECRET=abcDefGH1IJKlmNoPqRstuvWxyZ123/456+789==
```

### 3. Configure Database Credentials

```properties
# In .env
DB_URL=jdbc:mysql://your-host:3306/dayflow_hrms?createDatabaseIfNotExist=true&useSSL=true&allowPublicKeyRetrieval=false&serverTimezone=UTC&requireSSL=true
DB_USERNAME=dayflow_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
```

### 4. Update CORS for Production

```properties
# Development (multiple origins)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Production (single origin only)
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

---

## Security Features Implemented

### Backend Security ✓
- [x] Credentials stored in environment variables (NOT hardcoded)
- [x] JWT secret securely managed via environment variables
- [x] Database SSL/TLS enforced (useSSL=true, requireSSL=true)
- [x] SQL query logging disabled
- [x] Security headers implemented (CSP, X-Frame-Options, X-Content-Type-Options)
- [x] Input validation and sanitization utilities
- [x] Rate limiting on auth endpoints (10 req/min for login, 5 req/min for register)
- [x] Account lockout after failed attempts
- [x] Password hashing with BCrypt
- [x] Email verification required

### Frontend Security ✓
- [x] Content Security Policy headers
- [x] XSS Protection enabled
- [x] CSRF Protection headers
- [x] Secure token validation before sending
- [x] Auto-logout on token expiration
- [x] Clear session data on logout
- [x] No sensitive data in logs

### Code Quality ✓
- [x] No hardcoded secrets or credentials
- [x] Unused dependencies removed
- [x] Parameterized queries (prevents SQL injection)
- [x] Input validation on all endpoints
- [x] Error handling without data leakage
- [x] Audit logging enabled

---

## Testing Security Implementation

### 1. Test Authentication

```bash
# Start backend
cd backend
./mvnw spring-boot:run

# Test login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Should return JWT token
# Response: {"token": "eyJ0eXAiOiJKV1QiLCJhbGc...", "user": {...}}
```

### 2. Test Protected Endpoint

```bash
# Get the token from login response, then:
export TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/employees

# Should return employee list (HR only)
# Without token: 401 Unauthorized
# Without HR role: 403 Forbidden
```

### 3. Test Rate Limiting

```bash
# Try to login 11 times rapidly
for i in {1..11}; do
  curl -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# 11th request should return: 429 Too Many Requests
```

### 4. Test SQL Injection Prevention

```bash
# Attempt SQL injection (should fail safely)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com\" OR 1=1--","password":"anything"}'

# Should return: Invalid email or password
# No database error exposure
```

---

## Deployment Checklist

### Pre-Deployment Security Review

- [ ] All hardcoded secrets removed
- [ ] Environment variables documented in .env.example
- [ ] JWT secret generated and stored securely
- [ ] Database credentials updated for production
- [ ] CORS origins restricted to production domain only
- [ ] HTTPS/TLS enabled and enforced
- [ ] Security headers configured
- [ ] Rate limiting verified
- [ ] Input validation active on all endpoints
- [ ] Audit logging enabled
- [ ] Error messages don't leak information
- [ ] Dependencies updated and scanned for vulnerabilities
- [ ] SQL query logging disabled
- [ ] Debug mode disabled

### Production Environment Variables

```bash
# MUST set these before deployment:
export DB_URL="jdbc:mysql://prod-host:3306/dayflow_hrms?..."
export DB_USERNAME="dayflow_prod_user"
export DB_PASSWORD="secure-random-password"
export JWT_SECRET="secure-random-base64-string"
export CORS_ALLOWED_ORIGINS="https://your-domain.com"
export JWT_EXPIRATION="86400000"
export NODE_ENV="production"
```

### Infrastructure Security

- [ ] Use HTTPS with valid certificate (not self-signed)
- [ ] Configure firewall rules (close unnecessary ports)
- [ ] Enable VPN for admin access
- [ ] Set up monitoring and alerting
- [ ] Configure database backups
- [ ] Enable audit logs collection
- [ ] Set up intrusion detection
- [ ] Use secrets management service (AWS Secrets Manager, Vault, etc.)

---

## Troubleshooting Security Issues

### Issue: "Invalid JWT Secret"
**Solution:** Ensure JWT_SECRET environment variable is set
```bash
echo $JWT_SECRET
# If empty, set it:
export JWT_SECRET=$(openssl rand -base64 32)
```

### Issue: "Database connection refused"
**Solution:** Check database SSL settings
```bash
# Verify database accepts SSL connections
mysql -h your-host -u user -p --ssl-mode=REQUIRED -e "STATUS"
```

### Issue: "CORS error when calling API from frontend"
**Solution:** Update CORS_ALLOWED_ORIGINS
```bash
# Development: Include localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Production: Exact domain only
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### Issue: "Too many login attempts"
**Solution:** Wait 1 minute for rate limiting window to pass
```bash
# Or check IP being used
curl -s https://checkip.amazonaws.com
```

---

## Security Contact

- **Security Officer:** [name]
- **Email:** security@dayflow.com
- **Incident Hotline:** [phone]

## Additional Resources

- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Spring Security Guide](https://spring.io/guides/gs/securing-web/)
- [NIST Cyber Security Framework](https://www.nist.gov/cyberframework)

---

Last Updated: 2026-08-22
