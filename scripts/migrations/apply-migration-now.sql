-- ============================================
-- ENHANCED METADATA SEARCH MIGRATION
-- Apply this in Supabase SQL Editor
-- Project: birugqyuqhiahxvxeyqg
-- ============================================

-- Step 1: Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.search_embeddings_enhanced CASCADE;
DROP FUNCTION IF EXISTS public.search_by_metadata CASCADE;
DROP FUNCTION IF EXISTS public.get_metadata_stats CASCADE;

-- ============================================
-- FUNCTION 1: Enhanced Search with Metadata Scoring
-- ============================================
CREATE OR REPLACE FUNCTION public.search_embeddings_enhanced(
  query_embedding vector(1536),
  p_domain_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  content_types text[] DEFAULT NULL,
  query_keywords text[] DEFAULT NULL,
  boost_recent boolean DEFAULT false
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
      1 - (pe.embedding <=> query_embedding) as base_similarity,
      CASE 
        WHEN (pe.metadata->>'chunk_index')::int = 0 THEN 0.15
        WHEN (pe.metadata->>'chunk_index')::int = 1 THEN 0.10
        WHEN (pe.metadata->>'chunk_index')::int = 2 THEN 0.05
        ELSE 0
      END as position_boost,
      CASE 
        WHEN query_keywords IS NOT NULL AND 
             pe.metadata->'keywords' IS NOT NULL AND
             pe.metadata->'keywords' ?| query_keywords THEN 0.20
        WHEN query_keywords IS NOT NULL AND 
             pe.metadata->'entities' IS NOT NULL AND (
               pe.metadata->'entities'->'products' ?| query_keywords OR
               pe.metadata->'entities'->'brands' ?| query_keywords OR
               pe.metadata->'entities'->'skus' ?| query_keywords
             ) THEN 0.25
        ELSE 0
      END as keyword_boost,
      CASE 
        WHEN boost_recent AND pe.metadata->>'indexed_at' IS NOT NULL THEN
          GREATEST(0, 0.1 * (1 - EXTRACT(EPOCH FROM (current_date - (pe.metadata->>'indexed_at')::timestamp)) / (86400 * 180)))
        ELSE 0
      END as recency_boost,
      CASE 
        WHEN pe.metadata->>'content_type' = 'product' AND 
             query_keywords IS NOT NULL AND 
             (array_length(query_keywords, 1) > 0) THEN 0.10
        WHEN pe.metadata->>'content_type' = 'faq' AND 
             pe.chunk_text LIKE '%?%' THEN 0.05
        ELSE 0
      END as content_type_boost
    FROM page_embeddings pe
    INNER JOIN scraped_pages sp ON pe.page_id = sp.id
    WHERE 
      (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
      AND pe.embedding IS NOT NULL
      AND 1 - (pe.embedding <=> query_embedding) > match_threshold
      AND (content_types IS NULL OR pe.metadata->>'content_type' = ANY(content_types))
  ),
  final_scored AS (
    SELECT 
      *,
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

-- ============================================
-- FUNCTION 2: Metadata-Only Search (No Vector)
-- ============================================
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
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND (content_types IS NULL OR pe.metadata->>'content_type' = ANY(content_types))
    AND (must_have_keywords IS NULL OR pe.metadata->'keywords' ?| must_have_keywords)
    AND (price_min IS NULL OR (pe.metadata->'price_range'->>'min')::numeric >= price_min)
    AND (price_max IS NULL OR (pe.metadata->'price_range'->>'max')::numeric <= price_max)
    AND (availability IS NULL OR pe.metadata->>'availability' = availability)
  ORDER BY (pe.metadata->>'chunk_index')::int ASC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- FUNCTION 3: Metadata Statistics
-- ============================================
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
BEGIN
  RETURN QUERY
  WITH base_stats AS (
    SELECT 
      pe.id,
      pe.metadata,
      pe.metadata->>'content_type' as content_type,
      CASE WHEN pe.metadata->>'content_type' IS NOT NULL THEN 1 ELSE 0 END as has_enhanced,
      CASE WHEN pe.metadata->'keywords' IS NOT NULL 
           THEN jsonb_array_length(pe.metadata->'keywords') 
           ELSE 0 END as keyword_count,
      (pe.metadata->>'readability_score')::numeric as readability
    FROM page_embeddings pe
    LEFT JOIN scraped_pages sp ON pe.page_id = sp.id
    WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
  ),
  type_counts AS (
    SELECT 
      COALESCE(content_type, 'unknown') as ctype,
      COUNT(*) as cnt
    FROM base_stats
    GROUP BY content_type
  ),
  aggregated AS (
    SELECT 
      COUNT(*) as total,
      SUM(has_enhanced) as enhanced,
      AVG(keyword_count) as avg_keywords,
      AVG(readability) as avg_readability
    FROM base_stats
  )
  SELECT 
    aggregated.total as total_embeddings,
    aggregated.enhanced as with_enhanced_metadata,
    jsonb_object_agg(type_counts.ctype, type_counts.cnt) as content_type_distribution,
    COALESCE(aggregated.avg_keywords, 0) as avg_keywords_per_chunk,
    COALESCE(aggregated.avg_readability, 0) as avg_readability_score,
    CASE 
      WHEN aggregated.total > 0 THEN 
        (aggregated.enhanced::numeric / aggregated.total::numeric) * 100
      ELSE 0
    END as coverage_percentage
  FROM aggregated, type_counts
  GROUP BY aggregated.total, aggregated.enhanced, aggregated.avg_keywords, aggregated.avg_readability;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.search_embeddings_enhanced TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_by_metadata TO service_role, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_metadata_stats TO service_role, authenticated;

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Content type index for filtering
CREATE INDEX IF NOT EXISTS idx_page_embeddings_content_type 
  ON page_embeddings ((metadata->>'content_type'));

-- Indexed at for recency queries
CREATE INDEX IF NOT EXISTS idx_page_embeddings_indexed_at 
  ON page_embeddings ((metadata->>'indexed_at'));

-- Keywords GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_page_embeddings_keywords_gin 
  ON page_embeddings USING gin ((metadata->'keywords'));

-- Entities GIN index for SKU/brand/product searches
CREATE INDEX IF NOT EXISTS idx_page_embeddings_entities_gin 
  ON page_embeddings USING gin ((metadata->'entities'));

-- Price range index for e-commerce queries
CREATE INDEX IF NOT EXISTS idx_page_embeddings_price_range 
  ON page_embeddings ((metadata->'price_range'->>'min'), (metadata->'price_range'->>'max'))
  WHERE metadata->'price_range' IS NOT NULL;

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON FUNCTION public.search_embeddings_enhanced IS 
'Enhanced vector search with metadata-based filtering and scoring. Includes position boost for early chunks, keyword matching, recency boost, and content type relevance.';

COMMENT ON FUNCTION public.search_by_metadata IS 
'Fast metadata-based search without vector similarity. Useful for exact matches on keywords, content types, price ranges, etc.';

COMMENT ON FUNCTION public.get_metadata_stats IS 
'Get statistics about metadata quality and coverage for monitoring and optimization.';

-- ============================================
-- TEST THE FUNCTIONS (Optional)
-- ============================================

-- Test enhanced search (will return empty but shouldn't error)
SELECT 'Testing search_embeddings_enhanced...' as test_status;
SELECT * FROM search_embeddings_enhanced(
  ARRAY_FILL(0.1::float, ARRAY[1536])::vector(1536),
  NULL,
  0.1,
  1,
  NULL,
  NULL,
  false
) LIMIT 1;

-- Test metadata search
SELECT 'Testing search_by_metadata...' as test_status;
SELECT * FROM search_by_metadata(
  NULL,
  ARRAY['product']::text[],
  NULL,
  NULL,
  NULL,
  NULL,
  1
) LIMIT 1;

-- Test statistics
SELECT 'Testing get_metadata_stats...' as test_status;
SELECT * FROM get_metadata_stats(NULL);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'Enhanced metadata migration applied successfully!' as migration_status,
       NOW() as applied_at;