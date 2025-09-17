import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN!;
const projectRef = 'birugqyuqhiahxvxeyqg';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql(query: string): Promise<any> {
  if (accessToken) {
    // Use Management API for complex queries
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SQL Error: ${error}`);
    }
    
    return response.json();
  } else {
    // Fallback to Supabase client
    const { data, error } = await supabase.from('scraped_pages').select('*').limit(1);
    if (error) throw error;
    return data;
  }
}

async function investigateIndexes() {
  console.log('='.repeat(80));
  console.log('DATABASE INDEX FORENSIC ANALYSIS - DIRECT SQL');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

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

  try {
    // Step 1: List all indexes
    console.log('PHASE 1: INDEX INVENTORY');
    console.log('-'.repeat(60));
    
    const indexQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
        AND schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexResult = await executeSql(indexQuery);
    
    if (Array.isArray(indexResult)) {
      console.log(`Total indexes found: ${indexResult.length}\n`);
      
      const foundIndexes = new Set<string>();
      indexResult.forEach((idx: any) => {
        console.log(`Table: ${idx.tablename}`);
        console.log(`Index: ${idx.indexname}`);
        console.log(`Definition: ${idx.indexdef?.substring(0, 150)}...`);
        console.log();
        foundIndexes.add(idx.indexname);
      });
      
      console.log('\nTarget Index Verification:');
      console.log('-'.repeat(40));
      targetIndexes.forEach(indexName => {
        const status = foundIndexes.has(indexName) ? '✅ FOUND' : '❌ MISSING';
        console.log(`${status}: ${indexName}`);
      });
    }

    // Step 2: Check usage statistics
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 2: USAGE STATISTICS');
    console.log('-'.repeat(60));
    
    const usageQuery = `
      SELECT 
        schemaname,
        tablename,
        indexrelname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public' 
        AND tablename IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
      ORDER BY idx_scan DESC;
    `;
    
    const usageResult = await executeSql(usageQuery);
    
    if (Array.isArray(usageResult)) {
      console.log('Index Usage Analysis:\n');
      
      const criticalIndexes = targetIndexes.filter(idx => 
        ['idx_scraped_pages_fulltext', 'idx_scraped_pages_metadata_gin', 
         'idx_scraped_pages_title_trgm', 'idx_scraped_pages_product_sku'].includes(idx)
      );
      
      usageResult.forEach((stat: any) => {
        const isCritical = criticalIndexes.includes(stat.indexrelname);
        const marker = isCritical ? '⭐' : '';
        
        console.log(`${marker} Index: ${stat.indexrelname}`);
        console.log(`  Table: ${stat.tablename}`);
        console.log(`  Scans: ${stat.idx_scan}`);
        console.log(`  Tuples Read: ${stat.idx_tup_read}`);
        console.log(`  Tuples Fetched: ${stat.idx_tup_fetch}`);
        
        if (stat.idx_scan === 0) {
          console.log(`  ⚠️ WARNING: INDEX NEVER USED!`);
        } else if (stat.idx_scan < 10) {
          console.log(`  ⚠️ WARNING: Very low usage (${stat.idx_scan} scans)`);
        }
        
        if (isCritical && stat.idx_scan === 0) {
          console.log(`  🔴 CRITICAL: This is a key index that should be used!`);
        }
        
        console.log();
      });
    }

    // Step 3: Size analysis
    console.log('='.repeat(80));
    console.log('PHASE 3: INDEX SIZE AND BLOAT ANALYSIS');
    console.log('-'.repeat(60));
    
    const sizeQuery = `
      SELECT 
        indexrelname as index_name,
        tablename as table_name,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_relation_size(indexrelid) as size_bytes
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('scraped_pages', 'page_embeddings', 'structured_extractions')
      ORDER BY pg_relation_size(indexrelid) DESC;
    `;
    
    const sizeResult = await executeSql(sizeQuery);
    
    if (Array.isArray(sizeResult)) {
      let totalSize = 0;
      sizeResult.forEach((size: any) => {
        console.log(`${size.index_name}:`);
        console.log(`  Size: ${size.index_size}`);
        totalSize += parseInt(size.size_bytes) || 0;
      });
      console.log(`\nTotal Index Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }

    // Step 4: Test specific queries
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 4: QUERY EXECUTION PLAN TESTS');
    console.log('-'.repeat(60));

    // Test queries to verify index usage
    const testQueries = [
      {
        name: 'Full-Text Search (should use idx_scraped_pages_fulltext)',
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT url, title
          FROM scraped_pages
          WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
            @@ plainto_tsquery('english', 'tractor equipment')
          LIMIT 5;
        `
      },
      {
        name: 'JSONB Metadata Search (should use idx_scraped_pages_metadata_gin)',
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT url, title
          FROM scraped_pages
          WHERE metadata @> '{"product_type": "tractor"}'::jsonb
          LIMIT 5;
        `
      },
      {
        name: 'Fuzzy Title Search (should use idx_scraped_pages_title_trgm)',
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT url, title
          FROM scraped_pages
          WHERE title % 'agricultral'
          LIMIT 5;
        `
      },
      {
        name: 'SKU Lookup (should use idx_scraped_pages_product_sku)',
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT url, title
          FROM scraped_pages
          WHERE metadata->>'sku' = 'DC66'
          LIMIT 5;
        `
      },
      {
        name: 'Category Search (should use idx_scraped_pages_product_categories)',
        query: `
          EXPLAIN (ANALYZE, BUFFERS)
          SELECT url, title
          FROM scraped_pages
          WHERE metadata @> '{"categories": ["agricultural"]}'::jsonb
          LIMIT 5;
        `
      }
    ];

    for (const test of testQueries) {
      console.log(`\nTest: ${test.name}`);
      console.log('-'.repeat(40));
      
      try {
        const result = await executeSql(test.query);
        
        if (Array.isArray(result)) {
          const planText = result.map((r: any) => 
            Object.values(r).join(' ')
          ).join('\n');
          
          // Parse for index usage
          const indexMatch = planText.match(/Index[^:]*: ([^\s]+)/i);
          const scanMatch = planText.match(/(Seq Scan|Index Scan|Bitmap Index Scan|Index Only Scan)/i);
          const timeMatch = planText.match(/Execution Time: ([\d.]+) ms/i);
          
          if (indexMatch) {
            console.log(`✅ INDEX USED: ${indexMatch[1]}`);
          } else if (scanMatch && scanMatch[1]?.includes('Index')) {
            console.log(`✅ INDEX SCAN DETECTED`);
          } else if (scanMatch && scanMatch[1] === 'Seq Scan') {
            console.log(`❌ SEQUENTIAL SCAN - No index used!`);
          }
          
          if (timeMatch) {
            console.log(`Execution Time: ${timeMatch[1]} ms`);
          }
          
          // Show first few lines of plan
          console.log('\nPlan excerpt:');
          console.log(planText.substring(0, 300) + '...');
        }
      } catch (error) {
        console.error(`Error executing test query: ${error}`);
      }
    }

    // Step 5: Edge cases
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 5: EDGE CASE ANALYSIS');
    console.log('-'.repeat(60));

    const edgeCases = [
      {
        name: 'NULL values in indexed columns',
        query: `SELECT count(*) FROM scraped_pages WHERE title IS NULL;`
      },
      {
        name: 'Empty JSONB metadata',
        query: `SELECT count(*) FROM scraped_pages WHERE metadata = '{}'::jsonb;`
      },
      {
        name: 'Very short trigram searches',
        query: `EXPLAIN SELECT * FROM scraped_pages WHERE title % 'DC' LIMIT 1;`
      },
      {
        name: 'Complex nested JSONB',
        query: `SELECT count(*) FROM scraped_pages WHERE metadata->'specs'->'dimensions'->>'width' IS NOT NULL;`
      }
    ];

    for (const edge of edgeCases) {
      console.log(`\n${edge.name}:`);
      try {
        const result = await executeSql(edge.query);
        if (Array.isArray(result) && result.length > 0) {
          console.log(`Result: ${JSON.stringify(result[0])}`);
        }
      } catch (error) {
        console.error(`Error: ${error}`);
      }
    }

    // Step 6: Redundancy check
    console.log('\n' + '='.repeat(80));
    console.log('PHASE 6: REDUNDANCY AND CONFLICT ANALYSIS');
    console.log('-'.repeat(60));

    const redundancyQuery = `
      SELECT 
        a.indexname as index1,
        b.indexname as index2,
        a.indexdef as def1,
        b.indexdef as def2
      FROM pg_indexes a
      JOIN pg_indexes b ON a.tablename = b.tablename
        AND a.schemaname = b.schemaname
        AND a.indexname < b.indexname
      WHERE a.tablename IN ('scraped_pages', 'page_embeddings')
        AND a.schemaname = 'public'
        AND (
          a.indexdef LIKE '%(' || b.indexdef || '%'
          OR b.indexdef LIKE '%(' || a.indexdef || '%'
        )
      LIMIT 10;
    `;

    try {
      const redundancyResult = await executeSql(redundancyQuery);
      if (Array.isArray(redundancyResult) && redundancyResult.length > 0) {
        console.log('⚠️ Potential redundant indexes found:');
        redundancyResult.forEach((r: any) => {
          console.log(`\n${r.index1} vs ${r.index2}`);
        });
      } else {
        console.log('✅ No obvious redundant indexes detected');
      }
    } catch (error) {
      console.log('Could not check for redundancy:', error);
    }

  } catch (error) {
    console.error('Investigation error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('FORENSIC INVESTIGATION COMPLETE');
  console.log('='.repeat(80));
}

// Run investigation
investigateIndexes().catch(console.error);