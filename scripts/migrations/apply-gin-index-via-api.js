#!/usr/bin/env node

/**
 * Apply GIN index and other optimizations via Supabase Management API
 * Based on instructions from CLAUDE.md
 */

import dotenv from 'dotenv';
import { getSupabaseConfig } from '../supabase-config.js';

dotenv.config({ path: '.env.local' });

// Get Supabase configuration from environment variables
const config = getSupabaseConfig();
const { projectRef, managementToken } = config;

async function executeSQLViaAPI(sqlStatement, description) {
  console.log(`\nExecuting: ${description}...`);

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlStatement })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Success: ${description}`);
    return { success: true, result };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyAllOptimizations() {
  console.log('🚀 Applying Database Optimizations via Supabase Management API');
  console.log('=' .repeat(60));
  
  const optimizations = [
    {
      description: 'Create GIN index for text search on content',
      sql: `CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_gin 
            ON scraped_pages 
            USING gin(to_tsvector('english', content))`
    },
    {
      description: 'Create GIN index for text search on title',
      sql: `CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_gin 
            ON scraped_pages 
            USING gin(to_tsvector('english', title))`
    },
    {
      description: 'Create composite index on page_embeddings',
      sql: `CREATE INDEX IF NOT EXISTS idx_page_embeddings_composite 
            ON page_embeddings(page_id, chunk_index)`
    },
    {
      description: 'Update statistics for scraped_pages',
      sql: `ANALYZE scraped_pages`
    },
    {
      description: 'Update statistics for page_embeddings',
      sql: `ANALYZE page_embeddings`
    }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const opt of optimizations) {
    const result = await executeSQLViaAPI(opt.sql, opt.description);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  // Try HNSW index (may fail if extension not available)
  console.log('\nAttempting HNSW vector index (optional)...');
  const hnswResult = await executeSQLViaAPI(
    `CREATE INDEX IF NOT EXISTS idx_page_embeddings_hnsw 
     ON page_embeddings 
     USING hnsw (embedding vector_cosine_ops)`,
    'HNSW vector index'
  );
  
  if (!hnswResult.success) {
    console.log('ℹ️  HNSW index not created (extension may not be available)');
  } else {
    successCount++;
  }
  
  // Get final index list
  console.log('\n📊 Verifying indexes...');
  const indexCheck = await executeSQLViaAPI(
    `SELECT 
       tablename,
       indexname,
       indexdef
     FROM pg_indexes
     WHERE tablename IN ('scraped_pages', 'page_embeddings')
     ORDER BY tablename, indexname`,
    'List all indexes'
  );
  
  if (indexCheck.success && indexCheck.result) {
    console.log('\n✅ Current indexes:');
    if (Array.isArray(indexCheck.result)) {
      indexCheck.result.forEach(idx => {
        console.log(`  - ${idx.tablename}.${idx.indexname}`);
      });
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📈 Results: ${successCount} succeeded, ${failCount} failed`);
  
  if (failCount === 0) {
    console.log('✅ All optimizations successfully applied!');
    console.log('\n🎯 Expected improvements:');
    console.log('  • Text search: 10-100x faster with GIN indexes');
    console.log('  • JOIN operations: 50% faster with composite index');
    console.log('  • Query planning: Optimized with updated statistics');
  } else {
    console.log('⚠️  Some optimizations failed - check errors above');
  }
}

// Run the optimizations
applyAllOptimizations().catch(console.error);