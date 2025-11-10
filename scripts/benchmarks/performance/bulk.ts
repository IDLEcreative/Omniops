import { performance } from 'perf_hooks';
import { PerformanceMetrics } from './metrics';

const TEST_SIZES = [1, 5, 10, 25, 50];

export async function benchmarkBulkOperations(supabase: any, metrics: PerformanceMetrics) {
  console.log('\n📊 Testing Bulk Operation Performance...');

  for (const size of TEST_SIZES) {
    const pages = Array.from({ length: size }, (_, index) => ({
      url: `https://benchmark.test/page${index}`,
      title: `Benchmark Page ${index}`,
      content: `Test content for page ${index}`.repeat(100),
      status: 'completed'
    }));

    const singleStart = performance.now();
    for (const page of pages) {
      await supabase.from('scraped_pages').upsert(page);
    }
    const singleTime = performance.now() - singleStart;
    metrics.record('single_upsert', singleTime / size, { batchSize: size });

    await supabase.from('scraped_pages').delete().like('url', 'https://benchmark.test%');

    const bulkStart = performance.now();
    await supabase.rpc('bulk_upsert_scraped_pages', { pages });
    const bulkTime = performance.now() - bulkStart;
    metrics.record('bulk_upsert', bulkTime / size, { batchSize: size });

    const improvement = ((singleTime - bulkTime) / singleTime * 100).toFixed(1);
    console.log(
      `  Batch size ${size}: Single ${(singleTime / size).toFixed(2)}ms/item → Bulk ${(bulkTime / size).toFixed(2)}ms/item (${improvement}% faster)`
    );

    await supabase.from('scraped_pages').delete().like('url', 'https://benchmark.test%');
  }
}
