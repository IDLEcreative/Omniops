#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TestResult {
  testName: string;
  metrics: {
    responseTimes: number[];
    errorCount: number;
    successCount: number;
    rateLimit429Count: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    mean: number;
    throughput: number;
    totalDuration: number;
  };
  errors: string[];
  memoryUsage?: NodeJS.MemoryUsage;
}

interface PerformanceReport {
  timestamp: string;
  systemInfo: {
    platform: string;
    nodeVersion: string;
    memoryTotal: number;
  };
  tests: TestResult[];
  summary: {
    totalRequests: number;
    totalErrors: number;
    overallThroughput: number;
    recommendations: string[];
  };
}

class PerformanceTester {
  private baseUrl = 'http://localhost:3000/api/chat';
  private results: TestResult[] = [];
  private startMemory: NodeJS.MemoryUsage;

  constructor() {
    this.startMemory = process.memoryUsage();
  }

  private async makeRequest(message: string, options: RequestInit = {}): Promise<{
    responseTime: number;
    status: number;
    error?: string;
    data?: any;
  }> {
    const start = performance.now();
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          domain: 'localhost',
          session_id: `perf-test-${Date.now()}`,
        }),
        ...options,
      });

      const responseTime = performance.now() - start;
      let data = null;
      
      try {
        data = await response.json();
      } catch (e) {
        // Response might not be JSON
      }

      return {
        responseTime,
        status: response.status,
        data,
      };
    } catch (error) {
      return {
        responseTime: performance.now() - start,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private calculatePercentile(times: number[], percentile: number): number {
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private analyzeMetrics(responseTimes: number[], errors: string[], duration: number, rateLimitCount: number): TestResult['metrics'] {
    const successTimes = responseTimes.filter(t => t > 0);
    const successCount = successTimes.length;
    const errorCount = errors.length;
    
    return {
      responseTimes: successTimes,
      errorCount,
      successCount,
      rateLimit429Count: rateLimitCount,
      p50: this.calculatePercentile(successTimes, 50),
      p95: this.calculatePercentile(successTimes, 95),
      p99: this.calculatePercentile(successTimes, 99),
      min: Math.min(...successTimes) || 0,
      max: Math.max(...successTimes) || 0,
      mean: successTimes.reduce((a, b) => a + b, 0) / successTimes.length || 0,
      throughput: successCount / (duration / 1000), // requests per second
      totalDuration: duration,
    };
  }

  async testLoadSequential(requestCount: number = 50): Promise<TestResult> {
    console.log(`\n🚀 Starting Load Test: ${requestCount} sequential requests...`);
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let rateLimitCount = 0;
    const testStart = performance.now();

    for (let i = 0; i < requestCount; i++) {
      const message = `Load test message ${i + 1}: What products do you have?`;
      const result = await this.makeRequest(message);
      
      if (result.status === 429) {
        rateLimitCount++;
        console.log(`  Rate limited at request ${i + 1}`);
      } else if (result.error || result.status >= 400) {
        errors.push(result.error || `HTTP ${result.status}`);
        console.log(`  ❌ Request ${i + 1}: Error - ${result.error || `HTTP ${result.status}`}`);
      } else {
        responseTimes.push(result.responseTime);
        console.log(`  ✓ Request ${i + 1}: ${result.responseTime.toFixed(2)}ms`);
      }
      
      // Show progress every 10 requests
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${requestCount} completed`);
      }
    }

    const duration = performance.now() - testStart;
    const metrics = this.analyzeMetrics(responseTimes, errors, duration, rateLimitCount);
    
    return {
      testName: 'Sequential Load Test',
      metrics,
      errors: errors.slice(0, 5), // Limit error reporting
      memoryUsage: process.memoryUsage(),
    };
  }

  async testConcurrent(batchSize: number = 10, batches: number = 5): Promise<TestResult> {
    console.log(`\n🚀 Starting Concurrent Test: ${batchSize} simultaneous requests x ${batches} batches...`);
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let rateLimitCount = 0;
    const testStart = performance.now();

    for (let batch = 0; batch < batches; batch++) {
      console.log(`  Batch ${batch + 1}/${batches}: Sending ${batchSize} concurrent requests...`);
      
      const promises = Array.from({ length: batchSize }, (_, i) => {
        const message = `Concurrent test B${batch + 1}R${i + 1}: Show me your best sellers`;
        return this.makeRequest(message);
      });

      const results = await Promise.all(promises);
      
      results.forEach((result, i) => {
        if (result.status === 429) {
          rateLimitCount++;
        } else if (result.error || result.status >= 400) {
          errors.push(result.error || `HTTP ${result.status}`);
        } else {
          responseTimes.push(result.responseTime);
        }
      });

      console.log(`  Batch ${batch + 1} complete: ${results.filter(r => r.status === 200).length} successful`);
      
      // Small delay between batches to avoid overwhelming
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const duration = performance.now() - testStart;
    const metrics = this.analyzeMetrics(responseTimes, errors, duration, rateLimitCount);
    
    return {
      testName: 'Concurrent Request Test',
      metrics,
      errors: errors.slice(0, 5),
      memoryUsage: process.memoryUsage(),
    };
  }

  async testLargeData(): Promise<TestResult> {
    console.log(`\n🚀 Starting Large Data Test...`);
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let rateLimitCount = 0;
    const testStart = performance.now();

    const testCases = [
      {
        name: 'Maximum length message (1000 chars)',
        message: 'A'.repeat(1000),
      },
      {
        name: 'Complex nested query',
        message: 'I need help with multiple things: First, show me all products under $50 that are in stock and have good reviews. Second, explain your return policy for international orders. Third, check if you have any discounts for bulk orders over 100 items. Fourth, tell me about shipping times to Europe, Asia, and South America. Finally, what payment methods do you accept and do you offer payment plans?',
      },
      {
        name: 'Data-heavy response trigger',
        message: 'List all your products with full details including prices, descriptions, availability, shipping options, and customer reviews. Also include any current promotions or discounts.',
      },
      {
        name: 'Unicode and special characters',
        message: '测试 🎯 Can you help with ñoño products? Привет! מה שלומך? مرحبا 🚀💰📦',
      },
      {
        name: 'SQL injection attempt (security test)',
        message: "'; DROP TABLE users; -- Can you show me products?",
      },
    ];

    for (const testCase of testCases) {
      console.log(`  Testing: ${testCase.name}`);
      const result = await this.makeRequest(testCase.message);
      
      if (result.status === 429) {
        rateLimitCount++;
      } else if (result.error || result.status >= 400) {
        errors.push(`${testCase.name}: ${result.error || `HTTP ${result.status}`}`);
        console.log(`    ❌ Error: ${result.error || `HTTP ${result.status}`}`);
      } else {
        responseTimes.push(result.responseTime);
        console.log(`    ✓ Success: ${result.responseTime.toFixed(2)}ms`);
      }
      
      // Delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const duration = performance.now() - testStart;
    const metrics = this.analyzeMetrics(responseTimes, errors, duration, rateLimitCount);
    
    return {
      testName: 'Large Data & Complex Query Test',
      metrics,
      errors,
      memoryUsage: process.memoryUsage(),
    };
  }

  async testCacheEffectiveness(): Promise<TestResult> {
    console.log(`\n🚀 Starting Cache Effectiveness Test...`);
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let rateLimitCount = 0;
    const testStart = performance.now();

    const testMessage = 'What are your store hours and contact information?';
    const iterations = 10;

    console.log('  Testing identical queries for cache hits...');
    for (let i = 0; i < iterations; i++) {
      const result = await this.makeRequest(testMessage);
      
      if (result.status === 429) {
        rateLimitCount++;
      } else if (result.error || result.status >= 400) {
        errors.push(result.error || `HTTP ${result.status}`);
      } else {
        responseTimes.push(result.responseTime);
        console.log(`    Request ${i + 1}: ${result.responseTime.toFixed(2)}ms ${i > 0 ? '(potential cache hit)' : '(initial)'}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const duration = performance.now() - testStart;
    const metrics = this.analyzeMetrics(responseTimes, errors, duration, rateLimitCount);
    
    // Analyze cache effectiveness
    if (responseTimes.length > 1) {
      const firstTime = responseTimes[0];
      const subsequentTimes = responseTimes.slice(1);
      if (firstTime !== undefined && subsequentTimes.length > 0) {
        const avgSubsequent = subsequentTimes.reduce((a, b) => a + b, 0) / subsequentTimes.length;
        const improvement = firstTime !== 0 ? ((firstTime - avgSubsequent) / firstTime) * 100 : 0;
        
        console.log(`\n  Cache Analysis:`);
        console.log(`    First request: ${firstTime.toFixed(2)}ms`);
        console.log(`    Avg subsequent: ${avgSubsequent.toFixed(2)}ms`);
        console.log(`    Cache improvement: ${improvement.toFixed(1)}%`);
      }
    }
    
    return {
      testName: 'Cache Effectiveness Test',
      metrics,
      errors,
      memoryUsage: process.memoryUsage(),
    };
  }

  async testMemoryLeaks(): Promise<TestResult> {
    console.log(`\n🚀 Starting Memory Leak Test...`);
    const responseTimes: number[] = [];
    const errors: string[] = [];
    let rateLimitCount = 0;
    const testStart = performance.now();
    
    const memorySnapshots: NodeJS.MemoryUsage[] = [];
    const iterations = 20;

    console.log('  Running repeated requests to detect memory leaks...');
    for (let i = 0; i < iterations; i++) {
      if (i % 5 === 0) {
        global.gc && global.gc(); // Force garbage collection if available
        memorySnapshots.push(process.memoryUsage());
        const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
        if (lastSnapshot) {
          console.log(`  Memory checkpoint ${i}: RSS=${(lastSnapshot.rss / 1024 / 1024).toFixed(2)}MB`);
        }
      }

      const result = await this.makeRequest(`Memory test iteration ${i}: Generic product query`);
      
      if (result.status === 429) {
        rateLimitCount++;
      } else if (result.error || result.status >= 400) {
        errors.push(result.error || `HTTP ${result.status}`);
      } else {
        responseTimes.push(result.responseTime);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = performance.now() - testStart;
    const metrics = this.analyzeMetrics(responseTimes, errors, duration, rateLimitCount);
    
    // Analyze memory trend
    if (memorySnapshots.length > 1) {
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      if (firstSnapshot && lastSnapshot) {
        const memoryGrowth = lastSnapshot.rss - firstSnapshot.rss;
        const growthMB = memoryGrowth / 1024 / 1024;
        console.log(`\n  Memory Analysis:`);
        console.log(`    Growth: ${growthMB.toFixed(2)}MB`);
        console.log(`    Potential leak: ${growthMB > 10 ? 'YES ⚠️' : 'No ✓'}`);
      }
    }
    
    return {
      testName: 'Memory Leak Detection Test',
      metrics,
      errors,
      memoryUsage: process.memoryUsage(),
    };
  }

  generateReport(): PerformanceReport {
    const totalRequests = this.results.reduce((sum, r) => sum + r.metrics.successCount + r.metrics.errorCount, 0);
    const totalErrors = this.results.reduce((sum, r) => sum + r.metrics.errorCount, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.metrics.totalDuration, 0);
    
    const recommendations = this.generateRecommendations();
    
    return {
      timestamp: new Date().toISOString(),
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryTotal: require('os').totalmem(),
      },
      tests: this.results,
      summary: {
        totalRequests,
        totalErrors,
        overallThroughput: totalRequests / (totalDuration / 1000),
        recommendations,
      },
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Analyze results for recommendations
    this.results.forEach(result => {
      if (result.metrics.p95 > 2000) {
        recommendations.push(`⚠️ High P95 latency (${result.metrics.p95.toFixed(0)}ms) in ${result.testName}. Consider optimizing database queries or implementing caching.`);
      }
      
      if (result.metrics.rateLimit429Count > 0) {
        recommendations.push(`🔒 Rate limiting triggered ${result.metrics.rateLimit429Count} times in ${result.testName}. Consider adjusting rate limits for production.`);
      }
      
      if (result.metrics.errorCount > result.metrics.successCount * 0.1) {
        recommendations.push(`❌ High error rate (${((result.metrics.errorCount / (result.metrics.successCount + result.metrics.errorCount)) * 100).toFixed(1)}%) in ${result.testName}. Investigate error handling.`);
      }
      
      if (result.metrics.throughput < 10) {
        recommendations.push(`🐌 Low throughput (${result.metrics.throughput.toFixed(1)} req/s) in ${result.testName}. Consider horizontal scaling or async processing.`);
      }
    });
    
    // Memory recommendations
    const memoryTests = this.results.filter(r => r.testName.includes('Memory'));
    if (memoryTests.length > 0) {
      const lastTest = memoryTests[memoryTests.length - 1];
      if (lastTest) {
        const lastMemory = lastTest.memoryUsage;
        if (lastMemory && (lastMemory.rss - this.startMemory.rss) > 100 * 1024 * 1024) {
          recommendations.push('💾 Significant memory growth detected. Check for memory leaks in stream processing or connection pooling.');
        }
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance metrics are within acceptable ranges.');
    }
    
    return recommendations;
  }

  async runAllTests(): Promise<void> {
    console.log('🎯 Starting Comprehensive Performance Test Suite');
    console.log('=' .repeat(60));
    
    // Run tests
    this.results.push(await this.testLoadSequential(50));
    await new Promise(resolve => setTimeout(resolve, 2000)); // Cool down
    
    this.results.push(await this.testConcurrent(10, 5));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.results.push(await this.testLargeData());
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.results.push(await this.testCacheEffectiveness());
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.results.push(await this.testMemoryLeaks());
    
    // Generate and save report
    const report = this.generateReport();
    await this.saveReport(report);
    this.printSummary(report);
  }

  private async saveReport(report: PerformanceReport): Promise<void> {
    const reportPath = path.join(process.cwd(), `performance-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Full report saved to: ${reportPath}`);
  }

  private printSummary(report: PerformanceReport): void {
    console.log('\n' + '=' .repeat(60));
    console.log('📈 PERFORMANCE TEST SUMMARY');
    console.log('=' .repeat(60));
    
    report.tests.forEach(test => {
      console.log(`\n${test.testName}:`);
      console.log(`  ✓ Success: ${test.metrics.successCount} | ✗ Errors: ${test.metrics.errorCount} | 🔒 Rate Limited: ${test.metrics.rateLimit429Count}`);
      console.log(`  📊 Response Times (ms):`);
      console.log(`     P50: ${test.metrics.p50.toFixed(0)} | P95: ${test.metrics.p95.toFixed(0)} | P99: ${test.metrics.p99.toFixed(0)}`);
      console.log(`     Min: ${test.metrics.min.toFixed(0)} | Max: ${test.metrics.max.toFixed(0)} | Mean: ${test.metrics.mean.toFixed(0)}`);
      console.log(`  ⚡ Throughput: ${test.metrics.throughput.toFixed(1)} req/s`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 OVERALL METRICS');
    console.log('=' .repeat(60));
    console.log(`  Total Requests: ${report.summary.totalRequests}`);
    console.log(`  Total Errors: ${report.summary.totalErrors}`);
    console.log(`  Error Rate: ${((report.summary.totalErrors / report.summary.totalRequests) * 100).toFixed(2)}%`);
    console.log(`  Overall Throughput: ${report.summary.overallThroughput.toFixed(1)} req/s`);
    
    console.log('\n' + '=' .repeat(60));
    console.log('💡 RECOMMENDATIONS');
    console.log('=' .repeat(60));
    report.summary.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }
}

// Run the tests
async function main() {
  const tester = new PerformanceTester();
  await tester.runAllTests();
}

main().catch(console.error);