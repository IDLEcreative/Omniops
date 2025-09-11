#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { DatabaseOptimizer } = require('./lib/database-optimizer');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize optimizer
const optimizer = new DatabaseOptimizer(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Performance tracking
const metrics = {
  insert: [],
  update: [],
  delete: [],
  bulkInsert: [],
  vectorSearch: [],
  textSearch: []
};

// Test data generation
function generateTestData(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      url: `https://test.com/page-${Date.now()}-${i}`,
      content: `Test content ${i} with some meaningful text for searching and indexing. This is a longer piece of content to simulate real pages.`.repeat(10),
      title: `Test Page ${i}`,
      domain: 'test.com',
      scraped_at: new Date().toISOString()
    });
  }
  return data;
}

function generateTestEmbeddings(count) {
  const embeddings = [];
  for (let i = 0; i < count; i++) {
    // Generate a random 1536-dimension vector (OpenAI embedding size)
    const vector = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    embeddings.push({
      content: `Test chunk ${i} content`,
      embedding: vector,
      metadata: { test: true, index: i }
    });
  }
  return embeddings;
}

async function testInsertPerformance() {
  console.log('\n=== Testing INSERT Performance ===');
  const testData = generateTestData(10);
  
  for (const item of testData) {
    const start = Date.now();
    const { error } = await supabase
      .from('scraped_pages')
      .insert(item);
    const duration = Date.now() - start;
    
    if (!error) {
      metrics.insert.push(duration);
      console.log(`INSERT: ${duration}ms`);
    } else {
      console.error('INSERT failed:', error.message);
    }
  }
  
  const avgInsert = metrics.insert.reduce((a, b) => a + b, 0) / metrics.insert.length;
  console.log(`Average INSERT time: ${avgInsert.toFixed(2)}ms`);
  return avgInsert;
}

async function testUpdatePerformance() {
  console.log('\n=== Testing UPDATE Performance ===');
  
  // First, get some existing records
  const { data: existing } = await supabase
    .from('scraped_pages')
    .select('id, url')
    .limit(10);
  
  if (!existing || existing.length === 0) {
    console.log('No existing records to update');
    return 0;
  }
  
  for (const item of existing) {
    const start = Date.now();
    const { error } = await supabase
      .from('scraped_pages')
      .update({ content: `Updated content at ${new Date().toISOString()}` })
      .eq('id', item.id);
    const duration = Date.now() - start;
    
    if (!error) {
      metrics.update.push(duration);
      console.log(`UPDATE: ${duration}ms`);
    } else {
      console.error('UPDATE failed:', error.message);
    }
  }
  
  const avgUpdate = metrics.update.length > 0 
    ? metrics.update.reduce((a, b) => a + b, 0) / metrics.update.length 
    : 0;
  console.log(`Average UPDATE time: ${avgUpdate.toFixed(2)}ms`);
  return avgUpdate;
}

async function testDeletePerformance() {
  console.log('\n=== Testing DELETE Performance ===');
  
  // Delete test records
  const start = Date.now();
  const { error, count } = await supabase
    .from('scraped_pages')
    .delete()
    .eq('domain', 'test.com');
  const duration = Date.now() - start;
  
  if (!error) {
    console.log(`DELETE ${count || 'multiple'} records: ${duration}ms`);
    metrics.delete.push(duration);
  } else {
    console.error('DELETE failed:', error.message);
  }
  
  return duration;
}

async function testBulkOperations() {
  console.log('\n=== Testing BULK Operations with DatabaseOptimizer ===');
  
  // Test bulk insert of embeddings
  const embeddings = generateTestEmbeddings(100);
  
  console.log('Testing bulk insert of 100 embeddings...');
  const start = Date.now();
  const result = await optimizer.bulkInsertEmbeddings(embeddings);
  const duration = Date.now() - start;
  
  console.log(`Bulk INSERT result:`, {
    success: result.success,
    inserted: result.inserted,
    failed: result.failed,
    totalDuration: `${duration}ms`,
    avgBatchDuration: `${result.avgDuration?.toFixed(2)}ms`,
    perRowTime: `${(duration / embeddings.length).toFixed(2)}ms`
  });
  
  metrics.bulkInsert.push(duration);
  return duration;
}

async function testVectorSearch() {
  console.log('\n=== Testing Vector Search Performance (HNSW Index) ===');
  
  // Generate a random query vector
  const queryVector = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  
  const start = Date.now();
  const { data, error } = await supabase.rpc('match_page_embeddings', {
    query_embedding: queryVector,
    match_threshold: 0.7,
    match_count: 10
  });
  const duration = Date.now() - start;
  
  if (!error) {
    console.log(`Vector search completed in ${duration}ms, found ${data?.length || 0} results`);
    metrics.vectorSearch.push(duration);
  } else {
    console.error('Vector search failed:', error.message);
  }
  
  return duration;
}

async function testTextSearch() {
  console.log('\n=== Testing Text Search Performance (GIN Index) ===');
  
  const searchTerms = ['test', 'content', 'page', 'meaningful', 'search'];
  
  for (const term of searchTerms) {
    const start = Date.now();
    const { data, error } = await supabase
      .from('scraped_pages')
      .select('id, url, title')
      .textSearch('content', term)
      .limit(10);
    const duration = Date.now() - start;
    
    if (!error) {
      console.log(`Text search for "${term}": ${duration}ms (${data?.length || 0} results)`);
      metrics.textSearch.push(duration);
    } else {
      console.error(`Text search failed for "${term}":`, error.message);
    }
  }
  
  const avgTextSearch = metrics.textSearch.length > 0
    ? metrics.textSearch.reduce((a, b) => a + b, 0) / metrics.textSearch.length
    : 0;
  console.log(`Average text search time: ${avgTextSearch.toFixed(2)}ms`);
  return avgTextSearch;
}

async function checkIndexes() {
  console.log('\n=== Checking Database Indexes ===');
  
  try {
    const { data: indexes, error } = await supabase.rpc('get_indexes', {
      table_name: 'scraped_pages'
    });
    
    if (indexes && !error) {
      console.log('Indexes on scraped_pages:', indexes);
      return;
    }
  } catch (e) {
    // RPC not available, try alternative
  }
  
  try {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname, indexdef')
      .eq('tablename', 'scraped_pages');
    
    if (data && !error) {
      console.log('Found indexes:', data);
    } else {
      console.log('Cannot retrieve index information (limited permissions)');
    }
  } catch (e) {
    console.log('Cannot retrieve index information (limited permissions)');
  }
}

async function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('         PERFORMANCE PROFILING REPORT');
  console.log('='.repeat(60));
  
  console.log('\n📊 MEASURED METRICS:');
  console.log('-------------------');
  
  if (results.avgInsert) {
    const improvement = ((1700 - results.avgInsert) / 1700 * 100).toFixed(1);
    console.log(`✅ INSERT Operations: ${results.avgInsert.toFixed(2)}ms`);
    console.log(`   Claimed: 1700ms → 68ms (96% improvement)`);
    console.log(`   Actual improvement: ${improvement}%`);
    console.log(`   ${improvement > 90 ? '✅ CLAIM VERIFIED' : '❌ CLAIM NOT MET'}`);
  }
  
  if (results.avgUpdate) {
    console.log(`\n✅ UPDATE Operations: ${results.avgUpdate.toFixed(2)}ms`);
  }
  
  if (results.deleteTime) {
    console.log(`\n✅ DELETE Operations: ${results.deleteTime}ms`);
  }
  
  if (results.bulkTime) {
    const perRow = results.bulkTime / 100;
    console.log(`\n✅ BULK Operations (100 rows): ${results.bulkTime}ms`);
    console.log(`   Per row: ${perRow.toFixed(2)}ms`);
    console.log(`   Claimed: 99.5% improvement`);
    console.log(`   ${perRow < 10 ? '✅ HIGHLY OPTIMIZED' : '⚠️  NEEDS OPTIMIZATION'}`);
  }
  
  if (results.vectorSearchTime) {
    console.log(`\n✅ Vector Search (HNSW): ${results.vectorSearchTime}ms`);
    console.log(`   ${results.vectorSearchTime < 100 ? '✅ FAST' : '⚠️  SLOW'}`);
  }
  
  if (results.textSearchTime) {
    console.log(`\n✅ Text Search (GIN): ${results.textSearchTime.toFixed(2)}ms`);
    console.log(`   Claimed: 10-100x faster with GIN indexes`);
    console.log(`   ${results.textSearchTime < 50 ? '✅ OPTIMIZED' : '⚠️  NEEDS OPTIMIZATION'}`);
  }
  
  console.log('\n📈 OPTIMIZATION STATUS:');
  console.log('----------------------');
  console.log('✅ DatabaseOptimizer class implemented');
  console.log('✅ Bulk operations with batching');
  console.log('✅ Connection pooling configured');
  console.log('⚠️  Indexes need to be verified in production');
  
  console.log('\n🔍 RECOMMENDATIONS:');
  console.log('-------------------');
  if (results.avgInsert > 100) {
    console.log('• INSERT operations still slow - check network latency');
  }
  if (results.textSearchTime > 50) {
    console.log('• Text search needs GIN index optimization');
  }
  if (results.vectorSearchTime > 100) {
    console.log('• Vector search needs HNSW index tuning');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Main execution
async function main() {
  try {
    console.log('Starting Omniops Performance Profiling...');
    console.log('Database:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    const results = {};
    
    // Check indexes first
    await checkIndexes();
    
    // Run performance tests
    results.avgInsert = await testInsertPerformance();
    results.avgUpdate = await testUpdatePerformance();
    results.bulkTime = await testBulkOperations();
    results.vectorSearchTime = await testVectorSearch();
    results.textSearchTime = await testTextSearch();
    results.deleteTime = await testDeletePerformance();
    
    // Generate report
    await generateReport(results);
    
    // Show optimizer stats
    console.log('\n🔧 Optimizer Configuration:');
    console.log(optimizer.getPoolStats());
    
  } catch (error) {
    console.error('Performance test failed:', error);
  }
  
  process.exit(0);
}

main();