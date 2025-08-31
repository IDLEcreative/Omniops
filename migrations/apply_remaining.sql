-- Apply Remaining Optimizations
-- Only the 2 missing pieces: Full-text search and optimized functions

-- ============================================
-- PART 1: Full-Text Search Setup
-- ============================================

-- Add tsvector column for full-text search if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraped_pages' 
    AND column_name = 'content_search_vector'
  ) THEN
    ALTER TABLE scraped_pages 
    ADD COLUMN content_search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(content, '')
      )
    ) STORED;
    
    RAISE NOTICE 'Added full-text search column';
  ELSE
    RAISE NOTICE 'Full-text search column already exists';
  END IF;
END $$;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_search 
ON scraped_pages USING GIN (content_search_vector);

-- ============================================
-- PART 2: Optimized Search Functions
-- ============================================

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

-- Hybrid search function combining text and vector search
CREATE OR REPLACE FUNCTION search_content_optimized(
  query_text text,
  query_embedding vector(1536),
  p_domain_id uuid,
  match_count int DEFAULT 10,
  use_hybrid boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  url text,
  title text,
  content text,
  similarity float,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF use_hybrid AND query_text IS NOT NULL AND query_embedding IS NOT NULL THEN
    -- Hybrid search combining full-text and vector similarity
    RETURN QUERY
    WITH text_results AS (
      SELECT 
        sp.id,
        sp.url,
        sp.title,
        sp.content,
        ts_rank(sp.content_search_vector, websearch_to_tsquery('english', query_text)) as text_rank
      FROM scraped_pages sp
      WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
        AND sp.content_search_vector @@ websearch_to_tsquery('english', query_text)
      ORDER BY text_rank DESC
      LIMIT match_count * 2
    ),
    vector_results AS (
      SELECT 
        sp.id,
        sp.url,
        sp.title,
        sp.content,
        1 - (pe.embedding <=> query_embedding) as vec_similarity
      FROM page_embeddings pe
      JOIN scraped_pages sp ON sp.id = pe.page_id
      WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
        AND pe.embedding IS NOT NULL
      ORDER BY pe.embedding <=> query_embedding
      LIMIT match_count * 2
    ),
    combined AS (
      SELECT DISTINCT ON (id)
        id,
        url,
        title,
        content,
        COALESCE(MAX(vec_similarity), 0) as similarity,
        COALESCE(MAX(text_rank), 0) * 0.3 + COALESCE(MAX(vec_similarity), 0) * 0.7 as rank
      FROM (
        SELECT id, url, title, content, 0 as vec_similarity, text_rank FROM text_results
        UNION ALL
        SELECT id, url, title, content, vec_similarity, 0 as text_rank FROM vector_results
      ) t
      GROUP BY id, url, title, content
    )
    SELECT * FROM combined
    ORDER BY rank DESC
    LIMIT match_count;
  ELSIF query_embedding IS NOT NULL THEN
    -- Pure vector search
    RETURN QUERY
    SELECT 
      sp.id,
      sp.url,
      sp.title,
      sp.content,
      1 - (pe.embedding <=> query_embedding) as similarity,
      1 - (pe.embedding <=> query_embedding) as rank
    FROM page_embeddings pe
    JOIN scraped_pages sp ON sp.id = pe.page_id
    WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
      AND pe.embedding IS NOT NULL
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count;
  ELSE
    -- Pure text search
    RETURN QUERY
    SELECT 
      sp.id,
      sp.url,
      sp.title,
      sp.content,
      0::float as similarity,
      ts_rank(sp.content_search_vector, websearch_to_tsquery('english', query_text)) as rank
    FROM scraped_pages sp
    WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
      AND sp.content_search_vector @@ websearch_to_tsquery('english', query_text)
    ORDER BY rank DESC
    LIMIT match_count;
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_text_content TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings_optimized TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION search_content_optimized TO service_role, authenticated;

-- Update statistics
ANALYZE scraped_pages;

SELECT 'Remaining optimizations applied successfully!' as status,
       'Full-text search and optimized functions are now active' as message;