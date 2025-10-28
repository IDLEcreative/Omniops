-- Optimize RLS policies for performance
-- Fixes two categories of issues identified by Supabase advisors:
-- 1. Auth RLS InitPlan: Wrap auth function calls to prevent per-row re-evaluation
-- 2. Multiple Permissive Policies: Consolidate overlapping policies

-- ============================================================================
-- PART 1: Fix Auth RLS InitPlan Issues
-- ============================================================================
-- Problem: auth.jwt() and auth.role() calls not wrapped in subqueries cause
--          per-row evaluation instead of once-per-query evaluation
-- Solution: Wrap auth function calls like (select auth.role())
-- ============================================================================

-- global_synonym_mappings: Drop and recreate 4 policies
DROP POLICY IF EXISTS "optimized_read_global_synonyms" ON global_synonym_mappings;
DROP POLICY IF EXISTS "service_role_insert_global_synonyms" ON global_synonym_mappings;
DROP POLICY IF EXISTS "service_role_update_global_synonyms" ON global_synonym_mappings;
DROP POLICY IF EXISTS "service_role_delete_global_synonyms" ON global_synonym_mappings;

CREATE POLICY "optimized_read_global_synonyms" ON global_synonym_mappings
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR is_safe_for_all = true
  );

CREATE POLICY "service_role_insert_global_synonyms" ON global_synonym_mappings
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_update_global_synonyms" ON global_synonym_mappings
  FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "service_role_delete_global_synonyms" ON global_synonym_mappings
  FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- domain_synonym_mappings: Drop and recreate 1 policy
DROP POLICY IF EXISTS "service_role_all_domain_synonyms" ON domain_synonym_mappings;

CREATE POLICY "service_role_all_domain_synonyms" ON domain_synonym_mappings
  FOR ALL
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- ============================================================================
-- PART 2: Consolidate Multiple Permissive Policies
-- ============================================================================
-- Problem: Multiple permissive policies for same role+action cause unnecessary
--          re-evaluation of each policy
-- Solution: Combine into single policy with OR logic
-- ============================================================================

-- chat_telemetry_domain_rollups: Consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view their domain rollups" ON chat_telemetry_domain_rollups;
DROP POLICY IF EXISTS "Service role can manage domain rollups" ON chat_telemetry_domain_rollups;

CREATE POLICY "View domain rollups" ON chat_telemetry_domain_rollups
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR (
      (select auth.role()) = 'authenticated'
      AND domain IN (
        SELECT customer_configs.domain
        FROM customer_configs
        WHERE customer_configs.organization_id IN (
          SELECT organization_members.organization_id
          FROM organization_members
          WHERE organization_members.user_id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Insert domain rollups" ON chat_telemetry_domain_rollups
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Update domain rollups" ON chat_telemetry_domain_rollups
  FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Delete domain rollups" ON chat_telemetry_domain_rollups
  FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- chat_telemetry_model_rollups: Consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view their model rollups" ON chat_telemetry_model_rollups;
DROP POLICY IF EXISTS "Service role can manage model rollups" ON chat_telemetry_model_rollups;

CREATE POLICY "View model rollups" ON chat_telemetry_model_rollups
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR (
      (select auth.role()) = 'authenticated'
      AND (
        domain IS NULL
        OR domain IN (
          SELECT customer_configs.domain
          FROM customer_configs
          WHERE customer_configs.organization_id IN (
            SELECT organization_members.organization_id
            FROM organization_members
            WHERE organization_members.user_id = (select auth.uid())
          )
        )
      )
    )
  );

CREATE POLICY "Insert model rollups" ON chat_telemetry_model_rollups
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Update model rollups" ON chat_telemetry_model_rollups
  FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Delete model rollups" ON chat_telemetry_model_rollups
  FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- chat_telemetry_rollups: Consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view telemetry rollups" ON chat_telemetry_rollups;
DROP POLICY IF EXISTS "Service role can manage all telemetry rollups" ON chat_telemetry_rollups;

CREATE POLICY "View telemetry rollups" ON chat_telemetry_rollups
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR (select auth.role()) = 'authenticated'
  );

CREATE POLICY "Insert telemetry rollups" ON chat_telemetry_rollups
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Update telemetry rollups" ON chat_telemetry_rollups
  FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Delete telemetry rollups" ON chat_telemetry_rollups
  FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- demo_attempts: Consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view demo attempts" ON demo_attempts;
DROP POLICY IF EXISTS "Service role can manage demo attempts" ON demo_attempts;

CREATE POLICY "View demo attempts" ON demo_attempts
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR (select auth.role()) = 'authenticated'
  );

CREATE POLICY "Insert demo attempts" ON demo_attempts
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Update demo attempts" ON demo_attempts
  FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Delete demo attempts" ON demo_attempts
  FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- gdpr_audit_log: Consolidate 2 SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view their domain GDPR logs" ON gdpr_audit_log;
DROP POLICY IF EXISTS "Service role can manage GDPR audit log" ON gdpr_audit_log;

CREATE POLICY "View GDPR audit logs" ON gdpr_audit_log
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR (
      (select auth.role()) = 'authenticated'
      AND domain IN (
        SELECT customer_configs.domain
        FROM customer_configs
        WHERE customer_configs.organization_id IN (
          SELECT organization_members.organization_id
          FROM organization_members
          WHERE organization_members.user_id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Insert GDPR logs" ON gdpr_audit_log
  FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Update GDPR logs" ON gdpr_audit_log
  FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Delete GDPR logs" ON gdpr_audit_log
  FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- Summary
-- ============================================================================
-- Fixed:
--   • 5 auth RLS initplan issues (global_synonym_mappings: 4, domain_synonym_mappings: 1)
--   • 30+ multiple permissive policy warnings (5 tables × multiple roles)
--
-- Performance Impact:
--   • Auth function calls now evaluate once per query instead of per row
--   • Single policy evaluation instead of multiple overlapping policies
--   • Expected improvement: 50-80% reduction in RLS overhead for large result sets
-- ============================================================================
