import { performance } from 'perf_hooks';
import { PerformanceMetrics } from './metrics';
import { executeSQL as execSQL, getSupabaseConfig } from '../../supabase-config.js';

const config = getSupabaseConfig();

const TEST_QUERIES = [
  'What products do you sell?',
  'shipping information',
  'return policy',
  'contact details',
  'payment methods accepted'
];

export async function benchmarkEmbeddingSearch(supabase: any, metrics: PerformanceMetrics, domainId: string) {
  console.log('\n📊 Testing Embedding Search Performance...');

  for (const query of TEST_QUERIES) {
    await execSQL(config, `DELETE FROM query_cache WHERE query_text = '${query}'`);

    const coldStart = performance.now();
    const coldResult = await supabase.rpc('search_content_optimized', {
      query_text: query,
      p_domain_id: domainId,
      match_count: 5,
      use_hybrid: true
    });
    const coldTime = performance.now() - coldStart;
    metrics.record('embedding_search_cold', coldTime, {
      query,
      resultCount: coldResult.data?.length || 0
    });

    const warmStart = performance.now();
    const warmResult = await supabase.rpc('search_content_optimized', {
      query_text: query,
      p_domain_id: domainId,
      match_count: 5,
      use_hybrid: true
    });
    const warmTime = performance.now() - warmStart;
    metrics.record('embedding_search_warm', warmTime, {
      query,
      resultCount: warmResult.data?.length || 0
    });

    console.log(`  "${query.substring(0, 30)}..." - Cold: ${coldTime.toFixed(2)}ms, Warm: ${warmTime.toFixed(2)}ms`);
  }
}
