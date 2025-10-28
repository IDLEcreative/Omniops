# Security Migration Application Guide

> **Migration**: `20251028_fix_security_advisories.sql`
> **Date**: 2025-10-28
> **Fixes**: 12 security advisory warnings (4 SECURITY DEFINER views + 8 missing RLS tables)

---

## Quick Summary

This migration fixes all 12 security warnings from Supabase's database linter:
- ✅ Removes `SECURITY DEFINER` from 4 telemetry views (replaced with `SECURITY INVOKER`)
- ✅ Enables RLS on 8 tables that were missing it
- ✅ Creates organization-based access control policies

---

## Step-by-Step Application

### Step 1: Apply the Migration

**Option A: Via Supabase SQL Editor (Recommended)**

1. **Open SQL Editor**:
   ```
   https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new
   ```

2. **Copy Migration SQL**:
   - Open file: `supabase/migrations/20251028_fix_security_advisories.sql`
   - Copy entire contents (409 lines)

3. **Execute SQL**:
   - Paste into SQL Editor
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for completion (should take 5-10 seconds)

4. **Check for Success Message**:
   Look for output like:
   ```
   NOTICE: Security advisory fix complete:
   NOTICE:   - Recreated 4 views with SECURITY INVOKER
   NOTICE:   - Enabled RLS on 8 tables
   NOTICE:   - Created RLS policies for organization-based access control
   ```

**Option B: Via Supabase CLI (If Authenticated)**

```bash
# Link to project (if not already linked)
supabase link --project-ref birugqyuqhiahxvxeyqg

# Apply migration
supabase db push

# Or apply specific migration
supabase db push --include-all
```

---

### Step 2: Verify Migration Success

Run the verification script:

```bash
npx tsx verify-security-migration.ts
```

**Expected Output:**
```
════════════════════════════════════════════════════════════════
  Security Migration Verification
  Migration: 20251028_fix_security_advisories.sql
════════════════════════════════════════════════════════════════

📋 Checking View Security...

✅ View chat_telemetry_metrics uses SECURITY INVOKER
   Security type: SECURITY INVOKER
✅ View chat_telemetry_domain_costs uses SECURITY INVOKER
   Security type: SECURITY INVOKER
✅ View chat_telemetry_cost_analytics uses SECURITY INVOKER
   Security type: SECURITY INVOKER
✅ View chat_telemetry_hourly_costs uses SECURITY INVOKER
   Security type: SECURITY INVOKER

📋 Checking RLS Enabled on Tables...

✅ Table chat_telemetry_rollups has RLS enabled
   RLS is enabled
✅ Table chat_telemetry_domain_rollups has RLS enabled
   RLS is enabled
...

Total Checks: 20+
✅ Passed: 20+
❌ Failed: 0
📊 Success Rate: 100.0%

✅ All checks passed! Security migration was successful.
```

---

### Step 3: Check Security Advisors

After applying the migration, verify all warnings are resolved:

1. **Open Security Advisors**:
   ```
   https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/advisors/security
   ```

2. **Run Security Check**:
   - Click "Run Check" or "Refresh"
   - Wait for analysis to complete

3. **Verify Results**:
   You should see **0 security issues** (down from 12).

   **Before Migration:**
   ```
   ❌ 4 SECURITY DEFINER view warnings
   ❌ 8 RLS disabled in public schema warnings
   Total: 12 issues
   ```

   **After Migration:**
   ```
   ✅ 0 security issues
   Total: 0 issues
   ```

---

### Step 4: Run RLS Policy Tests (Optional but Recommended)

Test that RLS policies work correctly:

```bash
npx tsx test-rls-policies.ts
```

**What This Tests:**
- ✅ Service role has full access
- ✅ Anonymous users are blocked from sensitive data
- ✅ Views respect RLS policies
- ✅ Multi-tenant isolation works correctly
- ✅ GDPR audit log is isolated by organization

**Expected Output:**
```
════════════════════════════════════════════════════════════════
  RLS Policy Test Suite
  Migration: 20251028_fix_security_advisories.sql
════════════════════════════════════════════════════════════════

🔧 Setting up test data...

✓ Created test organizations and domains
  Org 1: xxx-xxx-xxx (test-org-1.example.com)
  Org 2: yyy-yyy-yyy (test-org-2.example.com)

📋 Testing Service Role Access...

✅ Service role can read chat_telemetry_rollups
✅ Service role can read chat_telemetry_domain_rollups
...

Total Tests: 15+
✅ Passed: 15+
❌ Failed: 0
📊 Success Rate: 100.0%
```

---

## What Changed?

### 1. View Security (4 fixes)

**Before:**
```sql
CREATE VIEW chat_telemetry_metrics
SECURITY DEFINER  -- ❌ Runs as superuser, bypasses RLS
AS SELECT * FROM chat_telemetry;
```

**After:**
```sql
CREATE VIEW chat_telemetry_metrics
SECURITY INVOKER  -- ✅ Runs as current user, respects RLS
AS SELECT * FROM chat_telemetry;
```

**Impact:**
- Views now respect RLS policies on underlying tables
- Users only see data they're authorized for
- No more privilege escalation via views

---

### 2. Row Level Security (8 fixes)

**Tables Now Protected:**

| Table | RLS Policy | Access Control |
|-------|-----------|----------------|
| `chat_telemetry_rollups` | ✅ Enabled | Service role: full, Authenticated: read all |
| `chat_telemetry_domain_rollups` | ✅ Enabled | Organization-scoped access only |
| `chat_telemetry_model_rollups` | ✅ Enabled | Organization-scoped + global rollups |
| `demo_attempts` | ✅ Enabled | Service role: full, Authenticated: read all |
| `gdpr_audit_log` | ✅ Enabled | Organization-scoped access only |
| `widget_configs`* | ✅ Enabled | Organization-scoped read/update |
| `widget_config_history`* | ✅ Enabled | Organization-scoped read-only |
| `widget_config_variants`* | ✅ Enabled | Organization-scoped CRUD |

*Conditional - only applied if table exists

---

## Security Model Overview

### Access Control Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                        User Request                           │
│  "Show me telemetry for example.com"                         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Authentication Check                       │
│  • What is auth.uid()?                                       │
│  • What is auth.role()?                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                Organization Membership Lookup                 │
│  SELECT organization_id FROM organization_members            │
│  WHERE user_id = auth.uid()                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Domain Authorization                       │
│  SELECT domain FROM customer_configs                         │
│  WHERE organization_id IN (user's orgs)                      │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    RLS Policy Filter                          │
│  WHERE domain IN (authorized domains)                        │
│  → Returns only data user is authorized to see               │
└──────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: "Permission denied" errors after migration

**Cause**: Views now respect RLS, may expose permission issues.

**Solution**:
1. Verify user is authenticated: `SELECT auth.uid()` should return user ID
2. Check organization membership: User must be in `organization_members` table
3. Verify domain ownership: Organization must own the domain in `customer_configs`

### Issue: Verification script shows failures

**Cause**: Migration may not have fully applied.

**Solution**:
1. Re-run migration in SQL Editor
2. Check for error messages in execution log
3. Verify you're using service role key for verification script

### Issue: Security advisors still show warnings

**Cause**: Advisors cache may be stale.

**Solution**:
1. Click "Refresh" button in Security Advisors page
2. Wait 1-2 minutes for analysis to complete
3. If still showing issues, re-run migration

---

## Rollback (Emergency Only)

If you need to rollback this migration:

```sql
-- WARNING: This will remove security protections!
-- Only use if absolutely necessary.

-- Disable RLS on tables
ALTER TABLE chat_telemetry_rollups DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_telemetry_domain_rollups DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_telemetry_model_rollups DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_audit_log DISABLE ROW LEVEL SECURITY;

-- Note: Cannot easily revert views to SECURITY DEFINER
-- They will remain as SECURITY INVOKER (which is secure)
```

**Recommendation**: Do NOT rollback unless absolutely necessary. The migration improves security.

---

## Documentation

- **Security Model**: [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md)
- **Migration SQL**: [supabase/migrations/20251028_fix_security_advisories.sql](supabase/migrations/20251028_fix_security_advisories.sql)
- **Verification Script**: [verify-security-migration.ts](verify-security-migration.ts)
- **RLS Test Suite**: [test-rls-policies.ts](test-rls-policies.ts)

---

## Support Checklist

After applying the migration, verify:

- [ ] Migration executed without errors
- [ ] Verification script shows 100% pass rate
- [ ] Security advisors show 0 issues (down from 12)
- [ ] Application still works correctly (no broken features)
- [ ] RLS test suite passes (optional)
- [ ] Documentation reviewed

---

## Questions?

If you encounter issues:

1. Check the troubleshooting section above
2. Review [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md)
3. Run verification script: `npx tsx verify-security-migration.ts`
4. Check Supabase logs for detailed error messages

---

**Migration Status**: ⏳ **Pending Application**

**Next Steps**:
1. ➡️ Apply migration via SQL Editor
2. ➡️ Run verification script
3. ➡️ Check security advisors
4. ➡️ Mark as complete ✅
