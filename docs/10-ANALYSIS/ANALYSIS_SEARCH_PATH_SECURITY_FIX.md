# Database Function Security Fix: Mutable search_path Vulnerability

**Type:** Security Analysis & Fix Documentation
**Status:** Ready for Application
**Last Updated:** 2025-11-08
**Severity:** MEDIUM (SQL Injection Risk)
**Affected Functions:** 25 database functions

## Purpose

Documents the search_path SQL injection vulnerability found in 25 database functions and provides the complete fix with verification steps.

## Table of Contents

- [Vulnerability Summary](#vulnerability-summary)
- [Affected Functions](#affected-functions)
- [Security Impact](#security-impact)
- [The Fix](#the-fix)
- [Application Methods](#application-methods)
- [Verification](#verification)
- [Testing](#testing)
- [Future Prevention](#future-prevention)

---

## Vulnerability Summary

### What is the Issue?

**25 PostgreSQL functions lack immutable search_path settings**, making them vulnerable to search_path manipulation attacks.

### How the Attack Works

```sql
-- Attacker creates malicious schema and objects
CREATE SCHEMA attacker_schema;
CREATE FUNCTION attacker_schema.now() RETURNS timestamp AS $$
  BEGIN
    -- Malicious code: steal data, escalate privileges, etc.
    INSERT INTO attacker_schema.stolen_data SELECT * FROM sensitive_table;
    RETURN CLOCK_TIMESTAMP();
  END;
$$ LANGUAGE plpgsql;

-- Attacker manipulates their search_path
SET search_path = attacker_schema, public, pg_catalog;

-- When vulnerable function runs, it uses attacker's now() instead of pg_catalog.now()
SELECT vulnerable_function(); -- Runs malicious code!
```

### Why This Matters

- **103 total functions** in the database
- **78 functions** already have `SET search_path` (secured)
- **25 functions** are vulnerable (no search_path set)
- **3 of these are SECURITY DEFINER** (run with elevated privileges)

When a SECURITY DEFINER function is vulnerable, the attack can escalate privileges.

---

## Affected Functions

### 🔴 SECURITY DEFINER Functions (HIGHEST PRIORITY - 3 functions)

These run with elevated privileges, making them the most dangerous:

```
1. cleanup_old_telemetry(integer)
2. get_query_cache_stats(uuid)
3. get_user_domain_ids(uuid)
4. get_user_organization_ids(uuid) [Actually 4 total]
```

### ⚠️ Trigger Functions (15 functions)

These update timestamps on table modifications:

```
1. update_ai_quotes_updated_at()
2. update_alert_thresholds_updated_at()
3. update_custom_funnels_updated_at()
4. update_domain_discounts()
5. update_domain_subscriptions_updated_at()
6. update_monthly_usage_updated_at()
7. update_pricing_tiers_updated_at()
8. update_query_cache_updated_at()
9. update_quote_rate_limits_updated_at()
10. update_scrape_jobs_updated_at()
11. increment_config_version()
12. backfill_organization_ids()
13. refresh_analytics_views()
14. cleanup_expired_query_cache()
15. get_view_last_refresh(text)
```

### 📊 Business Logic Functions (6 functions)

Critical for billing, search, and configuration:

```
1. calculate_multi_domain_discount(uuid)
2. get_recommended_pricing_tier(integer)
3. increment_monthly_completions(uuid, integer)
4. preview_multi_domain_discount(integer, numeric)
5. save_config_snapshot(uuid, jsonb, character varying, text)
6. search_pages_by_keyword(uuid, text, integer)
```

**Total: 25 vulnerable functions**

---

## Security Impact

### Risk Level: MEDIUM

**Why Medium and not High?**
- Requires authenticated database access
- No evidence of exploitation in wild
- Other security layers (RLS, authentication) provide defense-in-depth
- Attack requires ability to create schemas (limited to privileged users)

**However:**
- **SECURITY DEFINER functions** could allow privilege escalation
- **Search functions** could be manipulated to return incorrect results
- **Billing functions** could be exploited for financial manipulation
- **Trigger functions** could corrupt audit trails

### CVSS Considerations

If this were a CVE:
- **Attack Vector**: Network (requires DB access)
- **Attack Complexity**: High (requires schema creation privileges)
- **Privileges Required**: Low (authenticated user)
- **User Interaction**: None
- **Scope**: Unchanged
- **Confidentiality**: Low to Medium
- **Integrity**: Medium
- **Availability**: Low

Estimated CVSS Score: **5.0-6.0 (MEDIUM)**

---

## The Fix

### Pattern

For every vulnerable function, add:

```sql
ALTER FUNCTION public.function_name(argument_types)
SET search_path = public, pg_catalog;
```

### Why `public, pg_catalog`?

- **public**: Where application tables/functions live
- **pg_catalog**: PostgreSQL system catalog (trusted)
- **Order matters**: Searches `public` first, then `pg_catalog`
- **No user schemas**: Prevents attacker-controlled schemas from being searched

### Complete Fix SQL

The migration file `/Users/jamesguy/Omniops/supabase/migrations/20251108000000_fix_mutable_search_path_security.sql` contains all 25 ALTER statements.

**Preview (first 5 functions):**

```sql
-- SECURITY DEFINER functions (highest priority)
ALTER FUNCTION public.cleanup_old_telemetry(integer)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_query_cache_stats(uuid)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_user_domain_ids(uuid)
SET search_path = public, pg_catalog;

ALTER FUNCTION public.get_user_organization_ids(uuid)
SET search_path = public, pg_catalog;

-- Trigger functions
ALTER FUNCTION public.update_ai_quotes_updated_at()
SET search_path = public, pg_catalog;
```

---

## Application Methods

### Method 1: Supabase Dashboard (RECOMMENDED)

**Why recommended:** No authentication issues, visual confirmation, rollback available.

**Steps:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg
2. Navigate to: **SQL Editor** (left sidebar)
3. Copy contents of migration file:
   ```
   /Users/jamesguy/Omniops/supabase/migrations/20251108000000_fix_mutable_search_path_security.sql
   ```
4. Paste into SQL Editor
5. Click **Run** button
6. Verify: "Success. No rows returned" message
7. Run verification queries (see Verification section below)

**Time required:** 2-3 minutes

---

### Method 2: Supabase CLI (If authentication configured)

```bash
# From project root
npx supabase db push

# Or apply specific migration
npx supabase migration up
```

**Prerequisites:**
- Supabase CLI configured with valid access token
- Currently experiencing: "Invalid access token format" error

---

### Method 3: Direct psql (If database password known)

```bash
psql "postgresql://postgres:PASSWORD@db.birugqyuqhiahxvxeyqg.supabase.co:5432/postgres" \
  -f supabase/migrations/20251108000000_fix_mutable_search_path_security.sql
```

**Note:** Requires database password (not available in current session)

---

### Method 4: Execute via Application Code

Created script at: `/Users/jamesguy/Omniops/scripts/database/fix-search-path-security.ts`

**Issue:** Supabase client doesn't support DDL operations via `rpc()`.

**Workaround needed:** Would require creating a PostgreSQL function that executes DDL (not recommended for security reasons).

---

## Verification

### Step 1: Check No Functions Remain Vulnerable

**Run this query after applying the fix:**

```sql
-- Should return 0 rows (all functions secured)
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS args,
  p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'backfill_organization_ids',
    'calculate_multi_domain_discount',
    'cleanup_expired_query_cache',
    'cleanup_old_telemetry',
    'get_query_cache_stats',
    'get_recommended_pricing_tier',
    'get_user_domain_ids',
    'get_user_organization_ids',
    'get_view_last_refresh',
    'increment_config_version',
    'increment_monthly_completions',
    'preview_multi_domain_discount',
    'refresh_analytics_views',
    'save_config_snapshot',
    'search_pages_by_keyword',
    'update_ai_quotes_updated_at',
    'update_alert_thresholds_updated_at',
    'update_custom_funnels_updated_at',
    'update_domain_discounts',
    'update_domain_subscriptions_updated_at',
    'update_monthly_usage_updated_at',
    'update_pricing_tiers_updated_at',
    'update_query_cache_updated_at',
    'update_quote_rate_limits_updated_at',
    'update_scrape_jobs_updated_at'
  )
  AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ' ') LIKE '%search_path%');
```

**Expected result:** 0 rows

---

### Step 2: Verify Correct search_path Set

**Run this query:**

```sql
-- Should return 25 rows, all with search_path configured
SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS args,
  array_to_string(p.proconfig, ', ') AS config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND p.proname IN (
    'backfill_organization_ids',
    'calculate_multi_domain_discount',
    'cleanup_expired_query_cache',
    'cleanup_old_telemetry',
    'get_query_cache_stats',
    'get_recommended_pricing_tier',
    'get_user_domain_ids',
    'get_user_organization_ids',
    'get_view_last_refresh',
    'increment_config_version',
    'increment_monthly_completions',
    'preview_multi_domain_discount',
    'refresh_analytics_views',
    'save_config_snapshot',
    'search_pages_by_keyword',
    'update_ai_quotes_updated_at',
    'update_alert_thresholds_updated_at',
    'update_custom_funnels_updated_at',
    'update_domain_discounts',
    'update_domain_subscriptions_updated_at',
    'update_monthly_usage_updated_at',
    'update_pricing_tiers_updated_at',
    'update_query_cache_updated_at',
    'update_quote_rate_limits_updated_at',
    'update_scrape_jobs_updated_at'
  )
ORDER BY p.proname;
```

**Expected result:** 25 rows, each with `config` = `search_path=public, pg_catalog` (or similar)

---

## Testing

### Functional Tests

After applying the fix, verify functions still work correctly:

**Test 1: Trigger Function**

```sql
-- Update a record to trigger update_domain_subscriptions_updated_at
UPDATE domain_subscriptions
SET tier = tier
WHERE id = (SELECT id FROM domain_subscriptions LIMIT 1)
RETURNING updated_at;

-- Verify updated_at changed
```

**Test 2: Search Function**

```sql
-- Test search_pages_by_keyword still works
SELECT * FROM search_pages_by_keyword(
  (SELECT id FROM customer_configs LIMIT 1),
  'test',
  5
);
```

**Test 3: Stats Function**

```sql
-- Test get_query_cache_stats still works
SELECT * FROM get_query_cache_stats(NULL);
```

**Test 4: Security Definer Function**

```sql
-- Test get_user_domain_ids still works
SELECT * FROM get_user_domain_ids(
  (SELECT id FROM auth.users LIMIT 1)
);
```

---

### Security Test

Verify the fix actually prevents search_path attacks:

```sql
-- Step 1: Create attacker schema
CREATE SCHEMA IF NOT EXISTS test_attacker;

-- Step 2: Create malicious function
CREATE OR REPLACE FUNCTION test_attacker.now()
RETURNS timestamp AS $$
BEGIN
  RAISE NOTICE 'ATTACK DETECTED: Malicious now() called!';
  RETURN clock_timestamp();
END;
$$ LANGUAGE plpgsql;

-- Step 3: Set malicious search_path
SET search_path = test_attacker, public, pg_catalog;

-- Step 4: Call a previously vulnerable function
-- This should use pg_catalog.now(), NOT test_attacker.now()
SELECT get_query_cache_stats(NULL);

-- Step 5: Check logs - should NOT see "ATTACK DETECTED" message
-- If you do see it, the fix didn't work

-- Step 6: Cleanup
DROP SCHEMA test_attacker CASCADE;
RESET search_path;
```

**Expected:** No "ATTACK DETECTED" notice appears.

---

## Future Prevention

### Guidelines for Creating New Functions

**ALWAYS include search_path when creating functions:**

```sql
CREATE OR REPLACE FUNCTION public.my_new_function(param_type)
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER  -- or SECURITY INVOKER
SET search_path = public, pg_catalog  -- ✅ ALWAYS INCLUDE THIS
AS $$
BEGIN
  -- Function body
END;
$$;
```

### Code Review Checklist

When reviewing new database functions:

- [ ] Does the function have `SET search_path`?
- [ ] Is it set to `public, pg_catalog` (or other trusted schemas)?
- [ ] If SECURITY DEFINER, is search_path definitely set?
- [ ] Are all built-in functions schema-qualified? (e.g., `pg_catalog.now()` instead of `now()`)

### Automated Detection

Add to CI/CD pipeline:

```sql
-- Query to find vulnerable functions (should return 0 rows)
SELECT
  p.proname,
  p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND (p.proconfig IS NULL OR NOT array_to_string(p.proconfig, ' ') LIKE '%search_path%');
```

Add to `.github/workflows/database-security-check.yml` or similar.

---

## References

### PostgreSQL Documentation
- [CREATE FUNCTION - search_path](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

### Security Advisories
- [PostgreSQL: search_path Security](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)

### Related Files
- Migration: `/Users/jamesguy/Omniops/supabase/migrations/20251108000000_fix_mutable_search_path_security.sql`
- Fix Script: `/Users/jamesguy/Omniops/scripts/database/fix-search-path-security.ts`

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Functions** | 103 |
| **Already Secured** | 78 (76%) |
| **Vulnerable** | 25 (24%) |
| **Security Definer** | 4 (highest risk) |
| **Trigger Functions** | 15 |
| **Business Logic** | 6 |
| **Risk Level** | MEDIUM |
| **Fix Complexity** | LOW (simple ALTER statements) |
| **Testing Required** | MEDIUM (functional + security tests) |
| **Estimated Fix Time** | 5-10 minutes |

**Recommended Action:** Apply fix via Supabase Dashboard (Method 1) immediately.

**Migration Status:** ⏳ **Ready for Application** (file created, awaiting manual application)

---

**Next Steps:**
1. ✅ Apply migration via Supabase Dashboard
2. ✅ Run verification queries
3. ✅ Run functional tests
4. ✅ Run security test
5. ✅ Update this document status to "Applied"
6. ✅ Add to function creation guidelines
7. ✅ Add automated check to CI/CD

**Document Last Updated:** 2025-11-08 by Claude (Function Security Specialist Agent)
