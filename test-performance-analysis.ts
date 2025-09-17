#!/usr/bin/env npx tsx
/**
 * Performance Analysis Tool for Intelligent Chat System
 * Identifies bottlenecks and measures search performance
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

// Performance monitoring class
class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Array<{ name: string; duration: number; details?: any }> = [];

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const startTime = this.marks.get(startMark);
    const endTime = endMark ? this.marks.get(endMark) : performance.now();
    
    if (!startTime) return;
    
    const duration = endTime ? endTime - startTime : performance.now() - startTime;
    this.measures.push({ name, duration });
    return duration;
  }

  addMeasure(name: string, duration: number, details?: any) {
    this.measures.push({ name, duration, details });
  }

  getReport() {
    const sorted = [...this.measures].sort((a, b) => b.duration - a.duration);
    const total = this.measures.reduce((sum, m) => sum + m.duration, 0);
    
    return {
      total,
      measures: sorted,
      bottlenecks: sorted.filter(m => m.duration > total * 0.2), // > 20% of total time
    };
  }
}

// Direct embedding search test
async function testDirectEmbeddingSearch(query: string, domain: string) {
  const monitor = new PerformanceMonitor();
  console.log(`\n🔍 Testing Direct Embedding Search: "${query}"`);
  console.log('━'.repeat(60));
  
  try {
    // Import the embeddings module
    monitor.mark('import_start');
    const { searchSimilarContent, generateQueryEmbedding } = await import('./lib/embeddings');
    monitor.measure('Module Import', 'import_start');
    
    // Test query embedding generation
    monitor.mark('embedding_start');
    await generateQueryEmbedding(query, true, domain);
    const embeddingTime = monitor.measure('Query Embedding', 'embedding_start');
    console.log(`✓ Query embedding generated in ${embeddingTime.toFixed(2)}ms`);
    
    // Test search with different limits and thresholds
    const searchTests = [
      { limit: 5, threshold: 0.15, name: 'Standard Search (5 results)' },
      { limit: 10, threshold: 0.15, name: 'Extended Search (10 results)' },
      { limit: 20, threshold: 0.10, name: 'Broad Search (20 results, lower threshold)' },
    ];
    
    for (const test of searchTests) {
      monitor.mark(`search_${test.name}_start`);
      const results = await searchSimilarContent(query, domain, test.limit, test.threshold);
      const searchTime = monitor.measure(test.name, `search_${test.name}_start`);
      
      console.log(`\n📊 ${test.name}:`);
      console.log(`  • Time: ${searchTime.toFixed(2)}ms`);
      console.log(`  • Results found: ${results.length}`);
      console.log(`  • Average similarity: ${(results.reduce((sum, r) => sum + r.similarity, 0) / results.length || 0).toFixed(3)}`);
      
      if (results.length > 0) {
        console.log(`  • Top result: ${results[0].title} (${(results[0].similarity * 100).toFixed(1)}%)`);
      }
      
      monitor.addMeasure(test.name, searchTime, {
        resultCount: results.length,
        limit: test.limit,
        threshold: test.threshold
      });
    }
    
    // Test parallel searches (simulating what the intelligent route does)
    console.log('\n🚀 Testing Parallel Search Execution...');
    monitor.mark('parallel_start');
    
    const parallelQueries = [
      searchSimilarContent('Cifa pumps', domain, 8, 0.15),
      searchSimilarContent('hydraulic systems', domain, 6, 0.15),
      searchSimilarContent('mixer pump specifications', domain, 5, 0.3),
    ];
    
    const parallelResults = await Promise.all(parallelQueries);
    const parallelTime = monitor.measure('Parallel Search (3 queries)', 'parallel_start');
    
    console.log(`✓ Parallel execution completed in ${parallelTime.toFixed(2)}ms`);
    console.log(`  • Total results: ${parallelResults.reduce((sum, r) => sum + r.length, 0)}`);
    console.log(`  • Average time per query: ${(parallelTime / 3).toFixed(2)}ms`);
    
    return monitor;
    
  } catch (error) {
    console.error('❌ Error in direct search test:', error);
    return monitor;
  }
}

// Test the intelligent chat API
async function testIntelligentChatAPI(query: string, domain: string) {
  const monitor = new PerformanceMonitor();
  console.log(`\n🤖 Testing Intelligent Chat API: "${query}"`);
  console.log('━'.repeat(60));
  
  const API_URL = 'http://localhost:3000/api/chat-intelligent';
  
  try {
    monitor.mark('api_start');
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: uuidv4(),
        domain: domain,
        config: {
          ai: {
            maxSearchIterations: 3,
            searchTimeout: 15000  // 15 second timeout per search
          },
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
    });
    
    const apiTime = monitor.measure('API Response', 'api_start');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    console.log(`✓ API responded in ${apiTime.toFixed(2)}ms`);
    
    // Analyze search metadata
    if (data.searchMetadata) {
      console.log(`\n📊 Search Metadata:`);
      console.log(`  • Iterations: ${data.searchMetadata.iterations}`);
      console.log(`  • Total searches: ${data.searchMetadata.totalSearches}`);
      
      if (data.searchMetadata.searchLog) {
        console.log(`\n  Search breakdown:`);
        data.searchMetadata.searchLog.forEach((log: any, i: number) => {
          console.log(`    ${i + 1}. ${log.tool}: "${log.query}"`);
          console.log(`       → ${log.resultCount} results from ${log.source}`);
        });
      }
    }
    
    monitor.addMeasure('API Total Response', apiTime, {
      searches: data.searchMetadata?.totalSearches || 0,
      iterations: data.searchMetadata?.iterations || 0,
      sources: data.sources?.length || 0
    });
    
    return monitor;
    
  } catch (error) {
    console.error('❌ Error in API test:', error);
    return monitor;
  }
}

// Database query performance test
async function testDatabasePerformance(domain: string) {
  const monitor = new PerformanceMonitor();
  console.log(`\n🗄️ Testing Database Query Performance`);
  console.log('━'.repeat(60));
  
  try {
    const { createServiceRoleClient } = await import('./lib/supabase-server');
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      console.error('❌ Failed to create Supabase client');
      return monitor;
    }
    
    // Test domain lookup
    monitor.mark('domain_lookup_start');
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', domain.replace('www.', ''))
      .single();
    const domainTime = monitor.measure('Domain Lookup', 'domain_lookup_start');
    console.log(`✓ Domain lookup: ${domainTime.toFixed(2)}ms`);
    
    if (!domainData) {
      console.error('❌ Domain not found in database');
      return monitor;
    }
    
    // Test various database queries
    const queries = [
      {
        name: 'Count scraped pages',
        query: async () => await supabase
          .from('scraped_pages')
          .select('id', { count: 'exact', head: true })
          .eq('domain_id', domainData.id)
      },
      {
        name: 'Count embeddings',
        query: async () => await supabase
          .from('page_embeddings')
          .select('id', { count: 'exact', head: true })
          .limit(1)
      },
      {
        name: 'Keyword search (ILIKE)',
        query: async () => await supabase
          .from('scraped_pages')
          .select('url, title')
          .eq('domain_id', domainData.id)
          .ilike('content', '%cifa%')
          .limit(10)
      },
      {
        name: 'Metadata search',
        query: async () => await supabase
          .from('scraped_pages')
          .select('url, title, metadata')
          .eq('domain_id', domainData.id)
          .not('metadata', 'is', null)
          .limit(20)
      }
    ];
    
    for (const test of queries) {
      monitor.mark(`${test.name}_start`);
      const result = await test.query();
      const queryTime = monitor.measure(test.name, `${test.name}_start`);
      
      const count = result.count || (Array.isArray(result.data) ? result.data.length : 0);
      console.log(`✓ ${test.name}: ${queryTime.toFixed(2)}ms (${count} results)`);
      
      monitor.addMeasure(test.name, queryTime, { count });
    }
    
    // Test RPC function if available
    monitor.mark('rpc_test_start');
    try {
      // Generate a simple test embedding (zeros)
      const testEmbedding = new Array(1536).fill(0);
      
      const { data, error } = await supabase.rpc('search_embeddings', {
        query_embedding: testEmbedding,
        p_domain_id: domainData.id,
        match_threshold: 0.15,
        match_count: 5,
      });
      
      const rpcTime = monitor.measure('RPC search_embeddings', 'rpc_test_start');
      
      if (error) {
        console.log(`⚠️ RPC function error: ${error.message}`);
      } else {
        console.log(`✓ RPC search_embeddings: ${rpcTime.toFixed(2)}ms (${data?.length || 0} results)`);
      }
    } catch (rpcError) {
      console.log(`⚠️ RPC function not available: ${rpcError}`);
    }
    
    return monitor;
    
  } catch (error) {
    console.error('❌ Error in database test:', error);
    return monitor;
  }
}

// Main performance analysis
async function main() {
  console.log('🚀 PERFORMANCE ANALYSIS TOOL');
  console.log('═'.repeat(60));
  console.log('Analyzing search performance bottlenecks');
  console.log('═'.repeat(60));
  
  const domain = 'thompsonseparts.co.uk';
  const testQueries = [
    'Cifa products',
    'hydraulic pumps',
    'water systems',
    'DC66-10P Agri Flip pump'
  ];
  
  const allMonitors: Array<{ name: string; monitor: PerformanceMonitor }> = [];
  
  // Test database performance first
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 1: DATABASE PERFORMANCE');
  console.log('═'.repeat(60));
  const dbMonitor = await testDatabasePerformance(domain);
  allMonitors.push({ name: 'Database', monitor: dbMonitor });
  
  // Test direct embedding searches
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 2: DIRECT EMBEDDING SEARCH');
  console.log('═'.repeat(60));
  
  for (const query of testQueries) {
    const monitor = await testDirectEmbeddingSearch(query, domain);
    allMonitors.push({ name: `Direct: ${query}`, monitor });
    
    // Brief pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test API calls
  console.log('\n' + '═'.repeat(60));
  console.log('PHASE 3: INTELLIGENT CHAT API');
  console.log('═'.repeat(60));
  
  for (const query of testQueries.slice(0, 2)) { // Test fewer to avoid rate limits
    const monitor = await testIntelligentChatAPI(query, domain);
    allMonitors.push({ name: `API: ${query}`, monitor });
    
    // Longer pause for API tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Generate final report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 PERFORMANCE ANALYSIS REPORT');
  console.log('═'.repeat(60));
  
  // Identify bottlenecks
  console.log('\n🔥 IDENTIFIED BOTTLENECKS:');
  const bottlenecks: Array<{ test: string; operation: string; duration: number }> = [];
  
  allMonitors.forEach(({ name, monitor }) => {
    const report = monitor.getReport();
    report.bottlenecks.forEach(b => {
      bottlenecks.push({
        test: name,
        operation: b.name,
        duration: b.duration
      });
    });
  });
  
  bottlenecks
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10)
    .forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.operation} (${b.test}): ${b.duration.toFixed(2)}ms`);
    });
  
  // Performance recommendations
  console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
  
  const avgSearchTime = bottlenecks
    .filter(b => b.operation.includes('Search'))
    .reduce((sum, b) => sum + b.duration, 0) / 
    bottlenecks.filter(b => b.operation.includes('Search')).length || 0;
  
  if (avgSearchTime > 5000) {
    console.log('  ⚠️ CRITICAL: Search operations averaging > 5 seconds');
    console.log('  → Implement more aggressive caching');
    console.log('  → Reduce embedding dimension size');
    console.log('  → Add database query timeouts');
  } else if (avgSearchTime > 2000) {
    console.log('  ⚠️ WARNING: Search operations averaging > 2 seconds');
    console.log('  → Consider implementing result pre-warming');
    console.log('  → Optimize database indexes');
  } else {
    console.log('  ✅ Search performance is acceptable (< 2s average)');
  }
  
  const hasRPCIssues = bottlenecks.some(b => b.operation.includes('RPC'));
  if (hasRPCIssues) {
    console.log('  ⚠️ RPC function performance issues detected');
    console.log('  → Check pgvector extension configuration');
    console.log('  → Consider fallback to keyword search');
  }
  
  const hasParallelIssues = bottlenecks.some(b => b.operation.includes('Parallel'));
  if (!hasParallelIssues) {
    console.log('  ✅ Parallel execution is working efficiently');
  } else {
    console.log('  ⚠️ Parallel execution bottleneck detected');
    console.log('  → Reduce concurrent query count');
    console.log('  → Implement query queuing');
  }
  
  // Target performance metrics
  console.log('\n🎯 TARGET METRICS:');
  console.log('  • Query embedding generation: < 100ms');
  console.log('  • Single search operation: < 2000ms');
  console.log('  • Parallel search (3 queries): < 3000ms');
  console.log('  • Full API response: < 10000ms');
  console.log('  • Database queries: < 500ms each');
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ PERFORMANCE ANALYSIS COMPLETE');
  console.log('═'.repeat(60));
}

// Run performance analysis
console.log('🚀 Starting Performance Analysis...\n');
main()
  .then(() => {
    console.log('\n✅ Analysis completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });