-- Fix missing domain_id in page_embeddings table
-- This migration adds the domain_id column and populates it from scraped_pages

-- 1. Add domain_id column if it doesn't exist
ALTER TABLE page_embeddings 
ADD COLUMN IF NOT EXISTS domain_id UUID 
REFERENCES customer_configs(id);

-- 2. Populate domain_id from scraped_pages
UPDATE page_embeddings pe
SET domain_id = sp.domain_id
FROM scraped_pages sp
WHERE pe.page_id = sp.id
AND pe.domain_id IS NULL;

-- 3. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_page_embeddings_domain_id 
ON page_embeddings(domain_id);

-- 4. Create index on page_id for faster joins
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

-- 5. Update the search_embeddings function to use domain_id correctly
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  p_domain_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  page_id UUID,
  chunk_text text,
  chunk_index int,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.chunk_text,
    pe.chunk_index,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  WHERE 
    (p_domain_id IS NULL OR pe.domain_id = p_domain_id)
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_embeddings TO service_role, authenticated, anon;

-- Verify the fix
DO $$
DECLARE
  thompson_count INTEGER;
  null_count INTEGER;
BEGIN
  -- Count Thompson's embeddings
  SELECT COUNT(*) INTO thompson_count
  FROM page_embeddings
  WHERE domain_id = '8dccd788-1ec1-43c2-af56-78aa3366bad3';
  
  -- Count NULL domain_ids
  SELECT COUNT(*) INTO null_count
  FROM page_embeddings
  WHERE domain_id IS NULL;
  
  RAISE NOTICE 'Thompson embeddings: %', thompson_count;
  RAISE NOTICE 'NULL domain_ids: %', null_count;
  
  IF thompson_count = 0 THEN
    RAISE WARNING 'No Thompson embeddings found after migration - check page_id mapping';
  END IF;
  
  IF null_count > 0 THEN
    RAISE WARNING '% embeddings still have NULL domain_id', null_count;
  END IF;
END $$;