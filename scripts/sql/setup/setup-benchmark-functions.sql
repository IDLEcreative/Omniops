-- Helper functions for performance benchmarking
-- These functions provide insights into query execution and database performance

-- Function to get query execution plan
CREATE OR REPLACE FUNCTION get_query_plan(query_text TEXT)
RETURNS TABLE(plan_line TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || query_text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 'Error: ' || SQLERRM;
END;
$$;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_statistics(table_name TEXT)
RETURNS TABLE(
  index_name TEXT,
  index_scans BIGINT,
  tuples_read BIGINT,
  tuples_fetched BIGINT,
  index_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    indexrelname::TEXT AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND tablename = table_name
  ORDER BY idx_scan DESC;
END;
$$;

-- Function to get cache hit ratio
CREATE OR REPLACE FUNCTION get_cache_hit_ratio()
RETURNS TABLE(
  database_name TEXT,
  cache_hit_ratio NUMERIC,
  heap_blocks_read BIGINT,
  heap_blocks_hit BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    datname::TEXT AS database_name,
    ROUND(
      CASE 
        WHEN blks_hit + blks_read = 0 THEN 0
        ELSE (blks_hit::NUMERIC / (blks_hit + blks_read) * 100)
      END, 2
    ) AS cache_hit_ratio,
    blks_read AS heap_blocks_read,
    blks_hit AS heap_blocks_hit
  FROM pg_stat_database
  WHERE datname = current_database();
END;
$$;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_statistics(table_name TEXT)
RETURNS TABLE(
  stat_name TEXT,
  stat_value TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 'Total Rows'::TEXT, n_live_tup::TEXT
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename = table_name
  
  UNION ALL
  
  SELECT 'Dead Rows'::TEXT, n_dead_tup::TEXT
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename = table_name
  
  UNION ALL
  
  SELECT 'Table Size'::TEXT, pg_size_pretty(pg_total_relation_size(('public.' || table_name)::regclass))
  
  UNION ALL
  
  SELECT 'Sequential Scans'::TEXT, seq_scan::TEXT
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename = table_name
  
  UNION ALL
  
  SELECT 'Index Scans'::TEXT, idx_scan::TEXT
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename = table_name
  
  UNION ALL
  
  SELECT 'Last Vacuum'::TEXT, COALESCE(last_vacuum::TEXT, 'Never')
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename = table_name
  
  UNION ALL
  
  SELECT 'Last Analyze'::TEXT, COALESCE(last_analyze::TEXT, 'Never')
  FROM pg_stat_user_tables
  WHERE schemaname = 'public' AND tablename = table_name;
END;
$$;

-- Function for fuzzy search with typo tolerance
CREATE OR REPLACE FUNCTION search_with_typo_tolerance(
  search_query TEXT,
  search_domain TEXT
)
RETURNS TABLE(
  id UUID,
  url TEXT,
  title TEXT,
  content TEXT,
  similarity_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.url,
    sp.title,
    LEFT(sp.content, 500) AS content,
    similarity(sp.title || ' ' || sp.content, search_query) AS similarity_score
  FROM scraped_pages sp
  WHERE sp.domain = search_domain
    AND (
      -- Exact match
      sp.content ILIKE '%' || search_query || '%'
      OR sp.title ILIKE '%' || search_query || '%'
      -- Fuzzy match with trigram similarity
      OR similarity(sp.title || ' ' || sp.content, search_query) > 0.2
    )
  ORDER BY 
    CASE 
      WHEN sp.title ILIKE '%' || search_query || '%' THEN 1
      WHEN sp.content ILIKE '%' || search_query || '%' THEN 2
      ELSE 3
    END,
    similarity_score DESC
  LIMIT 20;
END;
$$;

-- Enhanced hybrid product search function for benchmarking
CREATE OR REPLACE FUNCTION hybrid_product_search(
  search_query TEXT,
  search_domain TEXT,
  result_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  url TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  relevance_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_sku_search BOOLEAN;
  is_price_search BOOLEAN;
  price_value NUMERIC;
BEGIN
  -- Detect search type
  is_sku_search := search_query ~ '^[A-Z0-9]+-[0-9]+$';
  is_price_search := search_query ~* 'under \$?[0-9]+';
  
  IF is_price_search THEN
    -- Extract price value
    price_value := (regexp_match(search_query, '\$?([0-9]+)', 'i'))[1]::NUMERIC;
  END IF;

  RETURN QUERY
  WITH ranked_results AS (
    SELECT 
      sp.id,
      sp.url,
      sp.title,
      LEFT(sp.content, 500) AS content,
      sp.metadata,
      CASE
        -- SKU exact match gets highest score
        WHEN is_sku_search AND sp.metadata->>'sku' = search_query THEN 100.0
        -- Price filter match
        WHEN is_price_search AND (sp.metadata->>'price')::NUMERIC <= price_value THEN 80.0
        -- Title exact match
        WHEN sp.title ILIKE '%' || search_query || '%' THEN 90.0
        -- Content match
        WHEN sp.content ILIKE '%' || search_query || '%' THEN 70.0
        -- Fuzzy match
        ELSE similarity(sp.title || ' ' || sp.content, search_query) * 100
      END AS relevance_score
    FROM scraped_pages sp
    WHERE sp.domain = search_domain
      AND (
        -- SKU search
        (is_sku_search AND sp.metadata->>'sku' = search_query)
        -- Price search
        OR (is_price_search AND (sp.metadata->>'price')::NUMERIC <= price_value)
        -- Regular text search
        OR (NOT is_sku_search AND NOT is_price_search AND (
          sp.title ILIKE '%' || search_query || '%'
          OR sp.content ILIKE '%' || search_query || '%'
          OR similarity(sp.title || ' ' || sp.content, search_query) > 0.2
        ))
      )
  )
  SELECT 
    ranked_results.id,
    ranked_results.url,
    ranked_results.title,
    ranked_results.content,
    ranked_results.metadata,
    ranked_results.relevance_score
  FROM ranked_results
  WHERE ranked_results.relevance_score > 10
  ORDER BY ranked_results.relevance_score DESC
  LIMIT result_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_query_plan TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_index_statistics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_cache_hit_ratio TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_table_statistics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_with_typo_tolerance TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hybrid_product_search TO anon, authenticated;