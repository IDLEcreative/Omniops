# Database Migration Instructions

## Problem
The database doesn't have an RPC function for executing raw SQL, which prevents programmatic migration execution.

## Solution (2 Steps)

### Step 1: Create the exec_sql Function

**Go to Supabase SQL Editor:**
https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new

**Copy and run this SQL** (from `APPLY_THIS_FIRST.sql`):

```sql
-- Create function to execute raw SQL (only accessible to service_role)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Only allow service_role to execute this function
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

COMMENT ON FUNCTION exec_sql(text) IS
'Execute raw SQL - only accessible to service_role for migrations and administrative tasks';
```

**Click "Run"** in the SQL Editor.

---

### Step 2: Apply RLS Migration

**Option A: Run the script (automated):**

```bash
npx tsx scripts/database/apply-rls-with-exec.ts
```

This will:
- Read the migration file
- Execute each SQL statement through the `exec_sql` function
- Report success/failure for each policy

**Option B: Manual SQL execution:**

If the script fails, go back to the SQL Editor and run this SQL (from `APPLY_THIS_IN_SUPABASE.sql`):

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "service_role_all_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_insert_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_select_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_update_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_delete_customer_configs" ON customer_configs;

-- Create new policies
CREATE POLICY "service_role_select_customer_configs" ON customer_configs
  FOR SELECT TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "service_role_insert_customer_configs" ON customer_configs
  FOR INSERT TO public
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );

CREATE POLICY "service_role_update_customer_configs" ON customer_configs
  FOR UPDATE TO public
  USING ((SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text))
  WITH CHECK ((SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text));

CREATE POLICY "service_role_delete_customer_configs" ON customer_configs
  FOR DELETE TO public
  USING ((SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text));
```

---

## What This Does

### exec_sql Function
- Allows service role to execute raw SQL statements
- Secured with `SECURITY DEFINER` and `REVOKE/GRANT`
- Only accessible to `service_role` (not public users)
- Enables programmatic migration execution

### RLS Policies
- Allows service role to SELECT, INSERT, UPDATE, DELETE on `customer_configs`
- Regular users still restricted by existing `is_organization_member()` checks
- Required for E2E tests to create test configurations

---

## Verification

After applying both steps, verify with:

```bash
# Run E2E tests that were failing
npm test __tests__/integration/agent-flow-core.test.ts
```

The test should now pass because the service role can create test customer configs.

---

## Files Reference

- `APPLY_THIS_FIRST.sql` - Creates exec_sql function
- `APPLY_THIS_IN_SUPABASE.sql` - RLS policies (manual backup)
- `scripts/database/apply-rls-with-exec.ts` - Automated script
- `supabase/migrations/20251115_add_service_role_customer_configs_policies.sql` - Original migration
