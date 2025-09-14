#!/usr/bin/env tsx

/**
 * Test script for ContentDeduplicator memory optimizations
 * This verifies that the LRU cache and memory management features work correctly
 */

import { ContentDeduplicator } from './lib/content-deduplicator';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test result tracking
let testsPassed = 0;
let testsFailed = 0;

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assertTrue(condition: boolean, testName: string) {
  if (condition) {
    log(`✓ ${testName}`, colors.green);
    testsPassed++;
  } else {
    log(`✗ ${testName}`, colors.red);
    testsFailed++;
  }
}

async function testLRUCacheEviction() {
  log('\n=== Testing LRU Cache Eviction ===', colors.blue);
  
  const deduplicator = new ContentDeduplicator();
  
  // Generate more content than the cache can hold
  // MAX_MINHASH_CACHE is set to 1000 in the implementation
  const testPages = 1500;
  log(`Adding ${testPages} unique pages to test cache eviction...`);
  
  for (let i = 0; i < testPages; i++) {
    const content = `Unique content for page ${i} with some random data ${Math.random()}`;
    const url = `https://test.com/page${i}`;
    await deduplicator.processContent(content, url);
    
    if (i % 100 === 0) {
      const stats = deduplicator.getStorageStats();
      log(`  Pages processed: ${i}, MinHash cache size: ${stats.cacheSize}`);
    }
  }
  
  const finalStats = deduplicator.getStorageStats();
  
  // Verify cache size is bounded
  assertTrue(
    finalStats.cacheSize <= 1000,
    `MinHash cache should be bounded to 1000 entries (actual: ${finalStats.cacheSize})`
  );
  
  // Verify common elements are bounded
  assertTrue(
    finalStats.commonElements <= 2000,
    `Common elements should be bounded to 2000 entries (actual: ${finalStats.commonElements})`
  );
  
  log(`Final cache size: ${finalStats.cacheSize}`, colors.yellow);
  log(`Final common elements: ${finalStats.commonElements}`, colors.yellow);
}

async function testMemoryCleanup() {
  log('\n=== Testing Automatic Memory Cleanup ===', colors.blue);
  
  const deduplicator = new ContentDeduplicator();
  
  // Process exactly 500 pages to trigger cleanup
  log('Processing 500 pages to trigger automatic cleanup...');
  
  for (let i = 0; i < 500; i++) {
    const content = `Test content ${i} with duplicate pattern: HEADER NAVIGATION FOOTER`;
    const url = `https://test.com/cleanup${i}`;
    await deduplicator.processContent(content, url);
  }
  
  const stats = deduplicator.getStorageStats();
  
  // Check that cleanup was triggered (processedPages should be tracked)
  assertTrue(
    stats.processedPages === 500,
    `Should track 500 processed pages (actual: ${stats.processedPages})`
  );
  
  // Memory usage should be available
  assertTrue(
    stats.memoryUsage !== undefined && stats.memoryUsage.heapUsed > 0,
    'Should track memory usage statistics'
  );
  
  log(`Heap used: ${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)}MB`, colors.yellow);
  log(`RSS: ${Math.round(stats.memoryUsage.rss / 1024 / 1024)}MB`, colors.yellow);
}

async function testDuplicateDetection() {
  log('\n=== Testing Duplicate Detection Still Works ===', colors.blue);
  
  const deduplicator = new ContentDeduplicator();
  
  // Add duplicate content
  const duplicateContent = 'This is duplicate content that appears on multiple pages';
  
  const hash1 = await deduplicator.processContent(duplicateContent, 'https://test.com/dup1');
  const hash2 = await deduplicator.processContent(duplicateContent, 'https://test.com/dup2');
  const hash3 = await deduplicator.processContent(duplicateContent, 'https://test.com/dup3');
  
  // All should have the same hash
  assertTrue(
    hash1 === hash2 && hash2 === hash3,
    'Duplicate content should produce the same hash'
  );
  
  // Add unique content
  const uniqueContent = 'This is completely unique content ' + Math.random();
  const hashUnique = await deduplicator.processContent(uniqueContent, 'https://test.com/unique');
  
  assertTrue(
    hashUnique !== hash1,
    'Unique content should produce different hash'
  );
  
  log(`Duplicate hash: ${hash1.substring(0, 8)}...`, colors.yellow);
  log(`Unique hash: ${hashUnique.substring(0, 8)}...`, colors.yellow);
}

async function testMemoryBounds() {
  log('\n=== Testing Memory Bounds Under Load ===', colors.blue);
  
  const deduplicator = new ContentDeduplicator();
  const initialMemory = process.memoryUsage().heapUsed;
  
  log('Processing 2500 pages to test memory bounds...');
  
  // Process many pages to ensure memory doesn't grow unbounded
  for (let i = 0; i < 2500; i++) {
    const content = `Page ${i}: ${Math.random()} Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    const url = `https://test.com/stress${i}`;
    await deduplicator.processContent(content, url);
    
    if (i % 500 === 0 && i > 0) {
      const currentMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = (currentMemory - initialMemory) / 1024 / 1024;
      log(`  After ${i} pages: Memory growth = ${Math.round(memoryGrowth)}MB`);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
  
  const finalMemory = process.memoryUsage().heapUsed;
  const totalGrowth = (finalMemory - initialMemory) / 1024 / 1024;
  
  log(`Total memory growth: ${Math.round(totalGrowth)}MB`, colors.yellow);
  
  // Memory growth should be reasonable (not linear with pages)
  assertTrue(
    totalGrowth < 100,
    `Memory growth should be bounded (actual: ${Math.round(totalGrowth)}MB)`
  );
  
  const finalStats = deduplicator.getStorageStats();
  log(`Final storage stats:`, colors.yellow);
  log(`  - Common elements: ${finalStats.commonElements}`);
  log(`  - Unique content: ${finalStats.uniqueContent}`);
  log(`  - References: ${finalStats.references}`);
  log(`  - Cache size: ${finalStats.cacheSize}`);
  log(`  - Processed pages: ${finalStats.processedPages}`);
}

async function testClearCache() {
  log('\n=== Testing Cache Clear Functionality ===', colors.blue);
  
  const deduplicator = new ContentDeduplicator();
  
  // Add some content
  for (let i = 0; i < 100; i++) {
    await deduplicator.processContent(`Content ${i}`, `https://test.com/clear${i}`);
  }
  
  let stats = deduplicator.getStorageStats();
  assertTrue(
    stats.cacheSize > 0 && stats.commonElements > 0,
    'Cache should have content before clearing'
  );
  
  // Clear the cache
  await deduplicator.clearCache();
  
  stats = deduplicator.getStorageStats();
  assertTrue(
    stats.cacheSize === 0,
    `Cache should be empty after clearing (actual: ${stats.cacheSize})`
  );
  assertTrue(
    stats.commonElements === 0,
    `Common elements should be empty after clearing (actual: ${stats.commonElements})`
  );
  assertTrue(
    stats.processedPages === 0,
    `Processed pages counter should reset (actual: ${stats.processedPages})`
  );
}

async function runAllTests() {
  log('=== ContentDeduplicator Memory Optimization Tests ===', colors.blue);
  log(`Starting tests at ${new Date().toISOString()}\n`);
  
  const startTime = Date.now();
  
  try {
    await testLRUCacheEviction();
    await testMemoryCleanup();
    await testDuplicateDetection();
    await testMemoryBounds();
    await testClearCache();
  } catch (error) {
    log(`\nTest error: ${error}`, colors.red);
    testsFailed++;
  }
  
  const duration = Date.now() - startTime;
  
  log('\n=== Test Results ===', colors.blue);
  log(`Tests passed: ${testsPassed}`, colors.green);
  log(`Tests failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
  log(`Total time: ${duration}ms`, colors.yellow);
  
  if (testsFailed === 0) {
    log('\n✅ All tests passed! Memory optimizations are working correctly.', colors.green);
  } else {
    log(`\n❌ ${testsFailed} test(s) failed. Please review the implementation.`, colors.red);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);