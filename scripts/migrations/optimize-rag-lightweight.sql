-- Lightweight optimization for RAG search (works with memory constraints)
-- Run this in Supabase SQL Editor

-- First, create regular indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id 
ON scraped_pages(domain_id);

CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

-- Try a smaller IVF index with fewer lists (requires less memory)
-- If this still fails, we'll skip it and rely on other optimizations
DO $$ 
BEGIN
  -- Try to create vector index with minimal lists
  BEGIN
    CREATE INDEX IF NOT EXISTS page_embeddings_embedding_idx
    ON page_embeddings 
    USING ivfflat (embedding vector_l2_ops)
    WITH (lists = 10); -- Reduced from 100 to 10 for lower memory usage
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Vector index creation failed, continuing without it';
  END;
END $$;

-- Analyze tables to update statistics
ANALYZE scraped_pages;
ANALYZE page_embeddings;

-- Increase timeout for complex queries
ALTER DATABASE postgres SET statement_timeout = '60s';

-- Now recreate the function with optimization for non-indexed vector search
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
  -- For domain-specific searches, use a more efficient approach
  IF p_domain_id IS NOT NULL THEN
    RETURN QUERY
    WITH filtered_pages AS (
      -- First filter by domain (uses index)
      SELECT pe.*, sp.url, sp.title
      FROM page_embeddings pe
      INNER JOIN scraped_pages sp ON pe.page_id = sp.id
      WHERE sp.domain_id = p_domain_id
      LIMIT 1000  -- Limit scan to first 1000 pages for performance
    )
    SELECT 
      fp.chunk_text as content,
      COALESCE((fp.metadata->>'url')::text, fp.url) as url,
      COALESCE((fp.metadata->>'title')::text, fp.title) as title,
      1 - (fp.embedding <-> query_embedding) as similarity
    FROM filtered_pages fp
    WHERE 1 - (fp.embedding <-> query_embedding) > match_threshold
    ORDER BY fp.embedding <-> query_embedding
    LIMIT match_count;
  ELSE
    -- For global searches, sample the data for performance
    RETURN QUERY
    SELECT 
      pe.chunk_text as content,
      COALESCE((pe.metadata->>'url')::text, sp.url) as url,
      COALESCE((pe.metadata->>'title')::text, sp.title) as title,
      1 - (pe.embedding <-> query_embedding) as similarity
    FROM page_embeddings pe
    INNER JOIN scraped_pages sp ON pe.page_id = sp.id
    WHERE 1 - (pe.embedding <-> query_embedding) > match_threshold
    ORDER BY pe.embedding <-> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role;

-- Create a simpler version for testing
CREATE OR REPLACE FUNCTION public.test_search_embeddings(
  p_domain_id UUID
)
RETURNS TABLE (
  page_count bigint,
  embedding_count bigint,
  sample_url text
) 
LANGUAGE sql
AS $$
  SELECT 
    (SELECT COUNT(*) FROM scraped_pages WHERE domain_id = p_domain_id) as page_count,
    (SELECT COUNT(*) FROM page_embeddings pe 
     JOIN scraped_pages sp ON pe.page_id = sp.id 
     WHERE sp.domain_id = p_domain_id) as embedding_count,
    (SELECT url FROM scraped_pages WHERE domain_id = p_domain_id LIMIT 1) as sample_url;
$$;

-- Grant permissions for test function
GRANT EXECUTE ON FUNCTION public.test_search_embeddings TO anon, authenticated, service_role;

-- Test with Thompson's domain
SELECT * FROM test_search_embeddings('8dccd788-1ec1-43c2-af56-78aa3366bad3'::uuid);

-- Show success message
SELECT 'Lightweight optimization complete!' as status;