#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { searchSimilarContent, generateQueryEmbedding } from './lib/embeddings';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Test queries
const TEST_QUERIES = [
  { query: 'find pumps', category: 'general' },
  { query: 'check BP-001', category: 'specific_sku' },
  { query: 'hydraulic pumps', category: 'product_type' },
  { query: 'DC66-10P', category: 'part_code' },
  { query: 'pumps under 1000', category: 'price_query' },
  { query: 'agricultural equipment', category: 'category' },
  { query: 'show all products', category: 'broad' }
];

const TEST_DOMAIN = 'cifa.com';

interface PerformanceMetrics {
  query: string;
  category: string;
  embeddingTime: number;
  searchTime: number;
  totalTime: number;
  resultsCount: number;
  cacheHit: boolean;
  queryPlan?: any;
  indexesUsed?: string[];
}

async function analyzeQueryPlan(query: string, domainId: string): Promise<any> {
  try {
    // Analyze the query plan for the search_embeddings function
    const { data: plan } = await supabase.rpc('explain_analyze_search', {
      query_text: query,
      p_domain_id: domainId
    });
    
    if (!plan) {
      // Fallback to manual EXPLAIN ANALYZE
      const sqlQuery = `
        EXPLAIN ANALYZE 
        SELECT pe.*, sp.url, sp.title, sp.content
        FROM page_embeddings pe
        JOIN scraped_pages sp ON pe.page_id = sp.id
        WHERE sp.domain_id = $1
        LIMIT 10;
      `;
      
      const { data: manualPlan } = await supabase.rpc('execute_sql', {
        query: sqlQuery.replace('$1', `'${domainId}'`)
      });
      
      return manualPlan;
    }
    
    return plan;
  } catch (error) {
    console.warn('Could not analyze query plan:', error);
    return null;
  }
}

async function checkIndexes(): Promise<string[]> {
  try {
    const { data: indexes } = await supabase
      .from('pg_indexes')
      .select('tablename, indexname, indexdef')
      .or('tablename.eq.page_embeddings,tablename.eq.scraped_pages')
      .order('tablename');
    
    if (!indexes) return [];
    
    return indexes.map(idx => `${idx.tablename}.${idx.indexname}`);
  } catch (error) {
    console.warn('Could not fetch indexes:', error);
    return [];
  }
}

async function measureDatabaseQuery(query: string, domainId: string): Promise<number> {
  const start = performance.now();
  
  try {
    // Direct database query to measure raw performance
    const { data, error } = await supabase
      .from('scraped_pages')
      .select('url, title, content')
      .eq('domain_id', domainId)
      .ilike('content', `%${query}%`)
      .limit(50);
    
    const end = performance.now();
    return end - start;
  } catch (error) {
    console.error('Database query error:', error);
    return -1;
  }
}

async function measureEmbeddingSearch(query: string, domain: string): Promise<PerformanceMetrics> {
  // Clear any existing cache to get true performance
  const metrics: PerformanceMetrics = {
    query,
    category: TEST_QUERIES.find(q => q.query === query)?.category || 'unknown',
    embeddingTime: 0,
    searchTime: 0,
    totalTime: 0,
    resultsCount: 0,
    cacheHit: false
  };
  
  const totalStart = performance.now();
  
  // Measure embedding generation
  const embeddingStart = performance.now();
  try {
    await generateQueryEmbedding(query, true, domain);
    metrics.embeddingTime = performance.now() - embeddingStart;
  } catch (error) {
    console.error(`Embedding generation failed for "${query}":`, error);
    metrics.embeddingTime = -1;
  }
  
  // Measure search time
  const searchStart = performance.now();
  try {
    const results = await searchSimilarContent(query, domain, 50, 0.15);
    metrics.searchTime = performance.now() - searchStart;
    metrics.resultsCount = results.length;
    
    // Check if it was a cache hit (very fast response)
    metrics.cacheHit = metrics.searchTime < 50;
  } catch (error) {
    console.error(`Search failed for "${query}":`, error);
    metrics.searchTime = -1;
  }
  
  metrics.totalTime = performance.now() - totalStart;
  
  return metrics;
}

async function runPerformanceTests() {
  console.log('========================================');
  console.log('Database Query Performance Test Suite');
  console.log('========================================\n');
  
  // Get domain ID
  const { data: domainData } = await supabase
    .from('domains')
    .select('id')
    .eq('domain', TEST_DOMAIN)
    .single();
  
  if (!domainData) {
    console.error(`Domain ${TEST_DOMAIN} not found in database`);
    return;
  }
  
  const domainId = domainData.id;
  console.log(`Testing with domain: ${TEST_DOMAIN} (ID: ${domainId})\n`);
  
  // Check available indexes
  console.log('📊 Database Indexes:');
  const indexes = await checkIndexes();
  indexes.forEach(idx => console.log(`  - ${idx}`));
  console.log('');
  
  // Test each query
  const results: PerformanceMetrics[] = [];
  
  console.log('🔍 Running Performance Tests...\n');
  
  for (const testCase of TEST_QUERIES) {
    console.log(`Testing: "${testCase.query}" (${testCase.category})`);
    
    // Run the test 3 times and average (first is cold, others are warm)
    const runs: PerformanceMetrics[] = [];
    
    for (let i = 0; i < 3; i++) {
      const metrics = await measureEmbeddingSearch(testCase.query, TEST_DOMAIN);
      runs.push(metrics);
      
      if (i === 0) {
        console.log(`  Cold run: ${metrics.totalTime.toFixed(2)}ms (${metrics.resultsCount} results)`);
      }
    }
    
    // Calculate averages for warm runs
    const warmRuns = runs.slice(1);
    const avgMetrics: PerformanceMetrics = {
      ...runs[0],
      embeddingTime: warmRuns.reduce((sum, r) => sum + r.embeddingTime, 0) / warmRuns.length,
      searchTime: warmRuns.reduce((sum, r) => sum + r.searchTime, 0) / warmRuns.length,
      totalTime: warmRuns.reduce((sum, r) => sum + r.totalTime, 0) / warmRuns.length,
      resultsCount: runs[0].resultsCount
    };
    
    console.log(`  Warm avg: ${avgMetrics.totalTime.toFixed(2)}ms`);
    console.log(`  - Embedding: ${avgMetrics.embeddingTime.toFixed(2)}ms`);
    console.log(`  - Search: ${avgMetrics.searchTime.toFixed(2)}ms`);
    console.log(`  - Results: ${avgMetrics.resultsCount}`);
    console.log(`  - Cache Hit: ${avgMetrics.cacheHit ? 'Yes' : 'No'}\n`);
    
    results.push(avgMetrics);
  }
  
  // Summary statistics
  console.log('\n========================================');
  console.log('📈 Performance Summary');
  console.log('========================================\n');
  
  // Calculate aggregates
  const avgTotalTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;
  const avgEmbeddingTime = results.reduce((sum, r) => sum + r.embeddingTime, 0) / results.length;
  const avgSearchTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
  const totalResults = results.reduce((sum, r) => sum + r.resultsCount, 0);
  
  console.log(`Average Response Time: ${avgTotalTime.toFixed(2)}ms`);
  console.log(`  - Embedding Generation: ${avgEmbeddingTime.toFixed(2)}ms`);
  console.log(`  - Database Search: ${avgSearchTime.toFixed(2)}ms`);
  console.log(`Total Results Retrieved: ${totalResults}`);
  
  // Performance by category
  console.log('\nPerformance by Query Category:');
  const categories = [...new Set(results.map(r => r.category))];
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const avgTime = categoryResults.reduce((sum, r) => sum + r.totalTime, 0) / categoryResults.length;
    const avgResults = categoryResults.reduce((sum, r) => sum + r.resultsCount, 0) / categoryResults.length;
    console.log(`  ${category}: ${avgTime.toFixed(2)}ms (avg ${avgResults.toFixed(0)} results)`);
  }
  
  // Direct database query comparison
  console.log('\n🔬 Direct Database Query Comparison:');
  for (const testCase of TEST_QUERIES.slice(0, 3)) {
    const dbTime = await measureDatabaseQuery(testCase.query, domainId);
    const embeddingResult = results.find(r => r.query === testCase.query);
    if (embeddingResult && dbTime > 0) {
      const speedup = dbTime / embeddingResult.searchTime;
      console.log(`  "${testCase.query}": ${dbTime.toFixed(2)}ms vs ${embeddingResult.searchTime.toFixed(2)}ms (${speedup.toFixed(1)}x ${speedup > 1 ? 'faster' : 'slower'} with embeddings)`);
    }
  }
  
  // Cache performance
  console.log('\n💾 Cache Performance:');
  const cacheHits = results.filter(r => r.cacheHit).length;
  const cacheHitRate = (cacheHits / results.length) * 100;
  console.log(`  Cache Hit Rate: ${cacheHitRate.toFixed(0)}%`);
  console.log(`  Cache Hits: ${cacheHits}/${results.length}`);
  
  // Recommendations
  console.log('\n🎯 Performance Recommendations:');
  if (avgSearchTime > 500) {
    console.log('  ⚠️  Average search time exceeds 500ms - consider adding indexes');
  } else if (avgSearchTime > 200) {
    console.log('  ⚡ Search performance is moderate - could benefit from optimization');
  } else {
    console.log('  ✅ Search performance is good (<200ms average)');
  }
  
  if (avgEmbeddingTime > 1000) {
    console.log('  ⚠️  Embedding generation is slow - check OpenAI API latency');
  }
  
  if (cacheHitRate < 20) {
    console.log('  💡 Low cache hit rate - consider increasing cache TTL');
  }
  
  const avgResultsPerQuery = totalResults / results.length;
  if (avgResultsPerQuery < 5) {
    console.log('  ⚠️  Low result count - consider lowering similarity threshold');
  } else if (avgResultsPerQuery > 30) {
    console.log('  💡 High result count - consider raising similarity threshold for precision');
  }
}

// Run the tests
runPerformanceTests().catch(console.error);