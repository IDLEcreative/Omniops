-- CHUNK 5: Optimized Search Functions
-- Creates fast search functions using the new indexes
-- Estimated time: 2-3 seconds

-- Fast text search function using full-text search
CREATE OR REPLACE FUNCTION search_text_content(
  query_text text,
  p_domain_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  url text,
  title text,
  content text,
  rank float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.url,
    sp.title,
    sp.content,
    ts_rank(sp.content_search_vector, websearch_to_tsquery('english', query_text)) as rank
  FROM scraped_pages sp
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND sp.content_search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Optimized vector search function
CREATE OR REPLACE FUNCTION search_embeddings_optimized(
  query_embedding vector(1536),
  p_domain_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  page_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    sp.content,
    sp.metadata,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON sp.id = pe.page_id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND pe.embedding IS NOT NULL
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_text_content TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings_optimized TO service_role, authenticated;

SELECT 'Chunk 5 complete: Search functions created' as status;