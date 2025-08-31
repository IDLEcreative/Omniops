#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'birugqyuqhiahxvxeyqg';
const ACCESS_TOKEN = 'sbp_3d1fa3086b18fbca507ee9b65042aa264395e1b8';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

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

async function getIndexUsage() {
  const sql = `
    SELECT 
      tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) AS size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('scraped_pages', 'page_embeddings')
    ORDER BY idx_scan DESC;
  `;
  
  return executeSQL(sql);
}

async function getTableStats() {
  const sql = `
    SELECT 
      schemaname,
      tablename,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows,
      ROUND(n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0) * 100, 2) as dead_pct,
      last_vacuum,
      last_analyze,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('scraped_pages', 'page_embeddings', 'customer_configs')
    ORDER BY n_live_tup DESC;
  `;
  
  return executeSQL(sql);
}

async function getSlowQueries() {
  // Note: Requires pg_stat_statements extension
  const sql = `
    SELECT 
      substring(query, 1, 100) AS query_preview,
      calls,
      ROUND(total_exec_time::numeric, 2) as total_time_ms,
      ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
      ROUND(max_exec_time::numeric, 2) as max_time_ms,
      rows
    FROM pg_stat_statements
    WHERE query NOT LIKE '%pg_stat_statements%'
    AND query NOT LIKE '%pg_stat%'
    AND mean_exec_time > 50
    ORDER BY mean_exec_time DESC
    LIMIT 10;
  `;
  
  try {
    return await executeSQL(sql);
  } catch (error) {
    if (error.message?.includes('pg_stat_statements')) {
      console.log('⚠️  pg_stat_statements extension not available');
      return null;
    }
    throw error;
  }
}

async function getCacheHitRatio() {
  const sql = `
    SELECT 
      ROUND(
        100.0 * sum(heap_blks_hit) / 
        NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 
        2
      ) AS cache_hit_ratio
    FROM pg_statio_user_tables;
  `;
  
  return executeSQL(sql);
}

async function benchmarkOperations() {
  console.log('\n⚡ Running Performance Benchmarks...');
  console.log('-' .repeat(60));
  
  const benchmarks = [];
  
  // Test 1: Single page upsert (old method)
  const singleStart = performance.now();
  await supabase.from('scraped_pages').upsert({
    url: 'https://benchmark.test/single',
    title: 'Benchmark Single',
    content: 'Test content',
    status: 'completed'
  });
  const singleTime = performance.now() - singleStart;
  benchmarks.push({ operation: 'Single Page Upsert', time: singleTime.toFixed(2) + 'ms' });
  
  // Test 2: Bulk upsert (new method)
  const bulkStart = performance.now();
  await supabase.rpc('bulk_upsert_scraped_pages', {
    pages: [
      { url: 'https://benchmark.test/bulk1', title: 'Bulk 1', content: 'Test', status: 'completed' },
      { url: 'https://benchmark.test/bulk2', title: 'Bulk 2', content: 'Test', status: 'completed' },
      { url: 'https://benchmark.test/bulk3', title: 'Bulk 3', content: 'Test', status: 'completed' }
    ]
  });
  const bulkTime = performance.now() - bulkStart;
  benchmarks.push({ 
    operation: 'Bulk Upsert (3 pages)', 
    time: bulkTime.toFixed(2) + 'ms',
    perItem: (bulkTime / 3).toFixed(2) + 'ms/page'
  });
  
  // Test 3: Vector search
  const searchStart = performance.now();
  await supabase.rpc('search_embeddings', {
    query_embedding: Array(1536).fill(0).map(() => Math.random()),
    match_threshold: 0.7,
    match_count: 5
  });
  const searchTime = performance.now() - searchStart;
  benchmarks.push({ operation: 'Vector Search', time: searchTime.toFixed(2) + 'ms' });
  
  // Cleanup
  await supabase.from('scraped_pages')
    .delete()
    .like('url', 'https://benchmark.test%');
  
  return benchmarks;
}

async function monitorPerformance() {
  console.log('🔍 Performance Monitoring Dashboard');
  console.log('=' .repeat(60));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));
  
  // Index Usage
  console.log('\n📊 Index Usage Statistics:');
  console.log('-' .repeat(60));
  const indexStats = await getIndexUsage();
  if (indexStats && indexStats.length > 0) {
    indexStats.forEach(idx => {
      console.log(`  ${idx.indexname}`);
      console.log(`    Scans: ${idx.scans || 0} | Size: ${idx.size}`);
      console.log(`    Efficiency: ${idx.tuples_fetched > 0 ? 
        ((idx.tuples_fetched / idx.tuples_read * 100).toFixed(2) + '%') : 'N/A'}`);
    });
  }
  
  // Table Statistics
  console.log('\n📈 Table Health:');
  console.log('-' .repeat(60));
  const tableStats = await getTableStats();
  if (tableStats && tableStats.length > 0) {
    tableStats.forEach(tbl => {
      console.log(`  ${tbl.tablename}:`);
      console.log(`    Rows: ${Number(tbl.live_rows).toLocaleString()} | Dead: ${tbl.dead_pct || 0}%`);
      console.log(`    Size: ${tbl.total_size}`);
      console.log(`    Last VACUUM: ${tbl.last_vacuum || 'Never'}`);
      console.log(`    Last ANALYZE: ${tbl.last_analyze || 'Never'}`);
    });
  }
  
  // Cache Hit Ratio
  console.log('\n💾 Cache Performance:');
  console.log('-' .repeat(60));
  const cacheStats = await getCacheHitRatio();
  if (cacheStats && cacheStats.length > 0) {
    console.log(`  Cache Hit Ratio: ${cacheStats[0].cache_hit_ratio || 0}%`);
    const ratio = parseFloat(cacheStats[0].cache_hit_ratio || 0);
    if (ratio < 90) {
      console.log('  ⚠️  Consider increasing shared_buffers');
    } else if (ratio > 99) {
      console.log('  ✅ Excellent cache performance');
    } else {
      console.log('  ✅ Good cache performance');
    }
  }
  
  // Slow Queries
  console.log('\n🐌 Slow Query Analysis:');
  console.log('-' .repeat(60));
  const slowQueries = await getSlowQueries();
  if (slowQueries && slowQueries.length > 0) {
    slowQueries.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.query_preview}...`);
      console.log(`     Calls: ${q.calls} | Avg: ${q.avg_time_ms}ms | Max: ${q.max_time_ms}ms`);
    });
  } else if (slowQueries === null) {
    console.log('  Enable pg_stat_statements for query analysis');
  } else {
    console.log('  ✅ No slow queries detected (>50ms avg)');
  }
  
  // Benchmarks
  const benchmarks = await benchmarkOperations();
  console.log('\n' .repeat(1));
  benchmarks.forEach(b => {
    console.log(`  ${b.operation}: ${b.time}`);
    if (b.perItem) console.log(`    Per item: ${b.perItem}`);
  });
  
  // Summary & Recommendations
  console.log('\n' + '=' .repeat(60));
  console.log('📋 Performance Summary:');
  console.log('=' .repeat(60));
  
  const improvements = [];
  
  // Check if HNSW index is being used
  const hnswIndex = indexStats?.find(i => i.indexname.includes('hnsw'));
  if (hnswIndex && hnswIndex.scans > 0) {
    improvements.push('✅ HNSW index is active and being used');
  } else {
    improvements.push('⚠️  HNSW index not being utilized - check vector search queries');
  }
  
  // Check bulk operations
  if (benchmarks.find(b => b.operation.includes('Bulk'))) {
    const singleTime = parseFloat(benchmarks.find(b => b.operation.includes('Single'))?.time || '0');
    const bulkPerItem = parseFloat(benchmarks.find(b => b.operation.includes('Bulk'))?.perItem || '0');
    const improvement = ((singleTime - bulkPerItem) / singleTime * 100).toFixed(0);
    improvements.push(`✅ Bulk operations ${improvement}% faster than single operations`);
  }
  
  // Check table bloat
  const bloatedTables = tableStats?.filter(t => parseFloat(t.dead_pct || 0) > 10);
  if (bloatedTables?.length > 0) {
    improvements.push(`⚠️  Tables need VACUUM: ${bloatedTables.map(t => t.tablename).join(', ')}`);
  } else {
    improvements.push('✅ Table bloat under control (<10% dead tuples)');
  }
  
  improvements.forEach(i => console.log(i));
  
  console.log('\n🎯 Next Actions:');
  console.log('1. Monitor these metrics regularly (daily/weekly)');
  console.log('2. Set up alerts for cache hit ratio < 90%');
  console.log('3. Schedule automatic VACUUM during low-traffic periods');
  console.log('4. Consider pg_stat_statements for detailed query analysis');
}

// Run monitoring
monitorPerformance().catch(console.error);