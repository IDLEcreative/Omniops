-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the search_embeddings function
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_domain_id uuid DEFAULT NULL
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
    pe.chunk_text AS content,
    COALESCE((pe.metadata->>'url')::text, '') AS url,
    COALESCE((pe.metadata->>'title')::text, 'Thompson eParts') AS title,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM page_embeddings pe
  WHERE 
    1 - (pe.embedding <=> query_embedding) > similarity_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Alternative function that includes domain filtering
CREATE OR REPLACE FUNCTION search_embeddings_with_domain(
  query_embedding vector(1536),
  domain_filter text DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7,
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
    pe.chunk_text AS content,
    COALESCE((pe.metadata->>'url')::text, '') AS url,
    COALESCE((pe.metadata->>'title')::text, 'Thompson eParts') AS title,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM page_embeddings pe
  WHERE 
    1 - (pe.embedding <=> query_embedding) > similarity_threshold
    AND (domain_filter IS NULL OR (pe.metadata->>'url')::text LIKE '%' || domain_filter || '%')
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Insert customer config if not exists
INSERT INTO customer_configs (
  domain,
  company_name,
  business_name,
  woocommerce_enabled,
  woocommerce_url,
  admin_email,
  created_at
)
VALUES (
  'thompsonseparts.co.uk',
  'Thompson eParts',
  'Thompson eParts Ltd',
  true,
  'https://www.thompsonseparts.co.uk',
  'admin@thompsonseparts.co.uk',
  NOW()
)
ON CONFLICT (domain) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  woocommerce_enabled = EXCLUDED.woocommerce_enabled,
  woocommerce_url = EXCLUDED.woocommerce_url;

-- Test the function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('search_embeddings', 'search_embeddings_with_domain');