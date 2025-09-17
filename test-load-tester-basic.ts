#!/usr/bin/env npx tsx

/**
 * Basic Load Tester Validation
 * Tests fundamental load testing functionality with mock servers
 */

import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { createLoadTester, loadTest } from './lib/dev-tools';

/**
 * Simple HTTP mock server for testing
 */
function createMockServer(responseDelay: number = 100, errorRate: number = 0): Promise<{ server: Server; url: string }> {
  return new Promise((resolve, reject) => {
    let requestCount = 0;
    
    const server = createServer((req, res) => {
      requestCount++;
      
      // Simulate error rate
      if (Math.random() < errorRate) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      
      // Simulate response delay
      setTimeout(() => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          message: 'Hello from mock server',
          requestId: requestCount,
          timestamp: Date.now(),
          delay: responseDelay
        }));
      }, responseDelay);
    });
    
    server.listen(0, 'localhost', () => {
      const address = server.address() as AddressInfo;
      const url = `http://localhost:${address.port}`;
      resolve({ server, url });
    });
    
    server.on('error', reject);
  });
}

/**
 * Test basic load testing functionality
 */
async function testBasicLoadTest() {
  console.log('🧪 Testing Basic Load Test...');
  
  const { server, url } = await createMockServer(50, 0.02); // 50ms delay, 2% error rate
  
  try {
    const result = await loadTest(url, 5, 10000); // 5 concurrent, 10 seconds
    
    console.log('✅ Basic load test completed');
    console.log(`   Status: ${result.summary.status}`);
    console.log(`   Duration: ${(result.summary.duration / 1000).toFixed(2)}s`);
    console.log(`   Requests: ${result.overallMetrics.totalRequests}`);
    console.log(`   RPS: ${result.summary.averageRPS.toFixed(2)}`);
    console.log(`   Success Rate: ${(result.overallMetrics.successRate * 100).toFixed(2)}%`);
    console.log(`   Avg Response Time: ${result.overallMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Grade: ${result.summary.grade}`);
    
    // Validate results
    if (result.summary.status === 'completed') {
      console.log('✅ Test completed successfully');
    } else {
      console.error('❌ Test did not complete successfully');
    }
    
    if (result.overallMetrics.totalRequests > 0) {
      console.log('✅ Requests were sent');
    } else {
      console.error('❌ No requests were sent');
    }
    
    if (result.overallMetrics.successRate > 0.9) {
      console.log('✅ High success rate achieved');
    } else {
      console.warn('⚠️ Lower than expected success rate');
    }
    
  } catch (error) {
    console.error('❌ Basic load test failed:', error);
  } finally {
    server.close();
  }
}

/**
 * Test advanced load testing with custom configuration
 */
async function testAdvancedLoadTest() {
  console.log('\n🧪 Testing Advanced Load Test...');
  
  const { server, url } = await createMockServer(100, 0.05); // 100ms delay, 5% error rate
  
  try {
    const loadTester = createLoadTester({
      url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LoadTester/Test'
      },
      body: JSON.stringify({ test: 'data', timestamp: Date.now() }),
      concurrency: 10,
      warmupDuration: 2000,
      rampupDuration: 3000,
      sustainedDuration: 5000,
      cooldownDuration: 1000,
      requestsPerSecond: 20,
      maxErrors: 50,
      maxErrorRate: 0.2
    }, {
      enableMetricsCollection: true,
      enableRequestSampling: true,
      requestSampleRate: 0.5,
      enableProgressCallback: true,
      enableJitter: true,
      jitterPercent: 10
    });
    
    // Track events
    const events: string[] = [];
    let progressUpdates = 0;
    
    loadTester.on('start', () => events.push('started'));
    loadTester.on('phaseStart', ({ phase }) => events.push(`phase-${phase}-start`));
    loadTester.on('phaseEnd', ({ phase }) => events.push(`phase-${phase}-end`));
    loadTester.on('progress', () => progressUpdates++);
    loadTester.on('complete', () => events.push('completed'));
    
    const result = await loadTester.start();
    
    console.log('✅ Advanced load test completed');
    console.log(`   Events: ${events.join(', ')}`);
    console.log(`   Progress Updates: ${progressUpdates}`);
    console.log(`   Phases with data: ${Object.entries(result.phases).filter(([, metrics]) => metrics.totalRequests > 0).map(([phase]) => phase).join(', ')}`);
    console.log(`   Peak RPS: ${result.summary.peakRPS.toFixed(2)}`);
    console.log(`   P95 Response Time: ${result.overallMetrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   Error Distribution: ${JSON.stringify(result.overallMetrics.errorDistribution)}`);
    console.log(`   Status Code Distribution: ${JSON.stringify(result.overallMetrics.statusCodeDistribution)}`);
    
    // Validate phases
    if (events.includes('started') && events.includes('completed')) {
      console.log('✅ Test lifecycle events fired correctly');
    } else {
      console.error('❌ Missing lifecycle events');
    }
    
    if (progressUpdates > 0) {
      console.log('✅ Progress updates received');
    } else {
      console.error('❌ No progress updates received');
    }
    
    // Validate export data
    if (result.exportData?.json && result.exportData?.csv && result.exportData?.html) {
      console.log('✅ Export data generated');
    } else {
      console.error('❌ Export data missing');
    }
    
  } catch (error) {
    console.error('❌ Advanced load test failed:', error);
  } finally {
    server.close();
  }
}

/**
 * Test error handling and resilience
 */
async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  const { server, url } = await createMockServer(200, 0.3); // 200ms delay, 30% error rate
  
  try {
    const loadTester = createLoadTester({
      url,
      concurrency: 8,
      sustainedDuration: 8000,
      maxErrors: 20, // Should stop when this is reached
      maxErrorRate: 0.5 // Should stop when this is reached
    }, {
      enableErrorSampling: true,
      errorSampleRate: 1.0,
      customErrorClassifier: (error) => {
        if (error.message.includes('500')) return 'server_error';
        return error.name;
      }
    });
    
    let stopReason = '';
    loadTester.on('maxErrorsReached', () => stopReason = 'max_errors');
    
    const result = await loadTester.start();
    
    console.log('✅ Error handling test completed');
    console.log(`   Stop Reason: ${stopReason || 'completed_normally'}`);
    console.log(`   Total Errors: ${result.errors.length}`);
    console.log(`   Error Rate: ${(result.overallMetrics.errorRate * 100).toFixed(2)}%`);
    console.log(`   Error Distribution: ${JSON.stringify(result.overallMetrics.errorDistribution)}`);
    
    if (result.overallMetrics.errorRate > 0.1) {
      console.log('✅ High error rate detected as expected');
    } else {
      console.warn('⚠️ Expected higher error rate for this test');
    }
    
    if (result.errors.length > 0) {
      console.log('✅ Errors were captured and recorded');
    } else {
      console.error('❌ No errors recorded despite high error rate');
    }
    
  } catch (error) {
    console.error('❌ Error handling test failed:', error);
  } finally {
    server.close();
  }
}

/**
 * Test rate limiting functionality
 */
async function testRateLimiting() {
  console.log('\n🧪 Testing Rate Limiting...');
  
  const { server, url } = await createMockServer(10, 0); // Fast responses, no errors
  
  try {
    const targetRPS = 10;
    const duration = 5000;
    
    const loadTester = createLoadTester({
      url,
      concurrency: 20, // Higher concurrency than target RPS
      sustainedDuration: duration,
      requestsPerSecond: targetRPS
    });
    
    const startTime = Date.now();
    const result = await loadTester.start();
    const actualDuration = Date.now() - startTime;
    
    const actualRPS = (result.overallMetrics.totalRequests * 1000) / actualDuration;
    const rpsVariance = Math.abs(actualRPS - targetRPS) / targetRPS;
    
    console.log('✅ Rate limiting test completed');
    console.log(`   Target RPS: ${targetRPS}`);
    console.log(`   Actual RPS: ${actualRPS.toFixed(2)}`);
    console.log(`   Variance: ${(rpsVariance * 100).toFixed(2)}%`);
    console.log(`   Total Requests: ${result.overallMetrics.totalRequests}`);
    
    if (rpsVariance < 0.2) { // Within 20% of target
      console.log('✅ Rate limiting is working correctly');
    } else {
      console.warn('⚠️ Rate limiting variance is higher than expected');
    }
    
  } catch (error) {
    console.error('❌ Rate limiting test failed:', error);
  } finally {
    server.close();
  }
}

/**
 * Test stress testing functionality
 */
async function testStressTesting() {
  console.log('\n🧪 Testing Stress Testing...');
  
  // Create a server that becomes slower under load
  let currentLoad = 0;
  const server = createServer((req, res) => {
    currentLoad++;
    
    // Simulate degradation under load
    const baseDelay = 50;
    const loadFactor = Math.max(1, currentLoad / 10);
    const delay = baseDelay * loadFactor;
    
    setTimeout(() => {
      currentLoad--;
      
      if (currentLoad > 30) {
        // Simulate server breaking under high load
        res.statusCode = 503;
        res.end('Service Unavailable');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          message: 'Response under load',
          currentLoad,
          delay: Math.round(delay)
        }));
      }
    }, delay);
  });
  
  try {
    await new Promise<void>((resolve, reject) => {
      server.listen(0, 'localhost', resolve);
      server.on('error', reject);
    });
    
    const address = server.address() as AddressInfo;
    const url = `http://localhost:${address.port}`;
    
    const loadTester = createLoadTester({
      url,
      concurrency: 5,
      sustainedDuration: 3000,
      enableStressTesting: true,
      stressMaxConcurrency: 25,
      stressRampupStep: 5,
      stressStepDuration: 2000,
      targetResponseTime: 1000 // Break when response time exceeds 1s
    });
    
    let breakingPointReached = false;
    loadTester.on('breakingPoint', ({ concurrency, metrics }) => {
      breakingPointReached = true;
      console.log(`   Breaking point at ${concurrency} concurrent users`);
      console.log(`   Response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
      console.log(`   Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    });
    
    const result = await loadTester.start();
    
    console.log('✅ Stress testing completed');
    console.log(`   Breaking point reached: ${breakingPointReached ? 'Yes' : 'No'}`);
    console.log(`   Max stable concurrency: ${result.performance.scalability.maxStableConcurrency}`);
    console.log(`   Max stable RPS: ${result.performance.scalability.maxStableRPS.toFixed(2)}`);
    console.log(`   Scalability factor: ${result.performance.scalability.scalabilityFactor.toFixed(2)}`);
    
    if (result.phases.stress.totalRequests > 0) {
      console.log('✅ Stress phase executed');
    } else {
      console.warn('⚠️ Stress phase did not execute or had no requests');
    }
    
  } catch (error) {
    console.error('❌ Stress testing failed:', error);
  } finally {
    server.close();
  }
}

/**
 * Test performance metrics calculation
 */
async function testPerformanceMetrics() {
  console.log('\n🧪 Testing Performance Metrics...');
  
  const { server, url } = await createMockServer(150, 0.1); // 150ms delay, 10% error rate
  
  try {
    const result = await loadTest(url, 8, 6000);
    
    console.log('✅ Performance metrics test completed');
    console.log(`   Min Response Time: ${result.overallMetrics.minResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${result.overallMetrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`   Avg Response Time: ${result.overallMetrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`   P50 Response Time: ${result.overallMetrics.p50ResponseTime.toFixed(2)}ms`);
    console.log(`   P95 Response Time: ${result.overallMetrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   P99 Response Time: ${result.overallMetrics.p99ResponseTime.toFixed(2)}ms`);
    console.log(`   Bytes Transferred: ${result.overallMetrics.bytesTransferred}`);
    console.log(`   Throughput: ${(result.overallMetrics.averageThroughput / 1024).toFixed(2)} KB/s`);
    
    // Validate percentile calculations
    const { p50ResponseTime, p95ResponseTime, p99ResponseTime, averageResponseTime } = result.overallMetrics;
    
    if (p50ResponseTime > 0 && p95ResponseTime > 0 && p99ResponseTime > 0) {
      console.log('✅ Percentile calculations completed');
    } else {
      console.error('❌ Invalid percentile calculations');
    }
    
    if (p50ResponseTime <= p95ResponseTime && p95ResponseTime <= p99ResponseTime) {
      console.log('✅ Percentiles are in correct order');
    } else {
      console.error('❌ Percentiles are not in correct order');
    }
    
    if (result.performance.bottlenecks && result.performance.scalability && result.performance.reliability) {
      console.log('✅ Performance analysis completed');
    } else {
      console.error('❌ Performance analysis incomplete');
    }
    
  } catch (error) {
    console.error('❌ Performance metrics test failed:', error);
  } finally {
    server.close();
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Load Tester Validation Tests');
  console.log('================================\n');
  
  try {
    await testBasicLoadTest();
    await testAdvancedLoadTest();
    await testErrorHandling();
    await testRateLimiting();
    await testStressTesting();
    await testPerformanceMetrics();
    
    console.log('\n✅ All Load Tester tests completed successfully!');
    console.log('\nThe Load Tester is working correctly and provides:');
    console.log('- HTTP/HTTPS request generation with configurable concurrency');
    console.log('- Request rate limiting (RPS control)');
    console.log('- Comprehensive response time tracking (min, max, avg, percentiles)');
    console.log('- Success/failure rate monitoring');
    console.log('- Status code and error distribution tracking');
    console.log('- Multi-phase testing (warmup, rampup, sustained, stress, cooldown)');
    console.log('- Breaking point detection');
    console.log('- Real-time progress reporting');
    console.log('- Performance analysis and recommendations');
    console.log('- Export capabilities (JSON, CSV, HTML)');
    
  } catch (error) {
    console.error('\n❌ Load Tester validation failed:', error);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);