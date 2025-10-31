#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';

const securityFixes = [
  {
    name: 'Fix bulk_upsert_scraped_pages search_path',
    sql: `CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(
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
    $$;`
  },
  {
    name: 'Fix bulk_insert_embeddings search_path',
    sql: `CREATE OR REPLACE FUNCTION bulk_insert_embeddings(
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
    $$;`
  },
  {
    name: 'Fix search_embeddings search_path',
    sql: `CREATE OR REPLACE FUNCTION search_embeddings(
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
    $$;`
  },
  {
    name: 'Create extensions schema',
    sql: `CREATE SCHEMA IF NOT EXISTS extensions;`
  },
  {
    name: 'Grant usage on extensions schema',
    sql: `GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;`
  },
  {
    name: 'Move vector extension',
    sql: `ALTER EXTENSION vector SET SCHEMA extensions;`
  },
  {
    name: 'Move pg_trgm extension',
    sql: `ALTER EXTENSION pg_trgm SET SCHEMA extensions;`
  },
  {
    name: 'Update database search path',
    sql: `ALTER DATABASE postgres SET search_path TO public, extensions;`
  }
];

async function applySecurityFixes() {
  console.log('🔒 Applying Security Fixes');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const fix of securityFixes) {
    process.stdout.write(`⏳ ${fix.name}... `);
    
    try {
      await executeSQL(fix.sql);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      errorCount++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Security Fix Summary:');
  console.log(`✅ Successful: ${successCount}/${securityFixes.length}`);
  console.log(`❌ Failed: ${errorCount}/${securityFixes.length}`);
  
  if (errorCount === 0) {
    console.log('\n✨ All security fixes applied successfully!');
    console.log('\n🔒 Security Improvements:');
    console.log('  • Functions now have immutable search_path (prevents SQL injection)');
    console.log('  • Extensions moved to dedicated schema (better isolation)');
    console.log('  • All functions use SECURITY DEFINER with proper search_path');
    console.log('  • Database search_path updated to include extensions schema');
  } else {
    console.log('\n⚠️  Some fixes failed. Review and apply manually in SQL Editor.');
  }
}

applySecurityFixes().catch(console.error);