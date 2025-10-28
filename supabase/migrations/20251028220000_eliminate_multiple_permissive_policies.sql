-- Migration: Eliminate Multiple Permissive Policies
-- Purpose: Fix 25 "Multiple Permissive Policies" warnings by consolidating FOR ALL policies
--          into command-specific policies (SELECT, INSERT, UPDATE, DELETE)
--
-- Problem: When a table has both FOR ALL and command-specific policies, PostgreSQL evaluates
--          both policies for the command, causing "Multiple Permissive Policies" warnings.
--          For example, a SELECT query on widget_configs evaluates:
--          1. "Service role can manage widget configs" (FOR ALL)
--          2. "Users can view their organization widget configs" (FOR SELECT)
--          This creates 2 permissive policies for a single command.
--
-- Solution: Drop all FOR ALL policies and create consolidated command-specific policies that
--           combine service_role + authenticated user access using OR logic. This ensures
--           only ONE policy is evaluated per command type.
--
-- Affected Tables:
-- - widget_configs: 10 warnings → 0 warnings (3 policies → 4 policies)
-- - widget_config_history: 5 warnings → 0 warnings (2 policies → 4 policies)
-- - widget_config_variants: 10 warnings → 0 warnings (3 policies → 4 policies)
--
-- Security: All existing access patterns are preserved. No changes to authorization logic.

BEGIN;

-- ============================================================================
-- 1. widget_configs - Consolidate 3 policies into 4 command-specific policies
-- ============================================================================

-- Drop existing policies that cause conflicts
DROP POLICY IF EXISTS "Service role can manage widget configs" ON public.widget_configs;
DROP POLICY IF EXISTS "Users can view their organization widget configs" ON public.widget_configs;
DROP POLICY IF EXISTS "Users can update their organization widget configs" ON public.widget_configs;

-- Create consolidated SELECT policy
-- Combines: service_role (full access) + authenticated users (organization-scoped)
CREATE POLICY "widget_configs_select" ON public.widget_configs
  FOR SELECT TO public
  USING (
    -- Service role has full access
    (SELECT auth.role()) = 'service_role'
    OR
    -- Authenticated users can view configs in their organization
    (
      (SELECT auth.role()) = 'authenticated'
      AND customer_config_id IN (
        SELECT cc.id
        FROM customer_configs cc
        WHERE cc.organization_id IN (
          SELECT om.organization_id
          FROM organization_members om
          WHERE om.user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- Create consolidated INSERT policy
-- Only service_role can insert widget configs
CREATE POLICY "widget_configs_insert" ON public.widget_configs
  FOR INSERT TO public
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
  );

-- Create consolidated UPDATE policy
-- Combines: service_role (full access) + authenticated users (organization-scoped)
CREATE POLICY "widget_configs_update" ON public.widget_configs
  FOR UPDATE TO public
  USING (
    -- Service role has full access
    (SELECT auth.role()) = 'service_role'
    OR
    -- Authenticated users can update configs in their organization
    (
      (SELECT auth.role()) = 'authenticated'
      AND customer_config_id IN (
        SELECT cc.id
        FROM customer_configs cc
        WHERE cc.organization_id IN (
          SELECT om.organization_id
          FROM organization_members om
          WHERE om.user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- Create consolidated DELETE policy
-- Only service_role can delete widget configs
CREATE POLICY "widget_configs_delete" ON public.widget_configs
  FOR DELETE TO public
  USING (
    (SELECT auth.role()) = 'service_role'
  );

-- ============================================================================
-- 2. widget_config_history - Consolidate 2 policies into 4 command-specific policies
-- ============================================================================

-- Drop existing policies that cause conflicts
DROP POLICY IF EXISTS "Service role can manage widget config history" ON public.widget_config_history;
DROP POLICY IF EXISTS "Users can view their organization widget history" ON public.widget_config_history;

-- Create consolidated SELECT policy
-- Combines: service_role (full access) + authenticated users (organization-scoped)
CREATE POLICY "widget_config_history_select" ON public.widget_config_history
  FOR SELECT TO public
  USING (
    -- Service role has full access
    (SELECT auth.role()) = 'service_role'
    OR
    -- Authenticated users can view history for configs in their organization
    (
      (SELECT auth.role()) = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM widget_configs wc
        JOIN customer_configs cc ON cc.id = wc.customer_config_id
        JOIN organization_members om ON om.organization_id = cc.organization_id
        WHERE wc.id = widget_config_history.widget_config_id
          AND om.user_id = (SELECT auth.uid())
      )
    )
  );

-- Create consolidated INSERT policy
-- Only service_role can insert history records
CREATE POLICY "widget_config_history_insert" ON public.widget_config_history
  FOR INSERT TO public
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
  );

-- Create consolidated UPDATE policy
-- Only service_role can update history records (history should be immutable, but policy for safety)
CREATE POLICY "widget_config_history_update" ON public.widget_config_history
  FOR UPDATE TO public
  USING (
    (SELECT auth.role()) = 'service_role'
  );

-- Create consolidated DELETE policy
-- Only service_role can delete history records
CREATE POLICY "widget_config_history_delete" ON public.widget_config_history
  FOR DELETE TO public
  USING (
    (SELECT auth.role()) = 'service_role'
  );

-- ============================================================================
-- 3. widget_config_variants - Consolidate 3 policies into 4 command-specific policies
-- ============================================================================

-- Drop existing policies that cause conflicts
DROP POLICY IF EXISTS "widget_config_variants_service_role_manage" ON public.widget_config_variants;
DROP POLICY IF EXISTS "widget_config_variants_select_policy" ON public.widget_config_variants;
DROP POLICY IF EXISTS "widget_config_variants_insert_policy" ON public.widget_config_variants;

-- Create consolidated SELECT policy
-- Combines: service_role (full access) + authenticated users (organization-scoped)
CREATE POLICY "widget_config_variants_select" ON public.widget_config_variants
  FOR SELECT TO public
  USING (
    -- Service role has full access
    (SELECT auth.role()) = 'service_role'
    OR
    -- Authenticated users can view variants for configs in their organization
    (
      (SELECT auth.role()) = 'authenticated'
      AND widget_config_id IN (
        SELECT wc.id
        FROM widget_configs wc
        WHERE wc.customer_config_id IN (
          SELECT cc.id
          FROM customer_configs cc
          WHERE cc.organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = (SELECT auth.uid())
          )
        )
      )
    )
  );

-- Create consolidated INSERT policy
-- Combines: service_role (full access) + authenticated users (organization-scoped)
CREATE POLICY "widget_config_variants_insert" ON public.widget_config_variants
  FOR INSERT TO public
  WITH CHECK (
    -- Service role has full access
    (SELECT auth.role()) = 'service_role'
    OR
    -- Authenticated users can insert variants for configs in their organization
    (
      (SELECT auth.role()) = 'authenticated'
      AND widget_config_id IN (
        SELECT wc.id
        FROM widget_configs wc
        WHERE wc.customer_config_id IN (
          SELECT cc.id
          FROM customer_configs cc
          WHERE cc.organization_id IN (
            SELECT om.organization_id
            FROM organization_members om
            WHERE om.user_id = (SELECT auth.uid())
          )
        )
      )
    )
  );

-- Create consolidated UPDATE policy
-- Only service_role can update variants (variants should be immutable after creation)
CREATE POLICY "widget_config_variants_update" ON public.widget_config_variants
  FOR UPDATE TO public
  USING (
    (SELECT auth.role()) = 'service_role'
  );

-- Create consolidated DELETE policy
-- Only service_role can delete variants
CREATE POLICY "widget_config_variants_delete" ON public.widget_config_variants
  FOR DELETE TO public
  USING (
    (SELECT auth.role()) = 'service_role'
  );

COMMIT;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify all policies are correctly created
DO $$
DECLARE
  policy_count INT;
BEGIN
  -- Check widget_configs has exactly 4 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'widget_configs';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'widget_configs should have 4 policies, found %', policy_count;
  END IF;

  -- Check widget_config_history has exactly 4 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'widget_config_history';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'widget_config_history should have 4 policies, found %', policy_count;
  END IF;

  -- Check widget_config_variants has exactly 4 policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'widget_config_variants';

  IF policy_count != 4 THEN
    RAISE EXCEPTION 'widget_config_variants should have 4 policies, found %', policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: All tables have exactly 4 command-specific policies';
END $$;

-- Verify no FOR ALL policies exist on these tables
DO $$
DECLARE
  all_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO all_policy_count
  FROM pg_policies
  WHERE tablename IN ('widget_configs', 'widget_config_history', 'widget_config_variants')
    AND cmd = 'ALL';

  IF all_policy_count > 0 THEN
    RAISE EXCEPTION 'Found % FOR ALL policies, should be 0', all_policy_count;
  END IF;

  RAISE NOTICE 'SUCCESS: No FOR ALL policies exist';
END $$;

-- Display final policy summary
SELECT
  tablename,
  cmd,
  policyname
FROM pg_policies
WHERE tablename IN ('widget_configs', 'widget_config_history', 'widget_config_variants')
ORDER BY tablename,
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ============================================================================
-- Expected Results After Migration
-- ============================================================================
--
-- widget_configs:
--   - widget_configs_select (FOR SELECT)
--   - widget_configs_insert (FOR INSERT)
--   - widget_configs_update (FOR UPDATE)
--   - widget_configs_delete (FOR DELETE)
--
-- widget_config_history:
--   - widget_config_history_select (FOR SELECT)
--   - widget_config_history_insert (FOR INSERT)
--   - widget_config_history_update (FOR UPDATE)
--   - widget_config_history_delete (FOR DELETE)
--
-- widget_config_variants:
--   - widget_config_variants_select (FOR SELECT)
--   - widget_config_variants_insert (FOR INSERT)
--   - widget_config_variants_update (FOR UPDATE)
--   - widget_config_variants_delete (FOR DELETE)
--
-- Total: 12 policies (4 per table)
-- Multiple Permissive Policies Warnings: 0 (down from 25)
--
-- ============================================================================
