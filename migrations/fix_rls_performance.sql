-- RLS Performance Optimization Migration
-- Generated: 2025-08-30
-- Purpose: Fix RLS auth function re-evaluation and consolidate duplicate policies

-- ============================================
-- 1. FIX DUPLICATE INDEX
-- ============================================

-- Remove duplicate index on page_embeddings
DROP INDEX IF EXISTS idx_page_embeddings_page;

-- ============================================
-- 2. FIX RLS AUTH FUNCTION RE-EVALUATION
-- ============================================

-- The key fix is to wrap auth.uid() in (SELECT auth.uid()) 
-- This creates an InitPlan that evaluates once instead of per-row

-- Fix scrape_jobs policies
DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON scrape_jobs;
DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON scrape_jobs;

CREATE POLICY "Users can access their own scrape jobs" ON scrape_jobs
  FOR ALL
  USING (
    domain_id IN (
      SELECT id FROM domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix scraped_pages policies  
DROP POLICY IF EXISTS "Users can view their domain's pages" ON scraped_pages;
DROP POLICY IF EXISTS "Users can insert pages for their domains" ON scraped_pages;

CREATE POLICY "Users can access their domain pages" ON scraped_pages
  FOR ALL
  USING (
    domain_id IN (
      SELECT id FROM domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix domains policies
DROP POLICY IF EXISTS "Users can view their own domains" ON domains;
DROP POLICY IF EXISTS "Users can insert their own domains" ON domains;
DROP POLICY IF EXISTS "Users can update their own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete their own domains" ON domains;

CREATE POLICY "Users own domains" ON domains
  FOR ALL
  USING (user_id = (SELECT auth.uid()));

-- Fix website_content policies
DROP POLICY IF EXISTS "Users can view their domain's content" ON website_content;
DROP POLICY IF EXISTS "Users can insert content for their domains" ON website_content;

CREATE POLICY "Users can access their domain content" ON website_content
  FOR ALL
  USING (
    domain_id IN (
      SELECT id FROM domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- Fix structured_extractions policies
DROP POLICY IF EXISTS "Users can view their domain's extractions" ON structured_extractions;
DROP POLICY IF EXISTS "Users can insert extractions for their domains" ON structured_extractions;

CREATE POLICY "Users can access their domain extractions" ON structured_extractions
  FOR ALL
  USING (
    domain_id IN (
      SELECT id FROM domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 3. FIX BUSINESS-RELATED RLS POLICIES
-- ============================================

-- Fix businesses policies
DROP POLICY IF EXISTS "Business owners see own data" ON businesses;
DROP POLICY IF EXISTS "Service role has full access to businesses" ON businesses;

CREATE POLICY "Business access control" ON businesses
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role' 
    OR owner_id = (SELECT auth.uid())
  );

-- Fix business_configs policies
DROP POLICY IF EXISTS "Business configs isolated" ON business_configs;
DROP POLICY IF EXISTS "Service role has full access to configs" ON business_configs;

CREATE POLICY "Business configs access control" ON business_configs
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Fix business_usage policies
DROP POLICY IF EXISTS "Business usage isolated" ON business_usage;
DROP POLICY IF EXISTS "Service role has full access to usage" ON business_usage;

CREATE POLICY "Business usage access control" ON business_usage
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Fix customer_verifications policies
DROP POLICY IF EXISTS "Verifications isolated by business" ON customer_verifications;
DROP POLICY IF EXISTS "Service role has full access to verifications" ON customer_verifications;

CREATE POLICY "Customer verifications access control" ON customer_verifications
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Fix customer_access_logs policies
DROP POLICY IF EXISTS "Access logs isolated by business" ON customer_access_logs;
DROP POLICY IF EXISTS "Service role has full access to access logs" ON customer_access_logs;

CREATE POLICY "Customer access logs control" ON customer_access_logs
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- Fix customer_data_cache policies
DROP POLICY IF EXISTS "Cache isolated by business" ON customer_data_cache;
DROP POLICY IF EXISTS "Service role has full access to cache" ON customer_data_cache;

CREATE POLICY "Customer cache access control" ON customer_data_cache
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (
      SELECT id FROM businesses 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 4. CREATE HELPER FUNCTION FOR BETTER PERFORMANCE
-- ============================================

-- Create a stable function to get current user's business IDs
-- This will be cached within a transaction
CREATE OR REPLACE FUNCTION get_user_business_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT id 
  FROM businesses 
  WHERE owner_id = (SELECT auth.uid())
$$;

-- Create a stable function to get current user's domain IDs
CREATE OR REPLACE FUNCTION get_user_domain_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT id 
  FROM domains 
  WHERE user_id = (SELECT auth.uid())
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_business_ids TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_domain_ids TO authenticated;

-- ============================================
-- 5. OPTIMIZE POLICIES WITH HELPER FUNCTIONS
-- ============================================

-- Now we can use these helper functions for even better performance
-- They'll be evaluated once per query instead of per row

-- Re-create business_configs with optimized function
DROP POLICY IF EXISTS "Business configs access control" ON business_configs;
CREATE POLICY "Business configs access control" ON business_configs
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (SELECT get_user_business_ids())
  );

-- Re-create business_usage with optimized function
DROP POLICY IF EXISTS "Business usage access control" ON business_usage;
CREATE POLICY "Business usage access control" ON business_usage
  FOR ALL
  USING (
    (SELECT auth.role()) = 'service_role'
    OR business_id IN (SELECT get_user_business_ids())
  );

-- Re-create scraped_pages with optimized function
DROP POLICY IF EXISTS "Users can access their domain pages" ON scraped_pages;
CREATE POLICY "Users can access their domain pages" ON scraped_pages
  FOR ALL
  USING (
    domain_id IN (SELECT get_user_domain_ids())
  );

-- Re-create website_content with optimized function
DROP POLICY IF EXISTS "Users can access their domain content" ON website_content;
CREATE POLICY "Users can access their domain content" ON website_content
  FOR ALL
  USING (
    domain_id IN (SELECT get_user_domain_ids())
  );

-- Re-create structured_extractions with optimized function
DROP POLICY IF EXISTS "Users can access their domain extractions" ON structured_extractions;
CREATE POLICY "Users can access their domain extractions" ON structured_extractions
  FOR ALL
  USING (
    domain_id IN (SELECT get_user_domain_ids())
  );

-- Re-create scrape_jobs with optimized function
DROP POLICY IF EXISTS "Users can access their own scrape jobs" ON scrape_jobs;
CREATE POLICY "Users can access their own scrape jobs" ON scrape_jobs
  FOR ALL
  USING (
    domain_id IN (SELECT get_user_domain_ids())
  );

-- ============================================
-- 6. ADD SERVICE ROLE BYPASS FOR BETTER PERFORMANCE
-- ============================================

-- Service role should bypass RLS entirely for better performance
-- This is already handled by BYPASSRLS privilege, but let's ensure it's set

ALTER ROLE service_role SET row_security TO off;

-- ============================================
-- 7. ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update statistics for better query planning with new policies
ANALYZE businesses;
ANALYZE business_configs;
ANALYZE business_usage;
ANALYZE customer_verifications;
ANALYZE customer_access_logs;
ANALYZE customer_data_cache;
ANALYZE domains;
ANALYZE scraped_pages;
ANALYZE website_content;
ANALYZE structured_extractions;
ANALYZE scrape_jobs;

-- ============================================
-- 8. VERIFICATION QUERIES
-- ============================================

-- Query to check if policies are using InitPlan (good) vs Filter (bad)
-- Run EXPLAIN on a simple SELECT to verify optimization
-- Example:
-- EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM scraped_pages LIMIT 10;
-- Should show InitPlan for auth.uid() evaluation

-- Check that duplicate index is removed
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE tablename = 'page_embeddings'
  AND schemaname = 'public'
ORDER BY indexname;