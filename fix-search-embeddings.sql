-- Fix RAG search_embeddings function to use correct table and parameters
-- Run this in Supabase SQL editor

-- Drop all conflicting versions of the function
DROP FUNCTION IF EXISTS public.search_embeddings CASCADE;

-- Create the correct version that searches page_embeddings table
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  p_domain_id UUID,
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
  RETURN QUERY
  SELECT 
    pe.chunk_text as content,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role;

-- Verify the function was created
SELECT 
  proname AS function_name,
  pronargs AS num_arguments,
  pg_get_function_identity_arguments(oid) AS arguments
FROM pg_proc 
WHERE proname = 'search_embeddings';