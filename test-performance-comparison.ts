/**
 * Performance Comparison: Original vs Optimized Chat API
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface TestResult {
  endpoint: string;
  query: string;
  firstByteTime?: number;
  totalTime: number;
  success: boolean;
  responsePreview?: string;
  error?: string;
}

class PerformanceComparison {
  private results: TestResult[] = [];

  async testEndpoint(
    endpoint: string,
    query: string,
    useStreaming: boolean = false
  ): Promise<TestResult> {
    const startTime = Date.now();
    let firstByteTime: number | undefined;
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          session_id: 'perf-test-' + Date.now(),
          domain: 'test.example.com',
          stream: useStreaming
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!firstByteTime) {
        firstByteTime = Date.now() - startTime;
      }

      let content = '';
      
      if (useStreaming && response.body) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.content) {
                content += data.content;
              }
              if (data.done) {
                break;
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      } else {
        // Handle regular response
        const data = await response.json();
        content = data.content || data.message || '';
      }

      const totalTime = Date.now() - startTime;
      
      return {
        endpoint,
        query,
        firstByteTime,
        totalTime,
        success: response.ok,
        responsePreview: content.substring(0, 100)
      };

    } catch (error) {
      return {
        endpoint,
        query,
        totalTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async runComparison(): Promise<void> {
    console.log('⚡ Performance Comparison: Original vs Optimized Chat API');
    console.log('=' .repeat(60));
    
    const testQueries = [
      'Hello',
      'What are your business hours?',
      'Do you sell hydraulic pumps?',
      'I need to track my order'
    ];

    for (const query of testQueries) {
      console.log(`\n📝 Testing: "${query}"`);
      console.log('─'.repeat(60));

      // Test original endpoint
      console.log('\n1️⃣ Original API (/api/chat):');
      const originalResult = await this.testEndpoint('/api/chat', query, false);
      this.displayResult(originalResult);
      this.results.push(originalResult);

      // Small delay
      await new Promise(r => setTimeout(r, 500));

      // Test optimized endpoint without streaming
      console.log('\n2️⃣ Optimized API - No Streaming (/api/chat-optimized):');
      const optimizedResult = await this.testEndpoint('/api/chat-optimized', query, false);
      this.displayResult(optimizedResult);
      this.results.push(optimizedResult);

      // Small delay
      await new Promise(r => setTimeout(r, 500));

      // Test optimized endpoint with streaming
      console.log('\n3️⃣ Optimized API - With Streaming (/api/chat-optimized):');
      const streamingResult = await this.testEndpoint('/api/chat-optimized', query, true);
      this.displayResult(streamingResult);
      this.results.push(streamingResult);

      // Calculate improvement
      if (originalResult.success && optimizedResult.success) {
        const improvement = ((originalResult.totalTime - optimizedResult.totalTime) / originalResult.totalTime * 100).toFixed(1);
        console.log(`\n📊 Improvement: ${improvement}% faster`);
        
        if (streamingResult.success && streamingResult.firstByteTime) {
          const perceivedImprovement = ((originalResult.totalTime - streamingResult.firstByteTime) / originalResult.totalTime * 100).toFixed(1);
          console.log(`📊 Perceived Improvement (streaming): ${perceivedImprovement}% faster to first byte`);
        }
      }
    }

    this.generateSummary();
  }

  private displayResult(result: TestResult): void {
    if (result.success) {
      console.log(`   ✅ Success`);
      console.log(`   ⏱️  Total Time: ${result.totalTime}ms ${this.getSpeedIndicator(result.totalTime)}`);
      if (result.firstByteTime) {
        console.log(`   ⚡ First Byte: ${result.firstByteTime}ms`);
      }
      if (result.responsePreview) {
        console.log(`   📄 Response: "${result.responsePreview}..."`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      console.log(`   ⏱️  Time: ${result.totalTime}ms`);
    }
  }

  private getSpeedIndicator(ms: number): string {
    if (ms < 1000) return '🚀 Excellent';
    if (ms < 3000) return '✅ Good';
    if (ms < 5000) return '⚠️ Slow';
    return '❌ Too Slow';
  }

  private generateSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE COMPARISON SUMMARY');
    console.log('='.repeat(60));

    // Calculate averages by endpoint
    const endpoints = ['/api/chat', '/api/chat-optimized'];
    
    for (const endpoint of endpoints) {
      const endpointResults = this.results.filter(r => r.endpoint === endpoint);
      if (endpointResults.length === 0) continue;
      
      const avgTime = endpointResults.reduce((sum, r) => sum + r.totalTime, 0) / endpointResults.length;
      const successRate = endpointResults.filter(r => r.success).length / endpointResults.length * 100;
      
      console.log(`\n${endpoint}:`);
      console.log(`   Average Time: ${avgTime.toFixed(0)}ms ${this.getSpeedIndicator(avgTime)}`);
      console.log(`   Success Rate: ${successRate.toFixed(0)}%`);
      
      // For streaming results
      const streamingResults = endpointResults.filter(r => r.firstByteTime);
      if (streamingResults.length > 0) {
        const avgFirstByte = streamingResults.reduce((sum, r) => sum + (r.firstByteTime || 0), 0) / streamingResults.length;
        console.log(`   Avg First Byte (streaming): ${avgFirstByte.toFixed(0)}ms`);
      }
    }

    // Overall comparison
    const originalAvg = this.results
      .filter(r => r.endpoint === '/api/chat')
      .reduce((sum, r) => sum + r.totalTime, 0) / 
      this.results.filter(r => r.endpoint === '/api/chat').length;

    const optimizedAvg = this.results
      .filter(r => r.endpoint === '/api/chat-optimized' && !r.firstByteTime)
      .reduce((sum, r) => sum + r.totalTime, 0) / 
      this.results.filter(r => r.endpoint === '/api/chat-optimized' && !r.firstByteTime).length;

    if (originalAvg && optimizedAvg) {
      const overallImprovement = ((originalAvg - optimizedAvg) / originalAvg * 100).toFixed(1);
      console.log(`\n🎯 Overall Performance Gain: ${overallImprovement}%`);
      console.log(`   Original: ${originalAvg.toFixed(0)}ms avg`);
      console.log(`   Optimized: ${optimizedAvg.toFixed(0)}ms avg`);
    }

    console.log('\n💡 Recommendations:');
    if (originalAvg > 5000) {
      console.log('   ✅ Switch to optimized endpoint immediately');
      console.log('   ✅ Enable streaming for better perceived performance');
      console.log('   ✅ Consider implementing caching for common queries');
    } else if (originalAvg > 3000) {
      console.log('   ⚠️ Performance is marginal, optimization recommended');
      console.log('   ✅ Test optimized endpoint in production');
    } else {
      console.log('   ✅ Performance is acceptable');
      console.log('   💡 Consider streaming for better UX');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Performance Comparison...\n');
  console.log('⚠️  Ensure dev server is running on port 3000\n');
  
  const comparison = new PerformanceComparison();
  await comparison.runComparison();
  
  console.log('\n✅ Comparison Complete');
}

main().catch(console.error);