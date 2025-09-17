-- Performance Optimization Indexes
-- These indexes will dramatically improve search query performance

-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for text search (5-10x improvement expected)
CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_trgm 
ON scraped_pages USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_trgm 
ON scraped_pages USING gin (content gin_trgm_ops);

-- Add B-tree index for URL searches
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url 
ON scraped_pages (url);

-- Composite index for domain + title searches
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_title 
ON scraped_pages (domain_id, title);

-- Add index for page_embeddings lookups
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings (page_id);

-- Add index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_domains_domain 
ON domains (domain);

-- Analyze tables to update statistics for query planner
ANALYZE scraped_pages;
ANALYZE page_embeddings;
ANALYZE domains;

-- Create optimized search function
CREATE OR REPLACE FUNCTION search_pages_optimized(
  search_query TEXT,
  domain_id UUID,
  result_limit INT DEFAULT 100
)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sp.url)
    sp.url,
    sp.title,
    sp.content,
    sp.metadata,
    GREATEST(
      CASE WHEN sp.title ILIKE '%' || search_query || '%' THEN 1.0 ELSE 0 END * 3,  -- Exact title match weighted 3x
      CASE WHEN sp.url ILIKE '%' || search_query || '%' THEN 1.0 ELSE 0 END * 2,    -- URL match weighted 2x
      CASE WHEN sp.content ILIKE '%' || search_query || '%' THEN 0.5 ELSE 0 END,    -- Content match
      similarity(sp.title, search_query) * 2,                                        -- Fuzzy title match
      similarity(COALESCE(sp.content, ''), search_query)                            -- Fuzzy content match
    ) as relevance_score
  FROM scraped_pages sp
  WHERE sp.domain_id = search_pages_optimized.domain_id
    AND (
      sp.title ILIKE '%' || search_query || '%'
      OR sp.url ILIKE '%' || search_query || '%'
      OR sp.content ILIKE '%' || search_query || '%'
      OR similarity(sp.title, search_query) > 0.1
    )
  ORDER BY sp.url, relevance_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION search_pages_optimized TO anon, authenticated, service_role;