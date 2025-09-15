#!/usr/bin/env node

/**
 * Comprehensive Performance Benchmark Script
 * Tests and measures the impact of database optimizations on real query performance
 */

import { createClient  } from '@supabase/supabase-js';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const ACCESS_TOKEN = 'sbp_3d1fa3086b18fbca507ee9b65042aa264395e1b8';

// Test configuration
const TEST_DOMAIN = 'thompsonseparts.co.uk';
const TEST_ITERATIONS = 5;
const CACHE_WARMUP_RUNS = 2;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Performance metrics collector
class PerformanceMetrics {
  constructor() {
    this.metrics = {};
  }

  record(name, duration, metadata = {}) {
    if (!this.metrics[name]) {
      this.metrics[name] = { times: [], metadata: [] };
    }
    this.metrics[name].times.push(duration);
    this.metrics[name].metadata.push(metadata);
  }

  getStats(name) {
    const times = this.metrics[name]?.times || [];
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: times.length
    };
  }

  summary() {
    const results = {};
    for (const [name, data] of Object.entries(this.metrics)) {
      results[name] = this.getStats(name);
    }
    return results;
  }
}

const metrics = new PerformanceMetrics();

// Direct SQL execution helper
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result);
          } else {
            reject(new Error(result.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Benchmark functions
async function benchmarkEmbeddingSearch(domain) {
  const testQueries = [
    'What products do you sell?',
    'shipping information',
    'return policy',
    'contact details',
    'payment methods accepted'
  ];
  
  console.log('\n📊 Testing Embedding Search Performance...');
  
  for (const query of testQueries) {
    // Test without cache (cold)
    await executeSQL(`DELETE FROM query_cache WHERE query_text = '${query}'`);
    
    const coldStart = performance.now();
    const coldResult = await supabase.rpc('search_content_optimized', {
      query_text: query,
      p_domain_id: domain,
      match_count: 5,
      use_hybrid: true
    });
    const coldTime = performance.now() - coldStart;
    metrics.record('embedding_search_cold', coldTime, { query, resultCount: coldResult.data?.length || 0 });
    
    // Test with cache (warm)
    const warmStart = performance.now();
    const warmResult = await supabase.rpc('search_content_optimized', {
      query_text: query,
      p_domain_id: domain,
      match_count: 5,
      use_hybrid: true
    });
    const warmTime = performance.now() - warmStart;
    metrics.record('embedding_search_warm', warmTime, { query, resultCount: warmResult.data?.length || 0 });
    
    console.log(`  Query: "${query.substring(0, 30)}..." - Cold: ${coldTime.toFixed(2)}ms, Warm: ${warmTime.toFixed(2)}ms`);
  }
}

async function benchmarkBulkOperations() {
  console.log('\n📊 Testing Bulk Operation Performance...');
  
  const testSizes = [1, 5, 10, 25, 50];
  
  for (const size of testSizes) {
    const pages = Array.from({ length: size }, (_, i) => ({
      url: `https://benchmark.test/page${i}`,
      title: `Benchmark Page ${i}`,
      content: `Test content for page ${i}`.repeat(100),
      status: 'completed'
    }));
    
    // Test single inserts
    const singleStart = performance.now();
    for (const page of pages) {
      await supabase.from('scraped_pages').upsert(page);
    }
    const singleTime = performance.now() - singleStart;
    metrics.record('single_upsert', singleTime / size, { batchSize: size });
    
    // Clean up
    await supabase.from('scraped_pages').delete().like('url', 'https://benchmark.test%');
    
    // Test bulk insert
    const bulkStart = performance.now();
    await supabase.rpc('bulk_upsert_scraped_pages', { pages });
    const bulkTime = performance.now() - bulkStart;
    metrics.record('bulk_upsert', bulkTime / size, { batchSize: size });
    
    const improvement = ((singleTime - bulkTime) / singleTime * 100).toFixed(1);
    console.log(`  Batch size ${size}: Single: ${(singleTime/size).toFixed(2)}ms/item, Bulk: ${(bulkTime/size).toFixed(2)}ms/item (${improvement}% faster)`);
    
    // Clean up
    await supabase.from('scraped_pages').delete().like('url', 'https://benchmark.test%');
  }
}

async function benchmarkChatAPI() {
  console.log('\n📊 Testing Chat API Performance...');
  
  const testMessages = [
    'Hello, what do you sell?',
    'Tell me about your shipping options',
    'I need help with my order #12345',
    'What are your business hours?',
    'How can I return a product?'
  ];
  
  for (const message of testMessages) {
    const start = performance.now();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: `benchmark-${Date.now()}`,
          domain: TEST_DOMAIN,
          config: {
            features: {
              websiteScraping: { enabled: true },
              woocommerce: { enabled: false }
            }
          }
        })
      });
      
      const data = await response.json();
      const duration = performance.now() - start;
      
      metrics.record('chat_api_response', duration, {
        message: message.substring(0, 30),
        hasResponse: !!data.message,
        sourceCount: data.sources?.length || 0
      });
      
      console.log(`  "${message.substring(0, 30)}..." - ${duration.toFixed(2)}ms (${data.sources?.length || 0} sources)`);
    } catch (error) {
      console.log(`  "${message.substring(0, 30)}..." - Error: ${error.message}`);
    }
  }
}

async function benchmarkQueryCache() {
  console.log('\n📊 Testing Query Cache Performance...');
  
  // Test cache hit rates
  const cacheKey = 'test_cache_' + Date.now();
  const testData = { results: Array(100).fill(0).map(() => ({ data: Math.random() })) };
  
  // Memory cache test
  const memWriteStart = performance.now();
  import { QueryCache  } from '../lib/query-cache.ts';
  QueryCache.setInMemory(cacheKey, testData, 60);
  const memWriteTime = performance.now() - memWriteStart;
  
  const memReadStart = performance.now();
  const memData = QueryCache.getFromMemory(cacheKey);
  const memReadTime = performance.now() - memReadStart;
  
  metrics.record('cache_memory_write', memWriteTime);
  metrics.record('cache_memory_read', memReadTime);
  
  console.log(`  Memory Cache - Write: ${memWriteTime.toFixed(2)}ms, Read: ${memReadTime.toFixed(2)}ms`);
  
  // Database cache test
  const domainId = 'test-domain-' + Date.now();
  
  const dbWriteStart = performance.now();
  await QueryCache.setInDb(supabase, domainId, cacheKey, 'test query', testData, 60);
  const dbWriteTime = performance.now() - dbWriteStart;
  
  const dbReadStart = performance.now();
  const dbData = await QueryCache.getFromDb(supabase, domainId, cacheKey);
  const dbReadTime = performance.now() - dbReadStart;
  
  metrics.record('cache_db_write', dbWriteTime);
  metrics.record('cache_db_read', dbReadTime);
  
  console.log(`  Database Cache - Write: ${dbWriteTime.toFixed(2)}ms, Read: ${dbReadTime.toFixed(2)}ms`);
  
  // Clean up
  await supabase.from('query_cache').delete().eq('domain_id', domainId);
  QueryCache.clearMemory(cacheKey);
}

async function checkIndexUsage() {
  console.log('\n📊 Analyzing Index Usage...');
  
  const indexQuery = `
    SELECT 
      t.tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as size,
      indexdef
    FROM pg_stat_user_indexes i
    JOIN pg_indexes pi ON i.indexname = pi.indexname
    WHERE i.schemaname = 'public'
    ORDER BY idx_scan DESC
    LIMIT 20;
  `;
  
  const result = await executeSQL(indexQuery);
  
  const unusedIndexes = result.filter(idx => idx.scans === 0);
  const heavilyUsed = result.filter(idx => idx.scans > 1000);
  
  console.log(`  Total indexes: ${result.length}`);
  console.log(`  Unused indexes: ${unusedIndexes.length}`);
  console.log(`  Heavily used (>1000 scans): ${heavilyUsed.length}`);
  
  if (unusedIndexes.length > 0) {
    console.log('\n  ⚠️  Unused indexes (consider removing):');
    unusedIndexes.forEach(idx => {
      console.log(`    - ${idx.indexname} on ${idx.tablename} (${idx.size})`);
    });
  }
  
  console.log('\n  📈 Most used indexes:');
  result.slice(0, 5).forEach(idx => {
    console.log(`    - ${idx.indexname}: ${idx.scans} scans (${idx.size})`);
  });
}

async function analyzeQueryPlans() {
  console.log('\n📊 Analyzing Query Execution Plans...');
  
  const queries = [
    {
      name: 'Embedding Search',
      sql: `EXPLAIN (ANALYZE, BUFFERS) 
            SELECT * FROM page_embeddings 
            WHERE domain_id = '${TEST_DOMAIN}' 
            ORDER BY embedding <-> '[0.1,0.2,0.3]' 
            LIMIT 5;`
    },
    {
      name: 'Content Search',
      sql: `EXPLAIN (ANALYZE, BUFFERS)
            SELECT * FROM scraped_pages
            WHERE domain = '${TEST_DOMAIN}'
            AND content_tsv @@ plainto_tsquery('english', 'test')
            LIMIT 10;`
    }
  ];
  
  for (const query of queries) {
    try {
      const result = await executeSQL(query.sql);
      const plan = result[0]?.['QUERY PLAN'] || result;
      
      // Parse execution time from plan
      const execTime = JSON.stringify(plan).match(/execution time: ([\d.]+)/i)?.[1];
      
      console.log(`\n  ${query.name}:`);
      console.log(`    Execution time: ${execTime || 'N/A'}ms`);
      
      // Check for sequential scans
      if (JSON.stringify(plan).includes('Seq Scan')) {
        console.log('    ⚠️  Sequential scan detected - missing index?');
      } else {
        console.log('    ✅ Using index scan');
      }
    } catch (error) {
      console.log(`  ${query.name}: Error - ${error.message}`);
    }
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📈 PERFORMANCE OPTIMIZATION REPORT');
  console.log('='.repeat(80));
  
  const summary = metrics.summary();
  
  console.log('\n🎯 KEY METRICS SUMMARY:');
  console.log('-'.repeat(80));
  
  // Calculate improvements
  const improvements = [];
  
  // Cache effectiveness
  if (summary.embedding_search_cold && summary.embedding_search_warm) {
    const cacheImprovement = ((summary.embedding_search_cold.avg - summary.embedding_search_warm.avg) / summary.embedding_search_cold.avg * 100).toFixed(1);
    improvements.push({
      metric: 'Cache Effectiveness',
      improvement: `${cacheImprovement}%`,
      details: `Cold: ${summary.embedding_search_cold.avg.toFixed(2)}ms → Warm: ${summary.embedding_search_warm.avg.toFixed(2)}ms`
    });
  }
  
  // Bulk operations
  if (summary.single_upsert && summary.bulk_upsert) {
    const bulkImprovement = ((summary.single_upsert.avg - summary.bulk_upsert.avg) / summary.single_upsert.avg * 100).toFixed(1);
    improvements.push({
      metric: 'Bulk Operations',
      improvement: `${bulkImprovement}%`,
      details: `Single: ${summary.single_upsert.avg.toFixed(2)}ms → Bulk: ${summary.bulk_upsert.avg.toFixed(2)}ms per item`
    });
  }
  
  // Memory vs DB cache
  if (summary.cache_memory_read && summary.cache_db_read) {
    const cacheSpeedup = (summary.cache_db_read.avg / summary.cache_memory_read.avg).toFixed(1);
    improvements.push({
      metric: 'Memory Cache Speed',
      improvement: `${cacheSpeedup}x faster`,
      details: `Memory: ${summary.cache_memory_read.avg.toFixed(2)}ms, DB: ${summary.cache_db_read.avg.toFixed(2)}ms`
    });
  }
  
  improvements.forEach(imp => {
    console.log(`\n  ${imp.metric}:`);
    console.log(`    Improvement: ${imp.improvement}`);
    console.log(`    ${imp.details}`);
  });
  
  console.log('\n📊 DETAILED METRICS:');
  console.log('-'.repeat(80));
  
  for (const [name, stats] of Object.entries(summary)) {
    if (stats) {
      console.log(`\n  ${name.replace(/_/g, ' ').toUpperCase()}:`);
      console.log(`    Min: ${stats.min.toFixed(2)}ms`);
      console.log(`    Avg: ${stats.avg.toFixed(2)}ms`);
      console.log(`    Median: ${stats.median.toFixed(2)}ms`);
      console.log(`    P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`    P99: ${stats.p99.toFixed(2)}ms`);
      console.log(`    Max: ${stats.max.toFixed(2)}ms`);
    }
  }
  
  console.log('\n🚀 OPTIMIZATION RECOMMENDATIONS:');
  console.log('-'.repeat(80));
  
  const recommendations = [];
  
  // Check chat API performance
  if (summary.chat_api_response?.avg > 2000) {
    recommendations.push('⚠️  Chat API responses > 2s - Consider optimizing OpenAI calls or reducing context size');
  }
  
  // Check cache hit rates
  if (summary.embedding_search_warm && summary.embedding_search_cold) {
    const cacheRatio = summary.embedding_search_warm.avg / summary.embedding_search_cold.avg;
    if (cacheRatio > 0.8) {
      recommendations.push('⚠️  Cache not providing significant speedup - Check cache implementation');
    }
  }
  
  // Check bulk operations
  if (summary.bulk_upsert?.avg > summary.single_upsert?.avg) {
    recommendations.push('⚠️  Bulk operations slower than single - Review bulk_upsert_scraped_pages function');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ All metrics within acceptable ranges');
    recommendations.push('✅ Caching is effective (>20% improvement)');
    recommendations.push('✅ Bulk operations are optimized');
  }
  
  recommendations.forEach(rec => console.log(`  ${rec}`));
  
  // Save detailed report
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: improvements,
    metrics: summary,
    recommendations
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  console.log('🚀 Starting Comprehensive Performance Benchmark');
  console.log('=' .repeat(80));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Test Domain: ${TEST_DOMAIN}`);
  console.log(`🔄 Iterations: ${TEST_ITERATIONS}`);
  console.log('=' .repeat(80));
  
  try {
    // Get domain ID for testing
    const { data: domainData } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', TEST_DOMAIN)
      .single();
    
    const domainId = domainData?.id;
    
    if (!domainId) {
      console.log(`⚠️  Domain ${TEST_DOMAIN} not found in database`);
    }
    
    // Run benchmarks
    await benchmarkEmbeddingSearch(domainId);
    await benchmarkBulkOperations();
    await benchmarkQueryCache();
    await benchmarkChatAPI();
    
    // Analyze database
    await checkIndexUsage();
    await analyzeQueryPlans();
    
    // Generate report
    await generateReport();
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main, metrics };;