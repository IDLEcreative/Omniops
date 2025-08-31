-- Migration: Fix RLS Performance Issues
-- Date: 2025-08-30
-- Purpose: Optimize Row Level Security policies to prevent re-evaluation of auth functions for each row

-- =====================================================
-- PART 1: Fix auth RLS initialization for domains table
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own domains" ON public.domains;
CREATE POLICY "Users can view their own domains" ON public.domains
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own domains" ON public.domains;
CREATE POLICY "Users can insert their own domains" ON public.domains
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own domains" ON public.domains;
CREATE POLICY "Users can update their own domains" ON public.domains
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own domains" ON public.domains;
CREATE POLICY "Users can delete their own domains" ON public.domains
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- PART 2: Fix auth RLS for structured_extractions table
-- =====================================================

DROP POLICY IF EXISTS "Users can view their domain's extractions" ON public.structured_extractions;
CREATE POLICY "Users can view their domain's extractions" ON public.structured_extractions
  FOR SELECT USING (
    domain IN (
      SELECT domain FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert extractions for their domains" ON public.structured_extractions;
CREATE POLICY "Users can insert extractions for their domains" ON public.structured_extractions
  FOR INSERT WITH CHECK (
    domain IN (
      SELECT domain FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 3: Fix auth RLS for website_content table
-- =====================================================

DROP POLICY IF EXISTS "Users can view their domain's content" ON public.website_content;
CREATE POLICY "Users can view their domain's content" ON public.website_content
  FOR SELECT USING (
    domain IN (
      SELECT domain FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert content for their domains" ON public.website_content;
CREATE POLICY "Users can insert content for their domains" ON public.website_content
  FOR INSERT WITH CHECK (
    domain IN (
      SELECT domain FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 4: Fix auth RLS for scraped_pages table
-- =====================================================

DROP POLICY IF EXISTS "Users can view their domain's pages" ON public.scraped_pages;
CREATE POLICY "Users can view their domain's pages" ON public.scraped_pages
  FOR SELECT USING (
    domain IN (
      SELECT domain FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert pages for their domains" ON public.scraped_pages;
CREATE POLICY "Users can insert pages for their domains" ON public.scraped_pages
  FOR INSERT WITH CHECK (
    domain IN (
      SELECT domain FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 5: Fix auth RLS for scrape_jobs table
-- =====================================================

-- Remove duplicate permissive policies and consolidate
DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON public.scrape_jobs;
DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON public.scrape_jobs;

-- Create single consolidated policy
CREATE POLICY "Users manage own scrape jobs" ON public.scrape_jobs
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- PART 6: Fix auth RLS for business-related tables
-- =====================================================

-- Fix businesses table
DROP POLICY IF EXISTS "Business owners see own data" ON public.businesses;
CREATE POLICY "Business owners see own data" ON public.businesses
  FOR ALL USING ((SELECT auth.uid()) = business_owner_id);

DROP POLICY IF EXISTS "Service role has full access to businesses" ON public.businesses;
CREATE POLICY "Service role has full access to businesses" ON public.businesses
  FOR ALL USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Fix business_configs table
DROP POLICY IF EXISTS "Business configs isolated" ON public.business_configs;
CREATE POLICY "Business configs isolated" ON public.business_configs
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE business_owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role has full access to configs" ON public.business_configs;
CREATE POLICY "Service role has full access to configs" ON public.business_configs
  FOR ALL USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Fix business_usage table
DROP POLICY IF EXISTS "Business usage isolated" ON public.business_usage;
CREATE POLICY "Business usage isolated" ON public.business_usage
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE business_owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role has full access to usage" ON public.business_usage;
CREATE POLICY "Service role has full access to usage" ON public.business_usage
  FOR ALL USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Fix customer_verifications table
DROP POLICY IF EXISTS "Verifications isolated by business" ON public.customer_verifications;
CREATE POLICY "Verifications isolated by business" ON public.customer_verifications
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE business_owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role has full access to verifications" ON public.customer_verifications;
CREATE POLICY "Service role has full access to verifications" ON public.customer_verifications
  FOR ALL USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Fix customer_access_logs table
DROP POLICY IF EXISTS "Access logs isolated by business" ON public.customer_access_logs;
CREATE POLICY "Access logs isolated by business" ON public.customer_access_logs
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE business_owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role has full access to access logs" ON public.customer_access_logs;
CREATE POLICY "Service role has full access to access logs" ON public.customer_access_logs
  FOR ALL USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- Fix customer_data_cache table
DROP POLICY IF EXISTS "Cache isolated by business" ON public.customer_data_cache;
CREATE POLICY "Cache isolated by business" ON public.customer_data_cache
  FOR ALL USING (
    business_id IN (
      SELECT id FROM public.businesses 
      WHERE business_owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role has full access to cache" ON public.customer_data_cache;
CREATE POLICY "Service role has full access to cache" ON public.customer_data_cache
  FOR ALL USING (
    (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
  );

-- =====================================================
-- PART 7: Remove duplicate index
-- =====================================================

-- Drop the duplicate index on page_embeddings table
DROP INDEX IF EXISTS public.idx_page_embeddings_page;
-- Keep idx_page_embeddings_page_id as it has a more descriptive name

-- =====================================================
-- PART 8: Add performance-optimized indexes if missing
-- =====================================================

-- Ensure proper indexes exist for foreign key lookups used in RLS policies
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(business_owner_id);
CREATE INDEX IF NOT EXISTS idx_business_configs_business_id ON public.business_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_business_usage_business_id ON public.business_usage(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_business_id ON public.customer_verifications(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_access_logs_business_id ON public.customer_access_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_data_cache_business_id ON public.customer_data_cache(business_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain ON public.structured_extractions(domain);
CREATE INDEX IF NOT EXISTS idx_website_content_domain ON public.website_content(domain);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain ON public.scraped_pages(domain);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_user_id ON public.scrape_jobs(user_id);

-- =====================================================
-- PART 9: Consolidate duplicate permissive policies
-- =====================================================

-- For tables with service role policies, ensure they don't overlap with user policies
-- by making service role policies more specific when needed

-- This migration optimizes RLS performance by:
-- 1. Wrapping auth functions in SELECT statements to prevent re-evaluation
-- 2. Consolidating duplicate permissive policies
-- 3. Removing duplicate indexes
-- 4. Adding performance indexes for foreign key lookups