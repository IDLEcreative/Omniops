-- Create domain mapping system for staging environments
-- This allows staging domains to use production content without duplication
-- Created: 2025-11-02

-- Create domain_mappings table to link staging to production
CREATE TABLE IF NOT EXISTS domain_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staging_domain_id UUID NOT NULL REFERENCES domains(id),
  production_domain_id UUID NOT NULL REFERENCES domains(id),
  mapping_type TEXT DEFAULT 'content_link',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staging_domain_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_domain_mappings_staging ON domain_mappings(staging_domain_id);

-- Insert Thompson's staging to production mapping
INSERT INTO domain_mappings (staging_domain_id, production_domain_id)
VALUES (
  '190a7970-14cd-4160-8b2e-0247308f0102', -- epartstaging.wpengine.com
  '8dccd788-1ec1-43c2-af56-78aa3366bad3'  -- thompsonseparts.co.uk
)
ON CONFLICT (staging_domain_id) DO NOTHING;

-- Update search_embeddings function to use domain mapping
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector,
  p_domain_id uuid,
  match_threshold double precision DEFAULT 0.78,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  page_id uuid,
  chunk_text text,
  similarity double precision,
  url text,
  title text,
  content text
)
LANGUAGE plpgsql
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  actual_domain_id uuid;
BEGIN
  -- Check if this is a staging domain that maps to production
  SELECT COALESCE(dm.production_domain_id, p_domain_id)
  INTO actual_domain_id
  FROM (VALUES (p_domain_id)) AS input(domain_id)
  LEFT JOIN domain_mappings dm ON dm.staging_domain_id = input.domain_id
  LIMIT 1;

  -- Log for debugging
  RAISE NOTICE 'Searching embeddings for domain_id: %, actual_domain_id: %', p_domain_id, actual_domain_id;

  RETURN QUERY
  SELECT
    pe.id,
    pe.page_id,
    pe.chunk_text,
    1 - (pe.embedding OPERATOR(extensions.<=>) query_embedding) as similarity,
    -- If it's a staging domain, replace production URLs with staging URLs
    CASE
      WHEN dm.staging_domain_id IS NOT NULL THEN
        REPLACE(REPLACE(sp.url, 'thompsonseparts.co.uk', 'epartstaging.wpengine.com'), 'www.thompsonseparts.co.uk', 'epartstaging.wpengine.com')
      ELSE sp.url
    END as url,
    sp.title,
    sp.content
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  LEFT JOIN domain_mappings dm ON dm.staging_domain_id = p_domain_id
  WHERE pe.domain_id = actual_domain_id
    AND 1 - (pe.embedding OPERATOR(extensions.<=>) query_embedding) > match_threshold
  ORDER BY pe.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT match_count;
END;
$function$;

-- Add comment to document the function
COMMENT ON FUNCTION search_embeddings IS 'Enhanced search function that supports domain mapping for staging environments. Staging domains automatically use their production counterpart embeddings.';
COMMENT ON TABLE domain_mappings IS 'Maps staging domains to production domains to share content and embeddings without duplication.';