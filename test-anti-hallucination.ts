#!/usr/bin/env npx tsx
/**
 * Test anti-hallucination measures in intelligent chat
 */

import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testAntiHallucination() {
  console.log(`\n${colors.cyan}${colors.bright}🔬 Testing Anti-Hallucination Measures${colors.reset}\n`);
  
  const queries = [
    {
      query: "What vehicle batteries do you have?",
      expectation: "Should NOT mention Numax batteries (they don't exist)",
      checkFor: ["numax", "XV31MF", "LV22MF"],
      shouldNotFind: true
    },
    {
      query: "Show me all your batteries",
      expectation: "Should mention actual batteries (remote control, power tool)",
      checkFor: ["HBC", "STIHL", "solar", "remote"],
      shouldNotFind: false
    },
    {
      query: "Do you have any truck batteries?",
      expectation: "Should admit no truck batteries available",
      checkFor: ["don't have", "not available", "couldn't find", "no truck batteries"],
      shouldNotFind: false
    }
  ];
  
  for (const test of queries) {
    console.log(`\n${colors.blue}Test: "${test.query}"${colors.reset}`);
    console.log(`Expectation: ${test.expectation}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.query,
          session_id: `hallucination-test-${Date.now()}`,
          domain: 'thompsonseparts.co.uk',
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.message.toLowerCase();
      
      // Check for hallucinated products
      let passed = true;
      const foundTerms = [];
      
      for (const term of test.checkFor) {
        if (responseText.includes(term.toLowerCase())) {
          foundTerms.push(term);
        }
      }
      
      if (test.shouldNotFind && foundTerms.length > 0) {
        console.log(`${colors.red}❌ FAILED: Found hallucinated terms: ${foundTerms.join(', ')}${colors.reset}`);
        passed = false;
      } else if (!test.shouldNotFind && foundTerms.length === 0) {
        console.log(`${colors.red}❌ FAILED: Did not find expected terms${colors.reset}`);
        passed = false;
      } else {
        console.log(`${colors.green}✅ PASSED: Response is accurate${colors.reset}`);
      }
      
      // Show search metadata
      if (data.searchMetadata) {
        console.log(`\nSearch details:`);
        console.log(`  - Iterations: ${data.searchMetadata.iterations}`);
        console.log(`  - Total searches: ${data.searchMetadata.totalSearches}`);
        if (data.searchMetadata.searchLog) {
          console.log(`  - Search functions:`);
          data.searchMetadata.searchLog.forEach((log: any) => {
            console.log(`    • ${log.function}: ${log.resultCount} results`);
          });
        }
      }
      
      // Show excerpt of response
      console.log(`\nResponse excerpt:`);
      console.log(`"${data.message.substring(0, 200)}..."${colors.reset}`);
      
      // Special check for Numax hallucination
      if (responseText.includes('numax')) {
        console.log(`\n${colors.red}${colors.bright}⚠️ WARNING: Response contains 'Numax' - this is a hallucination!${colors.reset}`);
        console.log(`Context: "${data.message.substring(responseText.indexOf('numax') - 50, responseText.indexOf('numax') + 100)}"`);
      }
      
    } catch (error: any) {
      console.error(`${colors.red}Error testing query:${colors.reset}`, error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`\n${colors.cyan}${colors.bright}📊 Test Summary${colors.reset}`);
  console.log(`Anti-hallucination measures have been implemented with:`);
  console.log(`  1. Strict system prompt rules against inventing products`);
  console.log(`  2. Grounding reminder before final response`);
  console.log(`  3. Explicit instructions to only mention search results`);
  console.log(`\nThe AI should now:`);
  console.log(`  • Only mention products found in search results`);
  console.log(`  • Admit when products don't exist`);
  console.log(`  • Suggest alternatives from actual inventory`);
  console.log(`  • Never invent product names or specifications`);
}

// Run the test
testAntiHallucination().catch(console.error);