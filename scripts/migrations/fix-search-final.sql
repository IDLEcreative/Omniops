-- Final fix for search_embeddings function
-- The issue is likely with the similarity calculation or vector operations

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
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pe.chunk_text as content,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    -- Use cosine similarity (1 - cosine distance)
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    -- For cosine similarity, use <=> operator
    AND pe.embedding <=> query_embedding < (1 - match_threshold)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role;

-- Alternative function using L2 distance if cosine doesn't work
CREATE OR REPLACE FUNCTION public.search_embeddings_l2(
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
LANGUAGE sql
STABLE
AS $$
  SELECT 
    pe.chunk_text as content,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    -- For L2 distance, smaller is more similar, so invert
    1.0 / (1.0 + (pe.embedding <-> query_embedding)) as similarity
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
  ORDER BY pe.embedding <-> query_embedding
  LIMIT match_count;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings_l2 TO anon, authenticated, service_role;

-- Test both functions
SELECT 'Functions created. Testing with sample data...' as status;

-- Check if we can get ANY results without filtering
WITH test_embedding AS (
  SELECT (
    SELECT embedding 
    FROM page_embeddings 
    LIMIT 1
  ) as emb
)
SELECT 
  COUNT(*) as total_results,
  'Using actual embedding from database' as test_type
FROM search_embeddings_l2(
  (SELECT emb FROM test_embedding),
  NULL,
  0.1,
  10
);