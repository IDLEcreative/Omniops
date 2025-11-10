-- Migration: Atomic Page and Embeddings Transaction
-- Created: 2025-11-08
-- Purpose: Ensure page save, embedding deletion, and embedding insert happen atomically
-- Benefits: No orphaned pages, no partial state, automatic rollback on errors

-- Drop function if exists (for re-running migration)
DROP FUNCTION IF EXISTS atomic_page_with_embeddings(JSONB, JSONB);

-- Create atomic function to save page and embeddings in single transaction
CREATE OR REPLACE FUNCTION atomic_page_with_embeddings(
  page_data JSONB,
  embeddings_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_page_id UUID;
  deleted_count INTEGER;
  inserted_count INTEGER;
  result JSONB;
BEGIN
  -- Step 1: Upsert page (with conflict resolution)
  INSERT INTO scraped_pages (
    url,
    domain_id,
    title,
    content,
    metadata,
    last_scraped_at,
    status
  )
  VALUES (
    (page_data->>'url')::TEXT,
    (page_data->>'domain_id')::UUID,
    (page_data->>'title')::TEXT,
    (page_data->>'content')::TEXT,
    (page_data->'metadata')::JSONB,
    COALESCE((page_data->>'last_scraped_at')::TIMESTAMPTZ, NOW()),
    COALESCE((page_data->>'status')::TEXT, 'completed')
  )
  ON CONFLICT (domain_id, url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    last_scraped_at = EXCLUDED.last_scraped_at,
    status = EXCLUDED.status
  RETURNING id INTO v_page_id;

  -- Step 2: Delete old embeddings for this page
  DELETE FROM page_embeddings WHERE page_id = v_page_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Step 3: Insert new embeddings
  INSERT INTO page_embeddings (
    page_id,
    domain_id,
    chunk_text,
    embedding,
    metadata
  )
  SELECT
    v_page_id, -- Use the page_id from step 1
    (e->>'domain_id')::UUID,
    (e->>'chunk_text')::TEXT,
    (e->>'embedding')::vector(1536),
    COALESCE((e->'metadata')::JSONB, '{}'::jsonb)
  FROM jsonb_array_elements(embeddings_data) e;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Return summary
  result := jsonb_build_object(
    'page_id', v_page_id,
    'deleted_embeddings', deleted_count,
    'inserted_embeddings', inserted_count,
    'success', true
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically on exception
    RAISE NOTICE 'Transaction rolled back: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION atomic_page_with_embeddings IS
  'Atomically saves page and embeddings in single transaction. Deletes old embeddings first. Rolls back on any error.';

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION atomic_page_with_embeddings TO service_role;
GRANT EXECUTE ON FUNCTION atomic_page_with_embeddings TO authenticated;
