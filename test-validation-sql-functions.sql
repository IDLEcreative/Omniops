-- SQL functions for search validation tests

-- Function to get chunk statistics
CREATE OR REPLACE FUNCTION get_chunk_stats()
RETURNS TABLE (
  avg_length integer,
  min_length integer,
  max_length integer,
  total_chunks bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(LENGTH(chunk_text))::integer as avg_length,
    MIN(LENGTH(chunk_text))::integer as min_length,
    MAX(LENGTH(chunk_text))::integer as max_length,
    COUNT(*)::bigint as total_chunks
  FROM page_embeddings
  WHERE chunk_text IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to find duplicate chunks
CREATE OR REPLACE FUNCTION find_duplicate_chunks(min_occurrences integer DEFAULT 5)
RETURNS TABLE (
  chunk_text text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.chunk_text,
    COUNT(*)::bigint as count
  FROM page_embeddings pe
  WHERE LENGTH(pe.chunk_text) > 50
  GROUP BY pe.chunk_text
  HAVING COUNT(*) >= min_occurrences
  ORDER BY COUNT(*) DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Function to check text_content population
CREATE OR REPLACE FUNCTION check_text_content_status()
RETURNS TABLE (
  total_pages bigint,
  with_text_content bigint,
  without_text_content bigint,
  percentage_populated numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_pages,
    COUNT(CASE WHEN text_content IS NOT NULL AND LENGTH(text_content) > 0 THEN 1 END)::bigint as with_text_content,
    COUNT(CASE WHEN text_content IS NULL OR LENGTH(text_content) = 0 THEN 1 END)::bigint as without_text_content,
    ROUND((COUNT(CASE WHEN text_content IS NOT NULL AND LENGTH(text_content) > 0 THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2) as percentage_populated
  FROM scraped_pages;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze embedding metadata quality
CREATE OR REPLACE FUNCTION analyze_embedding_metadata()
RETURNS TABLE (
  total_embeddings bigint,
  with_product_metadata bigint,
  with_url bigint,
  with_title bigint,
  avg_metadata_fields numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH metadata_analysis AS (
    SELECT 
      id,
      metadata,
      CASE 
        WHEN metadata IS NOT NULL AND (
          metadata->>'productSku' IS NOT NULL OR
          metadata->>'productPrice' IS NOT NULL OR
          metadata->>'productName' IS NOT NULL OR
          metadata->>'productBrand' IS NOT NULL
        ) THEN 1 
        ELSE 0 
      END as has_product_metadata,
      CASE WHEN metadata->>'url' IS NOT NULL THEN 1 ELSE 0 END as has_url,
      CASE WHEN metadata->>'title' IS NOT NULL THEN 1 ELSE 0 END as has_title,
      CASE 
        WHEN metadata IS NOT NULL THEN 
          jsonb_object_keys(metadata)
        ELSE NULL
      END as field_key
    FROM page_embeddings
  ),
  field_counts AS (
    SELECT 
      id,
      COUNT(field_key) as field_count
    FROM metadata_analysis
    GROUP BY id
  )
  SELECT 
    COUNT(DISTINCT ma.id)::bigint as total_embeddings,
    SUM(ma.has_product_metadata)::bigint as with_product_metadata,
    SUM(ma.has_url)::bigint as with_url,
    SUM(ma.has_title)::bigint as with_title,
    ROUND(AVG(fc.field_count), 2) as avg_metadata_fields
  FROM metadata_analysis ma
  LEFT JOIN field_counts fc ON ma.id = fc.id
  GROUP BY ma.id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;