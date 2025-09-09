-- Enhanced Metadata Search Function for Embeddings
-- Adds metadata-based filtering and scoring to improve search relevance

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.search_embeddings_enhanced CASCADE;

-- Create enhanced search function with metadata scoring
CREATE OR REPLACE FUNCTION public.search_embeddings_enhanced(
  query_embedding vector(1536),
  p_domain_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  content_types text[] DEFAULT NULL,  -- Filter by content types
  query_keywords text[] DEFAULT NULL,  -- Keywords from query for boosting
  boost_recent boolean DEFAULT false  -- Boost recent content
)
RETURNS TABLE (
  id UUID,
  page_id UUID,
  chunk_text text,
  url text,
  title text,
  metadata jsonb,
  base_similarity float,
  position_boost float,
  keyword_boost float,
  recency_boost float,
  content_type_boost float,
  final_score float
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_date timestamp := NOW();
BEGIN
  RETURN QUERY
  WITH scored_results AS (
    SELECT 
      pe.id,
      pe.page_id,
      pe.chunk_text,
      COALESCE((pe.metadata->>'url')::text, sp.url) as url,
      COALESCE((pe.metadata->>'title')::text, sp.title) as title,
      pe.metadata,
      -- Base vector similarity score
      1 - (pe.embedding <=> query_embedding) as base_similarity,
      
      -- Position boost: First chunks are often more important
      CASE 
        WHEN (pe.metadata->>'chunk_index')::int = 0 THEN 0.15
        WHEN (pe.metadata->>'chunk_index')::int = 1 THEN 0.10
        WHEN (pe.metadata->>'chunk_index')::int = 2 THEN 0.05
        ELSE 0
      END as position_boost,
      
      -- Keyword boost: Check if query keywords match metadata keywords
      CASE 
        WHEN query_keywords IS NOT NULL AND 
             pe.metadata->'keywords' IS NOT NULL AND
             pe.metadata->'keywords' ?| query_keywords THEN 0.20
        WHEN query_keywords IS NOT NULL AND 
             pe.metadata->'entities' IS NOT NULL AND (
               pe.metadata->'entities'->'products' ?| query_keywords OR
               pe.metadata->'entities'->'brands' ?| query_keywords OR
               pe.metadata->'entities'->'skus' ?| query_keywords
             ) THEN 0.25  -- Higher boost for entity matches
        ELSE 0
      END as keyword_boost,
      
      -- Recency boost: Newer content gets a slight boost
      CASE 
        WHEN boost_recent AND pe.metadata->>'indexed_at' IS NOT NULL THEN
          GREATEST(0, 0.1 * (1 - EXTRACT(EPOCH FROM (current_date - (pe.metadata->>'indexed_at')::timestamp)) / (86400 * 180)))  -- Decay over 180 days
        ELSE 0
      END as recency_boost,
      
      -- Content type boost: Certain content types may be more relevant
      CASE 
        WHEN pe.metadata->>'content_type' = 'product' AND 
             query_keywords IS NOT NULL AND 
             (array_length(query_keywords, 1) > 0) THEN 0.10  -- Boost products for likely product searches
        WHEN pe.metadata->>'content_type' = 'faq' AND 
             pe.chunk_text LIKE '%?%' THEN 0.05  -- Boost FAQs for question queries
        ELSE 0
      END as content_type_boost
      
    FROM page_embeddings pe
    INNER JOIN scraped_pages sp ON pe.page_id = sp.id
    WHERE 
      -- Domain filter
      (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
      -- Vector similarity threshold
      AND pe.embedding IS NOT NULL
      AND 1 - (pe.embedding <=> query_embedding) > match_threshold
      -- Content type filter
      AND (content_types IS NULL OR pe.metadata->>'content_type' = ANY(content_types))
  ),
  final_scored AS (
    SELECT 
      *,
      -- Calculate final score combining all factors
      base_similarity + position_boost + keyword_boost + recency_boost + content_type_boost as final_score
    FROM scored_results
  )
  SELECT 
    id,
    page_id,
    chunk_text,
    url,
    title,
    metadata,
    base_similarity,
    position_boost,
    keyword_boost,
    recency_boost,
    content_type_boost,
    final_score
  FROM final_scored
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_embeddings_enhanced TO service_role, authenticated, anon;

-- Create function for metadata-based filtering without vector search
-- Useful for quick lookups when we know exactly what we're looking for
CREATE OR REPLACE FUNCTION public.search_by_metadata(
  p_domain_id UUID DEFAULT NULL,
  content_types text[] DEFAULT NULL,
  must_have_keywords text[] DEFAULT NULL,
  price_min numeric DEFAULT NULL,
  price_max numeric DEFAULT NULL,
  availability text DEFAULT NULL,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  page_id UUID,
  chunk_text text,
  url text,
  title text,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.chunk_text,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    pe.metadata
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    -- Domain filter
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    -- Content type filter
    AND (content_types IS NULL OR pe.metadata->>'content_type' = ANY(content_types))
    -- Keyword filter
    AND (must_have_keywords IS NULL OR pe.metadata->'keywords' ?| must_have_keywords)
    -- Price range filter (for e-commerce)
    AND (price_min IS NULL OR (pe.metadata->'price_range'->>'min')::numeric >= price_min)
    AND (price_max IS NULL OR (pe.metadata->'price_range'->>'max')::numeric <= price_max)
    -- Availability filter
    AND (availability IS NULL OR pe.metadata->>'availability' = availability)
  ORDER BY (pe.metadata->>'chunk_index')::int ASC  -- Return in document order
  LIMIT limit_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.search_by_metadata TO service_role, authenticated, anon;

-- Create function to get metadata statistics for a domain
CREATE OR REPLACE FUNCTION public.get_metadata_stats(
  p_domain_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_embeddings bigint,
  with_enhanced_metadata bigint,
  content_type_distribution jsonb,
  avg_keywords_per_chunk numeric,
  avg_readability_score numeric,
  coverage_percentage numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result RECORD;
BEGIN
  WITH stats AS (
    SELECT 
      COUNT(*) as total_embeddings,
      COUNT(*) FILTER (WHERE metadata->>'content_type' IS NOT NULL) as with_enhanced_metadata,
      jsonb_object_agg(
        COALESCE(metadata->>'content_type', 'unknown'),
        count_by_type
      ) as content_type_distribution,
      AVG(jsonb_array_length(metadata->'keywords')) as avg_keywords,
      AVG((metadata->>'readability_score')::numeric) as avg_readability
    FROM (
      SELECT 
        pe.metadata,
        COUNT(*) OVER (PARTITION BY pe.metadata->>'content_type') as count_by_type
      FROM page_embeddings pe
      INNER JOIN scraped_pages sp ON pe.page_id = sp.id
      WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    ) t
    GROUP BY metadata->>'content_type', count_by_type
  )
  SELECT INTO result
    total_embeddings,
    with_enhanced_metadata,
    content_type_distribution,
    COALESCE(avg_keywords, 0),
    COALESCE(avg_readability, 0),
    CASE 
      WHEN total_embeddings > 0 THEN 
        (with_enhanced_metadata::numeric / total_embeddings::numeric) * 100
      ELSE 0
    END as coverage_percentage
  FROM stats;
  
  RETURN QUERY SELECT 
    result.total_embeddings,
    result.with_enhanced_metadata,
    result.content_type_distribution,
    result.avg_keywords,
    result.avg_readability,
    result.coverage_percentage;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_metadata_stats TO service_role, authenticated;

-- Create indexes for efficient metadata queries
CREATE INDEX IF NOT EXISTS idx_page_embeddings_content_type 
  ON page_embeddings ((metadata->>'content_type'));

CREATE INDEX IF NOT EXISTS idx_page_embeddings_indexed_at 
  ON page_embeddings ((metadata->>'indexed_at'));

CREATE INDEX IF NOT EXISTS idx_page_embeddings_keywords_gin 
  ON page_embeddings USING gin ((metadata->'keywords'));

CREATE INDEX IF NOT EXISTS idx_page_embeddings_entities_gin 
  ON page_embeddings USING gin ((metadata->'entities'));

CREATE INDEX IF NOT EXISTS idx_page_embeddings_price_range 
  ON page_embeddings ((metadata->'price_range'->>'min'), (metadata->'price_range'->>'max'))
  WHERE metadata->'price_range' IS NOT NULL;

-- Add comment documentation
COMMENT ON FUNCTION public.search_embeddings_enhanced IS 
'Enhanced vector search with metadata-based filtering and scoring. Includes position boost for early chunks, keyword matching, recency boost, and content type relevance.';

COMMENT ON FUNCTION public.search_by_metadata IS 
'Fast metadata-based search without vector similarity. Useful for exact matches on keywords, content types, price ranges, etc.';

COMMENT ON FUNCTION public.get_metadata_stats IS 
'Get statistics about metadata quality and coverage for monitoring and optimization.';

-- Success message
SELECT 'Enhanced metadata search functions created successfully!' as status;