-- Migration: Critical Fixes from PR #4 Analysis
-- Created: 2025-10-28 23:00:00
-- Purpose: Address critical database issues identified by 8-agent codebase analysis
-- Issues Fixed:
--   1. Remove deprecated chat_sessions and chat_messages tables (duplicates)
--   2. Begin customer_id → organization_id migration (Phase 1: Add columns)
--   3. Add missing tables referenced in code (scrape_jobs, query_cache, error_logs)
--   4. Add performance indexes for common query patterns
--   5. Add RLS policies for new tables
--
-- IMPORTANT: This is Phase 1 - dual-write period. Phase 2 will drop old columns after code is updated.
--
-- Reference Documents:
--   - docs/CRITICAL_ISSUES_ANALYSIS.md (Issue #2: customer_id migration)
--   - docs/reports/DATABASE_ANALYSIS_REPORT.md (16 unused tables, 5 missing tables, 2 deprecated)

-- =====================================================
-- SECTION 1: REMOVE DEPRECATED TABLES
-- =====================================================
-- These tables are duplicates of conversations and messages
-- Safe to remove as they're not actively used per DATABASE_ANALYSIS_REPORT.md

DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;

-- =====================================================
-- SECTION 2: ADD ORGANIZATION_ID TO TABLES MISSING IT
-- =====================================================
-- Phase 1 of customer_id → organization_id migration
-- These tables need organization_id for proper multi-tenant isolation
-- Based on CRITICAL_ISSUES_ANALYSIS.md Issue #2

-- Add organization_id to page_embeddings (13,054 rows - most critical)
ALTER TABLE page_embeddings
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to scraped_pages (4,459 rows)
ALTER TABLE scraped_pages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to website_content (3 rows - minimal use)
ALTER TABLE website_content
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to structured_extractions (34 rows)
ALTER TABLE structured_extractions
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to conversations (871 rows)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to messages (2,441 rows)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create indexes for organization_id queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_page_embeddings_organization_id ON page_embeddings(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_organization_id ON scraped_pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_website_content_organization_id ON website_content(organization_id);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_organization_id ON structured_extractions(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);

-- =====================================================
-- SECTION 3: CREATE MISSING TABLES
-- =====================================================
-- These tables are referenced in code but don't exist in database
-- Based on DATABASE_ANALYSIS_REPORT.md Section "Non-Existent Tables"

-- scrape_jobs: Background job queue for web scraping
-- Referenced 16 times in code
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  pages_scraped INTEGER DEFAULT 0,
  pages_total INTEGER,
  pages_failed INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scrape_jobs
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_org_status ON scrape_jobs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain ON scrape_jobs(domain);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

-- query_cache: Query result caching for performance
-- Referenced 7 times in code
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL,
  hit_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query_cache
CREATE INDEX IF NOT EXISTS idx_query_cache_hash ON query_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_cache_org ON query_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_query_cache_last_accessed ON query_cache(last_accessed_at);

-- error_logs: Error tracking and debugging
-- Referenced 3 times in code
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT,
  method TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for error_logs
CREATE INDEX IF NOT EXISTS idx_error_logs_org ON error_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved) WHERE resolved = FALSE;

-- =====================================================
-- SECTION 4: PERFORMANCE INDEXES
-- =====================================================
-- Add missing indexes for common query patterns identified in codebase

-- Conversations by organization with deleted filter (very common pattern)
CREATE INDEX IF NOT EXISTS idx_conversations_organization_active
ON conversations(organization_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Messages by conversation (always filtered, always sorted by created_at)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_active
ON messages(conversation_id, created_at ASC)
WHERE deleted_at IS NULL;

-- Page embeddings by customer_id (legacy) - for backwards compatibility during migration
CREATE INDEX IF NOT EXISTS idx_page_embeddings_customer_id
ON page_embeddings(customer_id)
WHERE customer_id IS NOT NULL;

-- Scraped pages by domain_id and status
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_status
ON scraped_pages(domain_id, status);

-- Scraped pages by URL for lookups
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url
ON scraped_pages(url);

-- Structured extractions by organization and type
CREATE INDEX IF NOT EXISTS idx_structured_extractions_org_type
ON structured_extractions(organization_id, extraction_type);

-- =====================================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Enable RLS and add policies for new tables

-- Enable RLS on new tables
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- scrape_jobs: Users can only see jobs for their organizations
CREATE POLICY scrape_jobs_org_isolation ON scrape_jobs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- query_cache: Users can only see cache for their organizations
CREATE POLICY query_cache_org_isolation ON query_cache
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- error_logs: Users can see errors for their organizations
-- Service role can see all errors for debugging
CREATE POLICY error_logs_org_isolation ON error_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- error_logs: Only admins can insert error logs
CREATE POLICY error_logs_insert ON error_logs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- SECTION 6: HELPER FUNCTIONS
-- =====================================================
-- Functions to assist with data migration and queries

-- Function to backfill organization_id from customer_configs
-- This will be called manually after migration to populate organization_id
CREATE OR REPLACE FUNCTION backfill_organization_ids()
RETURNS TABLE(
  table_name TEXT,
  rows_updated BIGINT
) AS $$
DECLARE
  v_rows_updated BIGINT;
BEGIN
  -- Backfill page_embeddings
  UPDATE page_embeddings pe
  SET organization_id = cc.organization_id
  FROM customer_configs cc
  WHERE pe.customer_id = cc.id
  AND pe.organization_id IS NULL
  AND cc.organization_id IS NOT NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  table_name := 'page_embeddings';
  rows_updated := v_rows_updated;
  RETURN NEXT;

  -- Backfill scraped_pages
  UPDATE scraped_pages sp
  SET organization_id = d.organization_id
  FROM domains d
  WHERE sp.domain_id = d.id
  AND sp.organization_id IS NULL
  AND d.organization_id IS NOT NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  table_name := 'scraped_pages';
  rows_updated := v_rows_updated;
  RETURN NEXT;

  -- Backfill website_content
  UPDATE website_content wc
  SET organization_id = d.organization_id
  FROM domains d
  WHERE wc.domain_id = d.id
  AND wc.organization_id IS NULL
  AND d.organization_id IS NOT NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  table_name := 'website_content';
  rows_updated := v_rows_updated;
  RETURN NEXT;

  -- Backfill structured_extractions
  UPDATE structured_extractions se
  SET organization_id = cc.organization_id
  FROM customer_configs cc
  WHERE se.customer_id = cc.id
  AND se.organization_id IS NULL
  AND cc.organization_id IS NOT NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  table_name := 'structured_extractions';
  rows_updated := v_rows_updated;
  RETURN NEXT;

  -- Backfill conversations
  UPDATE conversations c
  SET organization_id = cc.organization_id
  FROM customer_configs cc
  WHERE c.customer_id = cc.id
  AND c.organization_id IS NULL
  AND cc.organization_id IS NOT NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  table_name := 'conversations';
  rows_updated := v_rows_updated;
  RETURN NEXT;

  -- Backfill messages
  UPDATE messages m
  SET organization_id = c.organization_id
  FROM conversations c
  WHERE m.conversation_id = c.id
  AND m.organization_id IS NULL
  AND c.organization_id IS NOT NULL;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  table_name := 'messages';
  rows_updated := v_rows_updated;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 7: VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify migration success

-- Verify deprecated tables are removed
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('chat_sessions', 'chat_messages');

  IF v_count > 0 THEN
    RAISE NOTICE 'WARNING: Deprecated tables still exist (expected 0, found %)', v_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Deprecated tables removed';
  END IF;
END $$;

-- Verify new tables exist
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('scrape_jobs', 'query_cache', 'error_logs');

  IF v_count = 3 THEN
    RAISE NOTICE 'SUCCESS: All 3 new tables created';
  ELSE
    RAISE NOTICE 'WARNING: Expected 3 new tables, found %', v_count;
  END IF;
END $$;

-- Verify organization_id columns added
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'organization_id'
  AND table_name IN ('page_embeddings', 'scraped_pages', 'website_content',
                     'structured_extractions', 'conversations', 'messages');

  IF v_count = 6 THEN
    RAISE NOTICE 'SUCCESS: organization_id added to all 6 tables';
  ELSE
    RAISE NOTICE 'WARNING: Expected organization_id in 6 tables, found in %', v_count;
  END IF;
END $$;

-- Check for data that needs backfilling
DO $$
DECLARE
  v_page_embeddings INTEGER;
  v_scraped_pages INTEGER;
  v_conversations INTEGER;
BEGIN
  -- Count rows with customer_id but no organization_id
  SELECT COUNT(*) INTO v_page_embeddings
  FROM page_embeddings
  WHERE customer_id IS NOT NULL AND organization_id IS NULL;

  SELECT COUNT(*) INTO v_scraped_pages
  FROM scraped_pages
  WHERE organization_id IS NULL;

  SELECT COUNT(*) INTO v_conversations
  FROM conversations
  WHERE customer_id IS NOT NULL AND organization_id IS NULL;

  RAISE NOTICE 'Data requiring backfill:';
  RAISE NOTICE '  - page_embeddings: % rows', v_page_embeddings;
  RAISE NOTICE '  - scraped_pages: % rows', v_scraped_pages;
  RAISE NOTICE '  - conversations: % rows', v_conversations;
  RAISE NOTICE 'Run: SELECT * FROM backfill_organization_ids(); to populate organization_id';
END $$;

-- Verify RLS policies are enabled
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('scrape_jobs', 'query_cache', 'error_logs')
  AND c.relrowsecurity = true;

  IF v_count = 3 THEN
    RAISE NOTICE 'SUCCESS: RLS enabled on all 3 new tables';
  ELSE
    RAISE NOTICE 'WARNING: Expected RLS on 3 tables, found on %', v_count;
  END IF;
END $$;

-- Summary report
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE: 20251028230000_critical_fixes_from_pr4.sql';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ Removed 2 deprecated tables';
  RAISE NOTICE '  ✓ Added organization_id to 6 tables';
  RAISE NOTICE '  ✓ Created 3 missing tables';
  RAISE NOTICE '  ✓ Added 15+ performance indexes';
  RAISE NOTICE '  ✓ Enabled RLS on 3 tables';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run: SELECT * FROM backfill_organization_ids();';
  RAISE NOTICE '  2. Update application code to use organization_id';
  RAISE NOTICE '  3. Test thoroughly in development';
  RAISE NOTICE '  4. Phase 2: Drop customer_id columns (separate migration)';
  RAISE NOTICE '========================================';
END $$;
