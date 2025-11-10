import crypto from 'node:crypto';
import { PerformanceTracker } from './performance-tracker.js';
import { generateSampleData } from './sample-data.js';

export async function profileInsertOperations(supabase) {
  console.log('\n📊 PROFILING INSERT OPERATIONS\n');
  console.log('='.repeat(60));

  const tracker = {
    singleInsert: new PerformanceTracker('Single INSERT'),
    batchInsert: new PerformanceTracker('Batch INSERT'),
    upsert: new PerformanceTracker('UPSERT'),
    embeddingInsert: new PerformanceTracker('Embedding INSERT'),
  };

  console.log('\n1. Testing SINGLE ROW INSERTS (10 operations)...');
  const { pages } = generateSampleData(10);

  for (const page of pages) {
    tracker.singleInsert.start();
    const { error } = await supabase.from('scraped_pages').insert(page);
    const duration = tracker.singleInsert.end();

    if (error && !error.message.includes('duplicate')) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✓ Single insert: ${duration.toFixed(2)}ms`);
    }
  }

  console.log('\n2. Testing BATCH INSERTS (10 rows at once)...');
  const { pages: batchPages } = generateSampleData(10);

  tracker.batchInsert.start();
  const { error: batchError } = await supabase.from('scraped_pages').insert(batchPages);
  const batchDuration = tracker.batchInsert.end();

  if (batchError && !batchError.message.includes('duplicate')) {
    console.log(`   ❌ Batch error: ${batchError.message}`);
  } else {
    console.log(`   ✓ Batch insert (10 rows): ${batchDuration.toFixed(2)}ms`);
    console.log(`   📈 Per-row average: ${(batchDuration / 10).toFixed(2)}ms`);
  }

  console.log('\n3. Testing UPSERT OPERATIONS (5 operations)...');
  const { pages: upsertPages } = generateSampleData(5);

  for (const page of upsertPages) {
    tracker.upsert.start();
    const { error } = await supabase.from('scraped_pages').upsert(page, { onConflict: 'url' });
    const duration = tracker.upsert.end();

    if (error) {
      console.log(`   ❌ Upsert error: ${error.message}`);
    } else {
      console.log(`   ✓ Upsert: ${duration.toFixed(2)}ms`);
    }
  }

  console.log('\n4. Testing EMBEDDING INSERTS (30 embeddings)...');
  const { embeddings } = generateSampleData(10);
  const testPage = {
    id: crypto.randomUUID(),
    url: `https://test.example.com/embedding-test-${Date.now()}`,
    title: 'Embedding Test Page',
    content: 'Test content for embeddings',
    scraped_at: new Date().toISOString(),
  };

  await supabase.from('scraped_pages').insert(testPage);
  const testEmbeddings = embeddings.map((e) => ({ ...e, page_id: testPage.id }));

  tracker.embeddingInsert.start();
  const { error: embedError } = await supabase.from('page_embeddings').insert(testEmbeddings);
  const embedDuration = tracker.embeddingInsert.end();

  if (embedError) {
    console.log(`   ❌ Embedding insert error: ${embedError.message}`);
  } else {
    console.log(`   ✓ Batch embedding insert (30 rows): ${embedDuration.toFixed(2)}ms`);
    console.log(`   📈 Per-embedding average: ${(embedDuration / 30).toFixed(2)}ms`);
  }

  await supabase.from('page_embeddings').delete().eq('page_id', testPage.id);
  await supabase.from('scraped_pages').delete().eq('id', testPage.id);

  reportInsertSummary(tracker);
}

function reportInsertSummary(tracker) {
  console.log('\n📊 INSERT PERFORMANCE SUMMARY:');
  console.log('='.repeat(60));

  const singleStats = tracker.singleInsert.getStats();
  const batchStats = tracker.batchInsert.getStats();
  const embedStats = tracker.embeddingInsert.getStats();

  if (singleStats) {
    console.log(`\nSingle INSERT (per row): Avg ${singleStats.avg}ms (min ${singleStats.min}ms, max ${singleStats.max}ms, P95 ${singleStats.p95}ms)`);
  }

  if (batchStats && singleStats) {
    const perRow = (batchStats.avg / 10).toFixed(2);
    const improvement = ((singleStats.avg - batchStats.avg / 10) / singleStats.avg) * 100;
    console.log(`\nBatch INSERT (10 rows): Total ${batchStats.avg}ms, per-row ${perRow}ms → ${improvement.toFixed(1)}% faster than single inserts`);
  }

  if (embedStats) {
    console.log(`\nEmbedding INSERT (30 rows): Total ${embedStats.avg}ms, per-embedding ${(embedStats.avg / 30).toFixed(2)}ms`);
  }

  if (singleStats) {
    console.log('\n🎯 OPTIMIZATION VALIDATION:');
    if (singleStats.avg < 210) {
      console.log(`  ✅ INSERT performance is EXCELLENT (${singleStats.avg}ms avg)`);
    } else if (singleStats.avg < 500) {
      console.log(`  ⚠️  INSERT performance is GOOD (${singleStats.avg}ms avg)`);
    } else {
      console.log(`  ❌ INSERT performance is POOR (${singleStats.avg}ms avg)`);
    }
  }
}
