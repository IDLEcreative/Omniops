#!/usr/bin/env tsx
/**
 * MCP vs Traditional Tool Calling - Comparison Framework
 *
 * Purpose: Validates functional equivalence and measures performance improvements
 * when switching from traditional tool calling to MCP code execution.
 *
 * Architecture:
 * 1. Test Case Definition - Diverse conversation queries
 * 2. Execution Engine - Runs identical queries through both systems
 * 3. Comparison Logic - Assesses functional equivalence
 * 4. Performance Metrics - Measures speed and token usage
 * 5. Report Generation - Comprehensive analysis output
 *
 * Usage:
 *   npx tsx scripts/tests/compare-mcp-traditional.ts
 *
 * Prerequisites:
 * - Dev server running on port 3000
 * - Both systems enabled via environment flags
 * - Test customer configured in database
 */

import { ComparisonTestCase, ComparisonResult } from './modules/mcp-types';
import { TEST_CASES } from './modules/mcp-scenarios';
import { executeTraditionalChat, executeMCPChat } from './modules/mcp-executor';
import { compareResults } from './modules/mcp-analyzer';
import { generateReport, printSummary } from './modules/mcp-reporter';

// Re-export for tests
export { compareResults } from './modules/mcp-analyzer';
export { TEST_CASES } from './modules/mcp-scenarios';
export type { ExecutionResult, ComparisonTestCase } from './modules/mcp-types';

/**
 * Run complete comparison test suite
 */
export async function compareTraditionalAndMCP(
  customerId: string,
  domain: string,
  testCases: ComparisonTestCase[] = TEST_CASES
): Promise<ComparisonResult[]> {
  console.log(`\n🚀 Starting MCP Comparison Tests`);
  console.log(`📊 Running ${testCases.length} test cases\n`);

  const results: ComparisonResult[] = [];

  for (const testCase of testCases) {
    console.log(`\n▶️  ${testCase.id}: ${testCase.description}`);
    console.log(`   Query: "${testCase.userQuery}"`);

    // Execute traditional
    console.log('   🔹 Running traditional...');
    const traditionalResult = await executeTraditionalChat(testCase, customerId, domain);

    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Execute MCP
    console.log('   🔹 Running MCP...');
    const mcpResult = await executeMCPChat(testCase, customerId, domain);

    // Compare results
    const comparison = compareResults(traditionalResult, mcpResult, testCase);

    results.push(comparison);

    // Log immediate result
    const status = comparison.functionalEquivalence.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${status} (Score: ${comparison.functionalEquivalence.score}/100)`);
    console.log(`   Token savings: ${comparison.tokenUsage.percentReduction.toFixed(1)}%`);
    console.log(`   Speed: ${comparison.performance.speedImprovement.toFixed(1)}%`);

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Verify server is running
 */
async function verifyServerRunning(): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    console.error('❌ Dev server not responding on http://localhost:3000');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }
}

/**
 * Main CLI execution
 */
async function main() {
  // Verify server is running
  await verifyServerRunning();

  // Run comparison tests
  const results = await compareTraditionalAndMCP(
    'test-customer-id',
    'localhost:3000'
  );

  // Generate report
  const reportPath = generateReport(results);

  // Print summary
  printSummary(results);

  console.log(`\n📄 Full report saved to: ${reportPath}\n`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

// Export for use in other modules
export default compareTraditionalAndMCP;
export { TEST_CASES } from './modules/mcp-scenarios';
export { ComparisonTestCase, ExecutionResult, ComparisonResult } from './modules/mcp-types';
