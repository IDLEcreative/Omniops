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

interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface IndexUsage {
  schemaname: string;
  tablename: string;
  indexrelname: string;
  idx_scan: number;
  idx_tup_read: number;
  idx_tup_fetch: number;
}

interface IndexSize {
  index_name: string;
  table_name: string;
  index_size: string;
  index_size_bytes: number;
}

async function investigateIndexes() {
  console.log('='.repeat(80));
  console.log('DATABASE INDEX FORENSIC ANALYSIS');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // Step 1: List all indexes on scraped_pages and page_embeddings tables
  console.log('PHASE 1: INVENTORY - All Indexes on Target Tables');
  console.log('-'.repeat(60));
  
  const { data: indexes, error: indexError } = await supabase.rpc('run_sql', {
    sql: `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
      ORDER BY tablename, indexname;
    `
  });

  if (indexError) {
    console.error('Error fetching indexes:', indexError);
    return;
  }

  const targetIndexes = [
    'idx_scraped_pages_fulltext',
    'idx_scraped_pages_metadata_gin',
    'idx_scraped_pages_title_trgm',
    'idx_scraped_pages_content_trgm',
    'idx_scraped_pages_product_sku',
    'idx_scraped_pages_product_categories',
    'idx_scraped_pages_combined',
    'idx_page_embeddings_similarity',
    'idx_page_embeddings_page_id',
    'idx_structured_extractions_metadata'
  ];

  console.log(`Total indexes found: ${indexes?.length || 0}\n`);
  
  const foundIndexes = new Set<string>();
  indexes?.forEach((idx: IndexInfo) => {
    console.log(`Table: ${idx.tablename}`);
    console.log(`Index: ${idx.indexname}`);
    console.log(`Definition: ${idx.indexdef}\n`);
    foundIndexes.add(idx.indexname);
  });

  console.log('\nTarget Index Verification:');
  console.log('-'.repeat(40));
  targetIndexes.forEach(indexName => {
    const status = foundIndexes.has(indexName) ? '✅ FOUND' : '❌ MISSING';
    console.log(`${status}: ${indexName}`);
  });

  // Step 2: Check index usage statistics
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 2: USAGE STATISTICS - pg_stat_user_indexes');
  console.log('-'.repeat(60));
  
  const { data: usageStats, error: usageError } = await supabase.rpc('run_sql', {
    sql: `
      SELECT 
        schemaname,
        tablename,
        indexrelname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE tablename IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
      ORDER BY idx_scan DESC;
    `
  });

  if (usageError) {
    console.error('Error fetching usage stats:', usageError);
  } else {
    console.log('Index Usage (ordered by scan count):\n');
    usageStats?.forEach((stat: IndexUsage) => {
      console.log(`Index: ${stat.indexrelname}`);
      console.log(`  Scans: ${stat.idx_scan}`);
      console.log(`  Tuples Read: ${stat.idx_tup_read}`);
      console.log(`  Tuples Fetched: ${stat.idx_tup_fetch}`);
      const efficiency = stat.idx_tup_read > 0 
        ? (stat.idx_tup_fetch / stat.idx_tup_read * 100).toFixed(2)
        : 'N/A';
      console.log(`  Fetch Efficiency: ${efficiency}%`);
      
      // Flag potential issues
      if (stat.idx_scan === 0) {
        console.log(`  ⚠️ WARNING: Index never used!`);
      } else if (stat.idx_scan < 10) {
        console.log(`  ⚠️ WARNING: Very low usage (${stat.idx_scan} scans)`);
      }
      console.log();
    });
  }

  // Step 3: Check index sizes for bloat
  console.log('='.repeat(80));
  console.log('PHASE 3: INDEX SIZE ANALYSIS');
  console.log('-'.repeat(60));
  
  const { data: sizes, error: sizeError } = await supabase.rpc('run_sql', {
    sql: `
      SELECT 
        indexrelname as index_name,
        tablename as table_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_relation_size(indexrelid) as index_size_bytes
      FROM pg_stat_user_indexes
      WHERE tablename IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
      ORDER BY pg_relation_size(indexrelid) DESC;
    `
  });

  if (sizeError) {
    console.error('Error fetching index sizes:', sizeError);
  } else {
    console.log('Index Sizes (largest first):\n');
    let totalSize = 0;
    sizes?.forEach((size: IndexSize) => {
      console.log(`${size.index_name}: ${size.index_size}`);
      totalSize += size.index_size_bytes;
    });
    console.log(`\nTotal Index Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('PHASE 4: QUERY PLAN ANALYSIS - Testing Specific Indexes');
  console.log('-'.repeat(60));

  // Test 1: Full-text search index
  console.log('\nTest 1: Full-Text Search Index (idx_scraped_pages_fulltext)');
  console.log('-'.repeat(40));
  
  const { data: ftsPlan, error: ftsError } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT url, title, content
      FROM scraped_pages
      WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
        @@ plainto_tsquery('english', 'agricultural equipment')
      LIMIT 10;
    `
  });

  if (ftsError) {
    console.error('FTS query error:', ftsError);
  } else {
    analyzeQueryPlan(ftsPlan, 'Full-Text Search');
  }

  // Test 2: JSONB GIN index for metadata
  console.log('\nTest 2: JSONB GIN Index (idx_scraped_pages_metadata_gin)');
  console.log('-'.repeat(40));
  
  const { data: jsonbPlan, error: jsonbError } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT url, title, metadata
      FROM scraped_pages
      WHERE metadata @> '{"product_type": "tractor"}'::jsonb
      LIMIT 10;
    `
  });

  if (jsonbError) {
    console.error('JSONB query error:', jsonbError);
  } else {
    analyzeQueryPlan(jsonbPlan, 'JSONB Metadata Search');
  }

  // Test 3: Trigram index for fuzzy matching
  console.log('\nTest 3: Trigram Index (idx_scraped_pages_title_trgm)');
  console.log('-'.repeat(40));
  
  const { data: trigramPlan, error: trigramError } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT url, title
      FROM scraped_pages
      WHERE title % 'agricultral'  -- Intentional typo to test fuzzy matching
      LIMIT 10;
    `
  });

  if (trigramError) {
    console.error('Trigram query error:', trigramError);
  } else {
    analyzeQueryPlan(trigramPlan, 'Trigram Fuzzy Search');
  }

  // Test 4: SKU lookup index
  console.log('\nTest 4: SKU Index (idx_scraped_pages_product_sku)');
  console.log('-'.repeat(40));
  
  const { data: skuPlan, error: skuError } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT url, title, metadata
      FROM scraped_pages
      WHERE metadata->>'sku' = 'DC66'
      LIMIT 10;
    `
  });

  if (skuError) {
    console.error('SKU query error:', skuError);
  } else {
    analyzeQueryPlan(skuPlan, 'SKU Lookup');
  }

  // Test 5: Combined index
  console.log('\nTest 5: Combined Index (idx_scraped_pages_combined)');
  console.log('-'.repeat(40));
  
  const { data: combinedPlan, error: combinedError } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      SELECT url, title, created_at
      FROM scraped_pages
      WHERE domain = 'example.com'
        AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 10;
    `
  });

  if (combinedError) {
    console.error('Combined query error:', combinedError);
  } else {
    analyzeQueryPlan(combinedPlan, 'Combined Index (domain, status, created_at)');
  }

  // Phase 5: Edge case testing
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 5: EDGE CASE TESTING');
  console.log('-'.repeat(60));

  // Edge case 1: NULL values in indexed columns
  console.log('\nEdge Case 1: NULL values in indexed columns');
  const { data: nullTest } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT count(*) FROM scraped_pages WHERE title IS NULL;
    `
  });
  analyzeQueryPlan(nullTest, 'NULL value search');

  // Edge case 2: Very short search terms
  console.log('\nEdge Case 2: Short search terms (< 3 chars)');
  const { data: shortTest } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT url FROM scraped_pages WHERE title % 'DC';
    `
  });
  analyzeQueryPlan(shortTest, 'Short term fuzzy search');

  // Edge case 3: Complex JSONB queries
  console.log('\nEdge Case 3: Complex nested JSONB queries');
  const { data: complexJson } = await supabase.rpc('run_sql', {
    sql: `
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT url FROM scraped_pages 
      WHERE metadata @> '{"categories": ["agricultural"]}'::jsonb
        AND metadata->>'price' IS NOT NULL;
    `
  });
  analyzeQueryPlan(complexJson, 'Complex JSONB query');

  // Phase 6: Identify redundant indexes
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 6: REDUNDANCY ANALYSIS');
  console.log('-'.repeat(60));

  const { data: redundancyCheck } = await supabase.rpc('run_sql', {
    sql: `
      WITH index_columns AS (
        SELECT 
          i.indexrelid,
          i.indrelid,
          i.indkey,
          idx.indexname,
          array_agg(a.attname ORDER BY k.ord) as columns
        FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_indexes idx ON idx.indexname = (
          SELECT relname FROM pg_class WHERE oid = i.indexrelid
        )
        CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
        WHERE c.relname IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
        GROUP BY i.indexrelid, i.indrelid, i.indkey, idx.indexname
      )
      SELECT 
        ic1.indexname as index1,
        ic2.indexname as index2,
        ic1.columns as columns1,
        ic2.columns as columns2
      FROM index_columns ic1
      JOIN index_columns ic2 ON ic1.indrelid = ic2.indrelid
        AND ic1.indexrelid < ic2.indexrelid
        AND ic1.columns @> ic2.columns
      ORDER BY ic1.indexname, ic2.indexname;
    `
  });

  if (redundancyCheck && redundancyCheck.length > 0) {
    console.log('⚠️ POTENTIAL REDUNDANT INDEXES FOUND:');
    redundancyCheck.forEach((r: any) => {
      console.log(`\n${r.index1} (columns: ${r.columns1})`);
      console.log(`  might make ${r.index2} (columns: ${r.columns2}) redundant`);
    });
  } else {
    console.log('✅ No redundant indexes detected');
  }

  console.log('\n' + '='.repeat(80));
  console.log('INVESTIGATION COMPLETE');
  console.log('='.repeat(80));
}

function analyzeQueryPlan(planData: any, queryName: string) {
  if (!planData || !planData[0] || !planData[0].run_sql) {
    console.error(`No plan data for ${queryName}`);
    return;
  }

  try {
    const plan = JSON.parse(planData[0].run_sql)[0];
    const executionPlan = plan['QUERY PLAN'][0]['Plan'];
    
    console.log(`\nQuery: ${queryName}`);
    console.log(`Execution Time: ${plan['QUERY PLAN'][0]['Execution Time']?.toFixed(3) || 'N/A'} ms`);
    console.log(`Planning Time: ${plan['QUERY PLAN'][0]['Planning Time']?.toFixed(3) || 'N/A'} ms`);
    
    // Check if index is being used
    const indexUsed = checkIndexUsage(executionPlan);
    if (indexUsed) {
      console.log(`✅ Index Used: ${indexUsed}`);
    } else {
      console.log(`❌ NO INDEX USED - Sequential Scan`);
    }
    
    console.log(`Total Cost: ${executionPlan['Total Cost']?.toFixed(2) || 'N/A'}`);
    console.log(`Rows: ${executionPlan['Actual Rows'] || 'N/A'} (estimated: ${executionPlan['Plan Rows'] || 'N/A'})`);
    
    if (executionPlan['Shared Hit Blocks']) {
      console.log(`Buffer Hits: ${executionPlan['Shared Hit Blocks']} blocks`);
    }
  } catch (e) {
    console.error(`Error parsing plan for ${queryName}:`, e);
  }
}

function checkIndexUsage(plan: any): string | null {
  if (!plan) return null;
  
  // Check current node
  if (plan['Node Type']?.includes('Index')) {
    return plan['Index Name'] || plan['Node Type'];
  }
  
  // Check child nodes recursively
  if (plan['Plans']) {
    for (const childPlan of plan['Plans']) {
      const indexUsed = checkIndexUsage(childPlan);
      if (indexUsed) return indexUsed;
    }
  }
  
  return null;
}

// Run the investigation
investigateIndexes().catch(console.error);