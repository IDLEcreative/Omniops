-- EMERGENCY DATABASE PERFORMANCE FIX
-- Based on query analysis showing critical performance issues
-- Apply these fixes IMMEDIATELY to restore database functionality

-- ========================================
-- CRITICAL ISSUE #1: page_embeddings INSERT taking 78.3% of database time!
-- Average 1.7 seconds per insert with 8,585 calls
-- ========================================

-- 1. Add missing primary key/unique constraint to prevent duplicates
ALTER TABLE page_embeddings 
ADD CONSTRAINT unique_page_chunk 
UNIQUE (page_id, chunk_index) 
ON CONFLICT DO NOTHING;

-- 2. Critical index for the INSERT operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_composite 
ON page_embeddings(page_id, chunk_index);

-- ========================================
-- CRITICAL ISSUE #2: scraped_pages UPSERT operations (10.8% of time)
-- ========================================

-- Add critical index on URL for the ON CONFLICT clause
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_url_unique 
ON scraped_pages(url);

-- Add index for domain_id lookups (19,470 calls!)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_domain_id 
ON scraped_pages(domain_id);

-- ========================================
-- CRITICAL ISSUE #3: DELETE operations on page_embeddings (9,758 calls)
-- ========================================

-- This index will dramatically speed up DELETE WHERE page_id = ?
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id_delete 
ON page_embeddings(page_id) 
WHERE page_id IS NOT NULL;

-- ========================================
-- IMMEDIATE PERFORMANCE TUNING
-- ========================================

-- Increase work memory for this session
SET work_mem = '256MB';

-- Increase statement timeout to prevent cascading failures
SET statement_timeout = '5min';

-- Reduce lock timeout to fail fast
SET lock_timeout = '10s';

-- ========================================
-- KILL BLOCKING QUERIES
-- ========================================

-- Terminate all queries running longer than 2 minutes
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '2 minutes'
  AND pid != pg_backend_pid();

-- ========================================
-- VACUUM AND ANALYZE CRITICAL TABLES
-- ========================================

-- Clean up dead tuples and update statistics
VACUUM ANALYZE page_embeddings;
VACUUM ANALYZE scraped_pages;

-- ========================================
-- CREATE OPTIMIZED UPSERT FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION fast_upsert_scraped_page(
    p_url TEXT,
    p_title TEXT,
    p_content TEXT,
    p_scraped_at TIMESTAMPTZ,
    p_metadata JSONB,
    p_domain_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    -- Use INSERT ... ON CONFLICT with minimal locking
    INSERT INTO scraped_pages (url, title, content, scraped_at, metadata, domain_id)
    VALUES (p_url, p_title, p_content, p_scraped_at, p_metadata, p_domain_id)
    ON CONFLICT (url) 
    DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        scraped_at = EXCLUDED.scraped_at,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO result_id;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE BATCH INSERT FOR EMBEDDINGS
-- ========================================

CREATE OR REPLACE FUNCTION fast_batch_insert_embeddings(
    p_embeddings JSONB
) RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- Use a single INSERT with multiple values for efficiency
    WITH input_data AS (
        SELECT 
            (value->>'page_id')::UUID as page_id,
            (value->>'chunk_index')::INTEGER as chunk_index,
            value->>'chunk_text' as chunk_text,
            (value->'embedding')::vector as embedding,
            value->'metadata' as metadata
        FROM jsonb_array_elements(p_embeddings)
    )
    INSERT INTO page_embeddings (page_id, chunk_index, chunk_text, embedding, metadata)
    SELECT * FROM input_data
    ON CONFLICT (page_id, chunk_index) DO NOTHING;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- MONITORING VIEW
-- ========================================

CREATE OR REPLACE VIEW current_database_health AS
SELECT 
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
    (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL) as waiting_queries,
    (SELECT max(age(clock_timestamp(), query_start)) 
     FROM pg_stat_activity WHERE state = 'active') as longest_query_duration,
    (SELECT count(*) FROM pg_stat_activity) as total_connections,
    (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
    pg_database_size(current_database()) / 1024 / 1024 as database_size_mb;

-- Check the health after applying fixes
SELECT * FROM current_database_health;

-- ========================================
-- IMPORTANT: Run this to see if database is recovering
-- ========================================
SELECT 
    'Database Status' as check_type,
    CASE 
        WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '1 minute') > 0 
        THEN 'CRITICAL - Long running queries detected'
        WHEN (SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL) > 10
        THEN 'WARNING - Many waiting queries'
        ELSE 'OK - Database recovering'
    END as status;