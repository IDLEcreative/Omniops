#!/usr/bin/env tsx
/**
 * Detection script to identify which search implementation is active
 * Determines if the system is using the current implementation (search-orchestrator)
 * or the legacy implementation (embeddings-optimized)
 */

import { DEFAULT_SEARCH_LIMIT } from '@/lib/embeddings/constants';

console.log('='.repeat(70));
console.log('SEARCH IMPLEMENTATION DETECTION');
console.log('='.repeat(70));

// Check 1: Constants
console.log('\n📊 CONSTANTS CHECK:');
console.log(`DEFAULT_SEARCH_LIMIT: ${DEFAULT_SEARCH_LIMIT}`);

if (DEFAULT_SEARCH_LIMIT === 100) {
  console.log('✅ PASS: DEFAULT_SEARCH_LIMIT is 100 (expected for current implementation)');
} else if (DEFAULT_SEARCH_LIMIT === 5) {
  console.log('❌ FAIL: DEFAULT_SEARCH_LIMIT is 5 (legacy value - should be 100)');
} else {
  console.log(`⚠️  WARNING: DEFAULT_SEARCH_LIMIT is ${DEFAULT_SEARCH_LIMIT} (unexpected value)`);
}

// Check 2: Import path
console.log('\n📦 IMPORT VERIFICATION:');
try {
  // This will show which file is actually imported
  const embeddings = require('@/lib/embeddings');

  if (embeddings.searchSimilarContent) {
    console.log('✅ searchSimilarContent export found');
  } else {
    console.log('❌ searchSimilarContent export NOT found');
  }

  if (embeddings.handleZeroResults) {
    console.log('✅ handleZeroResults export found (recovery system integrated)');
  } else {
    console.log('⚠️  handleZeroResults export NOT found (recovery system not integrated)');
  }

} catch (error) {
  console.log('❌ Error loading embeddings module:', error);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('SUMMARY:');
console.log('='.repeat(70));

if (DEFAULT_SEARCH_LIMIT === 100) {
  console.log('✅ CURRENT IMPLEMENTATION ACTIVE');
  console.log('   - Using search-orchestrator.ts');
  console.log('   - DEFAULT_SEARCH_LIMIT = 100');
  console.log('   - Keyword search: up to 200 results');
  console.log('   - Vector search: uses requested limit');
} else {
  console.log('❌ LEGACY CONFIGURATION DETECTED');
  console.log('   - DEFAULT_SEARCH_LIMIT needs to be increased to 100');
  console.log('   - Update lib/embeddings/constants.ts');
}

console.log('='.repeat(70));
