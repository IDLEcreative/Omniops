/**
 * Full Page Retrieval Testing Script
 *
 * This script verifies that executeGetCompletePageDetails() correctly:
 * 1. Retrieves ALL chunks from a single page
 * 2. Returns chunks with same URL
 * 3. Sets source to 'full-page'
 * 4. Contains complete product information
 * 5. Returns pageInfo metadata
 * 6. Is token efficient (~1500-2000 tokens)
 */

import { executeGetCompletePageDetails } from './lib/chat/tool-handlers';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test result tracking
interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const testResults: TestResult[] = [];

function addTest(name: string, passed: boolean, details: string) {
  testResults.push({ name, passed, details });
  const status = passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
  console.log(`${status} ${name}: ${details}`);
}

// Approximate token count (4 chars ≈ 1 token)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

async function runFullPageRetrievalTests() {
  console.log(`\n${colors.bold}${colors.cyan}=== Full Page Retrieval Test Suite ===${colors.reset}\n`);

  const testQuery = '10mtr extension cables';
  const testDomain = 'thompsonseparts.co.uk';

  console.log(`${colors.blue}Test Query:${colors.reset} "${testQuery}"`);
  console.log(`${colors.blue}Test Domain:${colors.reset} ${testDomain}\n`);

  try {
    // Execute the function
    console.log(`${colors.yellow}Executing executeGetCompletePageDetails()...${colors.reset}\n`);
    const startTime = Date.now();
    const result = await executeGetCompletePageDetails(testQuery, testDomain);
    const executionTime = Date.now() - startTime;

    console.log(`${colors.cyan}Execution Time:${colors.reset} ${executionTime}ms\n`);

    // Test 1: Returns full page
    const returnedFullPage = result.success && result.results.length > 0;
    addTest(
      'Returns full page',
      returnedFullPage,
      returnedFullPage ? `Yes (${result.results.length} chunks)` : 'No'
    );

    if (!returnedFullPage) {
      console.log(`\n${colors.red}CRITICAL FAILURE: No results returned. Aborting remaining tests.${colors.reset}\n`);
      printSummary();
      return;
    }

    // Test 2: All chunks from same URL
    const urls = [...new Set(result.results.map(r => r.url))];
    const sameUrl = urls.length === 1;
    addTest(
      'All chunks same URL',
      sameUrl,
      sameUrl ? 'Yes' : `No (${urls.length} different URLs)`
    );

    // Test 3: Source is 'full-page'
    const correctSource = result.source === 'full-page';
    addTest(
      'Source is "full-page"',
      correctSource,
      correctSource ? 'Yes' : `No (source: ${result.source})`
    );

    // Test 4: Page info returned
    const hasPageInfo = !!result.pageInfo;
    addTest(
      'Page info returned',
      hasPageInfo,
      hasPageInfo
        ? `Yes (url: ${result.pageInfo?.url ? 'present' : 'missing'}, title: ${result.pageInfo?.title ? 'present' : 'missing'}, totalChunks: ${result.pageInfo?.totalChunks})`
        : 'No'
    );

    // Combine all chunk content for completeness check
    const allContent = result.results.map(r => r.content).join('\n').toLowerCase();

    // Test 5: Contains product price (£25.98)
    const hasPrice = allContent.includes('25.98') || allContent.includes('£25.98');
    addTest(
      'Complete product info: Price',
      hasPrice,
      hasPrice ? 'Yes (£25.98 found)' : 'No (price not found)'
    );

    // Test 6: Contains product SKU (10M-CC)
    const hasSKU = allContent.includes('10m-cc') || allContent.includes('10mcc');
    addTest(
      'Complete product info: SKU',
      hasSKU,
      hasSKU ? 'Yes (10M-CC found)' : 'No (SKU not found)'
    );

    // Test 7: Contains product description
    const hasDescription = allContent.includes('extension') && allContent.includes('cable');
    addTest(
      'Complete product info: Description',
      hasDescription,
      hasDescription ? 'Yes (extension cable description found)' : 'No (description not found)'
    );

    // Test 8: Token efficiency
    const totalTokens = result.results.reduce((sum, r) => sum + estimateTokenCount(r.content), 0);
    const tokenEfficient = totalTokens >= 1000 && totalTokens <= 3000;
    addTest(
      'Token efficiency',
      tokenEfficient,
      tokenEfficient
        ? `Good (${totalTokens} tokens, target: 1500-2000)`
        : `${totalTokens < 1000 ? 'Too few' : 'Too many'} (${totalTokens} tokens)`
    );

    // Detailed output
    console.log(`\n${colors.bold}${colors.cyan}=== Detailed Analysis ===${colors.reset}\n`);

    console.log(`${colors.blue}Chunks Returned:${colors.reset} ${result.results.length}`);
    console.log(`${colors.blue}URL:${colors.reset} ${result.results[0]?.url || 'N/A'}`);
    console.log(`${colors.blue}Page Title:${colors.reset} ${result.pageInfo?.title || result.results[0]?.title || 'N/A'}`);
    console.log(`${colors.blue}Total Tokens:${colors.reset} ~${totalTokens} tokens`);
    console.log(`${colors.blue}Average Tokens per Chunk:${colors.reset} ~${Math.round(totalTokens / result.results.length)} tokens`);

    // Show first chunk preview
    if (result.results.length > 0) {
      console.log(`\n${colors.blue}First Chunk Preview:${colors.reset}`);
      const preview = result.results[0].content.substring(0, 200) + '...';
      console.log(preview);
    }

    // Check metadata
    if (result.results.length > 0) {
      console.log(`\n${colors.blue}Metadata Sample:${colors.reset}`);
      const metadata = result.results[0].metadata;
      if (metadata) {
        console.log(`  - chunk_index: ${metadata.chunk_index ?? 'N/A'}`);
        console.log(`  - total_chunks: ${metadata.total_chunks ?? 'N/A'}`);
        console.log(`  - retrieval_strategy: ${metadata.retrieval_strategy ?? 'N/A'}`);
      } else {
        console.log('  No metadata available');
      }
    }

    // Print summary
    printSummary();

  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}TEST EXECUTION FAILED:${colors.reset}`, error);
    if (error instanceof Error) {
      console.error(`${colors.red}Error message:${colors.reset} ${error.message}`);
      console.error(`${colors.red}Stack trace:${colors.reset}`);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function printSummary() {
  const passed = testResults.filter(t => t.passed).length;
  const total = testResults.length;
  const passRate = Math.round((passed / total) * 100);

  console.log(`\n${colors.bold}${colors.cyan}=== Test Summary ===${colors.reset}\n`);
  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${total - passed}${colors.reset}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  if (passRate === 100) {
    console.log(`${colors.green}${colors.bold}🎉 ALL TESTS PASSED! 🎉${colors.reset}\n`);
  } else if (passRate >= 75) {
    console.log(`${colors.yellow}${colors.bold}⚠️  MOST TESTS PASSED (some issues) ⚠️${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ CRITICAL ISSUES DETECTED ❌${colors.reset}\n`);
  }

  // List failed tests
  const failedTests = testResults.filter(t => !t.passed);
  if (failedTests.length > 0) {
    console.log(`${colors.red}${colors.bold}Failed Tests:${colors.reset}`);
    failedTests.forEach(t => {
      console.log(`  ${colors.red}❌${colors.reset} ${t.name}: ${t.details}`);
    });
    console.log();
  }
}

// Execute tests
runFullPageRetrievalTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
