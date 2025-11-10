import { PerformanceTracker } from './performance-tracker.js';

function logIndexedQuery(tracker, label, duration) {
  console.log(`   ✓ ${label}: ${duration.toFixed(2)}ms`);
  tracker.metrics.push(duration);
}

export async function profileQueryPatterns(supabase) {
  console.log('\n\n📊 PROFILING QUERY PATTERNS\n');
  console.log('='.repeat(60));

  const tracker = {
    indexedQuery: new PerformanceTracker('Indexed Query'),
    joinQuery: new PerformanceTracker('JOIN Query'),
    vectorSearch: new PerformanceTracker('Vector Search'),
  };

  console.log('\n1. Testing INDEXED QUERIES...');
  tracker.indexedQuery.start();
  await supabase.from('scraped_pages').select('*').eq('url', 'https://example.com/test').single();
  const byUrlDuration = tracker.indexedQuery.end();
  logIndexedQuery(tracker.indexedQuery, 'Query by URL', byUrlDuration);

  const { data: samplePage } = await supabase.from('scraped_pages').select('id').limit(1).single();
  if (samplePage) {
    tracker.indexedQuery.start();
    await supabase.from('page_embeddings').select('*').eq('page_id', samplePage.id);
    const embedDuration = tracker.indexedQuery.end();
    logIndexedQuery(tracker.indexedQuery, 'Query embeddings by page_id', embedDuration);
  }

  console.log('\n2. Testing JOIN QUERIES...');
  tracker.joinQuery.start();
  await supabase
    .from('scraped_pages')
    .select('*, page_embeddings ( id, chunk_text )')
    .limit(5);
  const joinDuration = tracker.joinQuery.end();
  console.log(`   ✓ Pages with embeddings JOIN: ${joinDuration.toFixed(2)}ms`);

  console.log('\n3. Testing VECTOR SEARCH...');
  const queryVector = new Array(1536).fill(0).map(() => Math.random());
  tracker.vectorSearch.start();
  try {
    await supabase.rpc('match_page_embeddings', {
      embedding: queryVector,
      match_threshold: 0.7,
      match_count: 5,
    });
    const duration = tracker.vectorSearch.end();
    console.log(`   ✓ Vector similarity search: ${duration.toFixed(2)}ms`);
  } catch (error) {
    tracker.vectorSearch.end();
    console.log(`   ⚠️  Vector search not available: ${error.message || error}`);
  }

  await detectNPlusOnePatterns(supabase);
  summarizeQueryPerformance(tracker);
}

async function detectNPlusOnePatterns(supabase) {
  console.log('\n4. Checking for N+1 QUERY PATTERNS...');

  const { data: pages } = await supabase.from('scraped_pages').select('id').limit(5);
  if (!pages?.length) return;

  const n1Start = process.hrtime.bigint();
  for (const page of pages) {
    await supabase.from('page_embeddings').select('*').eq('page_id', page.id);
  }
  const n1Duration = Number(process.hrtime.bigint() - n1Start) / 1_000_000;
  console.log(`   ❌ N+1 pattern (5 pages): ${n1Duration.toFixed(2)}ms`);

  const batchStart = process.hrtime.bigint();
  await supabase.from('page_embeddings').select('*').in('page_id', pages.map((p) => p.id));
  const batchDuration = Number(process.hrtime.bigint() - batchStart) / 1_000_000;
  console.log(`   ✅ Batch query (5 pages): ${batchDuration.toFixed(2)}ms`);
  const improvement = ((n1Duration - batchDuration) / n1Duration) * 100;
  console.log(`   🚀 Batch is ${improvement.toFixed(1)}% faster than N+1`);
}

function summarizeQueryPerformance(tracker) {
  console.log('\n📊 QUERY PATTERN SUMMARY:');
  console.log('='.repeat(60));

  const indexStats = tracker.indexedQuery.getStats();
  if (indexStats) {
    console.log(`\nIndexed queries: Avg ${indexStats.avg}ms`);
    if (indexStats.avg < 50) {
      console.log('  ✅ Excellent - indexes are working effectively');
    } else if (indexStats.avg < 200) {
      console.log('  ⚠️  Good - indexes present but could be optimized');
    } else {
      console.log('  ❌ Poor - indexes may be missing or ineffective');
    }
  }

  const joinStats = tracker.joinQuery.getStats();
  if (joinStats) {
    console.log(`\nJOIN queries: Avg ${joinStats.avg}ms`);
  }
}
