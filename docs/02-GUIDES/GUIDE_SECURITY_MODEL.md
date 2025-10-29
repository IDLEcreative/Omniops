# Security Model Documentation

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-28
**Verified For:** v0.1.0
**Migration:** 20251028_fix_security_advisories.sql
**Dependencies:**
- [Database Schema](../01-ARCHITECTURE/database-schema.md) - RLS policy implementation
- [Customer Config Security](GUIDE_CUSTOMER_CONFIG_SECURITY.md) - API security model
**Estimated Read Time:** 36 minutes

**Version**: 1.1

## Purpose
Comprehensive platform security model documentation covering Row Level Security policies, view security (SECURITY INVOKER vs DEFINER), debug endpoint protection, multi-tenant isolation, access control patterns, and security best practices for Omniops platform with complete RLS policies by table and testing procedures.

## Quick Links
- [Security Principles](#security-principles) - Core guarantees
- [Debug Endpoint Protection](#debug-endpoint-protection) - Production safeguards
- [RLS Overview](#row-level-security-rls-overview) - Policy framework
- [View Security](#view-security-security-invoker-vs-security-definer) - View permissions
- [RLS Policies by Table](#rls-policies-by-table) - Complete policy reference
- [Testing RLS](#testing-rls-policies) - Security validation

## Keywords
security model, Row Level Security, RLS, PostgreSQL policies, multi-tenant isolation, RBAC, debug protection, view security, SECURITY INVOKER, SECURITY DEFINER, access control, Supabase RLS, service_role, authenticated role, audit trail, security testing

## Aliases
- "RLS" (also known as: Row Level Security, database policies, PostgreSQL policies)
- "SECURITY INVOKER" (also known as: invoker rights, user context execution)
- "SECURITY DEFINER" (also known as: definer rights, owner context execution, elevated privileges)
- "multi-tenant isolation" (also known as: tenant separation, data isolation, organization-scoped access)

---

## Overview

This document describes the comprehensive security model for the Omniops platform, including Row Level Security (RLS) policies, view security, debug endpoint protection, and access control patterns.

---

## Table of Contents

1. [Security Principles](#security-principles)
2. [Debug Endpoint Protection](#debug-endpoint-protection)
3. [Row Level Security (RLS) Overview](#row-level-security-rls-overview)
4. [View Security: SECURITY INVOKER vs SECURITY DEFINER](#view-security-security-invoker-vs-security-definer)
5. [RLS Policies by Table](#rls-policies-by-table)
6. [Access Control Patterns](#access-control-patterns)
7. [Testing RLS Policies](#testing-rls-policies)
8. [Security Best Practices](#security-best-practices)

---

## Security Principles

### Core Security Guarantees

1. **Multi-Tenant Isolation**: Users can only access data for domains in their organization
2. **Principle of Least Privilege**: Default deny; explicit grant required
3. **Defense in Depth**: Multiple layers of security (RLS + application logic)
4. **Audit Trail**: All sensitive operations logged in `gdpr_audit_log`

### Security Roles

| Role | Access Level | Use Case |
|------|--------------|----------|
| `service_role` | Full access to all tables | Backend API operations, migrations, system tasks |
| `authenticated` | Organization-scoped access | Dashboard users, authenticated API calls |
| `anon` | Public endpoints only | Unauthenticated chat widget, public APIs |

---

## Debug Endpoint Protection

### Overview

All debug, test, and diagnostic endpoints are **blocked in production** by default to prevent information disclosure, configuration leakage, and unauthorized system access.

### Protected Endpoint Patterns

The following endpoint patterns are automatically blocked in production:

| Pattern | Examples | Risk Level |
|---------|----------|------------|
| `/api/debug/*` | `/api/debug/example.com` | 🔴 CRITICAL - Exposes configuration, stats, credentials |
| `/api/test-*` | `/api/test-rag`, `/api/test-embeddings`, `/api/test-db` | 🔴 CRITICAL - Database access, API testing |
| `/api/check-*` | `/api/check-rag`, `/api/check-domain-content` | 🟡 HIGH - System diagnostics |
| `/api/fix-*` | `/api/fix-rag`, `/api/fix-customer-config` | 🔴 CRITICAL - Modifies system state |
| `/api/setup-*` | `/api/setup-rag`, `/api/setup-rag-production` | 🔴 CRITICAL - Configuration changes |
| `/api/*/test` | `/api/woocommerce/test`, `/api/shopify/test` | 🟡 HIGH - Integration testing |

### Protection Strategy: Defense in Depth

**Layer 1: Middleware Protection**
```typescript
// middleware.ts
if (isProduction && !debugEnabled) {
  const debugPatterns = [
    '/api/debug', '/api/test-', '/api/check-',
    '/api/fix-', '/api/setup-', // ... more patterns
  ];

  if (isDebugEndpoint) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
```

**Layer 2: Endpoint-Level Protection**
```typescript
// Each debug endpoint also checks internally
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // ... endpoint logic
}
```

### Environment Configuration

**Production (Default):**
```bash
NODE_ENV=production
# Debug endpoints blocked automatically
```

**Production with Debug Access (Emergency Only):**
```bash
NODE_ENV=production
ENABLE_DEBUG_ENDPOINTS=true  # ⚠️ Use with extreme caution
```

**Development:**
```bash
NODE_ENV=development
# Debug endpoints available
```

### Security Guarantees

✅ **404 Response**: All blocked endpoints return generic 404 "Not found"
✅ **No Information Leakage**: Error messages don't reveal why endpoint is blocked
✅ **No Bypass**: Even compromised application code can't enable debug endpoints without environment variable
✅ **Audit Trail**: All debug endpoint access should be logged and monitored

### Testing Debug Protection

See `__tests__/api/security/debug-endpoints.test.ts` for comprehensive tests:

```typescript
it('should block debug endpoints in production', async () => {
  process.env.NODE_ENV = 'production';
  const response = await fetch('/api/debug/test');
  expect(response.status).toBe(404);
});
```

### Protected Endpoints Inventory

**Complete list of protected endpoints:**

1. `/api/debug/[domain]` - Domain configuration and statistics
2. `/api/test-rag` - RAG system testing
3. `/api/test-embeddings` - Embeddings search testing
4. `/api/test-db` - Database connectivity testing
5. `/api/test-woocommerce` - WooCommerce integration testing
6. `/api/test-woo` - WooCommerce quick test
7. `/api/check-rag` - RAG health check
8. `/api/check-domain-content` - Domain content verification
9. `/api/fix-rag` - RAG system repair
10. `/api/fix-customer-config` - Customer configuration repair
11. `/api/setup-rag` - RAG initialization
12. `/api/setup-rag-production` - Production RAG setup
13. `/api/debug-rag` - RAG debugging (has own protection)
14. `/api/simple-rag-test` - Simple RAG test
15. `/api/woocommerce/test` - WooCommerce full test
16. `/api/woocommerce/cart/test` - Cart endpoint testing
17. `/api/woocommerce/customers/test` - Customer endpoint testing
18. `/api/woocommerce/customer-test` - Customer action testing
19. `/api/shopify/test` - Shopify integration testing
20. `/api/dashboard/test-connection` - Dashboard connection testing

### Monitoring and Alerts

**Recommended monitoring:**

```sql
-- Track blocked debug endpoint attempts (if logged)
SELECT COUNT(*) as blocked_attempts
FROM api_logs
WHERE path LIKE '/api/debug%'
  OR path LIKE '/api/test-%'
  OR path LIKE '/api/check-%'
  OR path LIKE '/api/fix-%'
  OR path LIKE '/api/setup-%'
AND status = 404
AND created_at > NOW() - INTERVAL '1 hour';
```

**Alert thresholds:**
- 🚨 **CRITICAL**: >10 blocked debug endpoint attempts in 1 hour
- ⚠️ **WARNING**: Debug endpoints enabled in production (`ENABLE_DEBUG_ENDPOINTS=true`)
- 🚨 **CRITICAL**: Debug endpoint accessed with valid credentials (should never happen)

### Emergency Access Procedure

**If debug access is needed in production:**

1. **Approve**: Get explicit approval from security team
2. **Enable**: Set `ENABLE_DEBUG_ENDPOINTS=true` environment variable
3. **Redeploy**: Restart application to apply change
4. **Time-Limit**: Enable for maximum 1 hour
5. **Audit**: Log all actions taken during debug session
6. **Disable**: Remove flag immediately after debugging
7. **Review**: Document what was accessed and why

**Never:**
- ❌ Leave debug endpoints enabled permanently
- ❌ Share debug endpoint URLs with untrusted parties
- ❌ Use debug endpoints for normal operations
- ❌ Commit `ENABLE_DEBUG_ENDPOINTS=true` to version control

---

## Row Level Security (RLS) Overview

### What is RLS?

Row Level Security (RLS) is a PostgreSQL feature that restricts which rows a user can access in a table. It acts as an invisible `WHERE` clause on every query.

**Example:**
```sql
-- Without RLS: User sees all rows
SELECT * FROM chat_telemetry;

-- With RLS: User only sees rows they're authorized for
SELECT * FROM chat_telemetry
WHERE domain IN (SELECT domain FROM customer_configs WHERE organization_id IN (...));
```

### Why RLS Matters

1. **Data Isolation**: Prevents cross-tenant data leakage
2. **SQL Injection Protection**: Filters applied at database level
3. **API Security**: Even compromised application code can't bypass RLS
4. **Compliance**: GDPR/CCPA requirement for data access control

### RLS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Query                              │
│  SELECT * FROM chat_telemetry WHERE domain = 'evil.com'     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              RLS Policy Enforcement (Database)               │
│  ✓ Check auth.role()                                        │
│  ✓ Check auth.uid()                                         │
│  ✓ Join with organization_members table                     │
│  ✓ Filter to authorized domains only                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Filtered Results                           │
│  Returns only rows user is authorized to see                │
└─────────────────────────────────────────────────────────────┘
```

---

## View Security: SECURITY INVOKER vs SECURITY DEFINER

### The Problem with SECURITY DEFINER

**SECURITY DEFINER** views execute with the permissions of the view creator (often superuser), bypassing RLS:

```sql
-- ❌ SECURITY DEFINER (Security Risk)
CREATE VIEW chat_telemetry_metrics
SECURITY DEFINER  -- Runs as superuser, ignores RLS
AS SELECT * FROM chat_telemetry;

-- Result: All users can see ALL telemetry data, violating tenant isolation
```

### The Solution: SECURITY INVOKER

**SECURITY INVOKER** views execute with the permissions of the querying user, respecting RLS:

```sql
-- ✅ SECURITY INVOKER (Secure)
CREATE VIEW chat_telemetry_metrics
SECURITY INVOKER  -- Runs as current user, respects RLS
AS SELECT * FROM chat_telemetry;

-- Result: Users only see telemetry for their organization's domains
```

### Views Updated in Migration

All telemetry views now use `SECURITY INVOKER`:

| View Name | Purpose | RLS Behavior |
|-----------|---------|--------------|
| `chat_telemetry_metrics` | Hourly aggregated metrics | Respects `chat_telemetry` RLS |
| `chat_telemetry_domain_costs` | Monthly cost breakdown by domain | Filters by user's organization |
| `chat_telemetry_cost_analytics` | Daily cost analytics by model | Respects `chat_telemetry` RLS |
| `chat_telemetry_hourly_costs` | Hourly cost tracking | Respects `chat_telemetry` RLS |

---

## RLS Policies by Table

### 1. `chat_telemetry_rollups`

**Purpose**: Aggregated telemetry metrics for dashboard performance.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage all telemetry rollups"
ON chat_telemetry_rollups FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Read-only access to all rollups
CREATE POLICY "Authenticated users can view telemetry rollups"
ON chat_telemetry_rollups FOR SELECT
USING (auth.role() = 'authenticated');
```

**Access Pattern:**
- ✅ Backend APIs can write aggregated data
- ✅ Dashboard users can read all historical rollups
- ❌ No filtering by organization (data is pre-aggregated and non-sensitive)

**Rationale**: Rollups contain aggregate statistics only (counts, averages), not raw data. Allowing all authenticated users to view aggregates doesn't leak sensitive information.

---

### 2. `chat_telemetry_domain_rollups`

**Purpose**: Domain-specific telemetry rollups for customer dashboards.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage domain rollups"
ON chat_telemetry_domain_rollups FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Can only view their organization's domains
CREATE POLICY "Authenticated users can view their domain rollups"
ON chat_telemetry_domain_rollups FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

**Access Pattern:**
- ✅ Users see rollups for `example.com` if they're in the org that owns `example.com`
- ❌ Users cannot see rollups for other organizations' domains

**Rationale**: Domain rollups contain customer-specific data. Multi-tenant isolation is critical.

---

### 3. `chat_telemetry_model_rollups`

**Purpose**: Model-specific telemetry rollups for cost tracking.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage model rollups"
ON chat_telemetry_model_rollups FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Can view their org's domains + global rollups
CREATE POLICY "Authenticated users can view their model rollups"
ON chat_telemetry_model_rollups FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (domain IS NULL OR domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  ))
);
```

**Access Pattern:**
- ✅ Users see model rollups for their organization's domains
- ✅ Users see global model rollups (where `domain IS NULL`)
- ❌ Users cannot see model rollups for other organizations

**Rationale**: Global rollups (domain=NULL) show system-wide model performance, which is non-sensitive. Domain-specific rollups are restricted.

---

### 4. `demo_attempts`

**Purpose**: Lead tracking for demo feature.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage demo attempts"
ON demo_attempts FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Read-only access to all demo attempts
CREATE POLICY "Authenticated users can view demo attempts"
ON demo_attempts FOR SELECT
USING (auth.role() = 'authenticated');
```

**Access Pattern:**
- ✅ Backend APIs can log demo attempts
- ✅ Marketing dashboard users can view all lead data
- ❌ No filtering by organization (this is lead gen data, not customer data)

**Rationale**: Demo attempts are marketing/sales data, not customer-specific. All staff should see lead pipeline.

---

### 5. `gdpr_audit_log`

**Purpose**: GDPR compliance audit trail.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage GDPR audit log"
ON gdpr_audit_log FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Can only view logs for their organization's domains
CREATE POLICY "Authenticated users can view their domain GDPR logs"
ON gdpr_audit_log FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

**Access Pattern:**
- ✅ Users see GDPR requests for their organization's domains
- ❌ Users cannot see other organizations' GDPR audit logs

**Rationale**: GDPR logs are sensitive compliance data. Strict tenant isolation required.

---

### 6. `widget_configs` (Conditional)

**Purpose**: Widget customization settings.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage widget configs"
ON widget_configs FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Can view their organization's widget configs
CREATE POLICY "Users can view their organization widget configs"
ON widget_configs FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Authenticated users: Can update their organization's widget configs
CREATE POLICY "Users can update their organization widget configs"
ON widget_configs FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

**Access Pattern:**
- ✅ Users can view and update widget configs for their organization's domains
- ❌ Users cannot modify other organizations' widget configs

**Rationale**: Widget configs are customer-specific branding/settings. Write access must be restricted.

---

### 7. `widget_config_history` (Conditional)

**Purpose**: Audit trail for widget configuration changes.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage widget config history"
ON widget_config_history FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Read-only access to their organization's history
CREATE POLICY "Users can view their organization widget history"
ON widget_config_history FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

**Access Pattern:**
- ✅ Users see change history for their organization's widget configs
- ❌ Users cannot see other organizations' history

**Rationale**: Configuration history is part of audit trail. Read-only to preserve integrity.

---

### 8. `widget_config_variants` (Conditional)

**Purpose**: A/B testing variants for widget configurations.

**RLS Policies:**

```sql
-- Service role: Full access
CREATE POLICY "Service role can manage widget config variants"
ON widget_config_variants FOR ALL
USING (auth.role() = 'service_role');

-- Authenticated users: Can view their organization's variants
CREATE POLICY "Users can view their organization widget variants"
ON widget_config_variants FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Authenticated users: Can create new variants for their organization
CREATE POLICY "Users can manage their organization widget variants"
ON widget_config_variants FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

**Access Pattern:**
- ✅ Users can create and view A/B test variants for their domains
- ❌ Users cannot access other organizations' variants

**Rationale**: A/B test data is sensitive competitive information. Strict isolation required.

---

## Access Control Patterns

### Organization-Based Access Control

**Pattern Used**: Multi-tenant isolation via organization membership lookup.

**Query Pattern:**
```sql
-- Step 1: Get current user's ID
auth.uid()  -- e.g., 'a1b2c3d4-...'

-- Step 2: Find organizations user belongs to
SELECT organization_id FROM organization_members
WHERE user_id = auth.uid()

-- Step 3: Find domains owned by those organizations
SELECT domain FROM customer_configs
WHERE organization_id IN (...)

-- Step 4: Filter data to those domains only
WHERE domain IN (...)
```

**Performance Optimization:**
- All lookups use indexed columns (`user_id`, `organization_id`, `domain`)
- Query planner can optimize the subquery chain
- No N+1 query problems at application layer

### Role-Based Access Control

| Role | Full Access Tables | Scoped Access Tables | No Access |
|------|-------------------|----------------------|-----------|
| `service_role` | All tables | N/A | None |
| `authenticated` | None | Domain-scoped tables | Raw telemetry logs |
| `anon` | None | Public chat endpoints | Everything else |

---

## Testing RLS Policies

### Manual Testing via SQL Editor

```sql
-- Test 1: Service role should see all data
SET ROLE service_role;
SELECT COUNT(*) FROM chat_telemetry_domain_rollups;
-- Expected: All rows

-- Test 2: Authenticated user should see only their org's data
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT COUNT(*) FROM chat_telemetry_domain_rollups;
-- Expected: Only rows for user's organization domains

-- Test 3: Verify isolation
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';
SELECT * FROM chat_telemetry_domain_rollups
WHERE domain = 'other-org-domain.com';
-- Expected: Zero rows (access denied)
```

### Automated Testing Script

See `test-rls-policies.ts` for comprehensive automated tests.

---

## Security Best Practices

### Development Guidelines

1. **Always Enable RLS**: Default to RLS on all new tables
2. **Service Role Only**: Use service role for system operations, never user role
3. **Test Policies**: Write tests for every RLS policy
4. **Audit Access**: Monitor `pgaudit` logs for suspicious queries
5. **Least Privilege**: Grant minimum permissions required

### Common Pitfalls

❌ **DON'T**: Use `SECURITY DEFINER` on views accessing RLS-protected tables
```sql
-- This bypasses RLS!
CREATE VIEW bad_view SECURITY DEFINER AS
SELECT * FROM chat_telemetry;
```

✅ **DO**: Use `SECURITY INVOKER` to respect RLS
```sql
CREATE VIEW good_view SECURITY INVOKER AS
SELECT * FROM chat_telemetry;
```

❌ **DON'T**: Expose service role credentials to frontend
```javascript
// Never do this!
const client = createClient(url, SERVICE_ROLE_KEY);
```

✅ **DO**: Use anon key on frontend, service key on backend only
```javascript
// Frontend: anon key
const client = createClient(url, ANON_KEY);

// Backend: service key (never exposed)
const adminClient = createClient(url, SERVICE_ROLE_KEY);
```

### Monitoring Security

**Key Metrics to Track:**
- Failed RLS policy checks (PostgreSQL logs)
- Service role usage patterns (should be backend only)
- Cross-organization data access attempts (should be zero)
- GDPR audit log entries (all data exports/deletions)

**Alerting Thresholds:**
- ⚠️ Warning: Service role used from frontend
- 🚨 Critical: RLS policy bypass attempt detected
- 🚨 Critical: User queries data outside their organization

---

## Verification Checklist

After applying the security migration, verify:

- [ ] All 4 telemetry views use `SECURITY INVOKER`
- [ ] All 8 tables have RLS enabled
- [ ] Service role policies exist for all tables
- [ ] Organization-scoped policies exist for sensitive tables
- [ ] No `SECURITY DEFINER` functions without explicit justification
- [ ] All policies tested with automated test suite
- [ ] Security advisors show zero critical issues

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Access Control Guide](https://owasp.org/www-project-proactive-controls/v3/en/c7-enforce-access-controls)
- Migration: `supabase/migrations/20251028_fix_security_advisories.sql`

---

**Last Reviewed**: 2025-10-28
**Next Review**: 2025-11-28 (or after major schema changes)
