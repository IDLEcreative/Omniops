/**
 * Final Verification Test for Full Page Retrieval
 *
 * This script provides a comprehensive pass/fail report for the
 * executeGetCompletePageDetails() function based on all requirements.
 */

import { executeGetCompletePageDetails } from './lib/chat/tool-handlers';

// Colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function finalVerification() {
  console.log(`\n${c.bold}${c.cyan}╔════════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.cyan}║     FULL PAGE RETRIEVAL - FINAL VERIFICATION TEST     ║${c.reset}`);
  console.log(`${c.bold}${c.cyan}╚════════════════════════════════════════════════════════════╝${c.reset}\n`);

  const testQuery = '10mtr extension cables for all TS Camera systems';
  const testDomain = 'test-domain.example.com';

  console.log(`${c.blue}Query:${c.reset} "${testQuery}"`);
  console.log(`${c.blue}Domain:${c.reset} ${testDomain}`);
  console.log(`${c.blue}Function:${c.reset} executeGetCompletePageDetails()\n`);

  let allTestsPassed = true;

  try {
    // Execute
    console.log(`${c.yellow}Executing...${c.reset}\n`);
    const startTime = Date.now();
    const result = await executeGetCompletePageDetails(testQuery, testDomain);
    const executionTime = Date.now() - startTime;

    console.log(`${c.cyan}Execution Time:${c.reset} ${executionTime}ms\n`);

    // Requirement 1: Returns full page with multiple chunks
    console.log(`${c.bold}${c.cyan}━━━ TEST 1: Returns Full Page ━━━${c.reset}`);
    const test1Pass = result.success && result.results.length > 1;
    console.log(`${test1Pass ? c.green + '✅' : c.red + '❌'} Expected: Multiple chunks (>1) from one page${c.reset}`);
    console.log(`${test1Pass ? c.green + '✅' : c.red + '❌'} Actual: ${result.results.length} chunks returned${c.reset}`);
    if (!test1Pass) allTestsPassed = false;
    console.log();

    if (!result.success || result.results.length === 0) {
      console.log(`${c.red}${c.bold}CRITICAL FAILURE: No results returned. Cannot continue tests.${c.reset}\n`);
      process.exit(1);
    }

    // Requirement 2: All chunks have same URL
    console.log(`${c.bold}${c.cyan}━━━ TEST 2: All Chunks Same URL ━━━${c.reset}`);
    const urls = [...new Set(result.results.map(r => r.url))];
    const test2Pass = urls.length === 1;
    console.log(`${test2Pass ? c.green + '✅' : c.red + '❌'} Expected: All chunks have identical URL${c.reset}`);
    console.log(`${test2Pass ? c.green + '✅' : c.red + '❌'} Actual: ${urls.length} unique URL(s)${c.reset}`);
    if (test2Pass) {
      console.log(`${c.blue}   URL:${c.reset} ${urls[0]}`);
    }
    if (!test2Pass) allTestsPassed = false;
    console.log();

    // Requirement 3: Source is 'full-page'
    console.log(`${c.bold}${c.cyan}━━━ TEST 3: Source is 'full-page' ━━━${c.reset}`);
    const test3Pass = result.source === 'full-page';
    console.log(`${test3Pass ? c.green + '✅' : c.red + '❌'} Expected: source === 'full-page'${c.reset}`);
    console.log(`${test3Pass ? c.green + '✅' : c.red + '❌'} Actual: source === '${result.source}'${c.reset}`);
    if (!test3Pass) allTestsPassed = false;
    console.log();

    // Requirement 4: Page info metadata present
    console.log(`${c.bold}${c.cyan}━━━ TEST 4: Page Info Metadata ━━━${c.reset}`);
    const test4Pass = !!result.pageInfo &&
                     !!result.pageInfo.url &&
                     !!result.pageInfo.title &&
                     typeof result.pageInfo.totalChunks === 'number';
    console.log(`${test4Pass ? c.green + '✅' : c.red + '❌'} Expected: pageInfo with url, title, totalChunks${c.reset}`);
    console.log(`${test4Pass ? c.green + '✅' : c.red + '❌'} Actual: ${test4Pass ? 'All fields present' : 'Missing fields'}${c.reset}`);
    if (test4Pass) {
      console.log(`${c.blue}   Title:${c.reset} ${result.pageInfo.title}`);
      console.log(`${c.blue}   Total Chunks:${c.reset} ${result.pageInfo.totalChunks}`);
    }
    if (!test4Pass) allTestsPassed = false;
    console.log();

    // Combine content for completeness check
    const allContent = result.results.map(r => r.content).join('\n');

    // Requirement 5: Complete product information
    console.log(`${c.bold}${c.cyan}━━━ TEST 5: Complete Product Information ━━━${c.reset}`);

    // Check for price (any price format)
    const priceMatch = allContent.match(/£\s*\d+\.?\d*/);
    const hasPrice = !!priceMatch;
    console.log(`${hasPrice ? c.green + '✅' : c.red + '❌'} Price found: ${hasPrice ? priceMatch[0] : 'NOT FOUND'}${c.reset}`);

    // Check for SKU
    const skuMatch = allContent.match(/SKU:\s*([A-Z0-9-]+)/i);
    const hasSKU = !!skuMatch;
    console.log(`${hasSKU ? c.green + '✅' : c.red + '❌'} SKU found: ${hasSKU ? skuMatch[1] : 'NOT FOUND'}${c.reset}`);

    // Check for description keywords
    const hasDescription = (allContent.toLowerCase().includes('extension') ||
                          allContent.toLowerCase().includes('cable')) &&
                         (allContent.toLowerCase().includes('camera') ||
                          allContent.toLowerCase().includes('ts camera'));
    console.log(`${hasDescription ? c.green + '✅' : c.red + '❌'} Description: ${hasDescription ? 'FOUND' : 'NOT FOUND'}${c.reset}`);

    const test5Pass = hasPrice && hasSKU && hasDescription;
    if (!test5Pass) allTestsPassed = false;
    console.log();

    // Requirement 6: Token efficiency
    console.log(`${c.bold}${c.cyan}━━━ TEST 6: Token Efficiency ━━━${c.reset}`);
    const totalChars = result.results.reduce((sum, r) => sum + r.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    // Acceptable range: 400-3000 (depends on page content)
    const test6Pass = estimatedTokens >= 400 && estimatedTokens <= 3000;
    console.log(`${test6Pass ? c.green + '✅' : c.red + '❌'} Expected: 400-3000 tokens (varies by page)${c.reset}`);
    console.log(`${test6Pass ? c.green + '✅' : c.red + '❌'} Actual: ~${estimatedTokens} tokens${c.reset}`);
    console.log(`${c.blue}   Characters:${c.reset} ${totalChars}`);
    console.log(`${c.blue}   Avg per chunk:${c.reset} ~${Math.round(estimatedTokens / result.results.length)} tokens`);
    if (!test6Pass) allTestsPassed = false;
    console.log();

    // Additional verification: Metadata structure
    console.log(`${c.bold}${c.cyan}━━━ TEST 7: Chunk Metadata Structure ━━━${c.reset}`);
    const firstChunk = result.results[0];
    const hasMetadata = !!firstChunk.metadata;
    const hasRetrievalStrategy = firstChunk.metadata?.retrieval_strategy === 'full_page';
    const hasChunkIndex = typeof firstChunk.metadata?.chunk_index === 'number';
    const hasTotalChunks = typeof firstChunk.metadata?.total_chunks === 'number';
    const test7Pass = hasMetadata && hasRetrievalStrategy && hasChunkIndex && hasTotalChunks;

    console.log(`${hasMetadata ? c.green + '✅' : c.red + '❌'} Metadata present: ${hasMetadata}${c.reset}`);
    console.log(`${hasRetrievalStrategy ? c.green + '✅' : c.red + '❌'} retrieval_strategy: ${firstChunk.metadata?.retrieval_strategy || 'missing'}${c.reset}`);
    console.log(`${hasChunkIndex ? c.green + '✅' : c.red + '❌'} chunk_index: ${firstChunk.metadata?.chunk_index ?? 'missing'}${c.reset}`);
    console.log(`${hasTotalChunks ? c.green + '✅' : c.red + '❌'} total_chunks: ${firstChunk.metadata?.total_chunks ?? 'missing'}${c.reset}`);
    if (!test7Pass) allTestsPassed = false;
    console.log();

    // Summary
    console.log(`${c.bold}${c.cyan}╔════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.bold}${c.cyan}║                     TEST SUMMARY                      ║${c.reset}`);
    console.log(`${c.bold}${c.cyan}╚════════════════════════════════════════════════════════════╝${c.reset}\n`);

    const testResults = [
      { name: 'Returns full page', pass: test1Pass },
      { name: 'All chunks same URL', pass: test2Pass },
      { name: 'Source is full-page', pass: test3Pass },
      { name: 'Page info returned', pass: test4Pass },
      { name: 'Complete product info', pass: test5Pass },
      { name: 'Token efficiency', pass: test6Pass },
      { name: 'Metadata structure', pass: test7Pass }
    ];

    const passCount = testResults.filter(t => t.pass).length;
    const totalCount = testResults.length;
    const passRate = Math.round((passCount / totalCount) * 100);

    console.log(`${c.bold}Tests Passed:${c.reset} ${passCount}/${totalCount} (${passRate}%)`);
    console.log();

    testResults.forEach(test => {
      const icon = test.pass ? `${c.green}✅` : `${c.red}❌`;
      console.log(`${icon} ${test.name}${c.reset}`);
    });
    console.log();

    if (allTestsPassed) {
      console.log(`${c.green}${c.bold}╔════════════════════════════════════════════════════════════╗${c.reset}`);
      console.log(`${c.green}${c.bold}║                  🎉 ALL TESTS PASSED 🎉                ║${c.reset}`);
      console.log(`${c.green}${c.bold}║                                                       ║${c.reset}`);
      console.log(`${c.green}${c.bold}║   executeGetCompletePageDetails() is PRODUCTION READY  ║${c.reset}`);
      console.log(`${c.green}${c.bold}╚════════════════════════════════════════════════════════════╝${c.reset}\n`);
      process.exit(0);
    } else {
      console.log(`${c.red}${c.bold}╔════════════════════════════════════════════════════════════╗${c.reset}`);
      console.log(`${c.red}${c.bold}║                  ❌ SOME TESTS FAILED ❌               ║${c.reset}`);
      console.log(`${c.red}${c.bold}╚════════════════════════════════════════════════════════════╝${c.reset}\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n${c.red}${c.bold}EXECUTION ERROR:${c.reset}`, error);
    if (error instanceof Error) {
      console.error(`${c.red}Message:${c.reset} ${error.message}`);
      console.error(`${c.red}Stack:${c.reset}`);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

finalVerification();
