# Pre-Deployment Security Checklist
## Dayflow HRMS Application

**Version:** 1.0  
**Last Updated:** 2026-08-22

---

## Developer Pre-Commit Checklist ✅

Before committing code, verify:

- [ ] No secrets, passwords, or API keys in code
- [ ] No hardcoded database credentials
- [ ] No hardcoded JWT secrets
- [ ] No sensitive data in log statements
- [ ] No `.env` files committed (only `.env.example`)
- [ ] No AWS keys, tokens, or credentials
- [ ] No commented-out credentials or secrets
- [ ] Input validation added for all user inputs
- [ ] Password fields marked with @JsonIgnore
- [ ] Sensitive API endpoints require authentication
- [ ] SQL queries use parameterized statements
- [ ] No SQL injection vulnerabilities
- [ ] Error messages don't leak system details
- [ ] Rate limiting applied to auth endpoints
- [ ] Security headers configured correctly
- [ ] CORS origins properly restricted
- [ ] ESLint passes without errors: `npm run lint`

**Command to verify:**
```bash
# Check for common secrets
grep -r "password\|secret\|key\|token" src/ | grep -v ".example\|test\|sample"

# Check no .env files
git status | grep ".env"
```

---

## Code Review Checklist ✅

When reviewing pull requests, verify:

- [ ] No hardcoded credentials introduced
- [ ] Input validation for all new endpoints
- [ ] Database queries are parameterized
- [ ] Sensitive data properly handled (@JsonIgnore, etc.)
- [ ] Error handling is secure (no data leakage)
- [ ] New auth endpoints rate limited
- [ ] RBAC enforced with @PreAuthorize
- [ ] Frontend token handling is secure
- [ ] No new security warnings in linting
- [ ] Security tests pass

**Questions to ask:**
- Does this code handle user input? → Is it validated?
- Does this access the database? → Are queries parameterized?
- Does this expose sensitive data? → Is it properly hidden?
- Does this authenticate users? → Is rate limiting applied?
- Is this a new endpoint? → Is authentication required?

---

## Build & Compilation Checklist ✅

Before pushing to CI/CD:

**Backend:**
```bash
# [ ] Clean build succeeds
mvn clean compile

# [ ] All tests pass
mvn test

# [ ] No security warnings
mvn dependency-check:check

# [ ] Code quality check passes
mvn sonar:sonar
```

**Frontend:**
```bash
# [ ] Linting passes
npm run lint

# [ ] Build succeeds
npm run build

# [ ] No console errors/warnings
npm run dev  # Check console

# [ ] No hardcoded URLs pointing to dev server
grep -r "localhost:8080" src/
```

---

## Staging Deployment Checklist ✅

### Environment Setup

- [ ] `.env` file created (from `.env.example`)
- [ ] All environment variables populated:
  - [ ] DB_URL (with SSL enabled)
  - [ ] DB_USERNAME
  - [ ] DB_PASSWORD
  - [ ] JWT_SECRET (generated with `openssl rand -base64 32`)
  - [ ] JWT_EXPIRATION set
  - [ ] CORS_ALLOWED_ORIGINS set to staging domain
  - [ ] NODE_ENV=staging

### Database Setup

- [ ] Database server running
- [ ] SSL enabled on database connection
- [ ] Dedicated database user created (limited privileges)
- [ ] Database backups configured
- [ ] Migration scripts run successfully

### Application Configuration

- [ ] Spring profiles configured correctly
- [ ] Logging level set to INFO (not DEBUG)
- [ ] Security headers verified in browser
- [ ] CORS origins restricted correctly
- [ ] Rate limiting verified working
- [ ] Error handling returning safe messages

### Security Verification

```bash
# [ ] No hardcoded secrets in running application
curl http://staging.example.com/api/health | grep secret  # Should be empty

# [ ] JWT token validation working
# Test: login, get token, verify it works
# Test: modify token, verify it fails

# [ ] Rate limiting working
# Test: hammer auth endpoint, verify 429 response

# [ ] CORS working correctly
# Test: call API from non-allowed origin, should fail

# [ ] SSL working (HTTPS only)
curl -k https://staging.example.com/api/health
```

### Testing

- [ ] Authentication flow tested
- [ ] All user roles tested (EMPLOYEE, HR)
- [ ] Protected endpoints require auth
- [ ] Invalid tokens rejected
- [ ] Expired tokens handled correctly
- [ ] Database connectivity stable
- [ ] Error messages don't leak data
- [ ] Audit logging working

---

## Production Deployment Checklist ✅

### Pre-Deployment

- [ ] All staging tests passed
- [ ] Code review approved
- [ ] Security audit completed
- [ ] Performance tested under load
- [ ] Rollback plan documented
- [ ] Backup verified

### Infrastructure

- [ ] Production domain configured with valid HTTPS certificate
- [ ] Firewall configured to allow only necessary ports (80, 443)
- [ ] SSH key-based access only (no password)
- [ ] Admin access via VPN only
- [ ] Database replica/backup configured
- [ ] Monitoring and alerting enabled
- [ ] Log aggregation configured
- [ ] CDN configured for static assets

### Application Configuration

- [ ] Environment variables set on production server
- [ ] Production JWT_SECRET generated: `openssl rand -base64 32`
- [ ] CORS_ALLOWED_ORIGINS set to production domain ONLY
- [ ] Database URL points to production database
- [ ] DB credentials are strong (20+ characters)
- [ ] Logging level set to WARN minimum
- [ ] Debug mode disabled
- [ ] API docs available only to authenticated users
- [ ] Admin endpoints restricted to admin IPs

### Security Configuration

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present and correct
- [ ] HSTS header set: `Strict-Transport-Security: max-age=31536000`
- [ ] CSP header configured properly
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff
- [ ] Cookie security flags: HttpOnly, Secure, SameSite=Strict
- [ ] CORS properly configured (no wildcard origins)
- [ ] Rate limiting active
- [ ] Account lockout active

### Monitoring & Alerting

- [ ] CPU/Memory/Disk monitoring enabled
- [ ] Database connection pool monitoring
- [ ] Error rate monitoring and alerting
- [ ] Failed authentication attempts monitored
- [ ] Rate limit trigger alerts configured
- [ ] Database backup completion alerts
- [ ] HTTPS certificate expiration alerts (30 days before)
- [ ] Disk space alerts (80% threshold)

### Backup & Disaster Recovery

- [ ] Database backups scheduled and verified
- [ ] Backup retention policy documented
- [ ] Restore process tested
- [ ] Disaster recovery plan documented
- [ ] RTO/RPO targets defined
- [ ] Business continuity plan reviewed

### Documentation

- [ ] Deployment notes documented
- [ ] Security configuration documented
- [ ] Environment variables documented
- [ ] Runbooks for common issues created
- [ ] Incident response procedures documented
- [ ] On-call rotation established
- [ ] Escalation procedures documented

### Post-Deployment

- [ ] All health checks passing
- [ ] Application responding normally
- [ ] Database connected and healthy
- [ ] Logging flowing correctly
- [ ] Monitoring dashboards updated
- [ ] Alert notifications tested
- [ ] Team notified of successful deployment
- [ ] Status page updated

---

## Incident Response Checklist ✅

### When Security Incident Occurs

1. **Immediate Actions (First 5 minutes)**
   - [ ] Isolate affected systems
   - [ ] Stop bleeding (disable compromised accounts)
   - [ ] Preserve evidence (logs, memory dumps)
   - [ ] Notify security officer
   - [ ] Begin incident log

2. **Investigation (First Hour)**
   - [ ] Determine scope of compromise
   - [ ] Review access logs
   - [ ] Check for lateral movement
   - [ ] Identify entry point
   - [ ] Document timeline

3. **Containment (First 4 Hours)**
   - [ ] Rotate compromised credentials
   - [ ] Update security groups/firewall
   - [ ] Patch vulnerabilities
   - [ ] Update WAF rules if needed
   - [ ] Force re-login for affected users

4. **Recovery (First Day)**
   - [ ] Restore from clean backup
   - [ ] Verify integrity of restore
   - [ ] Enable monitoring
   - [ ] Redeploy hardened configuration
   - [ ] Run vulnerability scans

5. **Post-Incident (Next Week)**
   - [ ] Complete root cause analysis
   - [ ] Update documentation
   - [ ] Implement preventive measures
   - [ ] Conduct team debriefing
   - [ ] Report to stakeholders

---

## Critical Secret Rotation ✅

### If Database Credentials Leaked

```bash
# 1. Generate new password
NEW_PASS=$(openssl rand -base64 32)
echo "New Password: $NEW_PASS"

# 2. Update database user
mysql -h production-host -u root -p
> ALTER USER 'dayflow_user'@'%' IDENTIFIED BY '$NEW_PASS';
> FLUSH PRIVILEGES;

# 3. Update environment variable
aws secretsmanager update-secret --secret-id dayflow/db_password --secret-string "$NEW_PASS"

# 4. Restart application (rolling restart)
kubectl rollout restart deployment/dayflow-backend

# 5. Verify connectivity
curl https://your-domain.com/api/health
```

### If JWT Secret Compromised

```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 32)
echo "New JWT Secret: $NEW_SECRET"

# 2. Update environment variable
aws secretsmanager update-secret --secret-id dayflow/jwt_secret --secret-string "$NEW_SECRET"

# 3. Restart application
kubectl rollout restart deployment/dayflow-backend

# 4. Force all users to re-login
# All existing tokens automatically invalid

# 5. Monitor for unusual activity
tail -f /var/log/dayflow/auth.log
```

---

## Monthly Security Tasks

- [ ] Review and approve access logs
- [ ] Update dependencies: `mvn versions:display-updates`
- [ ] Run security scanners: `mvn dependency-check:check`
- [ ] Review failed login attempts
- [ ] Verify backups completed successfully
- [ ] Check SSL certificate expiration
- [ ] Review audit logs for anomalies
- [ ] Update security patches
- [ ] Review and update incident response plan
- [ ] Team security training session

---

## Quarterly Security Tasks

- [ ] Security audit of codebase
- [ ] Penetration testing
- [ ] Review and update security policies
- [ ] Compliance check
- [ ] Disaster recovery drill
- [ ] Update security documentation
- [ ] Review and rotate credentials
- [ ] Infrastructure security review
- [ ] Team security assessment
- [ ] Stakeholder security briefing

---

## Annual Security Tasks

- [ ] Full security assessment
- [ ] External penetration test
- [ ] Regulatory compliance audit
- [ ] Disaster recovery test
- [ ] Security training for all staff
- [ ] Update security policies
- [ ] Review insurance coverage
- [ ] Refresh incident response plan
- [ ] Board security briefing

---

## Support & Questions

For security questions or concerns:

1. **Technical Questions:** Contact your Security Officer
2. **Urgent Issues:** Use incident hotline
3. **Policy Questions:** Review SECURITY.md
4. **Setup Questions:** See SECURITY-SETUP.md

---

**Remember:** Security is everyone's responsibility!

Last Updated: 2026-08-22  
Classification: Internal Use
