-- Migration: Create Bulk Operation Functions for Content Refresh Performance
-- Created: 2025-11-08
-- Purpose: Add bulk_upsert_scraped_pages and bulk_insert_embeddings functions
--          to eliminate 10-100x performance penalty from individual query fallbacks

-- ==============================================================================
-- Function 1: bulk_upsert_scraped_pages
-- ==============================================================================
-- Purpose: Bulk insert/update scraped pages with conflict resolution
-- Input: JSONB array of page objects
-- Output: Table of (id, url) for inserted/updated pages
-- Performance: 10-100x faster than individual INSERT/UPDATE operations

CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(pages_input JSONB)
RETURNS TABLE(result_id UUID, result_url TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_pages (
    url,
    domain_id,
    title,
    content,
    metadata,
    last_scraped_at,
    status
  )
  SELECT
    (p->>'url')::TEXT,
    (p->>'domain_id')::UUID,
    (p->>'title')::TEXT,
    (p->>'content')::TEXT,
    (p->'metadata')::JSONB,
    COALESCE((p->>'last_scraped_at')::TIMESTAMPTZ, NOW()),
    COALESCE((p->>'status')::TEXT, 'completed')
  FROM jsonb_array_elements(pages_input) p
  ON CONFLICT (domain_id, url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    last_scraped_at = EXCLUDED.last_scraped_at,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING scraped_pages.id, scraped_pages.url;
END;
$$ LANGUAGE plpgsql;

-- Add function comment for documentation
COMMENT ON FUNCTION bulk_upsert_scraped_pages(JSONB) IS
'Bulk insert/update scraped pages with conflict resolution. Handles array of page objects in JSONB format. Returns table of (id, url) for processed pages.';

-- ==============================================================================
-- Function 2: bulk_insert_embeddings
-- ==============================================================================
-- Purpose: Bulk insert page embeddings (chunk_text + vector)
-- Input: JSONB array of embedding objects
-- Output: Count of inserted embeddings
-- Performance: 10-100x faster than individual INSERT operations

CREATE OR REPLACE FUNCTION bulk_insert_embeddings(embeddings JSONB)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO page_embeddings (
    page_id,
    domain_id,
    chunk_text,
    embedding,
    metadata
  )
  SELECT
    (e->>'page_id')::UUID,
    (e->>'domain_id')::UUID,
    (e->>'chunk_text')::TEXT,
    (e->>'embedding')::vector(1536),
    COALESCE((e->'metadata')::JSONB, '{}'::jsonb)
  FROM jsonb_array_elements(embeddings) e;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Add function comment for documentation
COMMENT ON FUNCTION bulk_insert_embeddings(JSONB) IS
'Bulk insert page embeddings. Handles array of embedding objects with vector data. Returns count of inserted embeddings.';

-- ==============================================================================
-- Verification Queries (commented out - run manually to test)
-- ==============================================================================

/*
-- Test bulk_upsert_scraped_pages
SELECT * FROM bulk_upsert_scraped_pages('[
  {
    "url": "https://test.com/page1",
    "domain_id": "00000000-0000-0000-0000-000000000000",
    "title": "Test Page",
    "content": "Test content",
    "metadata": {"test": true}
  }
]'::jsonb);

-- Test bulk_insert_embeddings (requires valid page_id and domain_id)
SELECT bulk_insert_embeddings('[
  {
    "page_id": "00000000-0000-0000-0000-000000000000",
    "domain_id": "00000000-0000-0000-0000-000000000000",
    "chunk_text": "Test chunk",
    "embedding": "[0.1, 0.2, ...]",
    "metadata": {"chunk_index": 0}
  }
]'::jsonb);
*/
