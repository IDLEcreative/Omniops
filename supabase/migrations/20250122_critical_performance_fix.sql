-- Critical Performance Optimizations based on pg_stat_statements analysis
-- Addresses top performance issues consuming 60%+ of query time

-- 1. Fix DELETE performance (22K calls, 20ms avg -> target <2ms)
-- Composite index dramatically speeds up DELETE WHERE page_id = X
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id_composite 
ON page_embeddings(page_id, id);

-- 2. Optimize batch UPDATE operations (161 calls, 900ms avg -> target <100ms)
-- Index for UPDATE WHERE id = ANY(array) operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_id_for_updates 
ON page_embeddings(id) 
INCLUDE (domain_id);

-- 3. Speed up NULL domain_id lookups (for migration queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_null_domain 
ON page_embeddings(page_id) 
WHERE domain_id IS NULL;

-- 4. Optimize vector similarity search
-- Replace basic index with optimized IVFFlat index
DROP INDEX IF EXISTS idx_page_embeddings_vector;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_vector_ivfflat 
ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Create partial index for active content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_recent 
ON page_embeddings(created_at DESC, domain_id) 
WHERE created_at > CURRENT_DATE - INTERVAL '30 days';

-- 6. Optimize autovacuum for high-write table
ALTER TABLE page_embeddings SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Vacuum after 5% dead tuples
  autovacuum_analyze_scale_factor = 0.02, -- Analyze after 2% changes
  autovacuum_vacuum_cost_delay = 10,      -- Reduce vacuum impact
  autovacuum_vacuum_cost_limit = 1000,    -- Allow more work per round
  fillfactor = 90                         -- Leave space for updates
);

-- 7. Optimize scraped_pages for suggested index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_excerpt 
ON scraped_pages(excerpt);

-- 8. Update table statistics for better query planning
ANALYZE page_embeddings;
ANALYZE scraped_pages;

-- 9. Create optimized batch insert function
CREATE OR REPLACE FUNCTION batch_insert_page_embeddings(
  embeddings_data jsonb[],
  batch_size int DEFAULT 1000
)
RETURNS TABLE (
  inserted_count int,
  batch_count int
) 
LANGUAGE plpgsql
AS $$
DECLARE
  total_inserted int := 0;
  batches_processed int := 0;
  batch_start int;
  batch_end int;
  current_batch_size int;
BEGIN
  -- Process in optimized batches
  FOR batch_start IN 1..array_length(embeddings_data, 1) BY batch_size LOOP
    batch_end := LEAST(batch_start + batch_size - 1, array_length(embeddings_data, 1));
    
    -- Insert batch
    INSERT INTO page_embeddings (
      chunk_text, 
      embedding, 
      metadata, 
      page_id, 
      domain_id,
      created_at
    )
    SELECT 
      (e->>'chunk_text')::text,
      (e->>'embedding')::vector(1536),
      (e->'metadata')::jsonb,
      (e->>'page_id')::uuid,
      (e->>'domain_id')::uuid,
      COALESCE((e->>'created_at')::timestamptz, NOW())
    FROM unnest(embeddings_data[batch_start:batch_end]) AS e
    ON CONFLICT (id) DO NOTHING;
    
    GET DIAGNOSTICS current_batch_size = ROW_COUNT;
    total_inserted := total_inserted + current_batch_size;
    batches_processed := batches_processed + 1;
    
    -- Brief pause between batches to prevent blocking
    IF batches_processed % 10 = 0 THEN
      PERFORM pg_sleep(0.001);
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_inserted, batches_processed;
END;
$$;

-- 10. Create function for efficient batch deletes
CREATE OR REPLACE FUNCTION batch_delete_page_embeddings(
  page_ids uuid[],
  batch_size int DEFAULT 500
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  total_deleted int := 0;
  batch_deleted int;
  i int;
BEGIN
  FOR i IN 1..array_length(page_ids, 1) BY batch_size LOOP
    DELETE FROM page_embeddings 
    WHERE page_id = ANY(page_ids[i:LEAST(i + batch_size - 1, array_length(page_ids, 1))]);
    
    GET DIAGNOSTICS batch_deleted = ROW_COUNT;
    total_deleted := total_deleted + batch_deleted;
    
    -- Brief pause between batches
    IF i % 5000 = 1 AND i > 1 THEN
      PERFORM pg_sleep(0.001);
    END IF;
  END LOOP;
  
  RETURN total_deleted;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION batch_insert_page_embeddings TO service_role;
GRANT EXECUTE ON FUNCTION batch_delete_page_embeddings TO service_role;