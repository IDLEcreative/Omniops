#!/usr/bin/env node

/**
 * Performance Testing Script
 * Measures and reports on various performance metrics after optimizations
 */

import https from 'node:https';
import http from 'node:http';
import { performance  } from 'perf_hooks';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || '';

// Test endpoints
const TEST_ENDPOINTS = [
  { path: '/api/health', method: 'GET', name: 'Health Check' },
  { path: '/api/check-rag-data', method: 'GET', name: 'RAG Data Check' },
  { path: '/api/scrape?health=true', method: 'GET', name: 'Scrape Health' },
  { path: '/api/version', method: 'GET', name: 'Version Check' },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

/**
 * Make HTTP request and measure performance
 */
async function measureRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint.path);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const startTime = performance.now();
    let dataSize = 0;
    let ttfb = 0; // Time to first byte
    let responseHeaders = {};
    
    const req = protocol.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {},
    }, (res) => {
      if (ttfb === 0) {
        ttfb = performance.now() - startTime;
      }
      
      responseHeaders = res.headers;
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
        dataSize += chunk.length;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          statusCode: res.statusCode,
          totalTime: totalTime.toFixed(2),
          ttfb: ttfb.toFixed(2),
          dataSize,
          cacheControl: responseHeaders['cache-control'],
          etag: responseHeaders['etag'],
          xResponseTime: responseHeaders['x-response-time'],
          success: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        error: err.message,
        success: false,
      });
    });
    
    req.end();
  });
}

/**
 * Test cache effectiveness
 */
async function testCaching(endpoint) {
  console.log(`\nTesting cache for ${colors.cyan}${endpoint.name}${colors.reset}...`);
  
  // First request (cold cache)
  const firstRequest = await measureRequest(endpoint);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Second request (potentially cached)
  const secondRequest = await measureRequest(endpoint);
  
  const improvement = firstRequest.totalTime && secondRequest.totalTime
    ? ((parseFloat(firstRequest.totalTime) - parseFloat(secondRequest.totalTime)) / parseFloat(firstRequest.totalTime) * 100).toFixed(1)
    : 0;
  
  return {
    endpoint: endpoint.name,
    firstRequest: firstRequest.totalTime,
    secondRequest: secondRequest.totalTime,
    improvement: improvement + '%',
    hasETag: !!firstRequest.etag,
    hasCacheControl: !!firstRequest.cacheControl,
  };
}

/**
 * Test concurrent requests
 */
async function testConcurrency(endpoint, concurrentRequests = 10) {
  console.log(`\nTesting concurrency for ${colors.cyan}${endpoint.name}${colors.reset} with ${concurrentRequests} requests...`);
  
  const startTime = performance.now();
  const promises = Array(concurrentRequests).fill(null).map(() => measureRequest(endpoint));
  const results = await Promise.all(promises);
  const endTime = performance.now();
  
  const successful = results.filter(r => r.success).length;
  const avgResponseTime = results
    .filter(r => r.totalTime)
    .reduce((sum, r) => sum + parseFloat(r.totalTime), 0) / successful || 0;
  
  return {
    endpoint: endpoint.name,
    totalRequests: concurrentRequests,
    successful,
    failed: concurrentRequests - successful,
    totalTime: (endTime - startTime).toFixed(2),
    avgResponseTime: avgResponseTime.toFixed(2),
    requestsPerSecond: (successful / ((endTime - startTime) / 1000)).toFixed(2),
  };
}

/**
 * Main test runner
 */
async function runPerformanceTests() {
  console.log(`${colors.bright}${colors.cyan}=== Performance Test Suite ===${colors.reset}`);
  console.log(`Testing against: ${BASE_URL}\n`);
  
  const results = {
    basic: [],
    caching: [],
    concurrency: [],
    summary: {},
  };
  
  // Test 1: Basic performance
  console.log(`${colors.bright}1. Basic Response Times${colors.reset}`);
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await measureRequest(endpoint);
    results.basic.push(result);
    
    const statusColor = result.success ? colors.green : colors.red;
    console.log(`  ${result.endpoint}: ${statusColor}${result.totalTime}ms${colors.reset} (TTFB: ${result.ttfb}ms, Size: ${result.dataSize} bytes)`);
    
    if (result.xResponseTime) {
      console.log(`    Server reported time: ${result.xResponseTime}`);
    }
  }
  
  // Test 2: Cache effectiveness
  console.log(`\n${colors.bright}2. Cache Effectiveness${colors.reset}`);
  for (const endpoint of TEST_ENDPOINTS.slice(0, 2)) { // Test first 2 endpoints
    const result = await testCaching(endpoint);
    results.caching.push(result);
    
    const improvementColor = parseFloat(result.improvement) > 0 ? colors.green : colors.yellow;
    console.log(`  ${result.endpoint}:`);
    console.log(`    First request: ${result.firstRequest}ms`);
    console.log(`    Second request: ${result.secondRequest}ms`);
    console.log(`    Improvement: ${improvementColor}${result.improvement}${colors.reset}`);
    console.log(`    ETag: ${result.hasETag ? colors.green + '✓' : colors.red + '✗'}${colors.reset}, Cache-Control: ${result.hasCacheControl ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  }
  
  // Test 3: Concurrent requests
  console.log(`\n${colors.bright}3. Concurrency Test${colors.reset}`);
  for (const endpoint of TEST_ENDPOINTS.slice(0, 1)) { // Test first endpoint
    const result = await testConcurrency(endpoint, 20);
    results.concurrency.push(result);
    
    console.log(`  ${result.endpoint}:`);
    console.log(`    Total requests: ${result.totalRequests}`);
    console.log(`    Successful: ${colors.green}${result.successful}${colors.reset}, Failed: ${colors.red}${result.failed}${colors.reset}`);
    console.log(`    Total time: ${result.totalTime}ms`);
    console.log(`    Avg response time: ${result.avgResponseTime}ms`);
    console.log(`    Requests/second: ${colors.cyan}${result.requestsPerSecond}${colors.reset}`);
  }
  
  // Calculate summary statistics
  const avgResponseTime = results.basic
    .filter(r => r.totalTime)
    .reduce((sum, r) => sum + parseFloat(r.totalTime), 0) / results.basic.length || 0;
  
  const avgTTFB = results.basic
    .filter(r => r.ttfb)
    .reduce((sum, r) => sum + parseFloat(r.ttfb), 0) / results.basic.length || 0;
  
  const cacheImprovement = results.caching
    .reduce((sum, r) => sum + parseFloat(r.improvement), 0) / results.caching.length || 0;
  
  results.summary = {
    avgResponseTime: avgResponseTime.toFixed(2),
    avgTTFB: avgTTFB.toFixed(2),
    avgCacheImprovement: cacheImprovement.toFixed(1),
    endpointsTested: TEST_ENDPOINTS.length,
  };
  
  // Print summary
  console.log(`\n${colors.bright}${colors.green}=== Performance Summary ===${colors.reset}`);
  console.log(`Average response time: ${colors.cyan}${results.summary.avgResponseTime}ms${colors.reset}`);
  console.log(`Average TTFB: ${colors.cyan}${results.summary.avgTTFB}ms${colors.reset}`);
  console.log(`Average cache improvement: ${colors.cyan}${results.summary.avgCacheImprovement}%${colors.reset}`);
  
  // Performance recommendations
  console.log(`\n${colors.bright}Performance Recommendations:${colors.reset}`);
  
  if (avgResponseTime > 500) {
    console.log(`${colors.yellow}⚠${colors.reset} Average response time is high (${avgResponseTime}ms). Consider:`);
    console.log(`  - Implementing database query optimization`);
    console.log(`  - Adding more aggressive caching`);
    console.log(`  - Using CDN for static assets`);
  } else if (avgResponseTime < 100) {
    console.log(`${colors.green}✓${colors.reset} Excellent response times!`);
  } else {
    console.log(`${colors.green}✓${colors.reset} Good response times`);
  }
  
  if (cacheImprovement < 20) {
    console.log(`${colors.yellow}⚠${colors.reset} Cache improvement is low. Consider:`);
    console.log(`  - Implementing ETag headers`);
    console.log(`  - Adding longer cache durations for static content`);
    console.log(`  - Using stale-while-revalidate strategy`);
  } else {
    console.log(`${colors.green}✓${colors.reset} Good cache effectiveness`);
  }
  
  const hasETags = results.basic.filter(r => r.etag).length;
  if (hasETags < results.basic.length / 2) {
    console.log(`${colors.yellow}⚠${colors.reset} Many endpoints lack ETag headers`);
  }
  
  // Save results to file
  import fs from 'node:fs';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-results-${timestamp}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n${colors.green}Results saved to:${colors.reset} ${filename}`);
  
  return results;
}

// Run tests
runPerformanceTests()
  .then(() => {
    console.log(`\n${colors.green}Performance tests completed successfully${colors.reset}`);
    process.exit(0);
  })
  .catch(err => {
    console.error(`${colors.red}Error running performance tests:${colors.reset}`, err);
    process.exit(1);
  });