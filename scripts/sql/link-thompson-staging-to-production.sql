-- Link Thompson's staging domain to production content
-- This allows the staging site to use the same scraped content as production
-- without requiring a new scraping operation

-- First, let's check what we have
DO $$
DECLARE
  production_domain_id TEXT;
  staging_domain_id TEXT;
  production_domain TEXT := 'thompsonseparts.co.uk';
  staging_domain TEXT := 'epartstaging.wpengine.com';
  content_count INT;
BEGIN
  -- Get the production domain_id
  SELECT id INTO production_domain_id
  FROM customer_configs
  WHERE domain IN ('thompsonseparts.co.uk', 'www.thompsonseparts.co.uk')
  LIMIT 1;

  -- Get the staging domain_id
  SELECT id INTO staging_domain_id
  FROM customer_configs
  WHERE domain = 'epartstaging.wpengine.com';

  -- Check if we have content for production
  SELECT COUNT(*) INTO content_count
  FROM scraped_pages
  WHERE domain_id = production_domain_id;

  RAISE NOTICE 'Production domain_id: %', production_domain_id;
  RAISE NOTICE 'Staging domain_id: %', staging_domain_id;
  RAISE NOTICE 'Production content count: %', content_count;

  IF production_domain_id IS NOT NULL AND staging_domain_id IS NOT NULL AND content_count > 0 THEN
    -- Copy scraped_pages from production to staging
    -- Using INSERT ON CONFLICT to handle any duplicates
    INSERT INTO scraped_pages (
      domain_id,
      url,
      title,
      content,
      metadata,
      last_scraped_at,
      content_hash,
      scrape_status,
      error_message,
      is_faq_source
    )
    SELECT
      staging_domain_id as domain_id,  -- Use staging domain_id
      REPLACE(url, 'thompsonseparts.co.uk', 'epartstaging.wpengine.com') as url,  -- Update URLs to staging
      title,
      content,
      metadata,
      NOW() as last_scraped_at,  -- Update timestamp
      content_hash,
      scrape_status,
      error_message,
      is_faq_source
    FROM scraped_pages
    WHERE domain_id = production_domain_id
    ON CONFLICT (domain_id, url) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      last_scraped_at = EXCLUDED.last_scraped_at,
      content_hash = EXCLUDED.content_hash,
      scrape_status = EXCLUDED.scrape_status,
      is_faq_source = EXCLUDED.is_faq_source;

    GET DIAGNOSTICS content_count = ROW_COUNT;
    RAISE NOTICE 'Linked % pages from production to staging', content_count;

    -- Also copy page_embeddings if they exist
    INSERT INTO page_embeddings (
      page_id,
      embedding,
      chunk_index,
      chunk_text,
      metadata,
      created_at
    )
    SELECT
      sp_staging.id as page_id,
      pe.embedding,
      pe.chunk_index,
      pe.chunk_text,
      pe.metadata,
      NOW() as created_at
    FROM page_embeddings pe
    INNER JOIN scraped_pages sp_prod ON pe.page_id = sp_prod.id
    INNER JOIN scraped_pages sp_staging ON
      sp_staging.domain_id = staging_domain_id AND
      sp_staging.content_hash = sp_prod.content_hash
    WHERE sp_prod.domain_id = production_domain_id
    ON CONFLICT (page_id, chunk_index) DO UPDATE SET
      embedding = EXCLUDED.embedding,
      chunk_text = EXCLUDED.chunk_text,
      metadata = EXCLUDED.metadata;

    GET DIAGNOSTICS content_count = ROW_COUNT;
    RAISE NOTICE 'Linked % embeddings from production to staging', content_count;

    -- Copy structured_extractions (FAQs, products, etc.)
    INSERT INTO structured_extractions (
      domain_id,
      extraction_type,
      content,
      metadata,
      source_url,
      last_updated,
      version
    )
    SELECT
      staging_domain_id as domain_id,
      extraction_type,
      content,
      metadata,
      REPLACE(source_url, 'thompsonseparts.co.uk', 'epartstaging.wpengine.com') as source_url,
      NOW() as last_updated,
      version
    FROM structured_extractions
    WHERE domain_id = production_domain_id
    ON CONFLICT (domain_id, extraction_type, source_url) DO UPDATE SET
      content = EXCLUDED.content,
      metadata = EXCLUDED.metadata,
      last_updated = EXCLUDED.last_updated,
      version = EXCLUDED.version;

    GET DIAGNOSTICS content_count = ROW_COUNT;
    RAISE NOTICE 'Linked % structured extractions from production to staging', content_count;

    RAISE NOTICE '✅ Successfully linked Thompson staging to production content';
  ELSE
    IF production_domain_id IS NULL THEN
      RAISE EXCEPTION 'Production domain not found';
    END IF;
    IF staging_domain_id IS NULL THEN
      RAISE EXCEPTION 'Staging domain not found';
    END IF;
    IF content_count = 0 THEN
      RAISE EXCEPTION 'No production content found to link';
    END IF;
  END IF;
END $$;

-- Verify the linking was successful
SELECT
  'Production' as environment,
  COUNT(*) as page_count,
  COUNT(DISTINCT url) as unique_urls
FROM scraped_pages sp
INNER JOIN customer_configs cc ON sp.domain_id = cc.id
WHERE cc.domain IN ('thompsonseparts.co.uk', 'www.thompsonseparts.co.uk')

UNION ALL

SELECT
  'Staging' as environment,
  COUNT(*) as page_count,
  COUNT(DISTINCT url) as unique_urls
FROM scraped_pages sp
INNER JOIN customer_configs cc ON sp.domain_id = cc.id
WHERE cc.domain = 'epartstaging.wpengine.com';