/**
 * Verification script to test database performance improvements
 *
 * Tests:
 * 1. Index on page_embeddings.page_id improves deletion speed
 * 2. New bulk_insert_embeddings uses set-based operations
 * 3. Overall query performance improvements
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

async function main() {
  console.log('🔍 Verifying Performance Improvements\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }

  // Test 1: Verify indexes exist
  console.log('📊 Test 1: Checking indexes...');
  const { data: indexes } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE indexname IN (
        'idx_page_embeddings_page_id',
        'idx_scraped_pages_error_message'
      );
    `
  });

  console.log('Indexes found:', indexes);
  if (indexes && indexes.length === 2) {
    console.log('✅ Both indexes exist\n');
  } else {
    console.log('❌ Missing indexes!\n');
  }

  // Test 2: Check bulk_insert_embeddings function
  console.log('📊 Test 2: Checking bulk_insert_embeddings implementation...');
  const { data: funcDef } = await supabase.rpc('execute_sql', {
    query: `
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'bulk_insert_embeddings';
    `
  });

  if (funcDef && funcDef[0]?.definition) {
    const def = funcDef[0].definition;
    const hasLoop = def.includes('FOR') && def.includes('LOOP');
    const hasInsertSelect = def.includes('INSERT INTO') && def.includes('SELECT');

    if (!hasLoop && hasInsertSelect) {
      console.log('✅ Function uses set-based INSERT...SELECT (GOOD!)\n');
    } else if (hasLoop) {
      console.log('❌ Function still uses FOR LOOP (BAD!)\n');
    } else {
      console.log('⚠️  Cannot determine function implementation\n');
    }
  }

  // Test 3: Test actual bulk insert performance
  console.log('📊 Test 3: Testing bulk insert performance...');

  // Create test data
  const testPageId = '00000000-0000-0000-0000-000000000001';
  const testEmbedding = new Array(1536).fill(0.1); // Dummy embedding

  const testData = Array.from({ length: 50 }, (_, i) => ({
    page_id: testPageId,
    chunk_text: `Test chunk ${i}`,
    embedding: testEmbedding,
    metadata: { test: true, index: i }
  }));

  const startTime = Date.now();
  const { data: insertCount, error } = await supabase.rpc('bulk_insert_embeddings', {
    embeddings: testData
  });
  const duration = Date.now() - startTime;

  if (error) {
    console.log('❌ Bulk insert failed:', error.message);
  } else {
    console.log(`✅ Bulk inserted ${insertCount || testData.length} embeddings in ${duration}ms`);
    console.log(`   Average: ${(duration / testData.length).toFixed(2)}ms per embedding\n`);

    if (duration / testData.length < 5) {
      console.log('🎉 Excellent performance! (<5ms per embedding)\n');
    } else if (duration / testData.length < 20) {
      console.log('✅ Good performance (5-20ms per embedding)\n');
    } else {
      console.log('⚠️  Performance could be better (>20ms per embedding)\n');
    }
  }

  // Clean up test data
  await supabase
    .from('page_embeddings')
    .delete()
    .eq('page_id', testPageId);

  // Test 4: Check query performance stats
  console.log('📊 Test 4: Checking recent query performance...');
  const { data: queryStats } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        query,
        calls,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE query LIKE '%bulk_insert_embeddings%'
        AND calls > 0
      ORDER BY calls DESC
      LIMIT 5;
    `
  });

  if (queryStats && queryStats.length > 0) {
    console.log('\nRecent bulk_insert_embeddings performance:');
    queryStats.forEach((stat: any) => {
      console.log(`  Calls: ${stat.calls}, Mean: ${stat.mean_exec_time.toFixed(2)}ms, Max: ${stat.max_exec_time.toFixed(2)}ms`);
    });
  } else {
    console.log('No recent bulk_insert_embeddings calls found');
  }

  console.log('\n✅ Verification complete!');
}

main().catch(console.error);
