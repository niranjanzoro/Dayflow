# Security & Governance Policy - Dayflow HRMS

## Version: 1.0
## Last Updated: 2026-08-22
## Owner: Security Team

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [Infrastructure Security](#infrastructure-security)
5. [API Security](#api-security)
6. [Frontend Security](#frontend-security)
7. [Compliance & Audit](#compliance--audit)
8. [Incident Response](#incident-response)

---

## Overview

This document outlines the security and governance controls implemented in Dayflow HRMS. The application handles sensitive HR data including employee information, attendance, leaves, and payroll details.

**Security Principles:**
- **Principle of Least Privilege**: Users access only what they need
- **Defense in Depth**: Multiple layers of security controls
- **Zero Trust**: Verify every request and access attempt
- **Secure by Default**: Security is enabled by default, not an afterthought

---

## Authentication & Authorization

### 1. User Authentication (JWT-based)

**Implementation:**
- OAuth 2.0 / JWT (JSON Web Tokens) for stateless authentication
- Passwords hashed with BCrypt (strength factor: 12)
- Token expiration: 24 hours (configurable)

**Security Measures:**
```
✓ JWT signed with HMAC-SHA256
✓ Secret key stored in environment variables (NOT hardcoded)
✓ Token includes: email, employeeId, role, name
✓ Token validation on every request
✓ Automatic logout on token expiration
```

**Configuration:**
```properties
# .env or environment variable
JWT_SECRET=<generated-with-openssl-rand-base64-32>
JWT_EXPIRATION=86400000
```

**Usage:**
```bash
# Generate secure secret
openssl rand -base64 32
```

### 2. Role-Based Access Control (RBAC)

**Roles:**
- **EMPLOYEE**: Limited to personal data (attendance, leaves, payroll)
- **HR**: Full access to employee management, approvals, reports
- **ADMIN**: System administration (future implementation)

**Enforcement:**
```java
@PreAuthorize("hasRole('HR')")  // Only HR can access
@PreAuthorize("hasAnyRole('EMPLOYEE', 'HR')")  // Both can access
```

### 3. Account Management

**Email Verification:**
- Required before first login
- Verification code expires in 15 minutes
- Max 3 attempts allowed

**Password Policy:**
- Minimum 8 characters (enforced in frontend)
- At least 1 uppercase, 1 lowercase, 1 number
- Passwords hashed with BCrypt before storage
- No password history (future: prevent reuse of last 3 passwords)

**Account Lockout:**
- Locked after 5 failed login attempts
- Lockout duration: 15 minutes
- Automatic unlock or manual HR intervention

---

## Data Protection

### 1. Encryption in Transit

**HTTPS/TLS:**
```
✓ Enforced SSL/TLS for all database connections
✓ Database: useSSL=true, allowPublicKeyRetrieval=false, requireSSL=true
✓ Frontend: HTTPS enforcement headers set
✓ API: HSTS (HTTP Strict-Transport-Security) configured
```

### 2. Encryption at Rest

**Database:**
- MySQL configured with SSL
- Passwords stored as BCrypt hashes (one-way)
- Sensitive fields: encrypted at application layer (future implementation)

**Secrets Management:**
- JWT secret: Environment variable only
- Database credentials: Environment variables only
- API keys: Never hardcoded, always in .env

### 3. Data Minimization

**Stored Data:**
- Only essential employee data stored
- PII (Personally Identifiable Information) handled with care
- API responses exclude sensitive fields (passwords never exposed)

**Logging:**
- SQL query logging DISABLED (was showing sensitive data)
- Security events logged: login attempts, auth failures, access denials
- No sensitive data in logs

### 4. Session Management

**Frontend:**
- Token stored in localStorage (XSS risk mitigation planned)
- Session cookies: httpOnly, Secure, SameSite=Strict
- Auto-logout on token expiration

**Backend:**
- Stateless: No server-side session storage
- Each request validated independently
- Token revocation: Clear cache/DB on logout

---

## Infrastructure Security

### 1. CORS (Cross-Origin Resource Sharing)

**Configuration:**
```java
allowedOrigins: http://localhost:5173  // Dev only
allowedMethods: GET, POST, PUT, DELETE, PATCH, OPTIONS
allowedHeaders: Authorization, Content-Type, Accept
credentials: true
maxAge: 3600 seconds (1 hour preflight cache)
```

**Production Setup:**
```
Update CORS_ALLOWED_ORIGINS to your actual domain:
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### 2. Security Headers

**Implemented Headers:**

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevent MIME type sniffing |
| X-Frame-Options | SAMEORIGIN | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | XSS protection |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| Content-Security-Policy | default-src 'self' | XSS/injection prevention |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer data |

### 3. Input Validation & Sanitization

**Backend:**
```java
@Valid @RequestBody LoginRequest req  // Bean validation
@Email  // Email format validation
@NotBlank  // Required fields
// Custom validators for business rules
```

**Frontend:**
```javascript
// Axios interceptor validates token format
if (token && typeof token === 'string' && token.length > 0)
// Input sanitization in forms
```

---

## API Security

### 1. Authentication Endpoints

**Public Endpoints:**
```
POST /api/auth/register    - New employee signup
POST /api/auth/login       - Employee login
POST /api/auth/forgot-password - Password reset
```

**Security:**
- Rate limited (future implementation)
- Email verification required
- Account lockout after failed attempts

### 2. Protected Endpoints

**All other endpoints:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Examples:**
```
GET  /api/employees        - HR only (list all)
GET  /api/employees/{id}   - Own data only
POST /api/attendance/clock-in  - Authenticated
GET  /api/leaves/my-leaves     - Own leaves
```

### 3. HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input - check errors |
| 401 | Unauthorized | Token missing/invalid - re-login |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Email/ID already exists |
| 429 | Too Many Requests | Rate limited - wait and retry |
| 500 | Server Error | Internal error - contact support |

### 4. Error Handling

**Safe Error Messages:**
```json
{"message": "Invalid email or password"}   // Don't reveal which field
```

**Unsafe (DO NOT DO):**
```json
{"message": "Email john@example.com not found"}  // Leaks data
{"message": "SQL error: ..."}  // Leaks implementation details
```

---

## Frontend Security

### 1. Content Security Policy (CSP)

**Implemented in HTML:**
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; 
           script-src 'self'; 
           style-src 'self' 'unsafe-inline'; 
           img-src 'self' data: https:; 
           connect-src 'self' http://localhost:8080">
```

### 2. XSS (Cross-Site Scripting) Prevention

**Measures:**
- React auto-escapes output (safer by default)
- Avoid innerHTML for user data
- Validate and sanitize API responses
- Meta tag: X-XSS-Protection: 1; mode=block

### 3. CSRF (Cross-Site Request Forgery) Prevention

**Implementation:**
- SameSite cookie attribute: Strict
- X-Requested-With header added to requests
- State tokens for critical operations (future enhancement)

### 4. Token Storage (localStorage risks)

**Current Approach:**
- JWT stored in localStorage
- Protected by httpOnly cookies at session level

**Future Improvements:**
- Consider In-Memory token storage with refresh tokens
- Use secure httpOnly cookies for tokens
- Implement token rotation

### 5. Dependency Security

**Dependencies:**
```json
"axios": "^1.19.0"
"react": "^18.3.1"
"react-router-dom": "^6.30.6"
```

**Maintenance:**
```bash
# Check for vulnerabilities
npm audit

# Update vulnerable packages
npm audit fix

# Review before updating
npm outdated
```

---

## Compliance & Audit

### 1. Audit Logging

**Events Logged:**
```
- User login (success/failure)
- Failed login attempts (3+ triggers account review)
- Unauthorized access attempts
- Employee data modifications
- Leave approvals/rejections
- Payroll changes
- Role changes
- Account deactivation
```

**Log Format:**
```
[TIMESTAMP] [LEVEL] [USER_ID] [ACTION] [RESOURCE] [RESULT] [IP_ADDRESS]
2026-08-22T10:30:45Z INFO emp123 LOGIN success 192.168.1.100
```

### 2. Data Protection Regulations

**Applicable Regulations:**
- GDPR (EU): If handling EU employee data
- CCPA (California): If handling California resident data
- Local labor laws: By jurisdiction
- Company privacy policy

**Implemented Controls:**
```
✓ Data minimization: Only essential data stored
✓ Retention: Define data retention periods
✓ Deletion: Implement secure data deletion
✓ Access control: Role-based access
✓ Audit trails: All actions logged
```

### 3. Compliance Checklist

- [ ] All database credentials stored in environment variables
- [ ] JWT secret securely generated and stored
- [ ] HTTPS enabled in production
- [ ] Security headers implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using parameterized queries)
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Incident response plan documented
- [ ] Security training completed by development team

---

## Incident Response

### 1. Security Incidents

**Classification:**
- **Critical**: Data breach, system compromise
- **High**: Authentication bypass, privilege escalation
- **Medium**: Unpatched vulnerabilities, weak controls
- **Low**: Security policy violations, outdated docs

### 2. Response Procedure

1. **Identify**: Detect and classify the incident
2. **Contain**: Limit impact (disable accounts, rotate credentials)
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Review**: Post-incident analysis and improvements

### 3. Contact Information

- **Security Officer**: [email]
- **Incident Hotline**: [phone]
- **Email**: security@dayflow.com

### 4. Emergency Actions

**If JWT Secret Compromised:**
```bash
# 1. Generate new secret immediately
openssl rand -base64 32

# 2. Update environment variable
export JWT_SECRET=<new_secret>

# 3. Restart application
# All existing tokens automatically invalid

# 4. Notify all users to re-login
```

**If Database Credentials Leaked:**
```bash
# 1. Rotate database password immediately
# 2. Update DB_PASSWORD environment variable
# 3. Restart application
# 4. Review audit logs for unauthorized access
# 5. Reset any compromised accounts
```

---

## Deployment Checklist

### Before Going to Production

```bash
# ✓ Security
- [ ] Change all default credentials
- [ ] Generate new JWT secret (openssl rand -base64 32)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up VPN for admin access

# ✓ Database
- [ ] Create dedicated database user (with limited privileges)
- [ ] Enable SSL for database connection
- [ ] Set up automated backups
- [ ] Enable replication for high availability

# ✓ Application
- [ ] Update CORS_ALLOWED_ORIGINS to production domain
- [ ] Disable debug logging (spring.jpa.show-sql=false)
- [ ] Set logging to WARN level minimum
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting

# ✓ Frontend
- [ ] Update API_BASE_URL to production backend
- [ ] Enable CSP headers
- [ ] Minify and bundle JavaScript
- [ ] Set up CDN for static assets

# ✓ Monitoring
- [ ] Set up centralized logging (ELK, Splunk, etc.)
- [ ] Configure security alerts
- [ ] Set up intrusion detection
- [ ] Monitor failed login attempts
- [ ] Track API response times and errors
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-22 | Initial security & governance policy |

---

**Document Classification**: Internal Use  
**Access Level**: Engineering Team Only  
**Review Frequency**: Quarterly
