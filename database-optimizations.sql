-- DATABASE OPTIMIZATION SCRIPT FOR SUPABASE
-- Run these in the SQL Editor to make the database more robust for scraping operations

-- ========================================
-- 1. INCREASE STATEMENT TIMEOUT
-- ========================================
-- Default is often 8-30 seconds, increase for bulk operations
ALTER DATABASE postgres SET statement_timeout = '5min';

-- For the current session
SET statement_timeout = '5min';

-- ========================================
-- 2. ADD MISSING INDEXES FOR PERFORMANCE
-- ========================================

-- Index for scraped_pages table
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_scraped_at ON scraped_pages(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url_scraped_at ON scraped_pages(url, scraped_at DESC);

-- Index for page_embeddings table
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_created_at ON page_embeddings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_chunk ON page_embeddings(page_id, chunk_index);

-- Partial index for finding unprocessed pages
CREATE INDEX IF NOT EXISTS idx_scraped_pages_unprocessed 
ON scraped_pages(id) 
WHERE id NOT IN (SELECT DISTINCT page_id FROM page_embeddings);

-- ========================================
-- 3. OPTIMIZE TABLE STATISTICS
-- ========================================
-- Update table statistics for better query planning
ANALYZE scraped_pages;
ANALYZE page_embeddings;

-- ========================================
-- 4. CONNECTION POOL OPTIMIZATION
-- ========================================
-- Increase max connections (requires restart)
-- ALTER SYSTEM SET max_connections = 200;

-- Optimize work memory for bulk operations
SET work_mem = '256MB';
ALTER DATABASE postgres SET work_mem = '256MB';

-- Increase shared buffers for better caching
-- ALTER SYSTEM SET shared_buffers = '256MB';

-- ========================================
-- 5. OPTIMIZE AUTOVACUUM FOR HIGH WRITE LOAD
-- ========================================
-- Make autovacuum more aggressive during bulk inserts
ALTER TABLE scraped_pages SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

ALTER TABLE page_embeddings SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05,
    autovacuum_vacuum_cost_delay = 10
);

-- ========================================
-- 6. ADD UPSERT FUNCTION FOR EFFICIENT BULK INSERTS
-- ========================================
CREATE OR REPLACE FUNCTION upsert_scraped_page(
    p_url TEXT,
    p_title TEXT,
    p_content TEXT,
    p_scraped_at TIMESTAMPTZ,
    p_metadata JSONB DEFAULT NULL,
    p_word_count INTEGER DEFAULT NULL,
    p_content_hash TEXT DEFAULT NULL
) RETURNS scraped_pages AS $$
DECLARE
    result scraped_pages;
BEGIN
    INSERT INTO scraped_pages (url, title, content, scraped_at, metadata, word_count, content_hash)
    VALUES (p_url, p_title, p_content, p_scraped_at, p_metadata, p_word_count, p_content_hash)
    ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        scraped_at = EXCLUDED.scraped_at,
        metadata = EXCLUDED.metadata,
        word_count = EXCLUDED.word_count,
        content_hash = EXCLUDED.content_hash,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 7. CREATE BATCH INSERT FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION batch_insert_embeddings(
    embeddings JSONB[]
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
    embedding JSONB;
BEGIN
    FOREACH embedding IN ARRAY embeddings
    LOOP
        INSERT INTO page_embeddings (
            page_id,
            chunk_index,
            chunk_text,
            embedding,
            metadata,
            chunk_metadata
        ) VALUES (
            (embedding->>'page_id')::UUID,
            (embedding->>'chunk_index')::INTEGER,
            embedding->>'chunk_text',
            (embedding->'embedding')::vector,
            embedding->'metadata',
            embedding->'chunk_metadata'
        ) ON CONFLICT DO NOTHING;
        
        inserted_count := inserted_count + 1;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 8. ADD CONNECTION MONITORING VIEW
-- ========================================
CREATE OR REPLACE VIEW database_health AS
SELECT 
    (SELECT count(*) FROM pg_stat_activity) as total_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
    (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL) as waiting_queries,
    (SELECT max(age(clock_timestamp(), query_start)) FROM pg_stat_activity WHERE state = 'active') as longest_query_duration,
    (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
    (SELECT setting FROM pg_settings WHERE name = 'statement_timeout') as statement_timeout;

-- ========================================
-- 9. OPTIMIZE LOCKING BEHAVIOR
-- ========================================
-- Reduce lock timeout to fail fast instead of waiting
SET lock_timeout = '10s';
ALTER DATABASE postgres SET lock_timeout = '10s';

-- Reduce deadlock timeout for faster detection
ALTER DATABASE postgres SET deadlock_timeout = '2s';

-- ========================================
-- 10. CREATE MAINTENANCE FUNCTION
-- ========================================
CREATE OR REPLACE FUNCTION cleanup_old_scraped_data(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE(deleted_pages INTEGER, deleted_embeddings INTEGER) AS $$
DECLARE
    deleted_page_count INTEGER;
    deleted_embedding_count INTEGER;
BEGIN
    -- Delete old embeddings first (foreign key constraint)
    DELETE FROM page_embeddings 
    WHERE page_id IN (
        SELECT id FROM scraped_pages 
        WHERE scraped_at < NOW() - INTERVAL '1 day' * days_to_keep
    );
    GET DIAGNOSTICS deleted_embedding_count = ROW_COUNT;
    
    -- Delete old pages
    DELETE FROM scraped_pages 
    WHERE scraped_at < NOW() - INTERVAL '1 day' * days_to_keep;
    GET DIAGNOSTICS deleted_page_count = ROW_COUNT;
    
    -- Run vacuum to reclaim space
    VACUUM ANALYZE scraped_pages;
    VACUUM ANALYZE page_embeddings;
    
    RETURN QUERY SELECT deleted_page_count, deleted_embedding_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CHECK CURRENT DATABASE HEALTH
-- ========================================
SELECT * FROM database_health;

-- ========================================
-- SHOW CURRENT BOTTLENECKS
-- ========================================
SELECT 
    pid,
    usename,
    application_name,
    state,
    wait_event_type,
    wait_event,
    age(clock_timestamp(), query_start) AS query_age,
    LEFT(query, 100) AS query_snippet
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start;