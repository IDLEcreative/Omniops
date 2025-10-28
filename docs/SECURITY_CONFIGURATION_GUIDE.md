# Security Configuration Guide

**Last Updated:** 2025-10-28
**Status:** Manual configuration required for non-code security settings

This guide documents the security configurations that cannot be applied via code migrations and must be configured through the Supabase Dashboard.

---

## ✅ Code-Level Security (COMPLETED)

All code-level security issues have been resolved via SQL migrations:

- ✅ **Security Definer Views**: All 4 telemetry views now use `security_invoker = true`
- ✅ **RLS on Widget Tables**: Enabled on `widget_configs`, `widget_config_history`, `widget_config_variants`
- ✅ **Materialized View Access**: Created secure wrapper `organization_seat_usage_secure` with proper access control

---

## 🟡 Dashboard Configuration Required

The following security enhancements require manual configuration through the Supabase Dashboard:

### 1. Enable Leaked Password Protection

**Priority:** HIGH
**Effort:** 2 minutes
**Risk if not configured:** Users can set passwords that have been exposed in data breaches

#### What It Does
Checks all passwords against the [HaveIBeenPwned.org](https://haveibeenpwned.com) database to prevent users from setting compromised passwords.

#### Configuration Steps

1. Navigate to: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **Authentication** → **Policies**
2. Scroll to **Password Strength** section
3. Toggle ON: **"Prevent sign-ups with breached passwords"**
4. Click **Save**

#### Verification
Try signing up with a known compromised password like `password123` - it should be rejected.

---

### 2. Enable Additional MFA Options

**Priority:** MEDIUM
**Effort:** 5 minutes
**Risk if not configured:** Limited account security options for users

#### What It Does
Enables Time-based One-Time Password (TOTP) authentication for multi-factor authentication.

#### Configuration Steps

1. Navigate to: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **Authentication** → **Providers**
2. Scroll to **Multi-Factor Authentication (MFA)** section
3. Enable **TOTP (Authenticator Apps)**:
   - Toggle ON: **"Enable TOTP"**
   - Configure issuer name (e.g., "YourAppName")
   - Click **Save**

4. *Optional:* Enable **Phone (SMS)** if you have an SMS provider configured

#### Verification
Test MFA enrollment flow in your application's security settings.

---

### 3. Upgrade PostgreSQL Version

**Priority:** MEDIUM
**Effort:** 10 minutes + brief downtime
**Risk if not configured:** Missing security patches in PostgreSQL

#### What It Does
Upgrades your PostgreSQL database from version **17.4.1.074** to the latest patched version with security fixes.

#### ⚠️ Important Notes

- **Downtime:** Database will be unavailable for ~5-10 minutes during upgrade
- **Backup:** Supabase automatically creates a backup before upgrading
- **Rollback:** You can restore from backup if issues occur
- **Test First:** Consider testing in a branch environment first

#### Configuration Steps

1. Navigate to: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **Settings** → **Infrastructure**

2. Locate **Database Version** section

3. Review available upgrade:
   - Current: `supabase-postgres-17.4.1.074`
   - Available: Check for newer versions with security patches

4. Schedule upgrade:
   - **Option A:** Upgrade immediately (recommended for development)
   - **Option B:** Schedule for off-peak hours (recommended for production)

5. Click **Upgrade** and confirm

6. Wait for upgrade to complete (~5-10 minutes)

#### Verification

```sql
-- Run in SQL Editor to verify new version
SELECT version();
```

Expected output should show a version newer than `17.4.1.074`.

---

## 📊 Security Checklist

Use this checklist to track your configuration progress:

### Code-Level Security
- [x] Security Definer Views fixed
- [x] RLS enabled on widget tables
- [x] Materialized view access restricted

### Dashboard Configuration
- [ ] Leaked password protection enabled
- [ ] MFA (TOTP) enabled
- [ ] PostgreSQL upgraded to latest version

---

## 🔍 Verification Commands

After completing dashboard configurations, verify security status:

### Check Security Advisories
```bash
# Using Supabase MCP tools in Claude Code
# Run: Check security advisories
```

Expected result: Only INFO-level advisories remaining, no ERROR or WARN levels.

### Check Auth Configuration
```bash
# Test leaked password protection
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected: Error about weak/compromised password
```

### Check PostgreSQL Version
```sql
SELECT version();
```

---

## 📝 Additional Recommendations

### Security Best Practices

1. **Regular Security Audits**
   - Run `get_advisors(type: 'security')` monthly
   - Review and address new warnings promptly

2. **MFA Enforcement**
   - Consider requiring MFA for organization owners/admins
   - Implement in application logic using Supabase Auth

3. **Database Maintenance**
   - Subscribe to Supabase security bulletins
   - Apply PostgreSQL upgrades within 30 days of release

4. **Access Monitoring**
   - Review RLS policies quarterly
   - Monitor failed authentication attempts
   - Audit user access patterns

### Future Enhancements

Consider implementing these additional security measures:

- **Rate Limiting**: Add stricter rate limits for auth endpoints
- **IP Allowlisting**: Restrict database access to known IPs (production)
- **Audit Logging**: Enable comprehensive audit trails for sensitive operations
- **Secrets Rotation**: Implement automatic rotation for API keys and tokens

---

## 🆘 Support Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Security Best Practices**: https://supabase.com/docs/guides/platform/going-into-prod
- **Database Linter**: https://supabase.com/docs/guides/database/database-linter
- **Auth Configuration**: https://supabase.com/docs/guides/auth

---

## 📋 Change Log

| Date | Action | Status |
|------|--------|--------|
| 2025-10-28 | Fixed Security Definer views | ✅ Complete |
| 2025-10-28 | Enabled RLS on widget tables | ✅ Complete |
| 2025-10-28 | Secured organization_seat_usage materialized view | ✅ Complete |
| 2025-10-28 | Documented dashboard configuration steps | 📝 Documented |

---

**Next Steps:**
1. Complete dashboard configurations following sections 1-3
2. Run verification commands
3. Check off items in Security Checklist
4. Schedule quarterly security reviews
