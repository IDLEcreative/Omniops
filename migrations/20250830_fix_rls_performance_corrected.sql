-- Migration: Fix RLS Performance Issues (CORRECTED)
-- Date: 2025-08-30
-- Purpose: Optimize Row Level Security policies to prevent re-evaluation of auth functions for each row
-- Fixed: Using correct column names (domain_id instead of domain)

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
-- Note: Using domain_id (foreign key) instead of domain
-- =====================================================

DROP POLICY IF EXISTS "Users can view their domain's extractions" ON public.structured_extractions;
CREATE POLICY "Users can view their domain's extractions" ON public.structured_extractions
  FOR SELECT USING (
    domain_id IN (
      SELECT id FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert extractions for their domains" ON public.structured_extractions;
CREATE POLICY "Users can insert extractions for their domains" ON public.structured_extractions
  FOR INSERT WITH CHECK (
    domain_id IN (
      SELECT id FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 3: Fix auth RLS for website_content table
-- Note: Using domain_id (foreign key) instead of domain
-- =====================================================

DROP POLICY IF EXISTS "Users can view their domain's content" ON public.website_content;
CREATE POLICY "Users can view their domain's content" ON public.website_content
  FOR SELECT USING (
    domain_id IN (
      SELECT id FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert content for their domains" ON public.website_content;
CREATE POLICY "Users can insert content for their domains" ON public.website_content
  FOR INSERT WITH CHECK (
    domain_id IN (
      SELECT id FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 4: Fix auth RLS for scraped_pages table
-- Note: Using domain_id (foreign key) instead of domain
-- =====================================================

DROP POLICY IF EXISTS "Users can view their domain's pages" ON public.scraped_pages;
CREATE POLICY "Users can view their domain's pages" ON public.scraped_pages
  FOR SELECT USING (
    domain_id IN (
      SELECT id FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert pages for their domains" ON public.scraped_pages;
CREATE POLICY "Users can insert pages for their domains" ON public.scraped_pages
  FOR INSERT WITH CHECK (
    domain_id IN (
      SELECT id FROM public.domains 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- PART 5: Fix auth RLS for scrape_jobs table (if exists)
-- Note: This table might not exist based on the schema
-- =====================================================

-- Check if scrape_jobs table exists before creating policies
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'scrape_jobs') THEN
    
    -- Remove duplicate permissive policies and consolidate
    DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON public.scrape_jobs;
    DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON public.scrape_jobs;
    
    -- Create single consolidated policy
    EXECUTE 'CREATE POLICY "Users manage own scrape jobs" ON public.scrape_jobs
      FOR ALL USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

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
-- PART 7: Fix additional tables with domain_id references
-- =====================================================

-- Fix content_refresh_jobs table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies 
             WHERE schemaname = 'public' 
             AND tablename = 'content_refresh_jobs') THEN
    
    DROP POLICY IF EXISTS "Users can view their domain's jobs" ON public.content_refresh_jobs;
    EXECUTE 'CREATE POLICY "Users can view their domain''s jobs" ON public.content_refresh_jobs
      FOR SELECT USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
      
    DROP POLICY IF EXISTS "Users can manage their domain's jobs" ON public.content_refresh_jobs;
    EXECUTE 'CREATE POLICY "Users can manage their domain''s jobs" ON public.content_refresh_jobs
      FOR ALL USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
  END IF;
END $$;

-- Fix ai_optimized_content table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies 
             WHERE schemaname = 'public' 
             AND tablename = 'ai_optimized_content') THEN
    
    DROP POLICY IF EXISTS "Users can view their domain's optimized content" ON public.ai_optimized_content;
    EXECUTE 'CREATE POLICY "Users can view their domain''s optimized content" ON public.ai_optimized_content
      FOR SELECT USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
  END IF;
END $$;

-- Fix training_data table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies 
             WHERE schemaname = 'public' 
             AND tablename = 'training_data') THEN
    
    DROP POLICY IF EXISTS "Users can view their training data" ON public.training_data;
    EXECUTE 'CREATE POLICY "Users can view their training data" ON public.training_data
      FOR SELECT USING ((SELECT auth.uid()) = user_id)';
      
    DROP POLICY IF EXISTS "Users can manage their training data" ON public.training_data;
    EXECUTE 'CREATE POLICY "Users can manage their training data" ON public.training_data
      FOR ALL USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- =====================================================
-- PART 8: Remove duplicate index
-- =====================================================

-- Drop the duplicate index on page_embeddings table
DROP INDEX IF EXISTS public.idx_page_embeddings_page;
-- Keep idx_page_embeddings_page_id as it has a more descriptive name

-- =====================================================
-- PART 9: Add performance-optimized indexes if missing
-- =====================================================

-- Ensure proper indexes exist for foreign key lookups used in RLS policies
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(business_owner_id);
CREATE INDEX IF NOT EXISTS idx_business_configs_business_id ON public.business_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_business_usage_business_id ON public.business_usage(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_verifications_business_id ON public.customer_verifications(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_access_logs_business_id ON public.customer_access_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_data_cache_business_id ON public.customer_data_cache(business_id);

-- Add composite indexes for common query patterns with domain_id
CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain_id ON public.structured_extractions(domain_id);
CREATE INDEX IF NOT EXISTS idx_website_content_domain_id ON public.website_content(domain_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id ON public.scraped_pages(domain_id);
CREATE INDEX IF NOT EXISTS idx_content_refresh_jobs_domain_id ON public.content_refresh_jobs(domain_id);
CREATE INDEX IF NOT EXISTS idx_ai_optimized_content_domain_id ON public.ai_optimized_content(domain_id);
CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON public.training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_domain_id ON public.training_data(domain_id);

-- Add indexes for conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_domain_id ON public.conversations(domain_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- =====================================================
-- SUMMARY: This migration optimizes RLS performance by:
-- 1. Wrapping auth functions in SELECT statements to prevent re-evaluation
-- 2. Using correct column names (domain_id instead of domain)
-- 3. Consolidating duplicate permissive policies
-- 4. Removing duplicate indexes
-- 5. Adding performance indexes for foreign key lookups
-- =====================================================