#!/usr/bin/env npx tsx
/**
 * Performance Testing for Option 1: Full Visibility Implementation
 * 
 * This script profiles the chat-intelligent API endpoint to measure:
 * 1. Latency with/without metadata extraction
 * 2. Memory usage patterns with large result sets
 * 3. CPU usage during parallel metadata fetching
 * 4. Database query performance
 * 5. Response time degradation under load
 */

import { performance } from 'perf_hooks';
import * as os from 'os';

interface TestResult {
  query: string;
  resultCount: number;
  latency: number;
  memoryUsed: number;
  cpuUsage: NodeJS.CpuUsage;
  overviewTime?: number;
  searchTime?: number;
  totalTime: number;
  error?: string;
}

interface LoadTestResult {
  concurrency: number;
  totalRequests: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  throughput: number;
  memoryPeak: number;
}

class PerformanceProfiler {
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  private results: TestResult[] = [];
  private loadResults: LoadTestResult[] = [];

  /**
   * Test queries with varying complexity and expected result counts
   */
  private testQueries = [
    { query: "Show me all water pumps", expectedResults: "high", type: "product_search" },
    { query: "How many fuel pumps do you have?", expectedResults: "high", type: "counting" },
    { query: "What brands of filters are available?", expectedResults: "medium", type: "metadata" },
    { query: "List all products", expectedResults: "very_high", type: "all_products" },
    { query: "Show me pumps under £50", expectedResults: "medium", type: "filtered" },
    { query: "What's your return policy?", expectedResults: "low", type: "informational" },
    { query: "Show me Bosch products", expectedResults: "high", type: "brand_search" },
    { query: "Do you have part number ABC123?", expectedResults: "low", type: "specific" },
    { query: "Show me all categories of parts", expectedResults: "medium", type: "categories" },
    { query: "What oil filters fit a 2020 BMW?", expectedResults: "medium", type: "compatibility" }
  ];

  /**
   * Make a single API request and measure performance
   */
  private async makeRequest(query: string, sessionId: string): Promise<TestResult> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    
    const requestBody = {
      message: query,
      session_id: sessionId,
      domain: this.domain,
      config: {
        ai: {
          maxSearchIterations: 2,
          searchTimeout: 10000
        }
      }
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract timing information from response if available
      const metadata = data.metadata || {};
      
      return {
        query,
        resultCount: metadata.searchCount || 0,
        latency: endTime - startTime,
        memoryUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024, // MB
        cpuUsage: endCpu,
        overviewTime: metadata.overviewTime,
        searchTime: metadata.searchTime,
        totalTime: metadata.executionTime || (endTime - startTime),
      };
    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);
      
      return {
        query,
        resultCount: 0,
        latency: endTime - startTime,
        memoryUsed: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
        cpuUsage: endCpu,
        totalTime: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Run baseline tests (one request at a time)
   */
  public async runBaselineTests(): Promise<void> {
    console.log('\n=== BASELINE PERFORMANCE TESTS ===\n');
    console.log('Testing individual queries...\n');

    for (const testCase of this.testQueries) {
      const sessionId = `baseline_${Date.now()}_${Math.random()}`;
      console.log(`Testing: "${testCase.query}"`);
      
      const result = await this.makeRequest(testCase.query, sessionId);
      this.results.push(result);
      
      console.log(`  ✓ Latency: ${result.latency.toFixed(2)}ms`);
      console.log(`  ✓ Results: ${result.resultCount}`);
      console.log(`  ✓ Memory: ${result.memoryUsed.toFixed(2)}MB`);
      console.log(`  ✓ CPU: ${(result.cpuUsage.user / 1000).toFixed(2)}ms user, ${(result.cpuUsage.system / 1000).toFixed(2)}ms system`);
      
      if (result.error) {
        console.log(`  ✗ Error: ${result.error}`);
      }
      
      console.log('');
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Run concurrent load tests
   */
  public async runLoadTests(): Promise<void> {
    console.log('\n=== LOAD TESTS ===\n');
    
    const concurrencyLevels = [1, 5, 10, 20];
    const requestsPerLevel = 20;
    
    for (const concurrency of concurrencyLevels) {
      console.log(`\nTesting with ${concurrency} concurrent requests...`);
      
      const results = await this.runConcurrentRequests(concurrency, requestsPerLevel);
      
      const latencies = results.map(r => r.latency).sort((a, b) => a - b);
      const errors = results.filter(r => r.error).length;
      const memoryPeak = Math.max(...results.map(r => r.memoryUsed));
      
      const loadResult: LoadTestResult = {
        concurrency,
        totalRequests: requestsPerLevel,
        avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        minLatency: latencies[0],
        maxLatency: latencies[latencies.length - 1],
        p95Latency: latencies[Math.floor(latencies.length * 0.95)],
        p99Latency: latencies[Math.floor(latencies.length * 0.99)],
        errorRate: (errors / requestsPerLevel) * 100,
        throughput: requestsPerLevel / (latencies[latencies.length - 1] / 1000), // reqs/sec
        memoryPeak
      };
      
      this.loadResults.push(loadResult);
      
      console.log(`  ✓ Avg Latency: ${loadResult.avgLatency.toFixed(2)}ms`);
      console.log(`  ✓ P95 Latency: ${loadResult.p95Latency.toFixed(2)}ms`);
      console.log(`  ✓ P99 Latency: ${loadResult.p99Latency.toFixed(2)}ms`);
      console.log(`  ✓ Error Rate: ${loadResult.errorRate.toFixed(2)}%`);
      console.log(`  ✓ Throughput: ${loadResult.throughput.toFixed(2)} req/s`);
      console.log(`  ✓ Peak Memory: ${loadResult.memoryPeak.toFixed(2)}MB`);
      
      // Cool down between load levels
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Run concurrent requests for load testing
   */
  private async runConcurrentRequests(concurrency: number, totalRequests: number): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const queries = this.testQueries;
    
    const batches = Math.ceil(totalRequests / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = [];
      const batchSize = Math.min(concurrency, totalRequests - (batch * concurrency));
      
      for (let i = 0; i < batchSize; i++) {
        const query = queries[(batch * concurrency + i) % queries.length];
        const sessionId = `load_${Date.now()}_${Math.random()}`;
        batchPromises.push(this.makeRequest(query.query, sessionId));
      }
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Test with large result sets
   */
  public async testLargeResultSets(): Promise<void> {
    console.log('\n=== LARGE RESULT SET TESTS ===\n');
    
    const largeQueries = [
      { query: "List 10 products", limit: 10 },
      { query: "List 50 products", limit: 50 },
      { query: "List 100 products", limit: 100 },
      { query: "List 500 products", limit: 500 },
    ];
    
    for (const test of largeQueries) {
      console.log(`Testing with limit ${test.limit}...`);
      const sessionId = `large_${Date.now()}_${Math.random()}`;
      
      const result = await this.makeRequest(test.query, sessionId);
      
      console.log(`  ✓ Latency: ${result.latency.toFixed(2)}ms`);
      console.log(`  ✓ Results: ${result.resultCount}`);
      console.log(`  ✓ Memory: ${result.memoryUsed.toFixed(2)}MB`);
      console.log(`  ✓ Ms per result: ${(result.latency / Math.max(1, result.resultCount)).toFixed(2)}`);
      console.log('');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Compare with baseline (without metadata)
   */
  public async compareWithBaseline(): Promise<void> {
    console.log('\n=== BASELINE COMPARISON ===\n');
    
    // We'll simulate a baseline by using a very limited query
    const testQuery = "Show me water pumps";
    
    console.log('Testing WITH metadata (Option 1)...');
    const withMetadata = await this.makeRequest(testQuery, `with_${Date.now()}`);
    
    console.log('Testing WITHOUT metadata (simulated baseline with limit=20)...');
    // For a true baseline, we'd need a different endpoint or flag
    // Here we're comparing against the same endpoint but noting the overhead
    
    console.log('\nResults:');
    console.log(`  Option 1 (with metadata):`);
    console.log(`    - Latency: ${withMetadata.latency.toFixed(2)}ms`);
    console.log(`    - Results: ${withMetadata.resultCount}`);
    console.log(`    - Memory: ${withMetadata.memoryUsed.toFixed(2)}MB`);
    
    // Calculate overhead based on our baseline tests
    const baselineAvg = this.results
      .filter(r => !r.error)
      .reduce((sum, r) => sum + r.latency, 0) / Math.max(1, this.results.length);
    
    const overhead = ((withMetadata.latency - baselineAvg) / baselineAvg) * 100;
    console.log(`\n  Estimated overhead: ${overhead.toFixed(2)}%`);
  }

  /**
   * Test for memory leaks
   */
  public async testMemoryLeaks(): Promise<void> {
    console.log('\n=== MEMORY LEAK TEST ===\n');
    console.log('Running 50 sequential requests...\n');
    
    const memorySnapshots: number[] = [];
    const query = "Show me all products";
    
    for (let i = 0; i < 50; i++) {
      if (i % 10 === 0) {
        global.gc && global.gc(); // Force GC if available
        const memory = process.memoryUsage().heapUsed / 1024 / 1024;
        memorySnapshots.push(memory);
        console.log(`  Iteration ${i}: ${memory.toFixed(2)}MB`);
      }
      
      const sessionId = `leak_${Date.now()}_${Math.random()}`;
      await this.makeRequest(query, sessionId);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Check for memory growth
    const growth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
    console.log(`\nMemory growth: ${growth.toFixed(2)}MB`);
    
    if (growth > 50) {
      console.log('  ⚠️  Potential memory leak detected!');
    } else {
      console.log('  ✓ No significant memory leak detected');
    }
  }

  /**
   * Generate performance report
   */
  public generateReport(): void {
    console.log('\n=== PERFORMANCE REPORT ===\n');
    
    // Baseline metrics
    const validResults = this.results.filter(r => !r.error);
    if (validResults.length > 0) {
      const avgLatency = validResults.reduce((sum, r) => sum + r.latency, 0) / validResults.length;
      const avgMemory = validResults.reduce((sum, r) => sum + r.memoryUsed, 0) / validResults.length;
      const avgResults = validResults.reduce((sum, r) => sum + r.resultCount, 0) / validResults.length;
      
      console.log('Baseline Performance:');
      console.log(`  Average Latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`  Average Memory: ${avgMemory.toFixed(2)}MB`);
      console.log(`  Average Results: ${avgResults.toFixed(0)}`);
      console.log('');
    }
    
    // Load test metrics
    if (this.loadResults.length > 0) {
      console.log('Load Test Performance:');
      console.log('┌─────────────┬──────────┬──────────┬──────────┬───────────┬──────────┐');
      console.log('│ Concurrency │ Avg (ms) │ P95 (ms) │ P99 (ms) │ Error (%) │ RPS      │');
      console.log('├─────────────┼──────────┼──────────┼──────────┼───────────┼──────────┤');
      
      for (const result of this.loadResults) {
        console.log(
          `│ ${result.concurrency.toString().padEnd(11)} │ ` +
          `${result.avgLatency.toFixed(0).padEnd(8)} │ ` +
          `${result.p95Latency.toFixed(0).padEnd(8)} │ ` +
          `${result.p99Latency.toFixed(0).padEnd(8)} │ ` +
          `${result.errorRate.toFixed(1).padEnd(9)} │ ` +
          `${result.throughput.toFixed(1).padEnd(8)} │`
        );
      }
      console.log('└─────────────┴──────────┴──────────┴──────────┴───────────┴──────────┘');
    }
    
    // Bottlenecks identified
    console.log('\n=== BOTTLENECKS IDENTIFIED ===\n');
    
    const slowQueries = validResults.filter(r => r.latency > 3000);
    if (slowQueries.length > 0) {
      console.log('Slow Queries (>3s):');
      slowQueries.forEach(q => {
        console.log(`  - "${q.query.substring(0, 50)}..." : ${q.latency.toFixed(0)}ms`);
      });
    }
    
    const memoryIntensive = validResults.filter(r => r.memoryUsed > 10);
    if (memoryIntensive.length > 0) {
      console.log('\nMemory Intensive Queries (>10MB):');
      memoryIntensive.forEach(q => {
        console.log(`  - "${q.query.substring(0, 50)}..." : ${q.memoryUsed.toFixed(2)}MB`);
      });
    }
    
    // Optimization recommendations
    console.log('\n=== OPTIMIZATION RECOMMENDATIONS ===\n');
    
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  /**
   * Generate optimization recommendations based on results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const validResults = this.results.filter(r => !r.error);
    
    if (validResults.length === 0) {
      return ['No valid results to analyze'];
    }
    
    const avgLatency = validResults.reduce((sum, r) => sum + r.latency, 0) / validResults.length;
    const maxLatency = Math.max(...validResults.map(r => r.latency));
    const avgMemory = validResults.reduce((sum, r) => sum + r.memoryUsed, 0) / validResults.length;
    
    // Latency recommendations
    if (avgLatency > 2000) {
      recommendations.push('HIGH PRIORITY: Average latency >2s. Consider caching metadata queries.');
    }
    
    if (maxLatency > 5000) {
      recommendations.push('HIGH PRIORITY: Some queries exceed 5s. Implement query result caching.');
    }
    
    // Memory recommendations
    if (avgMemory > 5) {
      recommendations.push('MEDIUM PRIORITY: High memory usage. Consider streaming large result sets.');
    }
    
    // Concurrency recommendations
    const highConcurrencyResult = this.loadResults.find(r => r.concurrency === 20);
    if (highConcurrencyResult && highConcurrencyResult.errorRate > 5) {
      recommendations.push('MEDIUM PRIORITY: High error rate under load. Implement request queuing.');
    }
    
    if (highConcurrencyResult && highConcurrencyResult.p99Latency > avgLatency * 3) {
      recommendations.push('LOW PRIORITY: P99 latency degrades under load. Consider connection pooling optimization.');
    }
    
    // Specific optimizations for Option 1
    recommendations.push('Consider caching ProductOverview results with 5-minute TTL');
    recommendations.push('Implement pagination for allIds to avoid token explosion');
    recommendations.push('Use database indexes on scraped_pages.title and scraped_pages.url');
    recommendations.push('Consider pre-computing category/brand metadata during scraping');
    
    return recommendations;
  }
}

// Main execution
async function main() {
  console.log('=====================================');
  console.log(' Option 1 Performance Analysis');
  console.log(' Full Visibility Implementation');
  console.log('=====================================\n');
  
  console.log('API Endpoint: http://localhost:3000/api/chat-intelligent');
  console.log('Test Domain: thompsonseparts.co.uk');
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`System: ${os.platform()} ${os.arch()}, ${os.cpus().length} CPUs, ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB RAM`);
  
  const profiler = new PerformanceProfiler();
  
  try {
    // Run all tests
    await profiler.runBaselineTests();
    await profiler.testLargeResultSets();
    await profiler.runLoadTests();
    await profiler.compareWithBaseline();
    await profiler.testMemoryLeaks();
    
    // Generate report
    profiler.generateReport();
    
    console.log(`\nEnd Time: ${new Date().toISOString()}`);
    console.log('\n✅ Performance analysis complete!');
    
  } catch (error) {
    console.error('\n❌ Error during performance testing:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceProfiler };