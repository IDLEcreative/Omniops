#!/usr/bin/env npx tsx
/**
 * Quick test of restored system prompt
 */

import fetch from 'node-fetch';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function testQuery(query: string, checkFor: string[]): Promise<boolean> {
  console.log(`\n${colors.cyan}Testing: "${query}"${colors.reset}`);
  
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: `test-${Date.now()}`,
        domain: 'thompsonseparts.co.uk'
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      console.log(`  ${colors.red}✗ HTTP ${response.status}${colors.reset}`);
      return false;
    }

    const data = await response.json();
    const message = data.message || '';
    
    console.log(`  Response preview: "${message.substring(0, 100)}..."`);
    
    let allPassed = true;
    for (const check of checkFor) {
      const found = message.toLowerCase().includes(check.toLowerCase());
      console.log(`  ${found ? colors.green + '✓' : colors.red + '✗'} Contains "${check}": ${found}${colors.reset}`);
      if (!found) allPassed = false;
    }
    
    // Check for bad patterns
    const badPatterns = ['$', 'amazon', 'external', 'manufacturer website'];
    for (const bad of badPatterns) {
      const found = message.toLowerCase().includes(bad.toLowerCase());
      if (found) {
        console.log(`  ${colors.red}✗ Contains unwanted "${bad}"${colors.reset}`);
        allPassed = false;
      }
    }
    
    return allPassed;
    
  } catch (error: any) {
    console.log(`  ${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  console.log(`${colors.bold}Testing Restored System Prompt${colors.reset}`);
  console.log('API: http://localhost:3000/api/chat-intelligent');
  console.log('Model: GPT-5-mini with restored comprehensive prompt\n');
  
  const results: boolean[] = [];
  
  // Test 1: Cifa pump - should mention range/category
  results.push(await testQuery(
    "Need a pump for my Cifa mixer",
    ["range", "category", "Cifa"]
  ));
  
  // Test 2: Teng tools - should mention category, no external
  results.push(await testQuery(
    "Search for Teng torque wrenches",
    ["Teng", "category", "tools"]
  ));
  
  // Test 3: DC66-10P - should find product
  results.push(await testQuery(
    "DC66-10P",
    ["DC66", "available"]
  ));
  
  // Test 4: Price query - should use GBP
  results.push(await testQuery(
    "Price on a starter charger",
    ["£", "starter", "charger"]
  ));
  
  // Summary
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}Summary:${colors.reset}`);
  const passed = results.filter(r => r).length;
  const total = results.length;
  const passRate = (passed / total * 100).toFixed(0);
  
  console.log(`  Passed: ${passed}/${total} (${passRate}%)`);
  
  if (passed === total) {
    console.log(`  ${colors.green}${colors.bold}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`  ${colors.red}${colors.bold}✗ Some tests failed${colors.reset}`);
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Check server is running
fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(2000) })
  .then(() => runTests())
  .catch(() => {
    console.error(`${colors.red}Server not responding at localhost:3000${colors.reset}`);
    console.log('The server may need to be restarted after the route changes.');
    console.log('Try: npm run dev');
    process.exit(1);
  });