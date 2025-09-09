-- Migration: Database Cleanup
-- Date: 2025-09-09
-- Purpose: Remove unused tables and streamline database to only essential tables

-- =====================================================
-- PART 1: Create scrape_jobs table (missing but heavily referenced in code)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  customer_config_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  job_type TEXT NOT NULL DEFAULT 'full_scrape',
  priority INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain_id ON public.scrape_jobs(domain_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON public.scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_scheduled_at ON public.scrape_jobs(scheduled_at);

-- Enable RLS
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users manage own scrape jobs" ON public.scrape_jobs
  FOR ALL USING (
    domain_id IN (
      SELECT id FROM domains WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.scrape_jobs IS 'Background job queue for web scraping tasks';

-- =====================================================
-- PART 2: Create query_cache table (missing but referenced in code)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.query_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient cache lookups
CREATE INDEX IF NOT EXISTS idx_query_cache_lookup 
ON public.query_cache(domain_id, query_hash) 
WHERE expires_at > now();

CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
ON public.query_cache(expires_at);

-- Enable RLS
ALTER TABLE public.query_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Service role can manage cache" ON public.query_cache
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.query_cache IS 'Query result caching for performance optimization';

-- =====================================================
-- PART 3: Drop deprecated duplicate tables
-- =====================================================

-- These are duplicates of conversations and messages tables
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

-- =====================================================
-- PART 3: Drop unused multi-tenant tables (not implemented)
-- =====================================================

-- Multi-tenant feature not implemented, using domain-based isolation instead
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.business_configs CASCADE;
DROP TABLE IF EXISTS public.business_usage CASCADE;

-- =====================================================
-- PART 4: Drop unused privacy/compliance tables (not implemented)
-- =====================================================

-- Privacy features not implemented
DROP TABLE IF EXISTS public.privacy_requests CASCADE;
DROP TABLE IF EXISTS public.customer_verifications CASCADE;
DROP TABLE IF EXISTS public.customer_access_logs CASCADE;
DROP TABLE IF EXISTS public.customer_data_cache CASCADE;

-- =====================================================
-- PART 5: Drop unused optimization/feature tables (not implemented)
-- =====================================================

-- These features were planned but never implemented
DROP TABLE IF EXISTS public.ai_optimized_content CASCADE;
DROP TABLE IF EXISTS public.content_hashes CASCADE;
DROP TABLE IF EXISTS public.page_content_references CASCADE;
DROP TABLE IF EXISTS public.domain_patterns CASCADE;

-- =====================================================
-- PART 6: Drop unused tables with no data
-- =====================================================

-- These tables exist but have never been used
DROP TABLE IF EXISTS public.training_data CASCADE;
DROP TABLE IF EXISTS public.content_refresh_jobs CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;

-- =====================================================
-- PART 7: Keep minimal website_content table
-- =====================================================

-- website_content has minimal use (3 rows) but may be needed
-- Keep it for now but consider merging with scraped_pages later

-- =====================================================
-- PART 8: Add missing indexes for performance
-- =====================================================

-- Ensure all foreign keys have indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_domain_id ON public.conversations(domain_id);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON public.page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain_id ON public.structured_extractions(domain_id);

-- =====================================================
-- PART 9: Update table comments for clarity
-- =====================================================

COMMENT ON TABLE public.customer_configs IS 'Customer configuration and encrypted API credentials';
COMMENT ON TABLE public.domains IS 'Websites registered for scraping and monitoring';
COMMENT ON TABLE public.scraped_pages IS 'Raw HTML and text content from web scraping';
COMMENT ON TABLE public.page_embeddings IS 'Vector embeddings for semantic search (consolidated from content_embeddings)';
COMMENT ON TABLE public.structured_extractions IS 'AI-extracted structured data (products, FAQs, contact info)';
COMMENT ON TABLE public.conversations IS 'Chat conversation sessions';
COMMENT ON TABLE public.messages IS 'Individual chat messages within conversations';
COMMENT ON TABLE public.website_content IS 'Processed website content (consider merging with scraped_pages)';

-- =====================================================
-- FINAL: Summary of changes
-- =====================================================

-- Tables created: 2 (scrape_jobs, query_cache)
-- Tables dropped: 16 (unused/deprecated)
-- Final table count: 10 essential tables
-- 
-- Remaining tables:
-- 1. customer_configs (2 rows) - Customer settings & API keys
-- 2. domains (3 rows) - Tracked websites
-- 3. scraped_pages (4,459 rows) - Raw scraped content
-- 4. page_embeddings (13,054 rows) - Vector search embeddings
-- 5. structured_extractions (34 rows) - Extracted products/FAQs
-- 6. conversations (871 rows) - Chat sessions
-- 7. messages (2,441 rows) - Chat messages
-- 8. website_content (3 rows) - Processed content
-- 9. scrape_jobs (new) - Background job queue
-- 10. query_cache (new) - Performance caching