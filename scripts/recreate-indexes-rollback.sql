-- ROLLBACK SCRIPT: Recreate Unused Indexes
-- Use this script if you need to restore any of the dropped indexes
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql

-- ============================================================================
-- SCRAPE_JOBS TABLE INDEXES (5 indexes)
-- ============================================================================

-- Status index for filtering jobs by status
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status 
ON public.scrape_jobs(status);

-- Domain ID index for filtering jobs by domain
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain_id 
ON public.scrape_jobs(domain_id);

-- Customer config index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_customer_config_id 
ON public.scrape_jobs(customer_config_id);

-- Composite index for priority queue processing
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_priority_status 
ON public.scrape_jobs(priority DESC, status);

-- Composite index for queue job processing
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_queue_job 
ON public.scrape_jobs(status, priority DESC, created_at);

-- ============================================================================
-- CUSTOMER_CONFIGS TABLE INDEXES (1 index)
-- ============================================================================

-- Customer ID index for lookups
CREATE INDEX IF NOT EXISTS idx_customer_configs_customer_id 
ON public.customer_configs(customer_id);

-- ============================================================================
-- DOMAINS TABLE INDEXES (1 index)
-- ============================================================================

-- User ID index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_domains_user_id 
ON public.domains(user_id);

-- ============================================================================
-- WEBSITE_CONTENT TABLE INDEXES (4 indexes)
-- ============================================================================

-- Domain index for filtering content by domain
CREATE INDEX IF NOT EXISTS idx_website_content_domain 
ON public.website_content(domain);

-- URL index for direct lookups
CREATE INDEX IF NOT EXISTS idx_website_content_url 
ON public.website_content(url);

-- Content type index for filtering by type
CREATE INDEX IF NOT EXISTS idx_website_content_type 
ON public.website_content(content_type);

-- Hash index for duplicate detection
CREATE INDEX IF NOT EXISTS idx_website_content_hash 
ON public.website_content(content_hash);

-- ============================================================================
-- PAGE_EMBEDDINGS TABLE INDEXES (5 indexes)
-- ============================================================================

-- GIN index for keyword search
CREATE INDEX IF NOT EXISTS idx_page_embeddings_keywords_gin 
ON public.page_embeddings USING gin(keywords);

-- HNSW index for vector similarity search (first variant)
CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector_hnsw 
ON public.page_embeddings USING hnsw(embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- GIN index for entity extraction
CREATE INDEX IF NOT EXISTS idx_page_embeddings_entities_gin 
ON public.page_embeddings USING gin(entities);

-- B-tree index for price range queries
CREATE INDEX IF NOT EXISTS idx_page_embeddings_price_range 
ON public.page_embeddings(price_min, price_max);

-- HNSW index for vector similarity search (second variant)
-- Note: This appears to be a duplicate - consider keeping only one
CREATE INDEX IF NOT EXISTS idx_page_embeddings_hnsw 
ON public.page_embeddings USING hnsw(embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- SCRAPED_PAGES TABLE INDEXES (4 indexes)
-- ============================================================================

-- GIN index for full-text search on content
CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_gin 
ON public.scraped_pages USING gin(to_tsvector('english', content));

-- GIN index for full-text search on title
CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_gin 
ON public.scraped_pages USING gin(to_tsvector('english', title));

-- Composite index for domain-based queries with timestamp
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_scraped 
ON public.scraped_pages(domain, scraped_at DESC);

-- Composite index for URL lookups with completion status
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url_completed 
ON public.scraped_pages(url, is_completed);

-- ============================================================================
-- STRUCTURED_EXTRACTIONS TABLE INDEXES (2 indexes)
-- ============================================================================

-- Domain index for filtering extractions by domain
CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain 
ON public.structured_extractions(domain);

-- URL index for direct lookups
CREATE INDEX IF NOT EXISTS idx_structured_extractions_url 
ON public.structured_extractions(url);

-- ============================================================================
-- CONVERSATIONS TABLE INDEXES (2 indexes)
-- ============================================================================

-- Domain ID index for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_conversations_domain_id 
ON public.conversations(domain_id);

-- Customer ID index for user-specific queries
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id 
ON public.conversations(customer_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query to verify all indexes were created successfully:
/*
SELECT 
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
*/

-- Query to check index usage after recreation:
/*
SELECT 
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY tablename, indexname;
*/