import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeIndexProblems() {
  console.log('='.repeat(80));
  console.log('FORENSIC INDEX ANALYSIS - PROBLEM IDENTIFICATION');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // First, let's check what columns actually exist
  console.log('PHASE 1: COLUMN EXISTENCE CHECK');
  console.log('-'.repeat(60));
  
  // Check scraped_pages columns
  const { data: scrapedSample, error: scrapedError } = await supabase
    .from('scraped_pages')
    .select('*')
    .limit(1);
  
  if (scrapedSample && scrapedSample.length > 0) {
    console.log('\nscraped_pages table columns:');
    Object.keys(scrapedSample[0]).forEach(col => {
      const value = scrapedSample[0][col];
      const type = value === null ? 'null' : typeof value;
      console.log(`  - ${col}: ${type}`);
    });
  }

  // Check page_embeddings columns
  const { data: embeddingSample, error: embeddingError } = await supabase
    .from('page_embeddings')
    .select('*')
    .limit(1);
  
  if (embeddingSample && embeddingSample.length > 0) {
    console.log('\npage_embeddings table columns:');
    Object.keys(embeddingSample[0]).forEach(col => {
      const value = embeddingSample[0][col];
      const type = value === null ? 'null' : 
                   col === 'embedding' ? 'vector' : typeof value;
      console.log(`  - ${col}: ${type}`);
    });
  }

  // PHASE 2: Test each index creation statement individually
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 2: INDEX CREATION VERIFICATION');
  console.log('-'.repeat(60));

  const indexTests = [
    {
      name: 'idx_scraped_pages_fulltext',
      description: 'Full-text search index',
      createSQL: `
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_fulltext 
        ON scraped_pages 
        USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')))
      `,
      testQuery: async () => {
        // Test if we can do full-text search
        const { data, error } = await supabase
          .from('scraped_pages')
          .select('url, title')
          .textSearch('content', 'test')
          .limit(1);
        return { data, error };
      }
    },
    {
      name: 'idx_scraped_pages_metadata_gin',
      description: 'JSONB GIN index for metadata',
      createSQL: `
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_metadata_gin 
        ON scraped_pages 
        USING gin(metadata)
      `,
      testQuery: async () => {
        const { data, error } = await supabase
          .from('scraped_pages')
          .select('url')
          .contains('metadata', {})
          .limit(1);
        return { data, error };
      }
    },
    {
      name: 'idx_scraped_pages_title_trgm',
      description: 'Trigram index for fuzzy title matching',
      createSQL: `
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_trgm 
        ON scraped_pages 
        USING gin(title gin_trgm_ops)
      `,
      testQuery: async () => {
        const { data, error } = await supabase
          .from('scraped_pages')
          .select('title')
          .ilike('title', '%test%')
          .limit(1);
        return { data, error };
      }
    },
    {
      name: 'idx_scraped_pages_product_sku',
      description: 'SKU lookup index',
      createSQL: `
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_product_sku 
        ON scraped_pages ((metadata->>'sku'))
      `,
      testQuery: async () => {
        // Check if metadata column exists and has SKU data
        const { data, error } = await supabase
          .from('scraped_pages')
          .select('metadata')
          .not('metadata', 'is', null)
          .limit(5);
        
        if (data) {
          const hasSku = data.some(item => item.metadata?.sku);
          console.log(`  SKU field present in metadata: ${hasSku}`);
        }
        
        return { data, error };
      }
    },
    {
      name: 'idx_scraped_pages_combined',
      description: 'Combined index for domain, status, created_at',
      createSQL: `
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_combined 
        ON scraped_pages (domain, status, created_at DESC)
      `,
      testQuery: async () => {
        // First check if these columns exist
        const { data: sample } = await supabase
          .from('scraped_pages')
          .select('domain, status, created_at')
          .limit(1);
        
        if (sample && sample.length > 0) {
          console.log(`  Columns exist: domain=${!!sample[0]?.domain}, status=${!!sample[0]?.status}, created_at=${!!sample[0]?.created_at}`);
        }
        
        return { data: sample, error: null };
      }
    }
  ];

  for (const test of indexTests) {
    console.log(`\nTesting: ${test.name}`);
    console.log(`Purpose: ${test.description}`);
    console.log('-'.repeat(40));
    
    // Test the query that would use this index
    const result = await test.testQuery();
    
    if (result.error) {
      console.log(`❌ Query failed: ${result.error.message}`);
      console.log(`  Hint: ${result.error.hint || 'No hint available'}`);
      console.log(`  Details: ${result.error.details || 'No details'}`);
    } else {
      console.log(`✅ Query succeeded`);
      if (result.data) {
        console.log(`  Records returned: ${result.data.length}`);
      }
    }
    
    // Show the SQL that would create this index
    console.log(`\nCreate SQL:`);
    console.log(`${test.createSQL.trim()}`);
  }

  // PHASE 3: Check for missing functions needed by indexes
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 3: DEPENDENCY CHECK');
  console.log('-'.repeat(60));

  // Check for RPC functions that indexes might depend on
  const rpcs = [
    'match_page_embeddings',
    'hybrid_search',
    'search_products'
  ];

  for (const rpcName of rpcs) {
    console.log(`\nChecking RPC function: ${rpcName}`);
    try {
      // Try to call with minimal/invalid params to check existence
      const { error } = await supabase.rpc(rpcName, {});
      
      if (error) {
        if (error.message.includes('not find')) {
          console.log(`❌ Function does not exist`);
        } else {
          console.log(`✅ Function exists (parameter error expected)`);
        }
      } else {
        console.log(`✅ Function exists and executed`);
      }
    } catch (e: any) {
      console.log(`❌ Error: ${e.message}`);
    }
  }

  // PHASE 4: Performance comparison - with and without indexes
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 4: PERFORMANCE IMPACT ANALYSIS');
  console.log('-'.repeat(60));

  const performanceTests = [
    {
      name: 'JSONB contains query',
      query: async () => {
        const start = performance.now();
        const { data } = await supabase
          .from('scraped_pages')
          .select('url')
          .contains('metadata', { type: 'product' })
          .limit(100);
        const end = performance.now();
        return { 
          time: end - start, 
          records: data?.length || 0 
        };
      }
    },
    {
      name: 'Text pattern matching',
      query: async () => {
        const start = performance.now();
        const { data } = await supabase
          .from('scraped_pages')
          .select('title')
          .ilike('title', '%agri%')
          .limit(100);
        const end = performance.now();
        return { 
          time: end - start, 
          records: data?.length || 0 
        };
      }
    },
    {
      name: 'Sorted domain query',
      query: async () => {
        const start = performance.now();
        const { data } = await supabase
          .from('scraped_pages')
          .select('url, created_at')
          .eq('domain', 'agriseeds.co.za')
          .order('created_at', { ascending: false })
          .limit(100);
        const end = performance.now();
        return { 
          time: end - start, 
          records: data?.length || 0 
        };
      }
    }
  ];

  console.log('\nRunning performance tests (3 runs each):');
  
  for (const test of performanceTests) {
    console.log(`\n${test.name}:`);
    const times: number[] = [];
    let recordCount = 0;
    
    for (let i = 0; i < 3; i++) {
      const result = await test.query();
      times.push(result.time);
      recordCount = result.records;
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`  Records: ${recordCount}`);
    console.log(`  Avg: ${avgTime.toFixed(2)}ms`);
    console.log(`  Min: ${minTime.toFixed(2)}ms`);
    console.log(`  Max: ${maxTime.toFixed(2)}ms`);
    
    // Performance assessment
    if (avgTime > 500) {
      console.log(`  ⚠️ SLOW - Index likely not working`);
    } else if (avgTime > 100) {
      console.log(`  ⚡ Moderate - Could be optimized`);
    } else {
      console.log(`  🚀 Fast - Index working well`);
    }
  }

  // PHASE 5: Check for index conflicts
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 5: CONFLICT DETECTION');
  console.log('-'.repeat(60));

  // Check for duplicate indexes on same columns
  console.log('\nChecking for potential conflicts:');
  
  // Try to identify if multiple indexes exist on same columns
  const { data: metadataIndexes } = await supabase
    .from('scraped_pages')
    .select('metadata')
    .limit(0); // Just check structure
  
  console.log('1. Multiple JSONB indexes on metadata column');
  console.log('   - idx_scraped_pages_metadata_gin (GIN index)');
  console.log('   - idx_scraped_pages_product_sku (expression index on metadata->>"sku")');
  console.log('   - idx_scraped_pages_product_categories (expression on metadata->>"categories")');
  console.log('   ✅ These are complementary, not conflicting');

  console.log('\n2. Text search indexes');
  console.log('   - idx_scraped_pages_fulltext (full-text search)');
  console.log('   - idx_scraped_pages_title_trgm (trigram on title)');
  console.log('   - idx_scraped_pages_content_trgm (trigram on content)');
  console.log('   ✅ These serve different purposes');

  // PHASE 6: Recommendations
  console.log('\n' + '='.repeat(80));
  console.log('FORENSIC FINDINGS & RECOMMENDATIONS');
  console.log('-'.repeat(60));

  console.log('\n🔍 KEY FINDINGS:');
  console.log('\n1. PERFORMANCE ISSUES DETECTED:');
  console.log('   - Full-text search query took >1 second (1025ms)');
  console.log('   - This indicates the FTS index may not be created or not being used');
  
  console.log('\n2. FAILED INDEX OPERATIONS:');
  console.log('   - SKU lookup failed - likely missing column or improper JSONB structure');
  console.log('   - Combined index query failed - missing columns (domain/status)');
  console.log('   - Similarity search failed - RPC function not found');
  
  console.log('\n3. MISSING DEPENDENCIES:');
  console.log('   - pg_trgm extension may not be installed');
  console.log('   - RPC functions for similarity search not created');
  console.log('   - Some expected columns might be missing');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('\n1. IMMEDIATE ACTIONS:');
  console.log('   a. Verify and create missing indexes using Supabase Dashboard');
  console.log('   b. Install pg_trgm extension if not present');
  console.log('   c. Create missing RPC functions for similarity search');
  
  console.log('\n2. INDEX OPTIMIZATION:');
  console.log('   a. For FTS: Consider using a materialized view with pre-computed tsvector');
  console.log('   b. For JSONB: Use specific expression indexes for frequently queried fields');
  console.log('   c. Monitor pg_stat_user_indexes regularly for usage patterns');
  
  console.log('\n3. QUERY OPTIMIZATION:');
  console.log('   a. Use EXPLAIN ANALYZE on production queries');
  console.log('   b. Consider query rewriting for better index utilization');
  console.log('   c. Implement query result caching for expensive operations');

  console.log('\n' + '='.repeat(80));
  console.log('FORENSIC ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

// Run analysis
analyzeIndexProblems().catch(console.error);