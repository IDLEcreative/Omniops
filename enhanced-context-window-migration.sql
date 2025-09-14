-- Enhanced Context Window Migration
-- Creates match_page_embeddings_extended function with metadata extraction
-- Apply this in the Supabase SQL Editor

-- Drop existing function if it exists (to handle updates)
DROP FUNCTION IF EXISTS match_page_embeddings_extended(vector, float, int, text);

-- Create enhanced function with domain filtering and metadata extraction
CREATE OR REPLACE FUNCTION match_page_embeddings_extended(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  domain_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float,
  page_url text,
  domain text,
  chunk_index int,
  chunk_position int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.chunk_text,
    pe.metadata,
    (pe.embedding <=> query_embedding) * -1 + 1 AS similarity,
    sp.url AS page_url,
    sp.domain,
    COALESCE((pe.metadata->>'chunk_index')::int, 0) AS chunk_index,
    COALESCE((pe.metadata->>'chunk_position')::int, 0) AS chunk_position
  FROM page_embeddings pe
  JOIN scraped_pages sp ON sp.id = pe.page_id
  WHERE 
    pe.embedding <=> query_embedding < 1 - match_threshold
    AND (domain_filter IS NULL OR sp.domain = domain_filter)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create performance indexes if they don't exist

-- Cosine similarity index for vector operations
CREATE INDEX IF NOT EXISTS idx_page_embeddings_cosine 
ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- JSONB GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_page_embeddings_metadata_gin 
ON page_embeddings 
USING gin (metadata);

-- Composite index for domain filtering + similarity searches
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_performance 
ON scraped_pages (domain, id);

-- Index for joining embeddings with pages efficiently
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id_similarity 
ON page_embeddings (page_id, embedding);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_page_embeddings_extended TO authenticated;
GRANT EXECUTE ON FUNCTION match_page_embeddings_extended TO anon;

-- Create/Update compatibility function that matches the original function signature
CREATE OR REPLACE FUNCTION match_page_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.chunk_text,
    pe.metadata,
    (pe.embedding <=> query_embedding) * -1 + 1 AS similarity
  FROM page_embeddings pe
  WHERE 
    pe.embedding <=> query_embedding < 1 - match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions for standard function
GRANT EXECUTE ON FUNCTION match_page_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION match_page_embeddings TO anon;