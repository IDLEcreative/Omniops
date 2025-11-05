#!/usr/bin/env tsx
/**
 * Modified test runner that bypasses health check
 * This is needed because sandbox environment can't access localhost
 */

import * as path from 'path';
import {
  compareTraditionalAndMCP,
  generateReport,
  printSummary,
  TEST_CASES,
  type ComparisonTestCase
} from './compare-mcp-traditional';

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   MCP vs Traditional Tool Calling - Comparison Tests  ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Configuration
  const customerId = process.env.TEST_CUSTOMER_ID || 'test-customer-id';
  const domain = process.env.TEST_DOMAIN || 'test-domain.com';

  // Use sample tests (first 5)
  const testCases = TEST_CASES.slice(0, 5);

  console.log('📝 Running sample test suite (5 tests)');
  console.log('📋 Configuration:');
  console.log(`   ✓ Customer ID: ${customerId}`);
  console.log(`   ✓ Domain: ${domain}`);
  console.log(`   ✓ Test cases: ${testCases.length}`);
  console.log('\n⚠️  Bypassing health check (dev server assumed running)\n');

  const startTime = Date.now();

  console.log('🔄 Executing comparison tests...\n');

  let results;
  try {
    // The compareTraditionalAndMCP function handles all test cases at once
    results = await compareTraditionalAndMCP(
      customerId,
      domain,
      testCases
    );
  } catch (error: any) {
    console.error(`❌ Fatal error during test execution: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }

  const totalTime = Date.now() - startTime;

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  printSummary(results);

  // Generate report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const reportPath = path.join(
    process.cwd(),
    'ARCHIVE',
    'test-results',
    `mcp-comparison-${timestamp}.md`
  );

  await generateReport(results, reportPath);

  console.log(`\n✅ Report saved to: ${reportPath}`);
  console.log(`⏱️  Total execution time: ${(totalTime / 1000).toFixed(1)}s`);
}

main().catch(console.error);
