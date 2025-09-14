-- Fix the enhanced embeddings function to use correct JOIN
CREATE OR REPLACE FUNCTION match_page_embeddings_extended(
  query_embedding vector(1536),
  query_domain text,
  match_count int DEFAULT 10,
  similarity_threshold float DEFAULT 0.65
)
RETURNS TABLE (
  id uuid,
  page_id uuid,
  content text,
  url text,
  title text,
  similarity float,
  chunk_index int,
  is_product boolean,
  product_name text,
  product_sku text,
  product_price text,
  product_availability text,
  brand text,
  category text,
  specifications jsonb
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.chunk_text as content,
    sp.url,
    sp.title,
    1 - (pe.embedding <=> query_embedding) as similarity,
    COALESCE((pe.metadata->>'chunk_index')::int, 0) as chunk_index,
    COALESCE((wc.metadata->>'is_product')::boolean, false) as is_product,
    wc.metadata->>'product_name' as product_name,
    wc.metadata->>'product_sku' as product_sku,
    wc.metadata->>'product_price' as product_price,
    wc.metadata->>'product_availability' as product_availability,
    wc.metadata->>'brand' as brand,
    wc.metadata->>'category' as category,
    wc.metadata->'specifications' as specifications
  FROM page_embeddings pe
  JOIN scraped_pages sp ON sp.id = pe.page_id
  -- Fix: Join on URL instead of non-existent page_id
  LEFT JOIN website_content wc ON sp.url = wc.url AND sp.domain_id = wc.domain_id
  WHERE 
    sp.domain = query_domain
    AND 1 - (pe.embedding <=> query_embedding) > similarity_threshold
  ORDER BY 
    -- Prioritize first chunks
    CASE WHEN COALESCE((pe.metadata->>'chunk_index')::int, 0) = 0 THEN 1.3 ELSE 1.0 END *
    -- Prioritize product pages
    CASE WHEN COALESCE((wc.metadata->>'is_product')::boolean, false) THEN 1.2 ELSE 1.0 END *
    -- Base similarity
    (1 - (pe.embedding <=> query_embedding)) DESC
  LIMIT match_count;
END;
$$;