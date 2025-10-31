-- ============================================================================
-- Missing Database Indexes Migration
-- ============================================================================
-- Purpose: Add critical missing indexes identified in the comprehensive audit
-- Expected Performance Improvement: 30-70% reduction in query execution time
-- Created: 2025-10-31
-- Target: Supabase PostgreSQL (birugqyuqhiahxvxeyqg)
-- ============================================================================

-- This script is idempotent - safe to run multiple times
-- All CREATE INDEX statements use IF NOT EXISTS

BEGIN;

-- ============================================================================
-- 1. CRITICAL: page_embeddings.domain_id Indexes
-- ============================================================================
-- Impact: HIGH - Affects all semantic search queries
-- Current Issue: domain_id foreign key has no dedicated index
-- Expected Improvement: 50-70% faster domain-filtered searches

-- Standalone index for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_page_embeddings_domain_id
ON page_embeddings(domain_id);

COMMENT ON INDEX idx_page_embeddings_domain_id IS
'Foreign key index for domain filtering in search queries. Critical for performance.';

-- Composite index for common search pattern (domain + recent first)
CREATE INDEX IF NOT EXISTS idx_page_embeddings_domain_lookup
ON page_embeddings(domain_id, created_at DESC);

COMMENT ON INDEX idx_page_embeddings_domain_lookup IS
'Composite index for domain-filtered searches ordered by recency. Covers most search queries.';

-- ============================================================================
-- 2. IMPORTANT: business_classifications.domain_id Index
-- ============================================================================
-- Impact: MEDIUM - Currently only has unique constraint
-- Current Issue: Unique constraint doesn't optimize non-unique lookups
-- Expected Improvement: 30-40% faster business classification queries

CREATE INDEX IF NOT EXISTS idx_business_classifications_domain_id
ON business_classifications(domain_id);

COMMENT ON INDEX idx_business_classifications_domain_id IS
'Standalone index for business classification lookups by domain.';

-- ============================================================================
-- 3. conversations.domain_id Index (verify exists)
-- ============================================================================
-- Impact: MEDIUM - Affects conversation history queries
-- Note: Should already exist according to schema, but we verify here

CREATE INDEX IF NOT EXISTS idx_conversations_domain_id
ON conversations(domain_id);

COMMENT ON INDEX idx_conversations_domain_id IS
'Domain-based conversation filtering index.';

-- ============================================================================
-- 4. OPTIMIZATION: Composite Indexes for Common Query Patterns
-- ============================================================================

-- 4a. scraped_pages: Domain + Status + Recent First
-- Use case: Fetch recent successful scrapes for a domain
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_status_recent
ON scraped_pages(domain_id, status, created_at DESC)
WHERE status = 'completed';

COMMENT ON INDEX idx_scraped_pages_domain_status_recent IS
'Partial index for fetching recent successful scrapes. Excludes pending/failed pages.';

-- 4b. messages: Conversation + Chronological Order
-- Use case: Retrieve chat history in correct order
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at ASC);

COMMENT ON INDEX idx_messages_conversation_created IS
'Composite index for chat history retrieval in chronological order.';

-- 4c. scrape_jobs: Domain + Status Monitoring
-- Use case: Monitor active jobs for a domain
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain_status
ON scrape_jobs(domain_id, status)
WHERE status IN ('pending', 'running');

COMMENT ON INDEX idx_scrape_jobs_domain_status IS
'Partial index for active job monitoring. Only indexes pending/running jobs.';

-- ============================================================================
-- 5. MAINTENANCE: Update Table Statistics
-- ============================================================================
-- Ensure PostgreSQL query planner has fresh statistics after index creation

ANALYZE page_embeddings;
ANALYZE business_classifications;
ANALYZE conversations;
ANALYZE scraped_pages;
ANALYZE messages;
ANALYZE scrape_jobs;

-- ============================================================================
-- Summary of Changes
-- ============================================================================
-- Indexes Created:
--   1. idx_page_embeddings_domain_id (standalone foreign key)
--   2. idx_page_embeddings_domain_lookup (composite: domain + created_at)
--   3. idx_business_classifications_domain_id (standalone foreign key)
--   4. idx_conversations_domain_id (verification/creation)
--   5. idx_scraped_pages_domain_status_recent (partial: completed only)
--   6. idx_messages_conversation_created (composite: conversation + time)
--   7. idx_scrape_jobs_domain_status (partial: active jobs only)
--
-- Total: 7 indexes
-- Expected Impact: 30-70% query performance improvement
-- Storage Overhead: ~5-10MB estimated
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification Queries (run after migration)
-- ============================================================================

-- Verify all indexes were created
-- SELECT indexname, tablename
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_page_embeddings_domain%'
--    OR indexname LIKE 'idx_business_classifications_domain%'
--    OR indexname LIKE 'idx_conversations_domain%'
--    OR indexname LIKE 'idx_scraped_pages_domain_status%'
--    OR indexname LIKE 'idx_messages_conversation%'
--    OR indexname LIKE 'idx_scrape_jobs_domain_status%'
-- ORDER BY tablename, indexname;

-- Check index sizes
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%domain%'
-- ORDER BY pg_relation_size(indexrelid) DESC;
