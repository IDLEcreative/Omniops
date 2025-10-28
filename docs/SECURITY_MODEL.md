# Security Model Documentation

> **Version**: 1.0
> **Last Updated**: 2025-10-28
> **Migration**: 20251028_fix_security_advisories.sql

## Overview

This document describes the comprehensive security model for the Omniops platform, including Row Level Security (RLS) policies, view security, and access control patterns.

---

## Table of Contents

1. [Security Principles](#security-principles)
2. [Row Level Security (RLS) Overview](#row-level-security-rls-overview)
3. [View Security: SECURITY INVOKER vs SECURITY DEFINER](#view-security-security-invoker-vs-security-definer)
4. [RLS Policies by Table](#rls-policies-by-table)
5. [Access Control Patterns](#access-control-patterns)
6. [Testing RLS Policies](#testing-rls-policies)
7. [Security Best Practices](#security-best-practices)

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
