-- Migration: Consolidate training_data RLS policies
-- Purpose: Fix multiple_permissive_policies warnings by consolidating overlapping policies
-- Impact: Reduces policy evaluations from 4 policies to 3, improving query performance
-- Reference: Policy Consolidation - training_data table

-- ============================================================================
-- STEP 1: Drop all existing training_data policies
-- ============================================================================

DROP POLICY IF EXISTS "Service role has full access" ON training_data;
DROP POLICY IF EXISTS "Users can view own training data" ON training_data;
DROP POLICY IF EXISTS "Users can create training data" ON training_data;
DROP POLICY IF EXISTS "Users can update own pending training data" ON training_data;

-- ============================================================================
-- STEP 2: Create consolidated policies with OR logic
-- ============================================================================

-- Consolidated SELECT policy
-- Combines: service_role access + user viewing their own data
CREATE POLICY "training_data_select_policy" ON training_data
  FOR SELECT
  USING (
    (select auth.role()) = 'service_role'
    OR (select auth.uid()) = user_id
  );

-- Consolidated INSERT policy
-- Combines: service_role access + user creating their own data
CREATE POLICY "training_data_insert_policy" ON training_data
  FOR INSERT
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR (select auth.uid()) = user_id
  );

-- Consolidated UPDATE policy
-- Combines: service_role access + user updating their own pending data
CREATE POLICY "training_data_update_policy" ON training_data
  FOR UPDATE
  USING (
    (select auth.role()) = 'service_role'
    OR ((select auth.uid()) = user_id AND status = 'pending')
  )
  WITH CHECK (
    (select auth.role()) = 'service_role'
    OR ((select auth.uid()) = user_id AND status = 'pending')
  );

-- ============================================================================
-- VERIFICATION QUERIES (for manual testing)
-- ============================================================================

-- Run these after migration to verify:
-- 1. Check policy count (should be 3):
--    SELECT count(*) FROM pg_policies WHERE tablename = 'training_data';
--
-- 2. View all policies:
--    SELECT policyname, cmd, roles, qual, with_check
--    FROM pg_policies
--    WHERE tablename = 'training_data'
--    ORDER BY cmd;
--
-- 3. Check Supabase advisors for warnings:
--    Should show ZERO multiple_permissive_policies warnings for training_data
