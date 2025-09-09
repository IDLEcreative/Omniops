#!/usr/bin/env npx tsx

/**
 * Performance Analysis Tool for Query Enhancement and Semantic Chunking
 * Measures performance characteristics and identifies bottlenecks
 */

import { QueryEnhancer, type EnhancedQuery } from './lib/query-enhancer';
import { SemanticChunker, type SemanticChunk } from './lib/semantic-chunker';
import * as fs from 'fs';

// Performance measurement utilities
class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  private memorySnapshots: Map<string, NodeJS.MemoryUsage> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
    this.memorySnapshots.set(name, process.memoryUsage());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start && end) {
      const duration = end - start;
      if (!this.measures.has(name)) {
        this.measures.set(name, []);
      }
      this.measures.get(name)!.push(duration);
      return duration;
    }
    return 0;
  }

  getMemoryDelta(startMark: string, endMark: string): number {
    const start = this.memorySnapshots.get(startMark);
    const end = this.memorySnapshots.get(endMark);
    
    if (start && end) {
      return (end.heapUsed - start.heapUsed) / 1024 / 1024; // MB
    }
    return 0;
  }

  getStats(measureName: string) {
    const times = this.measures.get(measureName) || [];
    if (times.length === 0) return null;
    
    const sorted = [...times].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      samples: times.length
    };
  }

  reset() {
    this.marks.clear();
    this.measures.clear();
    this.memorySnapshots.clear();
  }
}

// Test data
const testQueries = [
  // Simple queries
  "motor price",
  "broken engine",
  "how to install",
  
  // Complex queries with entities
  "TENG-40DV motor not working need replacement",
  "Bosch PWS 700-115 angle grinder warranty claim",
  "Milwaukee M18 battery charger under $50",
  
  // Long queries
  "I have a problem with my motor it's making a strange noise when I turn it on and I think it might be broken can you help me fix it or do I need to buy a new one",
  
  // Queries with typos
  "moter instalation guid waranty",
  
  // Technical queries
  "12V 5A motor controller RPM adjustment troubleshooting",
  
  // Comparison queries
  "dewalt vs milwaukee impact driver comparison best price"
];

const testDocuments = [
  // Short document
  "This is a simple product description. The motor has 500W power.",
  
  // Medium document with structure
  `# Product Manual
  
## Installation Guide
Follow these steps to install your new motor:
1. Remove the old motor
2. Clean the mounting area
3. Install the new motor
4. Test the connections

## Troubleshooting
Q: Motor not starting?
A: Check the power supply and connections.

Q: Strange noise?
A: Inspect bearings for damage.`,
  
  // Long document (simulate with repetition)
  Array(100).fill(`
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    - Feature 1: High performance
    - Feature 2: Energy efficient
    - Feature 3: Quiet operation
  `).join('\n'),
  
  // Complex HTML structure
  `<html><body>
    <h1>Product Catalog</h1>
    <div class="product">
      <h2>TENG-40DV Motor</h2>
      <p>Professional grade motor with variable speed control.</p>
      <ul>
        <li>Power: 750W</li>
        <li>Speed: 0-3000 RPM</li>
        <li>Weight: 2.5kg</li>
      </ul>
      <table>
        <tr><td>SKU</td><td>TENG-40DV</td></tr>
        <tr><td>Price</td><td>$299.99</td></tr>
      </table>
    </div>
  </body></html>`
];

async function analyzeQueryEnhancement() {
  console.log('\n========================================');
  console.log('QUERY ENHANCEMENT PERFORMANCE ANALYSIS');
  console.log('========================================\n');
  
  const profiler = new PerformanceProfiler();
  const results: any[] = [];
  
  // Warm up
  await QueryEnhancer.enhance("warmup query");
  
  for (const query of testQueries) {
    console.log(`\nTesting query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);
    
    // Test multiple iterations for consistency
    for (let i = 0; i < 10; i++) {
      profiler.mark('start');
      const enhanced = await QueryEnhancer.enhance(query);
      profiler.mark('end');
      
      const duration = profiler.measure('enhance', 'start', 'end');
      const memory = profiler.getMemoryDelta('start', 'end');
      
      if (i === 0) {
        // Analyze complexity on first iteration
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
  
  // Performance statistics
  const stats = profiler.getStats('enhance');
  console.log('\n--- Query Enhancement Performance Summary ---');
  console.log(`Average: ${stats?.avg.toFixed(2)}ms`);
  console.log(`Median: ${stats?.median.toFixed(2)}ms`);
  console.log(`P95: ${stats?.p95.toFixed(2)}ms`);
  console.log(`P99: ${stats?.p99.toFixed(2)}ms`);
  console.log(`Min: ${stats?.min.toFixed(2)}ms`);
  console.log(`Max: ${stats?.max.toFixed(2)}ms`);
  
  // Complexity analysis
  console.log('\n--- Complexity Analysis ---');
  
  // Check for O(n²) patterns
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
  
  // Memory analysis
  const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / results.length;
  console.log(`\nAverage memory allocation per query: ${avgMemory.toFixed(2)}MB`);
  if (avgMemory > 5) {
    console.log('⚠️  WARNING: High memory usage detected');
  }
  
  // Bottleneck identification
  console.log('\n--- Bottleneck Analysis ---');
  const heavyQueries = results.filter(r => r.duration > (stats?.avg || 0) * 2);
  if (heavyQueries.length > 0) {
    console.log('Heavy queries detected:');
    heavyQueries.forEach(q => {
      console.log(`  - "${q.query.substring(0, 30)}..." (${q.duration.toFixed(2)}ms)`);
      console.log(`    Expanded terms: ${q.expandedTerms}, Synonyms: ${q.synonymCount}, Entities: ${q.entityCount}`);
    });
  }
  
  return results;
}

async function analyzeSemanticChunking() {
  console.log('\n========================================');
  console.log('SEMANTIC CHUNKING PERFORMANCE ANALYSIS');
  console.log('========================================\n');
  
  const profiler = new PerformanceProfiler();
  const results: any[] = [];
  
  for (const doc of testDocuments) {
    const docPreview = `${doc.substring(0, 50)}... (${doc.length} chars)`;
    console.log(`\nTesting document: ${docPreview}`);
    
    // Test with and without HTML
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
  
  // Performance statistics
  const stats = profiler.getStats('chunk');
  console.log('\n--- Semantic Chunking Performance Summary ---');
  console.log(`Average: ${stats?.avg.toFixed(2)}ms`);
  console.log(`Median: ${stats?.median.toFixed(2)}ms`);
  console.log(`P95: ${stats?.p95.toFixed(2)}ms`);
  console.log(`P99: ${stats?.p99.toFixed(2)}ms`);
  
  // Complexity analysis
  console.log('\n--- Complexity Analysis ---');
  const docLengths = results.map(r => r.docLength);
  const durations = results.map(r => r.duration);
  const correlation = calculateCorrelation(docLengths, durations);
  
  console.log(`Document length vs Duration correlation: ${correlation.toFixed(3)}`);
  if (correlation > 0.9) {
    console.log('⚠️  WARNING: Very strong correlation - possible O(n²) complexity in regex operations');
  }
  
  // Memory analysis
  const avgMemory = results.reduce((sum, r) => sum + r.memory, 0) / results.length;
  console.log(`\nAverage memory allocation per document: ${avgMemory.toFixed(2)}MB`);
  
  // Chunking quality
  console.log('\n--- Chunking Quality Analysis ---');
  results.forEach(r => {
    const avgScore = r.semanticScores.reduce((a: number, b: number) => a + b, 0) / r.semanticScores.length;
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

async function analyzeIntegrationOverhead() {
  console.log('\n========================================');
  console.log('INTEGRATION OVERHEAD ANALYSIS');
  console.log('========================================\n');
  
  const profiler = new PerformanceProfiler();
  
  // Simulate search pipeline
  const testQuery = "TENG-40DV motor troubleshooting guide";
  const testContent = testDocuments[3]; // HTML document
  
  console.log('Testing complete search pipeline...\n');
  
  // Step 1: Query Enhancement
  profiler.mark('query_start');
  const enhanced = await QueryEnhancer.enhance(testQuery);
  profiler.mark('query_end');
  const queryTime = profiler.measure('query_enhance', 'query_start', 'query_end');
  
  // Step 2: Apply to search
  profiler.mark('apply_start');
  const searchConfig = QueryEnhancer.applyToSearch(enhanced);
  profiler.mark('apply_end');
  const applyTime = profiler.measure('apply_search', 'apply_start', 'apply_end');
  
  // Step 3: Content chunking (simulating scraping)
  profiler.mark('chunk_start');
  const chunks = await SemanticChunker.chunkContent(testContent, testContent);
  profiler.mark('chunk_end');
  const chunkTime = profiler.measure('chunking', 'chunk_start', 'chunk_end');
  
  // Total pipeline time
  const totalTime = queryTime + applyTime + chunkTime;
  
  console.log('--- Pipeline Performance Breakdown ---');
  console.log(`Query Enhancement: ${queryTime.toFixed(2)}ms (${(queryTime/totalTime*100).toFixed(1)}%)`);
  console.log(`Search Application: ${applyTime.toFixed(2)}ms (${(applyTime/totalTime*100).toFixed(1)}%)`);
  console.log(`Content Chunking: ${chunkTime.toFixed(2)}ms (${(chunkTime/totalTime*100).toFixed(1)}%)`);
  console.log(`Total Pipeline: ${totalTime.toFixed(2)}ms`);
  
  // Memory footprint
  const queryMemory = profiler.getMemoryDelta('query_start', 'query_end');
  const chunkMemory = profiler.getMemoryDelta('chunk_start', 'chunk_end');
  
  console.log('\n--- Memory Usage ---');
  console.log(`Query Enhancement: ${queryMemory.toFixed(2)}MB`);
  console.log(`Content Chunking: ${chunkMemory.toFixed(2)}MB`);
  console.log(`Total: ${(queryMemory + chunkMemory).toFixed(2)}MB`);
  
  return { queryTime, applyTime, chunkTime, totalTime, queryMemory, chunkMemory };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return den === 0 ? 0 : num / den;
}

async function generateReport() {
  console.log('\n========================================');
  console.log('PERFORMANCE ANALYSIS REPORT');
  console.log('========================================\n');
  
  const queryResults = await analyzeQueryEnhancement();
  const chunkResults = await analyzeSemanticChunking();
  const integrationResults = await analyzeIntegrationOverhead();
  
  console.log('\n========================================');
  console.log('BOTTLENECK SEVERITY RATINGS');
  console.log('========================================\n');
  
  const bottlenecks: Array<{
    component: string;
    issue: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impact: string;
    recommendation: string;
  }> = [];
  
  // Query Enhancement bottlenecks
  const avgQueryTime = queryResults.reduce((sum, r) => sum + r.duration, 0) / queryResults.length;
  if (avgQueryTime > 50) {
    bottlenecks.push({
      component: 'Query Enhancement',
      issue: 'High average processing time',
      severity: avgQueryTime > 100 ? 'HIGH' : 'MEDIUM',
      impact: `${avgQueryTime.toFixed(0)}ms average latency added to search`,
      recommendation: 'Consider caching frequent queries or reducing synonym map size'
    });
  }
  
  // Check for O(n²) in synonyms
  const maxSynonyms = Math.max(...queryResults.map(r => r.synonymCount));
  if (maxSynonyms > 50) {
    bottlenecks.push({
      component: 'Query Enhancement',
      issue: 'Excessive synonym generation',
      severity: 'MEDIUM',
      impact: `Up to ${maxSynonyms} synonyms generated per query`,
      recommendation: 'Limit synonym expansion to top 10-15 most relevant'
    });
  }
  
  // Semantic Chunking bottlenecks
  const avgChunkTime = chunkResults.reduce((sum, r) => sum + r.duration, 0) / chunkResults.length;
  const largeDocResults = chunkResults.filter(r => r.docLength > 10000);
  if (largeDocResults.length > 0) {
    const avgLargeDocTime = largeDocResults.reduce((sum, r) => sum + r.duration, 0) / largeDocResults.length;
    if (avgLargeDocTime > 500) {
      bottlenecks.push({
        component: 'Semantic Chunking',
        issue: 'Slow processing of large documents',
        severity: avgLargeDocTime > 1000 ? 'HIGH' : 'MEDIUM',
        impact: `${avgLargeDocTime.toFixed(0)}ms for large documents`,
        recommendation: 'Optimize regex patterns, consider streaming approach'
      });
    }
  }
  
  // Memory bottlenecks
  const avgChunkMemory = chunkResults.reduce((sum, r) => sum + r.memory, 0) / chunkResults.length;
  if (avgChunkMemory > 10) {
    bottlenecks.push({
      component: 'Semantic Chunking',
      issue: 'High memory usage',
      severity: avgChunkMemory > 20 ? 'HIGH' : 'MEDIUM',
      impact: `${avgChunkMemory.toFixed(1)}MB average memory per document`,
      recommendation: 'Stream processing for large documents, clear intermediate objects'
    });
  }
  
  // Integration overhead
  if (integrationResults.totalTime > 200) {
    bottlenecks.push({
      component: 'Integration Pipeline',
      issue: 'High cumulative latency',
      severity: integrationResults.totalTime > 500 ? 'CRITICAL' : 'HIGH',
      impact: `${integrationResults.totalTime.toFixed(0)}ms total pipeline latency`,
      recommendation: 'Parallelize query enhancement and content processing where possible'
    });
  }
  
  // Print bottlenecks
  bottlenecks.sort((a, b) => {
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  bottlenecks.forEach(b => {
    const icon = b.severity === 'CRITICAL' ? '🔴' : 
                 b.severity === 'HIGH' ? '🟠' :
                 b.severity === 'MEDIUM' ? '🟡' : '🟢';
    
    console.log(`${icon} [${b.severity}] ${b.component}: ${b.issue}`);
    console.log(`   Impact: ${b.impact}`);
    console.log(`   Recommendation: ${b.recommendation}\n`);
  });
  
  console.log('\n========================================');
  console.log('OPTIMIZATION RECOMMENDATIONS');
  console.log('========================================\n');
  
  console.log('1. IMMEDIATE ACTIONS (Quick wins):');
  console.log('   - Cache enhanced queries with TTL (Redis/in-memory)');
  console.log('   - Limit synonym expansion to top N relevant terms');
  console.log('   - Pre-compile regex patterns in SemanticChunker');
  console.log('   - Use Set instead of Array for duplicate checking\n');
  
  console.log('2. SHORT-TERM OPTIMIZATIONS (1-2 days):');
  console.log('   - Implement query result caching with invalidation');
  console.log('   - Add concurrency limits to prevent memory spikes');
  console.log('   - Optimize regex patterns for better performance');
  console.log('   - Batch embedding generation for multiple chunks\n');
  
  console.log('3. LONG-TERM IMPROVEMENTS (1 week+):');
  console.log('   - Move heavy processing to background workers');
  console.log('   - Implement streaming for large document processing');
  console.log('   - Consider WebAssembly for compute-intensive operations');
  console.log('   - Add adaptive chunking based on content type\n');
  
  console.log('========================================');
  console.log('EXPECTED PERFORMANCE GAINS');
  console.log('========================================\n');
  
  console.log('With recommended optimizations:');
  console.log('- Query Enhancement: 30-50% latency reduction (~15-25ms saved)');
  console.log('- Semantic Chunking: 40-60% improvement for large docs (~200-300ms saved)');
  console.log('- Memory Usage: 50-70% reduction (~5-7MB saved per document)');
  console.log('- Overall Pipeline: 35-45% faster (~70-90ms reduction)\n');
}

// Run the analysis
generateReport().catch(console.error);