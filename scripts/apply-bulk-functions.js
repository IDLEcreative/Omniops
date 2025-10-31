#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';

// Bulk operation functions
const bulkFunctions = [
  {
    name: 'bulk_upsert_scraped_pages',
    sql: `CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
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
    $$;`
  },
  {
    name: 'Grant permissions for bulk_upsert_scraped_pages',
    sql: `GRANT EXECUTE ON FUNCTION bulk_upsert_scraped_pages TO service_role;`
  },
  {
    name: 'bulk_insert_embeddings',
    sql: `CREATE OR REPLACE FUNCTION bulk_insert_embeddings(
      embeddings jsonb
    )
    RETURNS integer
    LANGUAGE plpgsql
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
    $$;`
  },
  {
    name: 'Grant permissions for bulk_insert_embeddings',
    sql: `GRANT EXECUTE ON FUNCTION bulk_insert_embeddings TO service_role;`
  },
  {
    name: 'index_usage_stats view',
    sql: `CREATE OR REPLACE VIEW index_usage_stats AS
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch,
      pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC;`
  },
  {
    name: 'Grant permissions for index_usage_stats',
    sql: `GRANT SELECT ON index_usage_stats TO authenticated;`
  }
];

async function applyBulkFunctions() {
  console.log('🚀 Creating Bulk Operation Functions\n');
  console.log('=' .repeat(60));
  
  for (const func of bulkFunctions) {
    process.stdout.write(`⏳ Creating ${func.name}... `);
    
    try {
      await executeSQL(func.sql);
      console.log('✅');
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✨ Bulk functions created successfully!\n');
  console.log('📝 Usage Examples:\n');
  console.log('// Bulk upsert pages:');
  console.log("await supabase.rpc('bulk_upsert_scraped_pages', { pages: [...] });\n");
  console.log('// Bulk insert embeddings:');
  console.log("await supabase.rpc('bulk_insert_embeddings', { embeddings: [...] });");
}

applyBulkFunctions().catch(console.error);