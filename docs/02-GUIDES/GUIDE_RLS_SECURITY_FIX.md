# Quick Start Guide: Applying RLS Security Fixes

**Type:** Guide
**Status:** Active - Ready to Apply
**Last Updated:** 2025-11-08
**Estimated Time:** 15 minutes

## Overview

This guide walks you through applying the 3 RLS (Row Level Security) fixes identified by the security audit.

---

## Prerequisites

- Access to Supabase Dashboard: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg
- OR Supabase access token in `.env.local`

---

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Apply widget_config_versions RLS

1. Go to [SQL Editor](https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql)
2. Click "New Query"
3. Copy the contents of: `supabase/migrations/20250108000001_add_rls_widget_config_versions.sql`
4. Paste into the query editor
5. Click "Run" (or press Cmd+Enter)
6. Verify you see: `Success: Migration applied`

### Step 2: Apply domain_mappings RLS

1. Click "New Query" again
2. Copy the contents of: `supabase/migrations/20250108000002_add_rls_domain_mappings.sql`
3. Paste and run
4. Verify success

### Step 3: Apply demo_sessions RLS

1. Click "New Query" again
2. Copy the contents of: `supabase/migrations/20250108000003_add_rls_demo_sessions.sql`
3. Paste and run
4. Verify success

---

## Verification

Run this verification query in Supabase SQL Editor:

```sql
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('widget_config_versions', 'domain_mappings', 'demo_sessions');
```

**Expected: All show `rls_enabled = true`**

---

## Next Steps

After applying, see complete fix guide:
[ANALYSIS_SUPABASE_SECURITY_FIX_2025_11_08.md](../10-ANALYSIS/ANALYSIS_SUPABASE_SECURITY_FIX_2025_11_08.md)
