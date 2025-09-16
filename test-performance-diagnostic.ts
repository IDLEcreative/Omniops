/**
 * Performance Diagnostic Tool for Chat API
 * Identifies bottlenecks and slow operations
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface PerformanceMetric {
  operation: string;
  duration: number;
  details?: any;
}

class PerformanceDiagnostic {
  private metrics: PerformanceMetric[] = [];

  async measureAPIResponse(query: string, withContext: boolean = false): Promise<void> {
    console.log(`\n🔍 Testing: "${query}"`);
    console.log('─'.repeat(50));
    
    const startTotal = Date.now();
    const metrics: PerformanceMetric[] = [];
    
    try {
      // Measure request preparation
      const prepStart = Date.now();
      const requestBody = {
        message: query,
        session_id: 'perf-test-' + Date.now(),
        domain: 'test.example.com',
        config: withContext ? {
          features: {
            websiteScraping: { enabled: true }
          }
        } : undefined
      };
      metrics.push({
        operation: 'Request Preparation',
        duration: Date.now() - prepStart
      });

      // Measure API call
      const apiStart = Date.now();
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000)
      });
      const apiDuration = Date.now() - apiStart;
      metrics.push({
        operation: 'API Call Total',
        duration: apiDuration,
        details: { status: response.status }
      });

      // Measure response parsing
      const parseStart = Date.now();
      const data = await response.json();
      metrics.push({
        operation: 'Response Parsing',
        duration: Date.now() - parseStart,
        details: { 
          responseLength: JSON.stringify(data).length,
          hasContent: !!data.content 
        }
      });

      // Total duration
      const totalDuration = Date.now() - startTotal;
      metrics.push({
        operation: 'Total Time',
        duration: totalDuration
      });

      // Display results
      this.displayMetrics(metrics);
      
      // Store for analysis
      this.metrics.push(...metrics);

      // Show response preview
      if (data.content) {
        console.log(`\n📝 Response Preview: "${data.content.substring(0, 100)}..."`);
      }

    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      metrics.push({
        operation: 'Error',
        duration: Date.now() - startTotal,
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      });
      this.displayMetrics(metrics);
    }
  }

  private displayMetrics(metrics: PerformanceMetric[]): void {
    console.log('\n📊 Performance Breakdown:');
    
    for (const metric of metrics) {
      const bar = this.getPerformanceBar(metric.duration);
      const status = this.getPerformanceStatus(metric.duration);
      
      console.log(`   ${metric.operation}: ${metric.duration}ms ${bar} ${status}`);
      if (metric.details) {
        console.log(`     └─ ${JSON.stringify(metric.details)}`);
      }
    }
  }

  private getPerformanceBar(duration: number): string {
    const maxBar = 20;
    const maxDuration = 10000; // 10 seconds max
    const barLength = Math.min(Math.floor((duration / maxDuration) * maxBar), maxBar);
    return '█'.repeat(barLength) + '░'.repeat(maxBar - barLength);
  }

  private getPerformanceStatus(duration: number): string {
    if (duration < 1000) return '✅ Fast';
    if (duration < 3000) return '⚡ Acceptable';
    if (duration < 5000) return '⚠️ Slow';
    return '❌ Too Slow';
  }

  async runDiagnosticSuite(): Promise<void> {
    console.log('🏥 Chat API Performance Diagnostic');
    console.log('=' .repeat(50));
    console.log('Running performance tests...\n');

    const tests = [
      { query: 'Hello', context: false, description: 'Simple greeting (baseline)' },
      { query: 'What are your business hours?', context: false, description: 'General inquiry' },
      { query: 'Do you sell pumps?', context: true, description: 'Product search with context' },
      { query: 'Track order #12345', context: false, description: 'Order tracking request' },
      { query: 'My email is test@example.com', context: true, description: 'Customer verification' }
    ];

    for (const test of tests) {
      console.log(`\n🔬 Test: ${test.description}`);
      await this.measureAPIResponse(test.query, test.context);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.generateSummaryReport();
  }

  private generateSummaryReport(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📈 PERFORMANCE SUMMARY REPORT');
    console.log('='.repeat(50));

    // Group metrics by operation type
    const operationAverages = new Map<string, number[]>();
    
    for (const metric of this.metrics) {
      if (!operationAverages.has(metric.operation)) {
        operationAverages.set(metric.operation, []);
      }
      operationAverages.get(metric.operation)!.push(metric.duration);
    }

    console.log('\n📊 Average Times by Operation:');
    for (const [operation, durations] of operationAverages) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      
      console.log(`\n   ${operation}:`);
      console.log(`     Average: ${avg.toFixed(0)}ms ${this.getPerformanceStatus(avg)}`);
      console.log(`     Range: ${min}ms - ${max}ms`);
    }

    // Identify bottlenecks
    const bottlenecks = this.metrics
      .filter(m => m.duration > 5000 && m.operation !== 'Total Time')
      .sort((a, b) => b.duration - a.duration);

    if (bottlenecks.length > 0) {
      console.log('\n⚠️ Identified Bottlenecks:');
      bottlenecks.slice(0, 3).forEach(b => {
        console.log(`   - ${b.operation}: ${b.duration}ms`);
        if (b.details) {
          console.log(`     Details: ${JSON.stringify(b.details)}`);
        }
      });
    }

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    
    const avgApiTime = operationAverages.get('API Call Total');
    if (avgApiTime && avgApiTime[0] > 3000) {
      console.log('   1. API Response Time Issues:');
      console.log('      - Enable response streaming');
      console.log('      - Optimize database queries');
      console.log('      - Add caching layer');
    }

    if (bottlenecks.some(b => b.operation.includes('Context'))) {
      console.log('   2. Context Retrieval Issues:');
      console.log('      - Optimize embedding search');
      console.log('      - Reduce context chunk size');
      console.log('      - Pre-warm context cache');
    }

    console.log('\n' + '='.repeat(50));
  }

  async measureDatabasePerformance(): Promise<void> {
    console.log('\n🗄️ Database Performance Check');
    console.log('─'.repeat(50));

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test various database operations
    const dbTests = [
      {
        name: 'Simple SELECT',
        query: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('customer_configs')
            .select('id')
            .limit(1);
          return { duration: Date.now() - start, error };
        }
      },
      {
        name: 'Embedding Search',
        query: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .rpc('search_embeddings', {
              query_embedding: Array(1536).fill(0.1), // Mock embedding
              match_threshold: 0.7,
              match_count: 10
            });
          return { duration: Date.now() - start, error };
        }
      },
      {
        name: 'Full-text Search',
        query: async () => {
          const start = Date.now();
          const { data, error } = await supabase
            .from('scraped_pages')
            .select('url, title')
            .textSearch('content', 'pump')
            .limit(5);
          return { duration: Date.now() - start, error };
        }
      }
    ];

    for (const test of dbTests) {
      try {
        const result = await test.query();
        console.log(`   ${test.name}: ${result.duration}ms ${this.getPerformanceStatus(result.duration)}`);
        if (result.error) {
          console.log(`     └─ Error: ${result.error.message}`);
        }
      } catch (error) {
        console.log(`   ${test.name}: ❌ Failed`);
        console.log(`     └─ ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

// Main execution
async function main() {
  const diagnostic = new PerformanceDiagnostic();
  
  console.log('🚀 Starting Performance Diagnostic...\n');
  console.log('⚠️  Ensure the dev server is running on port 3000\n');
  
  // Run full diagnostic suite
  await diagnostic.runDiagnosticSuite();
  
  // Also check database performance
  await diagnostic.measureDatabasePerformance();
  
  console.log('\n✅ Diagnostic Complete');
}

main().catch(console.error);