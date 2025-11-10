import { QueryEnhancer } from '../lib/query-enhancer';
import { SemanticChunker } from '../lib/semantic-chunker';
import { PerformanceProfiler } from './performance-profiler';
import { testDocuments } from './test-data';

export interface IntegrationAnalysisResult {
  queryTime: number;
  applyTime: number;
  chunkTime: number;
  totalTime: number;
  queryMemory: number;
  chunkMemory: number;
}

export async function analyzeIntegrationOverhead(): Promise<IntegrationAnalysisResult> {
  console.log('\n========================================');
  console.log('INTEGRATION OVERHEAD ANALYSIS');
  console.log('========================================\n');

  const profiler = new PerformanceProfiler();
  const testQuery = 'TENG-40DV motor troubleshooting guide';
  const testContent = testDocuments[3];

  console.log('Testing complete search pipeline...\n');

  profiler.mark('query_start');
  const enhanced = await QueryEnhancer.enhance(testQuery);
  profiler.mark('query_end');
  const queryTime = profiler.measure('query_enhance', 'query_start', 'query_end');

  profiler.mark('apply_start');
  const searchConfig = QueryEnhancer.applyToSearch(enhanced);
  profiler.mark('apply_end');
  const applyTime = profiler.measure('apply_search', 'apply_start', 'apply_end');
  void searchConfig;

  profiler.mark('chunk_start');
  await SemanticChunker.chunkContent(testContent, testContent);
  profiler.mark('chunk_end');
  const chunkTime = profiler.measure('chunking', 'chunk_start', 'chunk_end');

  const totalTime = queryTime + applyTime + chunkTime;

  console.log('--- Pipeline Performance Breakdown ---');
  console.log(`Query Enhancement: ${queryTime.toFixed(2)}ms (${(queryTime / totalTime * 100).toFixed(1)}%)`);
  console.log(`Search Application: ${applyTime.toFixed(2)}ms (${(applyTime / totalTime * 100).toFixed(1)}%)`);
  console.log(`Content Chunking: ${chunkTime.toFixed(2)}ms (${(chunkTime / totalTime * 100).toFixed(1)}%)`);
  console.log(`Total Pipeline: ${totalTime.toFixed(2)}ms`);

  const queryMemory = profiler.getMemoryDelta('query_start', 'query_end');
  const chunkMemory = profiler.getMemoryDelta('chunk_start', 'chunk_end');

  console.log('\n--- Memory Usage ---');
  console.log(`Query Enhancement: ${queryMemory.toFixed(2)}MB`);
  console.log(`Content Chunking: ${chunkMemory.toFixed(2)}MB`);
  console.log(`Total: ${(queryMemory + chunkMemory).toFixed(2)}MB`);

  return { queryTime, applyTime, chunkTime, totalTime, queryMemory, chunkMemory };
}
