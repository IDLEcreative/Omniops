# Widget RLS Security - Quick Start Guide

> **Fast Track**: Get widget tables secured in 3 steps

---

## The Problem

The original security migration (`20251028_fix_security_advisories.sql`) contains **incorrect RLS policies** for widget tables that reference a non-existent `domain` column, causing policy failures.

## The Solution

A corrected migration (`20251028_fix_widget_rls_policies.sql`) that uses the correct `customer_config_id` foreign key for organization-based isolation.

---

## Quick Application (3 Steps)

### Step 1: Apply the Migration

**Option A: Supabase SQL Editor (Easiest)**

1. Open: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new
2. Paste contents of: `supabase/migrations/20251028_fix_widget_rls_policies.sql`
3. Click "Run"
4. Look for success NOTICEs

**Option B: Using Script**

```bash
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
npx tsx apply-widget-rls-migration.ts
```

### Step 2: Verify Success

```bash
npx tsx verify-widget-rls.ts
```

**Expected**: All checks pass (100% success rate)

### Step 3: Test Application

- [ ] Dashboard > Customize page works
- [ ] Users only see their organization's widgets
- [ ] Widget variants and history accessible

---

## What This Does

Secures 3 tables with organization-scoped RLS policies:

1. **widget_configs** - 5 policies (view, update, insert, delete + service role)
2. **widget_config_history** - 2 policies (view, insert + service role)
3. **widget_config_variants** - 5 policies (full CRUD + service role)

**Security Model**: Users can only access widgets for `customer_configs` in their organization (via `organization_members` table).

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/migrations/20251028_fix_widget_rls_policies.sql` | The corrected migration SQL |
| `verify-widget-rls.ts` | Automated verification script |
| `apply-widget-rls-migration.ts` | One-command application script |
| `WIDGET_RLS_IMPLEMENTATION_REPORT.md` | Full technical documentation |

---

## Important Note

**DO NOT** use lines 240-359 of the original `20251028_fix_security_advisories.sql` migration - those policies are incorrect. Use `20251028_fix_widget_rls_policies.sql` instead.

---

## Support

If issues occur:
1. Check `WIDGET_RLS_IMPLEMENTATION_REPORT.md` for troubleshooting
2. Review Supabase logs for specific errors
3. Verify tables exist: `widget_configs`, `widget_config_history`, `widget_config_variants`

---

**Status**: ✅ Ready to Apply
**Risk Level**: 🟢 Low (conditional logic handles missing tables)
**Estimated Time**: ⏱️ 2 minutes
