#!/usr/bin/env tsx
/**
 * MCP Comparison Test Runner
 *
 * Purpose: Executes the MCP vs Traditional comparison framework
 * and generates detailed reports.
 *
 * Usage:
 *   npx tsx scripts/tests/run-mcp-comparison.ts
 *   npx tsx scripts/tests/run-mcp-comparison.ts --sample  # Run 5 sample tests
 *   npx tsx scripts/tests/run-mcp-comparison.ts --category=exact_sku  # Run specific category
 *
 * Prerequisites:
 * - Dev server running on port 3000 (npm run dev)
 * - Test customer configured
 * - MCP_EXECUTION_ENABLED=true in environment
 */

import {
  compareTraditionalAndMCP,
  generateReport,
  printSummary,
  TEST_CASES,
  type ComparisonTestCase
} from './compare-mcp-traditional';

// =====================================================
// CONFIGURATION
// =====================================================

interface Config {
  customerId: string;
  domain: string;
  testCases: ComparisonTestCase[];
  outputPath?: string;
}

/**
 * Load configuration from environment or use defaults
 */
function loadConfig(): Config {
  const customerId = process.env.TEST_CUSTOMER_ID || 'test-customer-id';
  const domain = process.env.TEST_DOMAIN || 'test-domain.com';

  // Parse command line arguments
  const args = process.argv.slice(2);
  let testCases = TEST_CASES;

  // --sample flag: Run only 5 sample tests
  if (args.includes('--sample')) {
    console.log('📝 Running sample test suite (5 tests)');
    testCases = TEST_CASES.slice(0, 5);
  }

  // --category flag: Run only tests from specific category
  const categoryArg = args.find(arg => arg.startsWith('--category='));
  if (categoryArg) {
    const category = categoryArg.split('=')[1];
    console.log(`📝 Running ${category} tests only`);
    testCases = TEST_CASES.filter(tc => tc.category === category);

    if (testCases.length === 0) {
      console.error(`❌ No tests found for category: ${category}`);
      console.error('   Valid categories: exact_sku, semantic_search, multi_result, edge_case, error_handling');
      process.exit(1);
    }
  }

  // --output flag: Custom output path
  const outputArg = args.find(arg => arg.startsWith('--output='));
  const outputPath = outputArg ? outputArg.split('=')[1] : undefined;

  return {
    customerId,
    domain,
    testCases,
    outputPath
  };
}

/**
 * Verify server is running
 */
async function verifyServerRunning(): Promise<void> {
  console.log('🔍 Checking dev server...');

  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Health check returned ${response.status}`);
    }

    console.log('✅ Dev server is running\n');
  } catch (error) {
    console.error('\n❌ Dev server not responding on http://localhost:3000');
    console.error('   Please start the server with: npm run dev');
    console.error('   Then run this script again.\n');
    process.exit(1);
  }
}

/**
 * Verify MCP is enabled
 */
function verifyMCPEnabled(): void {
  console.log('🔍 Checking MCP configuration...');

  if (process.env.MCP_EXECUTION_ENABLED !== 'true') {
    console.error('\n⚠️  MCP_EXECUTION_ENABLED is not set to "true"');
    console.error('   Set environment variable: export MCP_EXECUTION_ENABLED=true');
    console.error('   Or add to .env.local: MCP_EXECUTION_ENABLED=true\n');
    process.exit(1);
  }

  console.log('✅ MCP execution is enabled\n');
}

/**
 * Display pre-flight checklist
 */
function displayPreFlightChecklist(config: Config): void {
  console.log('📋 Pre-flight Checklist:');
  console.log(`   ✓ Customer ID: ${config.customerId}`);
  console.log(`   ✓ Domain: ${config.domain}`);
  console.log(`   ✓ Test cases: ${config.testCases.length}`);
  console.log(`   ✓ Output: ${config.outputPath || 'default (ARCHIVE/test-results/)'}\n`);
}

/**
 * Estimate test duration
 */
function estimateTestDuration(testCount: number): string {
  // Each test: ~2s execution + 1s delay = ~3s per test
  const estimatedSeconds = testCount * 3;
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Display progress bar
 */
function displayProgress(current: number, total: number): void {
  const percentage = Math.floor((current / total) * 100);
  const barLength = 40;
  const filledLength = Math.floor((current / total) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

  process.stdout.write(`\r   Progress: [${bar}] ${percentage}% (${current}/${total})`);

  if (current === total) {
    process.stdout.write('\n');
  }
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.clear();
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   MCP vs Traditional Tool Calling - Comparison Tests  ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Load configuration
  const config = loadConfig();

  // Pre-flight checks
  displayPreFlightChecklist(config);
  await verifyServerRunning();
  verifyMCPEnabled();

  // Estimate duration
  const estimatedDuration = estimateTestDuration(config.testCases.length);
  console.log(`⏱️  Estimated duration: ${estimatedDuration}\n`);

  // Confirm execution
  console.log('🚀 Starting comparison tests...\n');

  const startTime = Date.now();

  try {
    // Run comparison tests
    const results = await compareTraditionalAndMCP(
      config.customerId,
      config.domain,
      config.testCases
    );

    const endTime = Date.now();
    const actualDuration = ((endTime - startTime) / 1000).toFixed(1);

    console.log(`\n✅ Tests completed in ${actualDuration}s`);

    // Generate report
    console.log('\n📝 Generating report...');
    const reportPath = generateReport(results, config.outputPath);

    // Print summary
    printSummary(results);

    // Exit with appropriate code
    const allPassed = results.every(r => r.functionalEquivalence.passed);
    const passRate = results.filter(r => r.functionalEquivalence.passed).length / results.length;

    if (allPassed) {
      console.log('🎉 All tests passed! MCP system ready for production.\n');
      process.exit(0);
    } else if (passRate >= 0.85) {
      console.log('⚠️  Most tests passed (>85%). Review failures before production.\n');
      process.exit(0);
    } else {
      console.log('❌ Too many failures (<85%). MCP system needs improvements.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\nStack trace:');
    console.error(error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// =====================================================
// ERROR HANDLING
// =====================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled rejection at:', promise);
  console.error('   Reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught exception:');
  console.error(error);
  process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Tests interrupted by user');
  console.log('   Partial results may be incomplete\n');
  process.exit(130);
});

// =====================================================
// HELP TEXT
// =====================================================

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
MCP Comparison Test Runner

Usage:
  npx tsx scripts/tests/run-mcp-comparison.ts [options]

Options:
  --sample              Run only 5 sample tests (faster)
  --category=<name>     Run only tests from specific category
  --output=<path>       Custom output path for report
  --help, -h            Show this help message

Categories:
  exact_sku            Tests for exact SKU matching
  semantic_search      Tests for semantic product search
  multi_result         Tests returning multiple products
  edge_case            Edge cases and unusual queries
  error_handling       Error scenarios

Examples:
  # Run all tests
  npx tsx scripts/tests/run-mcp-comparison.ts

  # Run 5 sample tests
  npx tsx scripts/tests/run-mcp-comparison.ts --sample

  # Run only exact SKU tests
  npx tsx scripts/tests/run-mcp-comparison.ts --category=exact_sku

  # Custom output path
  npx tsx scripts/tests/run-mcp-comparison.ts --output=./my-report.md

Environment Variables:
  TEST_CUSTOMER_ID     Customer ID for testing (default: test-customer-id)
  TEST_DOMAIN          Domain for testing (default: test-domain.com)
  MCP_EXECUTION_ENABLED Must be "true" to run tests

Prerequisites:
  1. Start dev server: npm run dev
  2. Set MCP_EXECUTION_ENABLED=true
  3. Ensure test customer exists in database
  `);
  process.exit(0);
}

// Run main function
main().catch(console.error);
