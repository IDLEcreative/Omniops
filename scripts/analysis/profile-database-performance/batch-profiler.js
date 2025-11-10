import { generateSampleData } from './sample-data.js';

export async function profileBatchOperations(supabase) {
  console.log('\n\n📊 PROFILING BATCH OPERATIONS\n');
  console.log('='.repeat(60));

  const batchSizes = [1, 5, 10, 20, 50, 100];
  const results = [];

  console.log('\nTesting different batch sizes for INSERT operations...\n');

  for (const size of batchSizes) {
    const { pages } = generateSampleData(size);
    const start = process.hrtime.bigint();
    const { error } = await supabase.from('scraped_pages').insert(pages);
    const duration = Number(process.hrtime.bigint() - start) / 1_000_000;
    const perRow = duration / size;
    results.push({ size, duration, perRow, error });

    if (!error || error.message.includes('duplicate')) {
      console.log(`  Batch size ${size.toString().padStart(3)}: ${duration.toFixed(2)}ms total, ${perRow.toFixed(2)}ms per row`);
    }

    await supabase.from('scraped_pages').delete().in('url', pages.map((p) => p.url));
  }

  summarizeBatchResults(results);
}

function summarizeBatchResults(results) {
  console.log('\n📊 BATCH SIZE OPTIMIZATION:');
  console.log('='.repeat(60));

  const optimal = results.reduce((best, current) => (current.perRow < best.perRow ? current : best));
  console.log(`\n🎯 Optimal batch size: ${optimal.size}`);
  console.log(`   Performance: ${optimal.perRow.toFixed(2)}ms per row (total ${optimal.duration.toFixed(2)}ms)`);

  const single = results.find((r) => r.size === 1);
  if (single && optimal.size > 1) {
    const improvement = ((single.perRow - optimal.perRow) / single.perRow) * 100;
    console.log(`   🚀 ${(improvement).toFixed(1)}% faster than single inserts`);
  }

  console.log('\n💡 RECOMMENDATIONS:');
  if (optimal.size >= 20) {
    console.log('  ✅ Use batch sizes of 20-50 for optimal performance');
  } else if (optimal.size >= 10) {
    console.log('  ⚠️  Use batch sizes of 10-20 for good performance');
  } else {
    console.log('  ❌ Benefits limited; investigate database performance');
  }
}
