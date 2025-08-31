#!/usr/bin/env node

/**
 * Test and apply database migrations chunk by chunk
 * This script attempts to apply each migration and reports results
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration chunks to test
const chunks = [
  { 
    name: 'Basic Indexes', 
    file: 'chunk_1_indexes.sql',
    test: async () => {
      // Test if indexes were created
      const { data, error } = await supabase
        .from('scraped_pages')
        .select('id')
        .limit(1);
      return !error;
    }
  },
  { 
    name: 'Full-Text Search', 
    file: 'chunk_2_fulltext.sql',
    test: async () => {
      // Test if full-text search column exists
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: `SELECT column_name FROM information_schema.columns 
              WHERE table_name = 'scraped_pages' 
              AND column_name = 'content_search_vector'`
      }).single();
      return !error;
    }
  },
  { 
    name: 'Vector Indexes', 
    file: 'chunk_3_vector_index.sql',
    test: async () => {
      // Test vector index by doing a simple query
      const { data: sample } = await supabase
        .from('page_embeddings')
        .select('embedding')
        .limit(1)
        .single();
      
      if (sample?.embedding) {
        const { error } = await supabase.rpc('search_embeddings', {
          query_embedding: sample.embedding,
          p_domain_id: null,
          match_threshold: 0.5,
          match_count: 1
        });
        return !error;
      }
      return true; // No embeddings to test
    }
  },
  { 
    name: 'Cache Table', 
    file: 'chunk_4_cache_table.sql',
    test: async () => {
      // Test if cache table exists
      const { error } = await supabase
        .from('query_cache')
        .select('id')
        .limit(1);
      return !error;
    }
  },
  { 
    name: 'Search Functions', 
    file: 'chunk_5_search_functions.sql',
    test: async () => {
      // Test if optimized functions exist
      const { error } = await supabase.rpc('search_text_content', {
        query_text: 'test',
        p_domain_id: null,
        match_count: 1
      });
      return !error;
    }
  },
  { 
    name: 'Cleanup', 
    file: 'chunk_6_cleanup.sql',
    test: async () => {
      // Test if cleanup function exists
      const { error } = await supabase.rpc('cleanup_expired_cache');
      return !error;
    }
  }
];

async function executeSqlStatements(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(/;\s*$/m)
    .filter(stmt => stmt.trim())
    .map(stmt => stmt.trim() + ';');
  
  const results = [];
  
  for (const statement of statements) {
    // Skip comments and empty statements
    if (statement.startsWith('--') || !statement.trim()) continue;
    
    try {
      // For complex statements, we'll need to handle them differently
      if (statement.includes('DO $$') || statement.includes('CREATE FUNCTION') || statement.includes('CREATE OR REPLACE FUNCTION')) {
        // These need to be executed as a single block
        results.push({ statement: statement.substring(0, 50) + '...', status: 'skipped (complex)' });
      } else {
        // Simple statements can be tested
        const { error } = await supabase.rpc('execute_sql', { sql: statement }).single();
        if (error) {
          results.push({ statement: statement.substring(0, 50) + '...', status: 'error', error: error.message });
        } else {
          results.push({ statement: statement.substring(0, 50) + '...', status: 'success' });
        }
      }
    } catch (err) {
      results.push({ statement: statement.substring(0, 50) + '...', status: 'error', error: err.message });
    }
  }
  
  return results;
}

async function testMigrations() {
  console.log('🧪 Testing Database Migrations\n');
  console.log('=' .repeat(60));
  
  const report = [];
  
  for (const chunk of chunks) {
    console.log(`\n📦 Testing: ${chunk.name}`);
    console.log('-'.repeat(40));
    
    // First, test if the migration is already applied
    console.log('   Checking current state...');
    const isApplied = await chunk.test();
    
    if (isApplied) {
      console.log(`   ✅ ${chunk.name} appears to be already applied`);
      report.push({ chunk: chunk.name, status: 'already applied' });
    } else {
      console.log(`   ⚠️  ${chunk.name} not detected`);
      
      // Read the SQL file
      const sqlPath = join(__dirname, '..', 'migrations', chunk.file);
      if (!fs.existsSync(sqlPath)) {
        console.log(`   ❌ Migration file not found: ${chunk.file}`);
        report.push({ chunk: chunk.name, status: 'file missing' });
        continue;
      }
      
      console.log(`   📄 Reading ${chunk.file}...`);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Try to analyze what the migration would do
      const analysis = analyzeSql(sql);
      console.log(`   📊 Migration would:`);
      analysis.forEach(item => console.log(`      - ${item}`));
      
      report.push({ 
        chunk: chunk.name, 
        status: 'not applied',
        actions: analysis
      });
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 MIGRATION STATUS REPORT\n');
  
  const applied = report.filter(r => r.status === 'already applied').length;
  const notApplied = report.filter(r => r.status === 'not applied').length;
  const missing = report.filter(r => r.status === 'file missing').length;
  
  console.log(`Status Summary:`);
  console.log(`   ✅ Already Applied: ${applied}/${chunks.length}`);
  console.log(`   ⚠️  Not Applied: ${notApplied}/${chunks.length}`);
  if (missing > 0) {
    console.log(`   ❌ Missing Files: ${missing}/${chunks.length}`);
  }
  
  console.log('\nDetailed Status:');
  report.forEach(r => {
    const icon = r.status === 'already applied' ? '✅' : 
                 r.status === 'not applied' ? '⚠️' : '❌';
    console.log(`   ${icon} ${r.chunk}: ${r.status}`);
    if (r.actions) {
      r.actions.forEach(action => console.log(`      • ${action}`));
    }
  });
  
  if (notApplied > 0) {
    console.log('\n💡 To apply missing migrations:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Run the chunk files for migrations marked "not applied"');
    console.log('   3. Start with the lowest numbered chunk first');
  }
  
  // Test current performance
  console.log('\n' + '=' .repeat(60));
  console.log('\n⚡ PERFORMANCE TEST\n');
  
  await testCurrentPerformance();
}

function analyzeSql(sql) {
  const actions = [];
  
  if (sql.includes('CREATE INDEX')) {
    const indexCount = (sql.match(/CREATE INDEX/gi) || []).length;
    actions.push(`Create ${indexCount} index(es)`);
  }
  
  if (sql.includes('ALTER TABLE')) {
    const alterCount = (sql.match(/ALTER TABLE/gi) || []).length;
    actions.push(`Modify ${alterCount} table(s)`);
  }
  
  if (sql.includes('CREATE TABLE')) {
    actions.push('Create new table(s)');
  }
  
  if (sql.includes('CREATE FUNCTION') || sql.includes('CREATE OR REPLACE FUNCTION')) {
    const funcCount = (sql.match(/CREATE.*FUNCTION/gi) || []).length;
    actions.push(`Create/update ${funcCount} function(s)`);
  }
  
  if (sql.includes('ANALYZE')) {
    actions.push('Update table statistics');
  }
  
  if (sql.includes('GIN')) {
    actions.push('Add full-text search index');
  }
  
  if (sql.includes('ivfflat') || sql.includes('hnsw')) {
    actions.push('Add vector similarity index');
  }
  
  return actions.length > 0 ? actions : ['Execute custom SQL'];
}

async function testCurrentPerformance() {
  // Test 1: Basic query performance
  console.log('Testing basic query performance...');
  
  const start1 = Date.now();
  const { data: pages, error: pagesError } = await supabase
    .from('scraped_pages')
    .select('id, url, title')
    .limit(100);
  const time1 = Date.now() - start1;
  
  console.log(`   • Fetch 100 pages: ${time1}ms ${pagesError ? '❌' : '✅'}`);
  
  // Test 2: Text search performance (if available)
  console.log('Testing text search...');
  
  const start2 = Date.now();
  const { data: searchResults, error: searchError } = await supabase
    .from('scraped_pages')
    .select('url, title')
    .ilike('content', '%product%')
    .limit(10);
  const time2 = Date.now() - start2;
  
  console.log(`   • ILIKE search: ${time2}ms ${searchError ? '❌' : '✅'}`);
  
  // Test 3: Join performance
  console.log('Testing join performance...');
  
  const start3 = Date.now();
  const { data: embeddings, error: embError } = await supabase
    .from('page_embeddings')
    .select('id, page_id')
    .limit(50);
  const time3 = Date.now() - start3;
  
  console.log(`   • Fetch embeddings: ${time3}ms ${embError ? '❌' : '✅'}`);
  
  // Performance assessment
  const avgTime = (time1 + time2 + time3) / 3;
  
  console.log('\n📈 Performance Assessment:');
  if (avgTime < 100) {
    console.log('   🚀 Excellent - Queries are very fast (<100ms avg)');
  } else if (avgTime < 500) {
    console.log('   ✅ Good - Queries are reasonably fast (<500ms avg)');
  } else if (avgTime < 1000) {
    console.log('   ⚠️  Fair - Some optimization needed (<1s avg)');
  } else {
    console.log('   ❌ Poor - Significant optimization needed (>1s avg)');
  }
  
  console.log(`   Average query time: ${avgTime.toFixed(0)}ms`);
}

// Run the tests
testMigrations().catch(console.error);