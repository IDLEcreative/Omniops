-- Performance Optimization: Add indexes for frequently queried columns
-- This migration adds indexes to improve query performance

-- Index for scraped_pages table
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain ON scraped_pages(domain);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_last_scraped ON scraped_pages(last_scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_scraped ON scraped_pages(domain, last_scraped_at DESC);

-- Index for page_embeddings table
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_created_at ON page_embeddings(created_at DESC);
-- For vector similarity search (if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector ON page_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Index for customer_configs table
CREATE INDEX IF NOT EXISTS idx_customer_configs_domain ON customer_configs(domain);
CREATE INDEX IF NOT EXISTS idx_customer_configs_company ON customer_configs(company_name);
CREATE INDEX IF NOT EXISTS idx_customer_configs_woo_enabled ON customer_configs(woocommerce_enabled);

-- Index for conversations table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
        CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
    END IF;
END $$;

-- Index for messages table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
        -- Composite index for conversation messages retrieval
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
    END IF;
END $$;

-- Index for content_embeddings table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_embeddings') THEN
        CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_id ON content_embeddings(content_id);
        CREATE INDEX IF NOT EXISTS idx_content_embeddings_created_at ON content_embeddings(created_at DESC);
    END IF;
END $$;

-- Index for training_data table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_data') THEN
        CREATE INDEX IF NOT EXISTS idx_training_data_customer_id ON training_data(customer_id);
        CREATE INDEX IF NOT EXISTS idx_training_data_type ON training_data(type);
        CREATE INDEX IF NOT EXISTS idx_training_data_created_at ON training_data(created_at DESC);
        -- Composite index for customer training data
        CREATE INDEX IF NOT EXISTS idx_training_data_customer_type ON training_data(customer_id, type);
    END IF;
END $$;

-- Index for scraper_configs table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scraper_configs') THEN
        CREATE INDEX IF NOT EXISTS idx_scraper_configs_customer_id ON scraper_configs(customer_id);
        CREATE INDEX IF NOT EXISTS idx_scraper_configs_updated_at ON scraper_configs(updated_at DESC);
    END IF;
END $$;

-- Optimize for JSONB queries on metadata columns
CREATE INDEX IF NOT EXISTS idx_scraped_pages_metadata_gin ON scraped_pages USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_metadata_gin ON page_embeddings USING gin(metadata);

-- Create partial indexes for commonly filtered queries
CREATE INDEX IF NOT EXISTS idx_scraped_pages_active ON scraped_pages(url) 
WHERE last_scraped_at > CURRENT_TIMESTAMP - INTERVAL '7 days';

CREATE INDEX IF NOT EXISTS idx_customer_configs_active_woo ON customer_configs(domain) 
WHERE woocommerce_enabled = true;

-- Analyze tables to update statistics after index creation
ANALYZE scraped_pages;
ANALYZE page_embeddings;
ANALYZE customer_configs;

-- Add comment to track migration purpose
COMMENT ON INDEX idx_scraped_pages_url IS 'Performance: Primary lookup by URL';
COMMENT ON INDEX idx_scraped_pages_domain IS 'Performance: Filter by domain';
COMMENT ON INDEX idx_page_embeddings_page_id IS 'Performance: Join with scraped_pages';
COMMENT ON INDEX idx_customer_configs_domain IS 'Performance: Lookup by domain';

-- Performance monitoring view
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Query performance view
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    min_time
FROM pg_stat_statements
WHERE mean_time > 100  -- Queries averaging over 100ms
ORDER BY mean_time DESC
LIMIT 20;

-- Index usage statistics view
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;