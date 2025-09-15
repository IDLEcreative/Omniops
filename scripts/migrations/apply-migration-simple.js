#!/usr/bin/env node

import { createClient  } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key:', supabaseKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Migration parts
const migrationParts = [
  {
    name: 'Drop existing enhanced search function',
    sql: `DROP FUNCTION IF EXISTS public.search_embeddings_enhanced CASCADE;`
  },
  {
    name: 'Create enhanced search function',
    sql: `CREATE OR REPLACE FUNCTION public.search_embeddings_enhanced(
  query_embedding vector(1536),
  p_domain_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  content_types text[] DEFAULT NULL,
  query_keywords text[] DEFAULT NULL,
  boost_recent boolean DEFAULT false
)
RETURNS TABLE (
  id UUID,
  page_id UUID,
  chunk_text text,
  url text,
  title text,
  metadata jsonb,
  base_similarity float,
  position_boost float,
  keyword_boost float,
  recency_boost float,
  content_type_boost float,
  final_score float
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  current_date timestamp := NOW();
BEGIN
  RETURN QUERY
  WITH scored_results AS (
    SELECT 
      pe.id,
      pe.page_id,
      pe.chunk_text,
      COALESCE((pe.metadata->>'url')::text, sp.url) as url,
      COALESCE((pe.metadata->>'title')::text, sp.title) as title,
      pe.metadata,
      1 - (pe.embedding <=> query_embedding) as base_similarity,
      CASE 
        WHEN (pe.metadata->>'chunk_index')::int = 0 THEN 0.15
        WHEN (pe.metadata->>'chunk_index')::int = 1 THEN 0.10
        WHEN (pe.metadata->>'chunk_index')::int = 2 THEN 0.05
        ELSE 0
      END as position_boost,
      CASE 
        WHEN query_keywords IS NOT NULL AND 
             pe.metadata->'keywords' IS NOT NULL AND
             pe.metadata->'keywords' ?| query_keywords THEN 0.20
        WHEN query_keywords IS NOT NULL AND 
             pe.metadata->'entities' IS NOT NULL AND (
               pe.metadata->'entities'->'products' ?| query_keywords OR
               pe.metadata->'entities'->'brands' ?| query_keywords OR
               pe.metadata->'entities'->'skus' ?| query_keywords
             ) THEN 0.25
        ELSE 0
      END as keyword_boost,
      CASE 
        WHEN boost_recent AND pe.metadata->>'indexed_at' IS NOT NULL THEN
          GREATEST(0, 0.1 * (1 - EXTRACT(EPOCH FROM (current_date - (pe.metadata->>'indexed_at')::timestamp)) / (86400 * 180)))
        ELSE 0
      END as recency_boost,
      CASE 
        WHEN pe.metadata->>'content_type' = 'product' AND 
             query_keywords IS NOT NULL AND 
             (array_length(query_keywords, 1) > 0) THEN 0.10
        WHEN pe.metadata->>'content_type' = 'faq' AND 
             pe.chunk_text LIKE '%?%' THEN 0.05
        ELSE 0
      END as content_type_boost
    FROM page_embeddings pe
    INNER JOIN scraped_pages sp ON pe.page_id = sp.id
    WHERE 
      (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
      AND pe.embedding IS NOT NULL
      AND 1 - (pe.embedding <=> query_embedding) > match_threshold
      AND (content_types IS NULL OR pe.metadata->>'content_type' = ANY(content_types))
  ),
  final_scored AS (
    SELECT 
      *,
      base_similarity + position_boost + keyword_boost + recency_boost + content_type_boost as final_score
    FROM scored_results
  )
  SELECT 
    id, page_id, chunk_text, url, title, metadata,
    base_similarity, position_boost, keyword_boost, recency_boost, content_type_boost, final_score
  FROM final_scored
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$;`
  },
  {
    name: 'Grant permissions to enhanced search function',
    sql: `GRANT EXECUTE ON FUNCTION public.search_embeddings_enhanced TO service_role, authenticated, anon;`
  },
  {
    name: 'Create metadata search function',
    sql: `CREATE OR REPLACE FUNCTION public.search_by_metadata(
  p_domain_id UUID DEFAULT NULL,
  content_types text[] DEFAULT NULL,
  must_have_keywords text[] DEFAULT NULL,
  price_min numeric DEFAULT NULL,
  price_max numeric DEFAULT NULL,
  availability text DEFAULT NULL,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  page_id UUID,
  chunk_text text,
  url text,
  title text,
  metadata jsonb
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    pe.chunk_text,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    pe.metadata
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND (content_types IS NULL OR pe.metadata->>'content_type' = ANY(content_types))
    AND (must_have_keywords IS NULL OR pe.metadata->'keywords' ?| must_have_keywords)
    AND (price_min IS NULL OR (pe.metadata->'price_range'->>'min')::numeric >= price_min)
    AND (price_max IS NULL OR (pe.metadata->'price_range'->>'max')::numeric <= price_max)
    AND (availability IS NULL OR pe.metadata->>'availability' = availability)
  ORDER BY (pe.metadata->>'chunk_index')::int ASC
  LIMIT limit_count;
END;
$$;`
  },
  {
    name: 'Grant permissions to metadata search function',
    sql: `GRANT EXECUTE ON FUNCTION public.search_by_metadata TO service_role, authenticated, anon;`
  }
];

async function executeSql(sql) {
  try {
    // Use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ 
        sql: sql
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function applyMigration() {
  console.log('🚀 Applying enhanced metadata search migration...\n');

  for (let i = 0; i < migrationParts.length; i++) {
    const part = migrationParts[i];
    console.log(`📝 ${i + 1}/${migrationParts.length}: ${part.name}`);

    try {
      await executeSql(part.sql);
      console.log('✅ Success\n');
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
      // Continue with next migration part
    }
  }

  console.log('🎉 Migration application completed!');
}

applyMigration().catch(console.error);