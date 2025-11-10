import { QueryEnhancer } from '../lib/query-enhancer';
import { PerformanceProfiler } from './performance-profiler';
import { testQueries } from './test-data';
import { calculateCorrelation } from './stats';

export interface QueryAnalysisResult {
  query: string;
  queryLength: number;
  wordCount: number;
  duration: number;
  memory: number;
  expandedTerms: number;
  synonymCount: number;
  entityCount: number;
  relatedQueries: number;
}

export async function analyzeQueryEnhancement(): Promise<QueryAnalysisResult[]> {
  console.log('\n========================================');
  console.log('QUERY ENHANCEMENT PERFORMANCE ANALYSIS');
  console.log('========================================\n');

  const profiler = new PerformanceProfiler();
  const results: QueryAnalysisResult[] = [];

  await QueryEnhancer.enhance('warmup query');

  for (const query of testQueries) {
    console.log(`\nTesting query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

    for (let i = 0; i < 10; i++) {
      profiler.mark('start');
      const enhanced = await QueryEnhancer.enhance(query);
      profiler.mark('end');

      const duration = profiler.measure('enhance', 'start', 'end');
      const memory = profiler.getMemoryDelta('start', 'end');

      if (i === 0) {
        results.push({
          query,
          queryLength: query.length,
          wordCount: query.split(/\s+/).length,
          duration,
          memory,
          expandedTerms: enhanced.expanded_terms.length,
          synonymCount: Array.from(enhanced.synonyms.values()).flat().length,
          entityCount: Object.values(enhanced.entities).flat().length,
          relatedQueries: enhanced.related_queries.length
        });
      }
    }
  }

  const stats = profiler.getStats('enhance');
  console.log('\n--- Query Enhancement Performance Summary ---');
  console.log(`Average: ${stats?.avg.toFixed(2)}ms`);
  console.log(`Median: ${stats?.median.toFixed(2)}ms`);
  console.log(`P95: ${stats?.p95.toFixed(2)}ms`);
  console.log(`P99: ${stats?.p99.toFixed(2)}ms`);
  console.log(`Min: ${stats?.min.toFixed(2)}ms`);
  console.log(`Max: ${stats?.max.toFixed(2)}ms`);

  console.log('\n--- Complexity Analysis ---');

  const queryLengths = results.map(r => r.queryLength);
  const durations = results.map(r => r.duration);
  const correlation = calculateCorrelation(queryLengths, durations);

  console.log(`Query length vs Duration correlation: ${correlation.toFixed(3)}`);
  if (correlation > 0.8) {
    console.log('⚠️  WARNING: Strong correlation detected - possible O(n²) complexity');
  } else if (correlation > 0.5) {
    console.log('⚠️  CAUTION: Moderate correlation - review algorithmic complexity');
  } else {
    console.log('✅ Good: Low correlation - likely O(n) or better');
  }

  const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / results.length;
  console.log(`\nAverage memory allocation per query: ${avgMemory.toFixed(2)}MB`);
  if (avgMemory > 5) {
    console.log('⚠️  WARNING: High memory usage detected');
  }

  console.log('\n--- Bottleneck Analysis ---');
  const statsAvg = stats?.avg ?? 0;
  const heavyQueries = results.filter(r => r.duration > statsAvg * 2);
  if (heavyQueries.length > 0) {
    console.log('Heavy queries detected:');
    heavyQueries.forEach(q => {
      console.log(`  - "${q.query.substring(0, 30)}..." (${q.duration.toFixed(2)}ms)`);
      console.log(`    Expanded terms: ${q.expandedTerms}, Synonyms: ${q.synonymCount}, Entities: ${q.entityCount}`);
    });
  }

  return results;
}
