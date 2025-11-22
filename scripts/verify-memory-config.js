#!/usr/bin/env node
/**
 * Verify Memory Configuration
 *
 * This script verifies that the Node.js memory limit is properly set to 8GB
 */

const v8 = require('v8');

console.log('🔍 Verifying Memory Configuration...\n');

// Get heap statistics
const heapStats = v8.getHeapStatistics();

// Calculate memory limit in MB
const memoryLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024);

// Get NODE_OPTIONS
const nodeOptions = process.env.NODE_OPTIONS || 'Not set';

console.log('📊 Memory Configuration:');
console.log('─'.repeat(50));
console.log(`NODE_OPTIONS: ${nodeOptions}`);
console.log(`Heap Size Limit: ${memoryLimitMB} MB`);
console.log(`Expected: 8192 MB (8GB)`);
console.log('─'.repeat(50));

// Verify the configuration
if (memoryLimitMB >= 8000 && memoryLimitMB <= 8300) {
  console.log('✅ Memory limit is correctly set to ~8GB');
  process.exit(0);
} else if (memoryLimitMB >= 4000 && memoryLimitMB <= 4200) {
  console.log('⚠️  Memory limit is still at ~4GB (old configuration)');
  console.log('    Please ensure NODE_OPTIONS is set correctly');
  process.exit(1);
} else {
  console.log(`❌ Unexpected memory limit: ${memoryLimitMB}MB`);
  console.log('    Please check your NODE_OPTIONS configuration');
  process.exit(1);
}