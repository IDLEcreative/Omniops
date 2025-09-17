#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test queries
const TEST_QUERIES = [
  'pumps',
  'DC66-10P', 
  'hydraulic',
  'agricultural'
];

interface QueryMetrics {
  query: string;
  withIndex: number;
  withoutIndex: number;
  improvement: string;
  resultCount: number;
}

async function testWithIndex(query: string, domainId: string): Promise<{ time: number; count: number }> {
  const start = performance.now();
  
  // Test using indexed columns
  const { data, error } = await supabase
    .from('scraped_pages')
    .select('id, url, title')
    .eq('domain_id', domainId)
    .or(`title.ilike.%${query}%,url.ilike.%${query}%`)
    .limit(50);
  
  const time = performance.now() - start;
  return { time, count: data?.length || 0 };
}

async function testWithoutIndex(query: string, domainId: string): Promise<{ time: number; count: number }> {
  const start = performance.now();
  
  // Test using non-indexed content column
  const { data, error } = await supabase
    .from('scraped_pages')
    .select('id, url, title')
    .eq('domain_id', domainId)
    .ilike('content', `%${query}%`)
    .limit(50);
  
  const time = performance.now() - start;
  return { time, count: data?.length || 0 };
}

async function testEmbeddingSearch(query: string, domainId: string): Promise<{ time: number; count: number }> {
  const start = performance.now();
  
  try {
    // Generate a simple embedding (mock for testing)
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random());
    
    // Test using the search_embeddings RPC function
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: mockEmbedding,
      p_domain_id: domainId,
      match_threshold: 0.15,
      match_count: 50
    });
    
    const time = performance.now() - start;
    return { time, count: data?.length || 0 };
  } catch (error) {
    console.error('Embedding search failed:', error);
    return { time: -1, count: 0 };
  }
}

async function checkIndexes(): Promise<void> {
  console.log('📊 Checking Database Indexes...\n');
  
  try {
    // Check for indexes on scraped_pages
    const { data: indexes } = await supabase
      .rpc('execute_sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE tablename IN ('scraped_pages', 'page_embeddings', 'domains')
          ORDER BY tablename, indexname;
        `
      });
  
    if (indexes) {
      console.log('Found indexes:');
      indexes.forEach((idx: any) => {
        console.log(`  - ${idx.tablename}.${idx.indexname}`);
      });
    }
  } catch (error) {
    console.log('Could not fetch indexes via RPC');
    
    // Fallback: try direct query
    try {
      const { data: tableInfo } = await supabase
        .from('scraped_pages')
        .select('id')
        .limit(1);
      
      if (tableInfo) {
        console.log('Database connection is working');
      }
    } catch (e) {
      console.log('Database connection issue:', e);
    }
  }
  console.log('');
}

async function createTestIndexes(domainId: string): Promise<void> {
  console.log('🔧 Creating Performance Indexes...\n');
  
  const indexes = [
    {
      name: 'idx_scraped_pages_domain_title',
      sql: 'CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_title ON scraped_pages(domain_id, title);'
    },
    {
      name: 'idx_scraped_pages_domain_url',
      sql: 'CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_url ON scraped_pages(domain_id, url);'
    },
    {
      name: 'idx_scraped_pages_title_trgm',
      sql: 'CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_trgm ON scraped_pages USING gin(title gin_trgm_ops);'
    },
    {
      name: 'idx_page_embeddings_page_id',
      sql: 'CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id ON page_embeddings(page_id);'
    }
  ];
  
  for (const index of indexes) {
    try {
      await supabase.rpc('execute_sql', { query: index.sql });
      console.log(`  ✅ Created/verified: ${index.name}`);
    } catch (error) {
      console.log(`  ⚠️  Failed to create ${index.name}:`, error);
    }
  }
  console.log('');
}

async function runPerformanceTests() {
  console.log('========================================');
  console.log('Database Search Performance Analysis');
  console.log('========================================\n');
  
  // First, find a test domain
  const { data: domains } = await supabase
    .from('domains')
    .select('id, domain')
    .limit(5);
  
  if (!domains || domains.length === 0) {
    console.log('❌ No domains found in database');
    console.log('\nCreating test data...');
    
    // Insert test domain
    const { data: newDomain } = await supabase
      .from('domains')
      .insert({ domain: 'test.example.com' })
      .select()
      .single();
    
    if (!newDomain) {
      console.error('Failed to create test domain');
      return;
    }
    
    // Insert test pages
    const testPages = [];
    for (let i = 0; i < 100; i++) {
      testPages.push({
        domain_id: newDomain.id,
        url: `https://test.example.com/product-${i}`,
        title: `Product ${i} - ${i % 10 === 0 ? 'Hydraulic Pump' : i % 5 === 0 ? 'Agricultural Equipment' : 'Item'}`,
        content: `This is test content for product ${i}. Keywords: pump, hydraulic, agricultural, DC66-10P`,
        scraped_at: new Date().toISOString()
      });
    }
    
    await supabase.from('scraped_pages').insert(testPages);
    console.log('✅ Created test data\n');
  }
  
  const testDomain = domains?.[0] || { id: 'test-id', domain: 'test.example.com' };
  console.log(`Testing with domain: ${testDomain.domain} (ID: ${testDomain.id})\n`);
  
  // Check current indexes
  await checkIndexes();
  
  // Create performance indexes if needed
  await createTestIndexes(testDomain.id);
  
  // Run performance tests
  console.log('🔍 Running Query Performance Tests...\n');
  
  const results: QueryMetrics[] = [];
  
  for (const query of TEST_QUERIES) {
    console.log(`Testing query: "${query}"`);
    
    // Warm-up queries
    await testWithIndex(query, testDomain.id);
    await testWithoutIndex(query, testDomain.id);
    
    // Actual measurements (average of 3 runs)
    let indexedTimes = [];
    let nonIndexedTimes = [];
    let resultCount = 0;
    
    for (let i = 0; i < 3; i++) {
      const indexed = await testWithIndex(query, testDomain.id);
      const nonIndexed = await testWithoutIndex(query, testDomain.id);
      
      indexedTimes.push(indexed.time);
      nonIndexedTimes.push(nonIndexed.time);
      resultCount = Math.max(indexed.count, nonIndexed.count);
    }
    
    const avgIndexed = indexedTimes.reduce((a, b) => a + b, 0) / indexedTimes.length;
    const avgNonIndexed = nonIndexedTimes.reduce((a, b) => a + b, 0) / nonIndexedTimes.length;
    const improvement = avgNonIndexed > 0 ? ((avgNonIndexed - avgIndexed) / avgNonIndexed * 100).toFixed(1) : '0';
    
    results.push({
      query,
      withIndex: avgIndexed,
      withoutIndex: avgNonIndexed,
      improvement: `${improvement}%`,
      resultCount
    });
    
    console.log(`  With Index: ${avgIndexed.toFixed(2)}ms`);
    console.log(`  Without Index: ${avgNonIndexed.toFixed(2)}ms`);
    console.log(`  Improvement: ${improvement}% faster`);
    console.log(`  Results: ${resultCount}\n`);
  }
  
  // Test embedding search
  console.log('Testing Embedding Search...');
  const embeddingResults = [];
  for (const query of TEST_QUERIES.slice(0, 2)) {
    const result = await testEmbeddingSearch(query, testDomain.id);
    embeddingResults.push(result);
    console.log(`  "${query}": ${result.time.toFixed(2)}ms (${result.count} results)`);
  }
  
  // Summary
  console.log('\n========================================');
  console.log('📈 Performance Summary');
  console.log('========================================\n');
  
  const avgImprovement = results
    .map(r => parseFloat(r.improvement))
    .reduce((a, b) => a + b, 0) / results.length;
  
  console.log(`Average Query Improvement with Indexes: ${avgImprovement.toFixed(1)}%`);
  
  const avgIndexedTime = results.reduce((a, b) => a + b.withIndex, 0) / results.length;
  const avgNonIndexedTime = results.reduce((a, b) => a + b.withoutIndex, 0) / results.length;
  
  console.log(`Average Indexed Query Time: ${avgIndexedTime.toFixed(2)}ms`);
  console.log(`Average Non-Indexed Query Time: ${avgNonIndexedTime.toFixed(2)}ms`);
  
  // Performance grading
  console.log('\n🎯 Performance Grade:');
  if (avgIndexedTime < 50) {
    console.log('  ✅ EXCELLENT - Queries under 50ms');
  } else if (avgIndexedTime < 200) {
    console.log('  ⚡ GOOD - Queries under 200ms');
  } else if (avgIndexedTime < 500) {
    console.log('  ⚠️  MODERATE - Consider optimization');
  } else {
    console.log('  ❌ POOR - Optimization needed');
  }
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  if (avgImprovement < 20) {
    console.log('  - Indexes are not providing significant benefit');
    console.log('  - Consider reviewing query patterns');
  }
  
  if (avgIndexedTime > 200) {
    console.log('  - Add compound indexes for common query patterns');
    console.log('  - Consider partitioning large tables');
    console.log('  - Review database connection pooling');
  }
  
  const totalResults = results.reduce((a, b) => a + b.resultCount, 0);
  if (totalResults / results.length > 30) {
    console.log('  - High result counts - consider pagination');
    console.log('  - Add more selective filters to queries');
  }
}

// Run the tests
runPerformanceTests().catch(console.error);