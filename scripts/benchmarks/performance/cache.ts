import { performance } from 'perf_hooks';
import { PerformanceMetrics } from './metrics';
import { QueryCache } from '../../lib/query-cache';

export async function benchmarkQueryCache(supabase: any, metrics: PerformanceMetrics) {
  console.log('\n📊 Testing Query Cache Performance...');

  const cacheKey = `test_cache_${Date.now()}`;
  const testData = { results: Array.from({ length: 100 }, () => ({ data: Math.random() })) };

  const memWriteStart = performance.now();
  QueryCache.setInMemory(cacheKey, testData, 60);
  metrics.record('cache_memory_write', performance.now() - memWriteStart);

  const memReadStart = performance.now();
  QueryCache.getFromMemory(cacheKey);
  metrics.record('cache_memory_read', performance.now() - memReadStart);

  console.log(
    `  Memory Cache - Write: ${metrics.getStats('cache_memory_write')?.avg.toFixed(2)}ms, Read: ${metrics
      .getStats('cache_memory_read')
      ?.avg.toFixed(2)}ms`
  );

  const domainId = `benchmark-domain-${Date.now()}`;

  const dbWriteStart = performance.now();
  await QueryCache.setInDb(supabase, domainId, cacheKey, 'test query', testData, 60);
  metrics.record('cache_db_write', performance.now() - dbWriteStart);

  const dbReadStart = performance.now();
  await QueryCache.getFromDb(supabase, domainId, cacheKey);
  metrics.record('cache_db_read', performance.now() - dbReadStart);

  console.log(
    `  Database Cache - Write: ${metrics.getStats('cache_db_write')?.avg.toFixed(2)}ms, Read: ${
      metrics.getStats('cache_db_read')?.avg.toFixed(2)
    }ms`
  );

  await supabase.from('query_cache').delete().eq('domain_id', domainId);
  QueryCache.clearMemory(cacheKey);
}
