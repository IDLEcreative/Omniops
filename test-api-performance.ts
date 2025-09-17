#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat-intelligent';

// Test queries with different complexity levels
const TEST_QUERIES = [
  { message: 'find pumps', category: 'general', complexity: 'simple' },
  { message: 'check BP-001', category: 'specific_sku', complexity: 'targeted' },
  { message: 'hydraulic pumps', category: 'product_type', complexity: 'moderate' },
  { message: 'DC66-10P', category: 'part_code', complexity: 'exact' },
  { message: 'pumps under 1000', category: 'price_query', complexity: 'filtered' },
  { message: 'agricultural equipment', category: 'category', complexity: 'broad' },
  { message: 'what products do you have', category: 'discovery', complexity: 'open' }
];

const TEST_DOMAINS = [
  'cifa.com',
  'example.com',
  'localhost'
];

interface PerformanceResult {
  query: string;
  category: string;
  complexity: string;
  domain: string;
  responseTime: number;
  firstTokenTime: number;
  totalTokens: number;
  chunksRetrieved: number;
  error?: string;
}

async function testChatEndpoint(message: string, domain: string): Promise<PerformanceResult> {
  const startTime = performance.now();
  let firstTokenTime = 0;
  let totalTokens = 0;
  let chunksRetrieved = 0;
  
  const testQuery = TEST_QUERIES.find(q => q.message === message) || { 
    message, 
    category: 'unknown', 
    complexity: 'unknown' 
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: `${crypto.randomUUID()}`,
        session_id: `perf-test-${Date.now()}`,
        domain,
        config: {
          features: {
            woocommerce: { enabled: false },
            websiteScraping: { enabled: true }
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let firstToken = true;
    
    if (!reader) {
      throw new Error('No response body');
    }
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (firstToken && value) {
        firstTokenTime = performance.now() - startTime;
        firstToken = false;
      }
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.token) {
              totalTokens++;
            }
            
            if (data.metadata) {
              chunksRetrieved = data.metadata.chunksRetrieved || chunksRetrieved;
            }
          } catch (e) {
            // Ignore parsing errors for incomplete JSON
          }
        }
      }
    }
    
    const responseTime = performance.now() - startTime;
    
    return {
      query: message,
      category: testQuery.category,
      complexity: testQuery.complexity,
      domain,
      responseTime,
      firstTokenTime,
      totalTokens,
      chunksRetrieved
    };
  } catch (error: any) {
    return {
      query: message,
      category: testQuery.category,
      complexity: testQuery.complexity,
      domain,
      responseTime: -1,
      firstTokenTime: -1,
      totalTokens: 0,
      chunksRetrieved: 0,
      error: error.message
    };
  }
}

async function runPerformanceTests() {
  console.log('========================================');
  console.log('API Endpoint Performance Test Suite');
  console.log('========================================\n');
  console.log(`Testing against: ${API_URL}\n`);
  
  // Check if the server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.error('❌ Server is not running on localhost:3000');
      console.log('Please start the server with: npm run dev\n');
      return;
    }
    console.log('✅ Server is running\n');
  } catch (error) {
    console.error('❌ Cannot connect to server:', error);
    return;
  }
  
  const results: PerformanceResult[] = [];
  const testDomain = 'example.com'; // Use a generic domain for testing
  
  console.log('🔍 Running Performance Tests...\n');
  console.log(`Testing with domain: ${testDomain}\n`);
  
  // Warm-up request
  console.log('Warming up...');
  await testChatEndpoint('hello', testDomain);
  console.log('Warm-up complete\n');
  
  // Test each query
  for (const testCase of TEST_QUERIES) {
    console.log(`Testing: "${testCase.message}" (${testCase.category} - ${testCase.complexity})`);
    
    const result = await testChatEndpoint(testCase.message, testDomain);
    results.push(result);
    
    if (result.error) {
      console.log(`  ❌ Error: ${result.error}\n`);
    } else {
      console.log(`  Response Time: ${result.responseTime.toFixed(2)}ms`);
      console.log(`  First Token: ${result.firstTokenTime.toFixed(2)}ms`);
      console.log(`  Total Tokens: ${result.totalTokens}`);
      console.log(`  Chunks Retrieved: ${result.chunksRetrieved}\n`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary statistics
  console.log('\n========================================');
  console.log('📈 Performance Summary');
  console.log('========================================\n');
  
  const successfulResults = results.filter(r => !r.error);
  
  if (successfulResults.length === 0) {
    console.log('❌ No successful test runs');
    return;
  }
  
  // Calculate aggregates
  const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
  const avgFirstToken = successfulResults.reduce((sum, r) => sum + r.firstTokenTime, 0) / successfulResults.length;
  const avgTokens = successfulResults.reduce((sum, r) => sum + r.totalTokens, 0) / successfulResults.length;
  const avgChunks = successfulResults.reduce((sum, r) => sum + r.chunksRetrieved, 0) / successfulResults.length;
  
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`Average First Token: ${avgFirstToken.toFixed(2)}ms`);
  console.log(`Average Tokens Generated: ${avgTokens.toFixed(0)}`);
  console.log(`Average Chunks Retrieved: ${avgChunks.toFixed(0)}`);
  
  // Performance by complexity
  console.log('\nPerformance by Query Complexity:');
  const complexities = [...new Set(successfulResults.map(r => r.complexity))];
  for (const complexity of complexities) {
    const complexityResults = successfulResults.filter(r => r.complexity === complexity);
    const avgTime = complexityResults.reduce((sum, r) => sum + r.responseTime, 0) / complexityResults.length;
    const avgTTFT = complexityResults.reduce((sum, r) => sum + r.firstTokenTime, 0) / complexityResults.length;
    console.log(`  ${complexity}: ${avgTime.toFixed(2)}ms (TTFT: ${avgTTFT.toFixed(2)}ms)`);
  }
  
  // Performance by category
  console.log('\nPerformance by Query Category:');
  const categories = [...new Set(successfulResults.map(r => r.category))];
  for (const category of categories) {
    const categoryResults = successfulResults.filter(r => r.category === category);
    const avgTime = categoryResults.reduce((sum, r) => sum + r.responseTime, 0) / categoryResults.length;
    const avgChunksCategory = categoryResults.reduce((sum, r) => sum + r.chunksRetrieved, 0) / categoryResults.length;
    console.log(`  ${category}: ${avgTime.toFixed(2)}ms (${avgChunksCategory.toFixed(0)} chunks)`);
  }
  
  // Find bottlenecks
  console.log('\n🔬 Performance Analysis:');
  
  const slowestQuery = successfulResults.reduce((prev, curr) => 
    curr.responseTime > prev.responseTime ? curr : prev
  );
  const fastestQuery = successfulResults.reduce((prev, curr) => 
    curr.responseTime < prev.responseTime ? curr : prev
  );
  
  console.log(`Slowest Query: "${slowestQuery.query}" (${slowestQuery.responseTime.toFixed(2)}ms)`);
  console.log(`Fastest Query: "${fastestQuery.query}" (${fastestQuery.responseTime.toFixed(2)}ms)`);
  console.log(`Speed Difference: ${(slowestQuery.responseTime / fastestQuery.responseTime).toFixed(1)}x`);
  
  // Token generation speed
  const tokenSpeeds = successfulResults.map(r => 
    r.totalTokens > 0 ? (r.totalTokens / (r.responseTime / 1000)) : 0
  ).filter(speed => speed > 0);
  
  if (tokenSpeeds.length > 0) {
    const avgTokenSpeed = tokenSpeeds.reduce((sum, speed) => sum + speed, 0) / tokenSpeeds.length;
    console.log(`\nAverage Token Generation Speed: ${avgTokenSpeed.toFixed(0)} tokens/second`);
  }
  
  // Recommendations
  console.log('\n🎯 Performance Recommendations:');
  
  if (avgResponseTime > 5000) {
    console.log('  ⚠️  Average response time exceeds 5s - significant optimization needed');
  } else if (avgResponseTime > 2000) {
    console.log('  ⚡ Response time is moderate - could benefit from optimization');
  } else {
    console.log('  ✅ Response time is good (<2s average)');
  }
  
  if (avgFirstToken > 1500) {
    console.log('  ⚠️  High Time to First Token - consider optimizing search/embedding generation');
  } else if (avgFirstToken < 500) {
    console.log('  ✅ Excellent Time to First Token (<500ms)');
  }
  
  if (avgChunks > 20) {
    console.log('  💡 High chunk retrieval count - consider more selective filtering');
  } else if (avgChunks < 3) {
    console.log('  ⚠️  Low chunk retrieval - may need to adjust similarity threshold');
  }
  
  // Error rate
  const errorRate = ((results.length - successfulResults.length) / results.length) * 100;
  if (errorRate > 0) {
    console.log(`  ⚠️  Error rate: ${errorRate.toFixed(0)}% - investigate failures`);
  }
}

// Run the tests
runPerformanceTests().catch(console.error);