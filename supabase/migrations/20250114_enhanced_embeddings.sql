-- Enhanced embedding search function with better chunk retrieval
-- This function improves on the standard match_page_embeddings by returning more metadata

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
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.content,
    pe.embedding,
    pe.chunk_index,
    COALESCE(pe.chunk_position, pe.chunk_index::float / NULLIF(pe.total_chunks::float, 0)) as chunk_position,
    1 - (pe.embedding <=> query_embedding) AS similarity,
    sp.url,
    sp.title,
    COALESCE(sp.metadata, '{}'::jsonb) || 
    COALESCE(wc.metadata, '{}'::jsonb) as metadata,
    pe.created_at,
    pe.updated_at
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  LEFT JOIN website_content wc ON sp.id = wc.scraped_page_id
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

-- Create index for chunk position if not exists
CREATE INDEX IF NOT EXISTS idx_page_embeddings_chunk_position
ON page_embeddings(page_id, chunk_index);

-- Add comment explaining the function
COMMENT ON FUNCTION match_page_embeddings_extended IS 
'Enhanced embedding search that returns more metadata including chunk position and combined metadata from scraped_pages and website_content tables';