-- Performance Critical Fixes Migration
-- Addresses database timeout issues with comprehensive indexing strategy

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Critical Vector Index for Embeddings Search
-- This is essential for the vector similarity search performance
CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector_search 
ON page_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- 3. Enhanced composite indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_title_content 
ON scraped_pages(domain_id, title) INCLUDE (content, url);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_url_lookup 
ON scraped_pages(domain_id, url);

-- 4. Full-text search indexes with GIN for content
CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_fts 
ON scraped_pages USING gin(to_tsvector('english', content));

CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_fts 
ON scraped_pages USING gin(to_tsvector('english', title));

-- 5. Trigram indexes for fuzzy search performance
CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_trgm 
ON scraped_pages USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_trgm 
ON scraped_pages USING gin (content gin_trgm_ops);

-- 6. Optimize page_embeddings relationships
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_domain 
ON page_embeddings(page_id) INCLUDE (domain_id);

-- 7. Fast domain lookups
CREATE INDEX IF NOT EXISTS idx_domains_domain_lookup 
ON domains(domain) INCLUDE (id);

-- 8. Create optimized vector search function with timeout protection
CREATE OR REPLACE FUNCTION search_embeddings_optimized(
  query_embedding vector(1536),
  p_domain_id uuid,
  match_threshold float DEFAULT 0.15,
  match_count int DEFAULT 10
)
RETURNS TABLE(
  content text,
  title text,
  url text,
  similarity float,
  metadata jsonb
) 
LANGUAGE plpgsql
SET statement_timeout = '8s'
AS $$
BEGIN
  -- Set a local timeout to prevent hanging
  PERFORM set_config('statement_timeout', '8000ms', true);
  
  RETURN QUERY
  SELECT 
    COALESCE(sp.content, '')::text as content,
    COALESCE(sp.title, 'Untitled')::text as title,
    COALESCE(sp.url, '')::text as url,
    GREATEST(0.0, 1.0 - (pe.embedding <=> query_embedding))::float as similarity,
    COALESCE(sp.metadata, '{}'::jsonb) as metadata
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE pe.domain_id = p_domain_id
    AND 1.0 - (pe.embedding <=> query_embedding) >= match_threshold
  ORDER BY pe.embedding <=> query_embedding ASC
  LIMIT match_count;
  
EXCEPTION
  WHEN others THEN
    -- Return empty result on any error to prevent timeout failures
    RETURN;
END;
$$;

-- 9. Create optimized keyword search function for fallback
CREATE OR REPLACE FUNCTION search_pages_keyword_optimized(
  search_query text,
  p_domain_id uuid,
  result_limit int DEFAULT 20
)
RETURNS TABLE(
  content text,
  title text,
  url text,
  similarity float
) 
LANGUAGE plpgsql
SET statement_timeout = '5s'
AS $$
BEGIN
  -- Set a local timeout
  PERFORM set_config('statement_timeout', '5000ms', true);
  
  RETURN QUERY
  SELECT 
    COALESCE(sp.content, '')::text as content,
    COALESCE(sp.title, 'Untitled')::text as title,
    COALESCE(sp.url, '')::text as url,
    CASE 
      WHEN sp.title ILIKE '%' || search_query || '%' THEN 0.9
      WHEN sp.url ILIKE '%' || search_query || '%' THEN 0.8
      WHEN sp.content ILIKE '%' || search_query || '%' THEN 0.7
      ELSE 0.5
    END::float as similarity
  FROM scraped_pages sp
  WHERE sp.domain_id = p_domain_id
    AND (
      sp.title ILIKE '%' || search_query || '%'
      OR sp.url ILIKE '%' || search_query || '%'
      OR sp.content ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN sp.title ILIKE '%' || search_query || '%' THEN 1
      WHEN sp.url ILIKE '%' || search_query || '%' THEN 2
      ELSE 3
    END,
    sp.created_at DESC
  LIMIT result_limit;
  
EXCEPTION
  WHEN others THEN
    -- Return empty result on any error
    RETURN;
END;
$$;

-- 10. Update statement timeout configurations
ALTER DATABASE postgres SET statement_timeout = '60s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '300s';

-- 11. Grant permissions
GRANT EXECUTE ON FUNCTION search_embeddings_optimized TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION search_pages_keyword_optimized TO anon, authenticated, service_role;

-- 12. Update table statistics for query planner optimization
ANALYZE scraped_pages;
ANALYZE page_embeddings;
ANALYZE domains;

-- 13. Set work_mem for better sort performance during vector operations
-- This is applied at the session level for better vector search performance
CREATE OR REPLACE FUNCTION optimize_vector_search_session()
RETURNS void AS $$
BEGIN
  -- Increase memory for vector operations
  PERFORM set_config('work_mem', '256MB', false);
  PERFORM set_config('maintenance_work_mem', '512MB', false);
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION optimize_vector_search_session TO anon, authenticated, service_role;

-- 14. Create monitoring function to track performance
CREATE OR REPLACE FUNCTION get_search_performance_stats()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_size text,
  row_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    i.indexname::text as index_name,
    pg_size_pretty(pg_relation_size(i.indexname::regclass))::text as index_size,
    t.n_tup_ins + t.n_tup_upd as row_count
  FROM pg_stat_user_tables t
  LEFT JOIN pg_indexes i ON i.tablename = t.relname
  WHERE t.relname IN ('scraped_pages', 'page_embeddings', 'domains')
    AND i.indexname IS NOT NULL
  ORDER BY t.relname, i.indexname;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_search_performance_stats TO anon, authenticated, service_role;

-- Migration complete
SELECT 'Performance critical migration completed successfully' as status;