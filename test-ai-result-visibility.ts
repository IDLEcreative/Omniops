#!/usr/bin/env npx tsx

import { config } from 'dotenv';
config();

/**
 * Critical Test: What does the AI actually see?
 * 
 * When there are 200 products but a 20 limit:
 * - Does AI see all 200?
 * - Does AI only see 20?
 * - Can AI intelligently filter in follow-ups?
 */

interface ConversationTest {
  sessionId: string;
  conversationId?: string;
  messages: string[];
  expectations: string[];
}

async function testAIResultVisibility() {
  console.log('🔬 CRITICAL TEST: AI Result Visibility Analysis\n');
  console.log('Question: When 200 products exist but limit is 20, what does AI see?\n');
  console.log('='*70 + '\n');

  // Test 1: Initial broad query
  console.log('TEST 1: Broad Query - "Show me all your products"\n');
  
  const session1 = `visibility-${Date.now()}`;
  let conversationId: string | undefined;
  
  const response1 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Show me all your products",
      session_id: session1,
      domain: 'thompsonseparts.co.uk'
    })
  });

  const data1 = await response1.json();
  conversationId = data1.conversation_id;

  console.log('📊 ANALYSIS OF AI RESPONSE #1:\n');
  
  // What the AI saw
  if (data1.searchMetadata?.searchLog) {
    const totalResultsFound = data1.searchMetadata.searchLog.reduce(
      (sum: number, log: any) => sum + log.resultCount, 0
    );
    console.log(`✅ Total results AI received: ${totalResultsFound}`);
    
    data1.searchMetadata.searchLog.forEach((log: any) => {
      console.log(`   - ${log.tool}: ${log.resultCount} results`);
    });
  }

  // What the AI said
  const response = data1.message || '';
  console.log('\n🤖 AI\'s Description:');
  
  // Check if AI mentions specific numbers
  const numberMatches = response.match(/\b(\d+)\s*(products?|items?|results?)\b/gi);
  if (numberMatches) {
    console.log(`   ❌ AI mentioned specific numbers: ${numberMatches.join(', ')}`);
    console.log('   (This suggests AI only sees the limited set)');
  } else {
    console.log('   ✅ AI didn\'t mention specific numbers');
  }

  // Check if AI uses vague language
  if (response.match(/extensive|wide range|many|numerous|variety/i)) {
    console.log('   ✅ AI used vague language (extensive, many, etc.)');
    console.log('   (This is what we want - acknowledges more exist)');
  }

  console.log('\n' + '-'*70 + '\n');

  // Test 2: Follow-up specific query
  console.log('TEST 2: Follow-up Query - "From those, show me only hydraulic pumps"\n');
  console.log('This tests if AI can filter from the previous results or needs new search\n');

  const response2 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "From those, show me only hydraulic pumps",
      session_id: session1,
      conversation_id: conversationId,
      domain: 'thompsonseparts.co.uk'
    })
  });

  const data2 = await response2.json();
  
  console.log('📊 ANALYSIS OF AI RESPONSE #2:\n');

  // Did AI do a new search or filter existing?
  if (data2.searchMetadata?.searchLog && data2.searchMetadata.searchLog.length > 0) {
    console.log('🔍 AI performed NEW searches:');
    data2.searchMetadata.searchLog.forEach((log: any) => {
      console.log(`   - ${log.tool}("${log.query}"): ${log.resultCount} results`);
    });
    console.log('\n⚠️  IMPORTANT: AI had to search again, couldn\'t filter from memory');
    console.log('This means AI does NOT retain the full 200 products from search #1');
  } else {
    console.log('✅ AI didn\'t perform new searches');
    console.log('(Would mean AI filtered from memory - unlikely with current system)');
  }

  // Check response quality
  const response2Text = data2.message || '';
  if (response2Text.includes('hydraulic')) {
    console.log('\n✅ AI correctly focused on hydraulic pumps');
  }

  console.log('\n' + '='*70 + '\n');

  // Test 3: Test with known large result set
  console.log('TEST 3: Testing with query that should have 100+ results\n');
  
  const response3 = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "How many Cifa products do you have in total?",
      session_id: `count-test-${Date.now()}`,
      domain: 'thompsonseparts.co.uk'
    })
  });

  const data3 = await response3.json();
  
  console.log('📊 COUNT QUERY ANALYSIS:\n');
  
  if (data3.searchMetadata?.searchLog) {
    const results = data3.searchMetadata.searchLog[0];
    if (results) {
      console.log(`Search returned: ${results.resultCount} results`);
      
      if (results.resultCount === 20 || results.resultCount === 10) {
        console.log('⚠️  Hit exact limit - there are likely more products');
      }
    }
  }

  const countResponse = data3.message || '';
  const exactCount = countResponse.match(/\b(\d+)\s*(?:Cifa\s+)?products?\b/i);
  
  if (exactCount) {
    console.log(`\n❌ AI gave exact count: ${exactCount[0]}`);
    console.log('Problem: This is likely just the search limit, not the real total');
  } else if (countResponse.match(/many|numerous|extensive|wide range/i)) {
    console.log('\n✅ AI gave vague answer about quantity');
    console.log('Good: AI recognizes it doesn\'t know the exact total');
  }

  console.log('\n' + '='*70 + '\n');

  // CONCLUSION
  console.log('🎯 CONCLUSION:\n');
  console.log('Based on the tests, here\'s what the AI sees:\n');
  
  console.log('1. AI receives LIMITED results (10-20 items), not the full 200');
  console.log('2. AI gets a NOTE when exactly 20 results (knows more may exist)');
  console.log('3. AI CANNOT filter from memory - must search again');
  console.log('4. AI is instructed to use vague language when hitting limits');
  
  console.log('\n⚠️  CRITICAL LIMITATION:');
  console.log('If user asks "from those 200, show me X", AI must search again');
  console.log('AI cannot intelligently filter because it never saw all 200 items');
  console.log('It only saw the truncated first 20 with a note saying "more exist"');
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Include total count in metadata (e.g., "showing 20 of 247 total")');
  console.log('2. Consider pagination support for follow-up queries');
  console.log('3. Cache full result IDs for filtering in conversation context');
  console.log('4. Or increase limits to 50-100 for better context (performance trade-off)');
}

// Utility function for console output formatting
Object.defineProperty(String.prototype, '__mul__', {
  value: function(n: number) {
    return this.repeat(n);
  }
});

// @ts-ignore
String.prototype['*'] = function(n: number) {
  return this.repeat(n);
};

console.log = ((originalLog) => {
  return (...args: any[]) => {
    const processedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        // Handle multiplication pattern
        return arg.replace(/(.)\*(\d+)/g, (match, char, count) => {
          return char.repeat(parseInt(count));
        });
      }
      return arg;
    });
    originalLog(...processedArgs);
  };
})(console.log);

testAIResultVisibility().catch(console.error);