-- Performance Optimization Migration
-- Generated: 2025-08-29
-- Purpose: Optimize slow queries identified in performance analysis

-- ============================================
-- 1. ADD MISSING INDEXES
-- ============================================

-- Index for scraped_pages domain_id and scraped_at (used in filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_domain_scraped 
ON scraped_pages(domain_id, scraped_at DESC);

-- Partial index for completed pages (reduce index size)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_url_completed 
ON scraped_pages(url) 
WHERE status = 'completed';

-- Index for page_embeddings page_id lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

-- Composite index for page_embeddings queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_created 
ON page_embeddings(page_id, created_at DESC);

-- ============================================
-- 2. OPTIMIZE VECTOR SEARCH WITH HNSW INDEX
-- ============================================

-- Drop old IVFFlat index if exists and create HNSW for better performance
DROP INDEX IF EXISTS page_embeddings_embedding_idx;

-- Create HNSW index for faster similarity search
-- Note: HNSW provides better query performance than IVFFlat
CREATE INDEX CONCURRENTLY page_embeddings_embedding_hnsw_idx 
ON page_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Also create HNSW index for content_embeddings if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'content_embeddings') THEN
        
        DROP INDEX IF EXISTS content_embeddings_embedding_idx;
        
        CREATE INDEX CONCURRENTLY content_embeddings_embedding_hnsw_idx 
        ON content_embeddings 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    END IF;
END $$;

-- ============================================
-- 3. OPTIMIZE SEARCH_EMBEDDINGS FUNCTION
-- ============================================

-- Drop and recreate with performance improvements
DROP FUNCTION IF EXISTS search_embeddings(vector, uuid, double precision, integer);

CREATE OR REPLACE FUNCTION search_embeddings(
    query_embedding vector,
    p_domain_id uuid DEFAULT NULL,
    match_threshold double precision DEFAULT 0.78,
    match_count integer DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    page_id uuid,
    chunk_text text,
    metadata jsonb,
    similarity double precision
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Use HNSW index for fast similarity search
    RETURN QUERY
    SELECT 
        pe.id,
        pe.page_id,
        pe.chunk_text,
        pe.metadata,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM page_embeddings pe
    INNER JOIN scraped_pages sp ON pe.page_id = sp.id
    WHERE 
        (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
        AND sp.status = 'completed'  -- Only search completed pages
        AND 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_embeddings TO service_role;
GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;

-- ============================================
-- 4. CREATE BULK UPSERT FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
    pages jsonb
)
RETURNS TABLE(
    id uuid,
    url text,
    status text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    INSERT INTO scraped_pages (
        url, title, content, domain_id, status, scraped_at, metadata
    )
    SELECT 
        (p->>'url')::text,
        (p->>'title')::text,
        (p->>'content')::text,
        (p->>'domain_id')::uuid,
        COALESCE((p->>'status')::text, 'completed'),
        COALESCE((p->>'scraped_at')::timestamptz, NOW()),
        COALESCE((p->'metadata')::jsonb, '{}'::jsonb)
    FROM jsonb_array_elements(pages) AS p
    ON CONFLICT (url) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        status = EXCLUDED.status,
        scraped_at = EXCLUDED.scraped_at,
        metadata = EXCLUDED.metadata,
        last_scraped_at = NOW()
    RETURNING 
        scraped_pages.id,
        scraped_pages.url,
        scraped_pages.status;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION bulk_upsert_scraped_pages TO service_role;

-- ============================================
-- 5. CREATE BULK INSERT FOR EMBEDDINGS
-- ============================================

CREATE OR REPLACE FUNCTION bulk_insert_embeddings(
    embeddings jsonb
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    inserted_count integer;
BEGIN
    WITH inserted AS (
        INSERT INTO page_embeddings (
            page_id, chunk_text, embedding, metadata
        )
        SELECT 
            (e->>'page_id')::uuid,
            (e->>'chunk_text')::text,
            (e->>'embedding')::vector(1536),
            COALESCE((e->'metadata')::jsonb, '{}'::jsonb)
        FROM jsonb_array_elements(embeddings) AS e
        ON CONFLICT DO NOTHING
        RETURNING 1
    )
    SELECT COUNT(*) INTO inserted_count FROM inserted;
    
    RETURN inserted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION bulk_insert_embeddings TO service_role;

-- ============================================
-- 6. OPTIMIZE TABLE STATISTICS
-- ============================================

-- Update statistics for better query planning
ANALYZE scraped_pages;
ANALYZE page_embeddings;
ANALYZE customer_configs;

-- ============================================
-- 7. ADD TABLE PARTITIONING (OPTIONAL - for very large tables)
-- ============================================

-- If scraped_pages grows very large (>10M rows), consider partitioning
-- Uncomment below if needed:

/*
-- Create partitioned table
CREATE TABLE scraped_pages_partitioned (
    LIKE scraped_pages INCLUDING ALL
) PARTITION BY RANGE (scraped_at);

-- Create partitions for each month
CREATE TABLE scraped_pages_2025_01 PARTITION OF scraped_pages_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE scraped_pages_2025_02 PARTITION OF scraped_pages_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Add more partitions as needed...
*/

-- ============================================
-- 8. CONNECTION POOLING OPTIMIZATION
-- ============================================

-- Note: Connection pooling settings should be configured at the application level
-- Add these to your Supabase client initialization:
-- {
--   db: {
--     poolSize: 10,
--     idleTimeoutMillis: 30000,
--     connectionTimeoutMillis: 2000,
--   }
-- }

-- ============================================
-- 9. VACUUM AND REINDEX
-- ============================================

-- Clean up dead tuples and update visibility map
VACUUM ANALYZE scraped_pages;
VACUUM ANALYZE page_embeddings;

-- Rebuild indexes for optimal performance (run during maintenance window)
-- REINDEX TABLE CONCURRENTLY scraped_pages;
-- REINDEX TABLE CONCURRENTLY page_embeddings;

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- Query to check index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Query to monitor slow queries
CREATE OR REPLACE VIEW slow_query_monitor AS
SELECT 
    substring(query, 1, 100) AS query_preview,
    calls,
    total_time,
    mean_time,
    max_time,
    rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 20;

-- Grant view permissions
GRANT SELECT ON index_usage_stats TO authenticated;
GRANT SELECT ON slow_query_monitor TO authenticated;