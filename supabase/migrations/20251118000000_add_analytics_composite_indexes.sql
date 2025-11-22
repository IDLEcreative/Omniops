-- Add Missing Analytics Composite Indexes
-- Performance improvement: 20-30% faster analytics queries
-- Analysis reference: docs/10-ANALYSIS/ANALYSIS_SUPABASE_PERFORMANCE.md (Issue #2)

-- Index 1: Chat telemetry cost analysis by domain + time
-- Speeds up queries filtering by domain and sorting by cost/time
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_telemetry_domain_cost_created
ON chat_telemetry(domain, cost_usd, created_at DESC);

-- Index 2: Chat telemetry performance analytics by model
-- Speeds up queries analyzing model performance and duration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_telemetry_model_duration
ON chat_telemetry(model, duration_ms DESC, created_at DESC);

-- Index 3: Scraped pages domain status with time filtering
-- Speeds up queries for active pages by domain with partial index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_domain_status_created
ON scraped_pages(domain_id, status, created_at DESC)
WHERE status != 'deleted';

-- Comment documentation
COMMENT ON INDEX idx_chat_telemetry_domain_cost_created IS
'Composite index for cost analysis queries grouped by domain and sorted by cost/time. Eliminates need for in-memory filtering.';

COMMENT ON INDEX idx_chat_telemetry_model_duration IS
'Composite index for performance analytics by AI model with duration sorting. Supports dashboard queries.';

COMMENT ON INDEX idx_scraped_pages_domain_status_created IS
'Partial composite index for active pages by domain. Excludes deleted pages to reduce index size.';
