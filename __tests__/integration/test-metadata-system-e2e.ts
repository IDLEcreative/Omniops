#!/usr/bin/env npx tsx

/**
 * End-to-End Integration Test for Conversation Metadata System
 *
 * Orchestrator for metadata system E2E tests.
 * Individual test modules are located in ./metadata-system/
 *
 * Validates:
 * - Metadata persistence to database
 * - Entity tracking across conversation turns
 * - Correction detection and tracking
 * - Numbered list reference resolution
 * - Feature flag behavior (USE_ENHANCED_METADATA_CONTEXT)
 * - Complete conversation flow simulation
 *
 * Refactored from 551 LOC to 7 focused test modules (<300 LOC each).
 */

import { TestResult, logSection, reportTestResults } from '../utils/metadata/metadata-system-helpers';
import { testDatabaseSchema } from './metadata-system/database-schema.test';
import { testMetadataManager } from './metadata-system/metadata-manager.test';
import { testResponseParser } from './metadata-system/response-parser.test';
import { testFeatureFlag } from './metadata-system/feature-flag.test';
import { testParseAndTrackEntities } from './metadata-system/parse-and-track.test';
import { testDatabasePersistence } from './metadata-system/database-persistence.test';
import { testMultiTurnConversation } from './metadata-system/multi-turn-flow.test';

const results: TestResult[] = [];

async function runAllTests() {
  logSection('CONVERSATION METADATA SYSTEM - END-TO-END INTEGRATION TEST');

  console.log('\nExecuting 7 comprehensive tests...\n');

  // Test 1: Database Schema
  results.push(await testDatabaseSchema());

  // Test 2: Metadata Manager Core Functionality
  results.push(await testMetadataManager());

  // Test 3: Response Parser
  results.push(await testResponseParser());

  // Test 4: Feature Flag
  results.push(await testFeatureFlag());

  // Test 5: parseAndTrackEntities Integration
  results.push(await testParseAndTrackEntities());

  // Test 6: Database Persistence
  results.push(await testDatabasePersistence());

  // Test 7: Multi-Turn Conversation
  results.push(await testMultiTurnConversation());

  // Report results
  const { passed, total } = reportTestResults(results);

  if (passed === total) {
    console.log('\n🎉 All tests passed! Metadata system is fully functional.\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${total - passed} test(s) failed.\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
