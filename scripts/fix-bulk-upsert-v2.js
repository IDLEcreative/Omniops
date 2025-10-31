#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';

async function fixBulkUpsert() {
  console.log('🔧 Fixing bulk_upsert_scraped_pages function (v2)...\n');
  
  // Drop the old function
  console.log('Dropping old function...');
  await executeSQL('DROP FUNCTION IF EXISTS bulk_upsert_scraped_pages(jsonb);');
  
  // Create the fixed function with fully qualified names
  console.log('Creating fixed function with qualified names...');
  const createFunction = `
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
  pages jsonb
)
RETURNS TABLE(
  out_id uuid,
  out_url text,
  out_status text
)
LANGUAGE plpgsql
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
$$;`;
  
  await executeSQL(createFunction);
  
  console.log('Granting permissions...');
  await executeSQL('GRANT EXECUTE ON FUNCTION bulk_upsert_scraped_pages TO service_role;');
  
  console.log('\n✅ Function fixed successfully!');
}

fixBulkUpsert().catch(console.error);