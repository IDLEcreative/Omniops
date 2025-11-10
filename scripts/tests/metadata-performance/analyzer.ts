import { performance } from 'perf_hooks';
import { MetadataExtractor } from '../lib/metadata-extractor';
import { SAMPLE_CONTENTS } from './samples';
import type { PerformanceMetrics } from './types';

export class MetadataPerformanceAnalyzer {
  async analyzeMethod(
    methodName: string,
    method: () => any,
    iterations: number = 100
  ): Promise<PerformanceMetrics> {
    const times: number[] = [];
    const memoryBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < 10; i++) {
      method();
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      method();
      const end = performance.now();
      times.push(end - start);
    }

    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryDelta = (memoryAfter - memoryBefore) / 1024 / 1024;

    return {
      method: methodName,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      memoryDelta,
      samples: iterations
    };
  }

  async analyzeFullExtraction(content: string, contentType: string): Promise<void> {
    console.log(`\n📊 Analyzing ${contentType} content (${content.length} chars)`);
    console.log('='.repeat(60));

    const url = 'https://example.com/product/test';
    const title = 'Test Product Page';

    const methodTests = [
      { name: 'classifyContent', fn: () => (MetadataExtractor as any).classifyContent(content, url, title) },
      { name: 'extractKeywords', fn: () => (MetadataExtractor as any).extractKeywords(content, 10) },
      { name: 'extractEntities', fn: () => (MetadataExtractor as any).extractEntities(content) },
      { name: 'extractContactInfo', fn: () => (MetadataExtractor as any).extractContactInfo(content) },
      { name: 'extractQAPairs', fn: () => (MetadataExtractor as any).extractQAPairs(content) },
      { name: 'calculateReadability', fn: () => (MetadataExtractor as any).calculateReadability(content) },
      { name: 'extractEcommerceData', fn: () => (MetadataExtractor as any).extractEcommerceData(content, content, undefined) }
    ];

    const results: PerformanceMetrics[] = [];
    for (const test of methodTests) {
      results.push(await this.analyzeMethod(test.name, test.fn));
    }

    const fullMetrics = await this.analyzeMethod(
      'FULL_EXTRACTION',
      () => MetadataExtractor.extractEnhancedMetadata(content, content, url, title, 0, 1, undefined),
      50
    );
    results.push(fullMetrics);

    this.printMethodTable(results);
    this.printBottlenecks(results, fullMetrics);
  }

  private printMethodTable(results: PerformanceMetrics[]) {
    console.log('\nMethod Performance:');
    console.log('┌─────────────────────────┬───────────┬───────────┬───────────┬──────────┐');
    console.log('│ Method                  │ Avg (ms)  │ Min (ms)  │ Max (ms)  │ Mem (MB) │');
    console.log('├─────────────────────────┼───────────┼───────────┼───────────┼──────────┤');

    for (const metric of results) {
      const name = metric.method.padEnd(23);
      const avg = metric.avgTime.toFixed(3).padStart(9);
      const min = metric.minTime.toFixed(3).padStart(9);
      const max = metric.maxTime.toFixed(3).padStart(9);
      const mem = metric.memoryDelta.toFixed(2).padStart(8);
      const prefix = metric.avgTime > 5 ? '🔴' : metric.avgTime > 1 ? '🟡' : '🟢';
      console.log(`│ ${prefix} ${name} │ ${avg} │ ${min} │ ${max} │ ${mem} │`);
    }

    console.log('└─────────────────────────┴───────────┴───────────┴───────────┴──────────┘');
  }

  private printBottlenecks(results: PerformanceMetrics[], fullMetrics: PerformanceMetrics) {
    const bottlenecks = results.filter(r => r.avgTime > 0.5).sort((a, b) => b.avgTime - a.avgTime);
    if (bottlenecks.length === 0) return;

    console.log('\n⚠️  Performance Bottlenecks Detected:');
    bottlenecks.forEach(bottleneck => {
      const percentOfTotal = fullMetrics.avgTime > 0 ? (bottleneck.avgTime / fullMetrics.avgTime * 100).toFixed(1) : '0';
      console.log(`  - ${bottleneck.method}: ${bottleneck.avgTime.toFixed(3)}ms (${percentOfTotal}% of total)`);
    });
  }

  async analyzeBatchProcessing(): Promise<void> {
    console.log('\n📦 Batch Processing Analysis');
    console.log('='.repeat(60));

    const batchSizes = [10, 50, 100, 500, 1000];
    const content = SAMPLE_CONTENTS.medium;

    for (const batchSize of batchSizes) {
      const start = performance.now();
      const memBefore = process.memoryUsage().heapUsed;

      const tasks = Array.from({ length: batchSize }, (_, i) =>
        MetadataExtractor.extractEnhancedMetadata(content, content, `https://example.com/page${i}`, `Page ${i}`, 0, 1, undefined)
      );

      await Promise.all(tasks);

      const end = performance.now();
      const memAfter = process.memoryUsage().heapUsed;

      const totalTime = end - start;
      const avgTime = totalTime / batchSize;
      const memUsed = (memAfter - memBefore) / 1024 / 1024;
      const throughput = (batchSize / totalTime) * 1000;

      console.log(`Batch ${batchSize.toString().padStart(4)}: ${avgTime.toFixed(2)}ms/item, ${throughput.toFixed(0)} items/sec, ${memUsed.toFixed(1)}MB used`);
    }
  }

  async analyzeRegexPerformance(): Promise<void> {
    console.log('\n🔍 Regex Pattern Performance Analysis');
    console.log('='.repeat(60));

    const testContent = SAMPLE_CONTENTS.heavyRegex;
    const regexPatterns = [
      { name: 'SKU Pattern', regex: /\b(?:[A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*|SKU[\s]?[\d]+)\b/gi },
      { name: 'Model Pattern', regex: /\b(?:model\s+)?([A-Z]{1,}[\-]?[\d]{2,}[\w\-]*)\b/gi },
      { name: 'Price Pattern', regex: /(?:[\$£€]\s?)([\d,]+(?:\.\d{2})?)/g },
      { name: 'Email Pattern', regex: /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/gi },
      { name: 'Phone Pattern', regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g },
      { name: 'Q&A Pattern 1', regex: /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis },
      { name: 'Q&A Pattern 2', regex: /([^.!?\n]+\?)\s*([^?]+?)(?=\n[^.!?\n]+\?|$)/gis }
    ];

    regexPatterns.forEach(({ name, regex }) => {
      const times: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        testContent.match(regex);
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const matchCount = testContent.match(regex)?.length || 0;
      const indicator = avgTime > 1 ? '🔴' : avgTime > 0.5 ? '🟡' : '🟢';

      console.log(`${indicator} ${name.padEnd(20)}: ${avgTime.toFixed(3)}ms avg, ${matchCount} matches`);
    });
  }

  async estimateMigrationTime(): Promise<void> {
    console.log('\n⏱️  Migration Time Estimation for 13,045 Embeddings');
    console.log('='.repeat(60));

    const sampleTime = await this.analyzeMethod(
      'sample',
      () =>
        MetadataExtractor.extractEnhancedMetadata(
          SAMPLE_CONTENTS.medium,
          SAMPLE_CONTENTS.medium,
          'https://example.com/test',
          'Test',
          0,
          1,
          undefined
        ),
      100
    );

    const totalEmbeddings = 13045;
    const concurrencyLevels = [1, 10, 50, 100, 200];

    console.log(`\nBase extraction time: ${sampleTime.avgTime.toFixed(3)}ms per embedding`);
    console.log('\nEstimated migration times:');

    concurrencyLevels.forEach(concurrency => {
      const batchCount = Math.ceil(totalEmbeddings / concurrency);
      const estimatedTime = (batchCount * sampleTime.avgTime) / 1000;
      const throughput = (totalEmbeddings / estimatedTime) || 0;
      const timeStr = estimatedTime < 60 ? `${estimatedTime.toFixed(1)}s` : `${(estimatedTime / 60).toFixed(1)}min`;
      console.log(`  Concurrency ${concurrency.toString().padStart(3)}: ${timeStr.padStart(8)} (${throughput.toFixed(0)} items/sec)`);
    });

    const avgMetadataSize = 2;
    const totalMemory = (totalEmbeddings * avgMetadataSize) / 1024;
    console.log(`\nEstimated memory for full dataset: ${totalMemory.toFixed(1)}MB`);
  }
}
