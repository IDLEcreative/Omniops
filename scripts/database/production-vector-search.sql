-- Production Database Vector Search Functions
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create RPC function for matching page embeddings
CREATE OR REPLACE FUNCTION match_page_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  customer_id uuid
)
RETURNS TABLE (
  id uuid,
  page_id uuid,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    page_embeddings.id,
    page_embeddings.page_id,
    page_embeddings.content,
    page_embeddings.metadata,
    page_embeddings.embedding,
    1 - (page_embeddings.embedding <=> query_embedding) AS similarity
  FROM page_embeddings
  WHERE 
    page_embeddings.customer_id = customer_id
    AND 1 - (page_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY page_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create RPC function for matching content embeddings (new table structure)
CREATE OR REPLACE FUNCTION match_content_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  customer_id uuid
)
RETURNS TABLE (
  id uuid,
  content_id uuid,
  content text,
  metadata jsonb,
  embedding vector(1536),
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    content_embeddings.id,
    content_embeddings.content_id,
    content_embeddings.content,
    content_embeddings.metadata,
    content_embeddings.embedding,
    1 - (content_embeddings.embedding <=> query_embedding) AS similarity
  FROM content_embeddings
  WHERE 
    content_embeddings.customer_id = customer_id
    AND 1 - (content_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY content_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create a general search function that searches both tables
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  customer_id uuid DEFAULT NULL
)
RETURNS TABLE (
  source text,
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH page_results AS (
    SELECT 
      'page'::text as source,
      pe.id,
      pe.content,
      pe.metadata,
      1 - (pe.embedding <=> query_embedding) AS similarity
    FROM page_embeddings pe
    WHERE 
      (customer_id IS NULL OR pe.customer_id = customer_id)
      AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ),
  content_results AS (
    SELECT 
      'content'::text as source,
      ce.id,
      ce.content,
      ce.metadata,
      1 - (ce.embedding <=> query_embedding) AS similarity
    FROM content_embeddings ce
    WHERE 
      (customer_id IS NULL OR ce.customer_id = customer_id)
      AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ),
  combined_results AS (
    SELECT * FROM page_results
    UNION ALL
    SELECT * FROM content_results
  )
  SELECT * FROM combined_results
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Grant execute permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION match_page_embeddings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_content_embeddings TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings TO anon, authenticated;

-- Verify the functions were created
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('match_page_embeddings', 'match_content_embeddings', 'search_embeddings')
ORDER BY p.proname;