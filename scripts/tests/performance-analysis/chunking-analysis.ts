import { SemanticChunker } from '../lib/semantic-chunker';
import { PerformanceProfiler } from './performance-profiler';
import { testDocuments } from './test-data';
import { calculateCorrelation } from './stats';

export interface ChunkingAnalysisResult {
  docLength: number;
  isHTML: boolean;
  duration: number;
  memory: number;
  chunkCount: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  semanticScores: number[];
}

export async function analyzeSemanticChunking(): Promise<ChunkingAnalysisResult[]> {
  console.log('\n========================================');
  console.log('SEMANTIC CHUNKING PERFORMANCE ANALYSIS');
  console.log('========================================\n');

  const profiler = new PerformanceProfiler();
  const results: ChunkingAnalysisResult[] = [];

  for (const doc of testDocuments) {
    const docPreview = `${doc.substring(0, 50)}... (${doc.length} chars)`;
    console.log(`\nTesting document: ${docPreview}`);

    const isHTML = doc.includes('<html');

    for (let i = 0; i < 5; i++) {
      profiler.mark('start');
      const chunks = await SemanticChunker.chunkContent(doc, isHTML ? doc : undefined);
      profiler.mark('end');

      const duration = profiler.measure('chunk', 'start', 'end');
      const memory = profiler.getMemoryDelta('start', 'end');

      if (i === 0) {
        results.push({
          docLength: doc.length,
          isHTML,
          duration,
          memory,
          chunkCount: chunks.length,
          avgChunkSize: chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length,
          minChunkSize: Math.min(...chunks.map(c => c.content.length)),
          maxChunkSize: Math.max(...chunks.map(c => c.content.length)),
          semanticScores: chunks.map(c => c.semantic_completeness)
        });
      }
    }
  }

  const stats = profiler.getStats('chunk');
  console.log('\n--- Semantic Chunking Performance Summary ---');
  console.log(`Average: ${stats?.avg.toFixed(2)}ms`);
  console.log(`Median: ${stats?.median.toFixed(2)}ms`);
  console.log(`P95: ${stats?.p95.toFixed(2)}ms`);
  console.log(`P99: ${stats?.p99.toFixed(2)}ms`);

  console.log('\n--- Complexity Analysis ---');
  const docLengths = results.map(r => r.docLength);
  const durations = results.map(r => r.duration);
  const correlation = calculateCorrelation(docLengths, durations);

  console.log(`Document length vs Duration correlation: ${correlation.toFixed(3)}`);
  if (correlation > 0.9) {
    console.log('⚠️  WARNING: Very strong correlation - possible O(n²) complexity in regex operations');
  }

  const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / results.length;
  console.log(`\nAverage memory allocation per document: ${avgMemory.toFixed(2)}MB`);

  console.log('\n--- Chunking Quality Analysis ---');
  results.forEach(r => {
    const avgScore = r.semanticScores.reduce((a, b) => a + b, 0) / r.semanticScores.length;
    console.log(`Doc (${r.docLength} chars): ${r.chunkCount} chunks, avg semantic score: ${avgScore.toFixed(2)}`);
    if (r.minChunkSize < 300) {
      console.log(`  ⚠️  Warning: Very small chunk detected (${r.minChunkSize} chars)`);
    }
    if (r.maxChunkSize > 2000) {
      console.log(`  ⚠️  Warning: Very large chunk detected (${r.maxChunkSize} chars)`);
    }
  });

  return results;
}
