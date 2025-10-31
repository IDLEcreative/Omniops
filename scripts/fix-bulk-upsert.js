#!/usr/bin/env node

// MIGRATED: Now uses environment variables via supabase-config.js
import { getSupabaseConfig, executeSQL } from './supabase-config.js';

const config = getSupabaseConfig();

async function fixBulkUpsert() {
  console.log('🔧 Fixing bulk_upsert_scraped_pages function...\n');

  // Drop the old function
  console.log('Dropping old function...');
  await executeSQL(config, 'DROP FUNCTION IF EXISTS bulk_upsert_scraped_pages(jsonb);');

  // Create the fixed function with proper column qualification
  console.log('Creating fixed function...');
  const createFunction = `
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
  pages jsonb
)
RETURNS TABLE(
  id uuid,
  url text,
  status text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_pages (
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
    scraped_pages.id,
    scraped_pages.url,
    scraped_pages.status;
END;
$$;`;
  
  await executeSQL(config, createFunction);

  console.log('Granting permissions...');
  await executeSQL(config, 'GRANT EXECUTE ON FUNCTION bulk_upsert_scraped_pages TO service_role;');
  
  console.log('\n✅ Function fixed successfully!');
}

fixBulkUpsert().catch(console.error);