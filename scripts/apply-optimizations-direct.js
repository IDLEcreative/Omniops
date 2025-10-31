#!/usr/bin/env node

import { executeSQL } from './supabase-config.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Note: executeSQL imported from supabase-config.js

// SQL statements to execute
const sqlStatements = [
  // Indexes
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_domain_scraped ON scraped_pages(domain_id, scraped_at DESC);`,
  
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scraped_pages_url_completed ON scraped_pages(url) WHERE status = 'completed';`,
  
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_id ON page_embeddings(page_id);`,
  
  `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_embeddings_page_created ON page_embeddings(page_id, created_at DESC);`,
  
  // HNSW Index
  `DROP INDEX IF EXISTS page_embeddings_embedding_idx;`,
  
  `CREATE INDEX CONCURRENTLY page_embeddings_embedding_hnsw_idx ON page_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);`,
  
  // Optimized search function
  `DROP FUNCTION IF EXISTS search_embeddings(vector, uuid, double precision, integer);`,
  
  `CREATE OR REPLACE FUNCTION search_embeddings(
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
  $$;`,
  
  `GRANT EXECUTE ON FUNCTION search_embeddings TO service_role, authenticated;`,
  
  // Statistics update
  `ANALYZE scraped_pages;`,
  `ANALYZE page_embeddings;`,
  `ANALYZE customer_configs;`
];

async function applyOptimizations() {
  console.log('🚀 Applying Performance Optimizations\n');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const preview = sql.substring(0, 50).replace(/\n/g, ' ') + '...';
    
    process.stdout.write(`[${i + 1}/${sqlStatements.length}] ${preview} `);
    
    try {
      await executeSQL(sql);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log(`❌ ${error.message}`);
      errorCount++;
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary:');
  console.log(`✅ Successful: ${successCount}/${sqlStatements.length}`);
  console.log(`❌ Failed: ${errorCount}/${sqlStatements.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some optimizations failed. You may need to:');
    console.log('1. Check if the pgvector extension supports HNSW indexes');
    console.log('2. Run failed statements manually in SQL Editor');
    console.log('3. Ensure you have proper permissions');
  } else {
    console.log('\n✨ All optimizations applied successfully!');
    console.log('Monitor performance improvements in your application.');
  }
}

// Run the script
applyOptimizations().catch(console.error);