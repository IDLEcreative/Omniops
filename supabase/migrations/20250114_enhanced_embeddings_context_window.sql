-- Enhanced embedding search function with better chunk retrieval for 10-15 chunk context window
-- This migration improves AI accuracy by providing more context to the language model

CREATE OR REPLACE FUNCTION match_page_embeddings_extended(
  query_embedding vector(1536),
  p_domain_id uuid,
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  page_id uuid,
  content text,
  embedding vector(1536),
  chunk_index int,
  chunk_position float,
  similarity float,
  url text,
  title text,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.chunk_text as content,
    pe.embedding,
    COALESCE((pe.metadata->>'chunk_index')::int, 0) as chunk_index,
    COALESCE(
      (pe.metadata->>'chunk_position')::float,
      CASE 
        WHEN (pe.metadata->>'total_chunks')::int > 0 
        THEN (pe.metadata->>'chunk_index')::float / (pe.metadata->>'total_chunks')::float
        ELSE 0.0
      END
    ) as chunk_position,
    1 - (pe.embedding <=> query_embedding) AS similarity,
    sp.url,
    sp.title,
    COALESCE(sp.metadata, '{}'::jsonb) || 
    COALESCE(wc.metadata, '{}'::jsonb) || 
    COALESCE(pe.metadata, '{}'::jsonb) as metadata,
    pe.created_at
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  LEFT JOIN website_content wc ON sp.id = wc.page_id
  WHERE 
    sp.domain_id = p_domain_id
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_page_embeddings_domain_lookup 
ON scraped_pages(domain_id) 
WHERE domain_id IS NOT NULL;

-- Create index for metadata chunk lookup if not exists
CREATE INDEX IF NOT EXISTS idx_page_embeddings_metadata_chunk
ON page_embeddings(page_id, (metadata->>'chunk_index'));

-- Add comment explaining the function
COMMENT ON FUNCTION match_page_embeddings_extended IS 
'Enhanced embedding search that returns more metadata including chunk position and combined metadata from scraped_pages and website_content tables. Optimized for retrieving 10-15 chunks for improved AI context.';