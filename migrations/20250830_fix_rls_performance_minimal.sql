-- Migration: Fix RLS Performance Issues (MINIMAL VERSION)
-- Date: 2025-08-30
-- Purpose: Optimize Row Level Security policies to prevent re-evaluation of auth functions
-- Note: This version only fixes tables that actually exist in your schema

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
-- PART 5: Fix auth RLS for content_refresh_jobs table
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'content_refresh_jobs') THEN
    
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'content_refresh_jobs' 
               AND policyname = 'Users can view their domain''s jobs') THEN
      EXECUTE 'DROP POLICY "Users can view their domain''s jobs" ON public.content_refresh_jobs';
    END IF;
    
    -- Create optimized policy
    EXECUTE 'CREATE POLICY "Users can view their domain''s jobs" ON public.content_refresh_jobs
      FOR SELECT USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
      
    -- Drop and recreate management policy
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'content_refresh_jobs' 
               AND policyname = 'Users can manage their domain''s jobs') THEN
      EXECUTE 'DROP POLICY "Users can manage their domain''s jobs" ON public.content_refresh_jobs';
    END IF;
    
    EXECUTE 'CREATE POLICY "Users can manage their domain''s jobs" ON public.content_refresh_jobs
      FOR ALL USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
  END IF;
END $$;

-- =====================================================
-- PART 6: Fix auth RLS for ai_optimized_content table
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'ai_optimized_content') THEN
    
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'ai_optimized_content' 
               AND policyname = 'Users can view their domain''s optimized content') THEN
      EXECUTE 'DROP POLICY "Users can view their domain''s optimized content" ON public.ai_optimized_content';
    END IF;
    
    EXECUTE 'CREATE POLICY "Users can view their domain''s optimized content" ON public.ai_optimized_content
      FOR SELECT USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
  END IF;
END $$;

-- =====================================================
-- PART 7: Fix auth RLS for training_data table
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'training_data') THEN
    
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'training_data' 
               AND policyname = 'Users can view their training data') THEN
      EXECUTE 'DROP POLICY "Users can view their training data" ON public.training_data';
    END IF;
    
    EXECUTE 'CREATE POLICY "Users can view their training data" ON public.training_data
      FOR SELECT USING ((SELECT auth.uid()) = user_id)';
      
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'training_data' 
               AND policyname = 'Users can manage their training data') THEN
      EXECUTE 'DROP POLICY "Users can manage their training data" ON public.training_data';
    END IF;
    
    EXECUTE 'CREATE POLICY "Users can manage their training data" ON public.training_data
      FOR ALL USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- =====================================================
-- PART 8: Fix auth RLS for scrape_jobs table (if exists)
-- Note: scrape_jobs uses domain_id, not user_id
-- =====================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'scrape_jobs') THEN
    
    -- Remove existing policies
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'scrape_jobs' 
               AND policyname = 'Users can view their own scrape jobs') THEN
      EXECUTE 'DROP POLICY "Users can view their own scrape jobs" ON public.scrape_jobs';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'scrape_jobs' 
               AND policyname = 'Users can manage their own scrape jobs') THEN
      EXECUTE 'DROP POLICY "Users can manage their own scrape jobs" ON public.scrape_jobs';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies 
               WHERE schemaname = 'public' 
               AND tablename = 'scrape_jobs' 
               AND policyname = 'Users manage own scrape jobs') THEN
      EXECUTE 'DROP POLICY "Users manage own scrape jobs" ON public.scrape_jobs';
    END IF;
    
    -- Create new consolidated policy using domain_id
    EXECUTE 'CREATE POLICY "Users manage own scrape jobs" ON public.scrape_jobs
      FOR ALL USING (
        domain_id IN (
          SELECT id FROM public.domains 
          WHERE user_id = (SELECT auth.uid())
        )
      )';
  END IF;
END $$;

-- =====================================================
-- PART 9: Remove duplicate index
-- =====================================================

-- Drop the duplicate index on page_embeddings table if it exists
DROP INDEX IF EXISTS public.idx_page_embeddings_page;

-- =====================================================
-- PART 10: Add performance-optimized indexes
-- =====================================================

-- Critical indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON public.domains(user_id);

-- Indexes for domain_id foreign keys (most important for performance)
CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain_id ON public.structured_extractions(domain_id);
CREATE INDEX IF NOT EXISTS idx_website_content_domain_id ON public.website_content(domain_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id ON public.scraped_pages(domain_id);

-- Indexes for embeddings tables
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON public.page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_id ON public.content_embeddings(content_id);

-- Indexes for conversation tables
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_domain_id ON public.conversations(domain_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- Conditional indexes for tables that might exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'content_refresh_jobs') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_content_refresh_jobs_domain_id ON public.content_refresh_jobs(domain_id)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'ai_optimized_content') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_optimized_content_domain_id ON public.ai_optimized_content(domain_id)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'training_data') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON public.training_data(user_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_training_data_domain_id ON public.training_data(domain_id)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'scrape_jobs') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain_id ON public.scrape_jobs(domain_id)';
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This minimal migration:
-- 1. Only fixes tables that actually exist in your schema
-- 2. Skips business-related tables (they use different auth model)
-- 3. Wraps all auth functions in SELECT statements
-- 4. Uses correct column names (domain_id relationships)
-- 5. Removes duplicate indexes
-- 6. Adds performance indexes for foreign key lookups
-- 
-- Expected performance improvement: 10-100x on large datasets
-- =====================================================