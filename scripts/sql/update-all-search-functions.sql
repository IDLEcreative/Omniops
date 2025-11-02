-- Update all search functions to handle domain mappings for staging environments
-- This ensures staging domains can use production content seamlessly
-- Created: 2025-11-02

-- 1. Update search_embeddings function (already done in create-domain-mapping.sql)
-- This is the main vector search function

-- 2. Update fast_vector_search function
CREATE OR REPLACE FUNCTION public.fast_vector_search(
  query_embedding vector,
  domain_id_param uuid,
  match_threshold double precision DEFAULT 0.1,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  chunk_text text,
  metadata jsonb,
  similarity double precision,
  page_id uuid
)
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  actual_domain_id uuid;
BEGIN
  -- Check if this is a staging domain that maps to production
  SELECT COALESCE(dm.production_domain_id, domain_id_param)
  INTO actual_domain_id
  FROM (VALUES (domain_id_param)) AS input(domain_id)
  LEFT JOIN domain_mappings dm ON dm.staging_domain_id = input.domain_id
  LIMIT 1;

  RETURN QUERY
  SELECT
    pe.chunk_text,
    pe.metadata,
    1 - (pe.embedding OPERATOR(extensions.<=>) query_embedding) as similarity,
    pe.page_id
  FROM page_embeddings pe
  WHERE
    pe.domain_id = actual_domain_id
    AND pe.embedding IS NOT NULL
    AND 1 - (pe.embedding OPERATOR(extensions.<=>) query_embedding) >= match_threshold
  ORDER BY pe.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
END;
$function$;

-- 3. Create keyword search function that respects domain mappings
CREATE OR REPLACE FUNCTION search_pages_by_keyword(
  p_domain_id uuid,
  p_keyword text,
  p_limit integer DEFAULT 200
)
RETURNS TABLE(
  url text,
  title text,
  content text,
  domain_id uuid
)
LANGUAGE plpgsql
AS $function$
DECLARE
  actual_domain_id uuid;
  staging_domain text;
  production_domain text;
BEGIN
  -- Check if this is a staging domain that maps to production
  SELECT COALESCE(dm.production_domain_id, p_domain_id)
  INTO actual_domain_id
  FROM (VALUES (p_domain_id)) AS input(domain_id)
  LEFT JOIN domain_mappings dm ON dm.staging_domain_id = input.domain_id
  LIMIT 1;

  -- Get domain names for URL transformation
  IF actual_domain_id != p_domain_id THEN
    SELECT d_staging.domain, d_prod.domain
    INTO staging_domain, production_domain
    FROM domain_mappings dm
    JOIN domains d_staging ON dm.staging_domain_id = d_staging.id
    JOIN domains d_prod ON dm.production_domain_id = d_prod.id
    WHERE dm.staging_domain_id = p_domain_id;
  END IF;

  RETURN QUERY
  SELECT
    CASE
      WHEN actual_domain_id != p_domain_id THEN
        REPLACE(REPLACE(sp.url, production_domain, staging_domain), 'www.' || production_domain, staging_domain)
      ELSE sp.url
    END as url,
    sp.title,
    sp.content,
    p_domain_id as domain_id
  FROM scraped_pages sp
  WHERE sp.domain_id = actual_domain_id
    AND (
      sp.title ILIKE '%' || p_keyword || '%'
      OR sp.url ILIKE '%' || p_keyword || '%'
      OR sp.content ILIKE '%' || p_keyword || '%'
    )
  LIMIT p_limit;
END;
$function$;

-- 4. Update adaptive_entity_search function
CREATE OR REPLACE FUNCTION public.adaptive_entity_search(
  p_query text,
  p_domain_id uuid,
  p_limit integer DEFAULT 20,
  p_entity_type text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  entity_type text,
  description text,
  price numeric,
  is_available boolean,
  attributes jsonb,
  score double precision,
  match_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_business_type TEXT;
  v_terminology JSONB;
  actual_domain_id UUID;
BEGIN
  -- Check if this is a staging domain that maps to production
  SELECT COALESCE(dm.production_domain_id, p_domain_id)
  INTO actual_domain_id
  FROM (VALUES (p_domain_id)) AS input(domain_id)
  LEFT JOIN domain_mappings dm ON dm.staging_domain_id = input.domain_id
  LIMIT 1;

  -- Get business type for the actual domain
  SELECT business_type, entity_terminology
  INTO v_business_type, v_terminology
  FROM business_classifications
  WHERE domain_id = actual_domain_id;

  RETURN QUERY
  WITH text_matches AS (
    SELECT
      ec.id,
      ec.name,
      ec.entity_type,
      ec.description,
      ec.price,
      ec.is_available,
      ec.attributes,
      ts_rank(ec.search_vector, plainto_tsquery('english', p_query)) * 2 as score,
      'text' as match_type
    FROM entity_catalog ec
    WHERE ec.domain_id = actual_domain_id
      AND (p_entity_type IS NULL OR ec.entity_type = p_entity_type)
      AND ec.search_vector @@ plainto_tsquery('english', p_query)
    LIMIT p_limit
  ),
  attribute_matches AS (
    SELECT
      ec.id,
      ec.name,
      ec.entity_type,
      ec.description,
      ec.price,
      ec.is_available,
      ec.attributes,
      1.5 as score,
      'attribute' as match_type
    FROM entity_catalog ec
    WHERE ec.domain_id = actual_domain_id
      AND (p_entity_type IS NULL OR ec.entity_type = p_entity_type)
      AND ec.attributes @> jsonb_build_object('search_match', p_query)
    LIMIT p_limit
  )
  SELECT * FROM text_matches
  UNION ALL
  SELECT * FROM attribute_matches
  ORDER BY score DESC
  LIMIT p_limit;
END;
$function$;

-- Test all functions
DO $$
DECLARE
  test_embedding vector;
  staging_domain_id uuid := '190a7970-14cd-4160-8b2e-0247308f0102';
  production_domain_id uuid := '8dccd788-1ec1-43c2-af56-78aa3366bad3';
  test_count integer;
BEGIN
  -- Get a test embedding
  SELECT embedding INTO test_embedding
  FROM page_embeddings
  WHERE domain_id = production_domain_id
  LIMIT 1;

  -- Test search_embeddings
  SELECT COUNT(*) INTO test_count
  FROM search_embeddings(test_embedding, staging_domain_id, 0.5, 5);
  RAISE NOTICE 'search_embeddings test: % results', test_count;

  -- Test fast_vector_search
  SELECT COUNT(*) INTO test_count
  FROM fast_vector_search(test_embedding, staging_domain_id, 0.5, 5);
  RAISE NOTICE 'fast_vector_search test: % results', test_count;

  -- Test keyword search
  SELECT COUNT(*) INTO test_count
  FROM search_pages_by_keyword(staging_domain_id, 'pump', 5);
  RAISE NOTICE 'search_pages_by_keyword test: % results', test_count;

  -- Test adaptive_entity_search
  SELECT COUNT(*) INTO test_count
  FROM adaptive_entity_search('pump', staging_domain_id, 5);
  RAISE NOTICE 'adaptive_entity_search test: % results', test_count;
END $$;