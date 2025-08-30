-- Optimize RAG search for better performance
-- Run this in Supabase SQL Editor

-- First, create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id 
ON scraped_pages(domain_id);

CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

-- Create the vector index using IVF_FLAT for faster similarity search
-- Using vector_l2_ops for L2 distance (compatible with <-> operator)
CREATE INDEX IF NOT EXISTS page_embeddings_embedding_idx
ON page_embeddings 
USING ivfflat (embedding vector_l2_ops)
WITH (lists = 100);

-- Analyze tables to update statistics
ANALYZE scraped_pages;
ANALYZE page_embeddings;

-- Increase timeout for complex queries
ALTER DATABASE postgres SET statement_timeout = '30s';

-- Now recreate the function with better performance hints
DROP FUNCTION IF EXISTS public.search_embeddings CASCADE;

CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  p_domain_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  content text,
  url text,
  title text,
  similarity float
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use SET LOCAL for query-specific optimizations
  SET LOCAL enable_seqscan = OFF; -- Force index usage
  SET LOCAL ivfflat.probes = 10; -- Increase search accuracy
  
  RETURN QUERY
  SELECT 
    pe.chunk_text as content,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    1 - (pe.embedding <-> query_embedding) as similarity
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND 1 - (pe.embedding <-> query_embedding) > match_threshold
  ORDER BY pe.embedding <-> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role;

-- Test the function performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM search_embeddings(
  (SELECT array_agg(0.1)::vector(1536) FROM generate_series(1, 1536)),
  NULL,
  0.5,
  5
);

-- Show success message
SELECT 'Optimization complete! Indexes created and function optimized.' as status;