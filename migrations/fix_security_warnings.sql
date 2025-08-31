-- Security Fix Migration: Address Supabase Linter Warnings
-- Generated: 2025-08-30
-- Purpose: Fix function search_path vulnerabilities and extension placement

-- ============================================
-- 1. FIX SEARCH_PATH FOR ALL FUNCTIONS
-- ============================================

-- Fix bulk_upsert_scraped_pages
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
  pages jsonb
)
RETURNS TABLE(
  out_id uuid,
  out_url text,
  out_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_pages AS sp (
    url, title, content, domain_id, status, scraped_at, metadata
  )
  SELECT 
    (p->>'url')::text,
    (p->>'title')::text,
    (p->>'content')::text,
    (p->>'domain_id')::uuid,
    COALESCE((p->>'status')::text, 'completed'),
    COALESCE((p->>'scraped_at')::timestamptz, NOW()),
    COALESCE((p->'metadata')::jsonb, '{}'::jsonb)
  FROM jsonb_array_elements(pages) AS p
  ON CONFLICT (url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    status = EXCLUDED.status,
    scraped_at = EXCLUDED.scraped_at,
    metadata = EXCLUDED.metadata,
    last_scraped_at = NOW()
  RETURNING 
    sp.id AS out_id,
    sp.url AS out_url,
    sp.status AS out_status;
END;
$$;

-- Fix bulk_insert_embeddings
CREATE OR REPLACE FUNCTION bulk_insert_embeddings(
  embeddings jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  inserted_count integer;
BEGIN
  WITH inserted AS (
    INSERT INTO page_embeddings (
      page_id, chunk_text, embedding, metadata
    )
    SELECT 
      (e->>'page_id')::uuid,
      (e->>'chunk_text')::text,
      (e->>'embedding')::vector(1536),
      COALESCE((e->'metadata')::jsonb, '{}'::jsonb)
    FROM jsonb_array_elements(embeddings) AS e
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO inserted_count FROM inserted;
  
  RETURN inserted_count;
END;
$$;

-- Fix search_embeddings
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector,
  p_domain_id uuid DEFAULT NULL,
  match_threshold double precision DEFAULT 0.78,
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  page_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.chunk_text,
    pe.metadata,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND sp.status = 'completed'
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix get_business_id_from_domain
CREATE OR REPLACE FUNCTION get_business_id_from_domain(
  p_domain text
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_business_id uuid;
BEGIN
  SELECT business_id INTO v_business_id
  FROM customer_configs
  WHERE domain = p_domain
  LIMIT 1;
  
  RETURN v_business_id;
END;
$$;

-- Fix track_api_usage
CREATE OR REPLACE FUNCTION track_api_usage(
  p_domain text,
  p_endpoint text,
  p_status_code integer DEFAULT 200
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  INSERT INTO api_usage_logs (
    domain,
    endpoint,
    status_code,
    timestamp
  ) VALUES (
    p_domain,
    p_endpoint,
    p_status_code,
    NOW()
  );
END;
$$;

-- Fix create_scrape_job_for_domain_change
CREATE OR REPLACE FUNCTION create_scrape_job_for_domain_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF OLD.domain IS DISTINCT FROM NEW.domain THEN
    INSERT INTO scrape_jobs (
      domain_id,
      status,
      created_at
    ) VALUES (
      NEW.id,
      'pending',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix get_stale_content
CREATE OR REPLACE FUNCTION get_stale_content(
  p_days integer DEFAULT 30
)
RETURNS TABLE(
  id uuid,
  url text,
  last_scraped_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.url,
    sp.last_scraped_at
  FROM scraped_pages sp
  WHERE sp.last_scraped_at < NOW() - (p_days || ' days')::interval
  ORDER BY sp.last_scraped_at ASC;
END;
$$;

-- Fix manually_trigger_scraping
CREATE OR REPLACE FUNCTION manually_trigger_scraping(
  p_domain_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO scrape_jobs (
    domain_id,
    status,
    created_at
  ) VALUES (
    p_domain_id,
    'pending',
    NOW()
  ) RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- Fix notify_scrape_job_webhook
CREATE OR REPLACE FUNCTION notify_scrape_job_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  PERFORM pg_notify(
    'scrape_job_updates',
    json_build_object(
      'job_id', NEW.id,
      'status', NEW.status,
      'domain_id', NEW.domain_id
    )::text
  );
  RETURN NEW;
END;
$$;

-- Fix trigger_scraping_on_domain_change
CREATE OR REPLACE FUNCTION trigger_scraping_on_domain_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF OLD.domain IS DISTINCT FROM NEW.domain THEN
    INSERT INTO scrape_jobs (
      domain_id,
      status,
      created_at
    ) VALUES (
      NEW.id,
      'pending',
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Fix create_manual_scrape_job
CREATE OR REPLACE FUNCTION create_manual_scrape_job(
  p_domain_id uuid,
  p_priority text DEFAULT 'normal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_job_id uuid;
BEGIN
  INSERT INTO scrape_jobs (
    domain_id,
    status,
    priority,
    created_at
  ) VALUES (
    p_domain_id,
    'pending',
    p_priority,
    NOW()
  ) RETURNING id INTO v_job_id;
  
  RETURN v_job_id;
END;
$$;

-- Fix clean_expired_data
CREATE OR REPLACE FUNCTION clean_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Delete old api usage logs
  DELETE FROM api_usage_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Delete old messages based on retention settings
  DELETE FROM messages m
  USING conversations c
  JOIN customer_configs cc ON c.customer_id = cc.id
  WHERE m.conversation_id = c.id
  AND m.created_at < NOW() - (cc.data_retention_days || ' days')::interval
  AND cc.data_retention_days IS NOT NULL;
  
  -- Clean up orphaned embeddings
  DELETE FROM page_embeddings pe
  WHERE NOT EXISTS (
    SELECT 1 FROM scraped_pages sp
    WHERE sp.id = pe.page_id
  );
END;
$$;

-- Fix update_scrape_jobs_updated_at
CREATE OR REPLACE FUNCTION update_scrape_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 2. MOVE EXTENSIONS TO DEDICATED SCHEMA
-- ============================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move vector extension
ALTER EXTENSION vector SET SCHEMA extensions;

-- Move pg_trgm extension  
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Update search path for database to include extensions
ALTER DATABASE postgres SET search_path TO public, extensions;

-- ============================================
-- 3. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant execute permissions on all fixed functions
GRANT EXECUTE ON FUNCTION bulk_upsert_scraped_pages TO service_role;
GRANT EXECUTE ON FUNCTION bulk_insert_embeddings TO service_role;
GRANT EXECUTE ON FUNCTION search_embeddings TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO service_role;
GRANT EXECUTE ON FUNCTION get_business_id_from_domain TO authenticated;
GRANT EXECUTE ON FUNCTION track_api_usage TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION get_stale_content TO service_role;
GRANT EXECUTE ON FUNCTION manually_trigger_scraping TO authenticated;
GRANT EXECUTE ON FUNCTION create_manual_scrape_job TO authenticated;
GRANT EXECUTE ON FUNCTION clean_expired_data TO service_role;

-- ============================================
-- 4. VERIFY FIXES
-- ============================================

-- Query to verify all functions have search_path set
SELECT 
  proname AS function_name,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security,
  CASE 
    WHEN proconfig::text LIKE '%search_path%' THEN 'SET'
    ELSE 'NOT SET'
  END AS search_path_status
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND prokind = 'f'
ORDER BY proname;

-- Query to verify extensions are in correct schema
SELECT 
  extname AS extension_name,
  nspname AS schema_name
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY extname;