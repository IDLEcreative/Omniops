#!/usr/bin/env node

/**
 * Final validation test for 90%+ success rate
 * Faster version with reduced timeouts
 */

const API_URL = 'http://localhost:3001/api/chat';
const TEST_DOMAIN = 'thompsonselectrical.co.uk';

async function testQuery(message, shouldTrigger) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: `test-${Date.now()}-${Math.random()}`,
        domain: TEST_DOMAIN
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout per request
    });

    if (!response.ok) {
      console.log(`❌ "${message}" - HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();
    const text = data.message.toLowerCase();
    
    // Check if verification was requested
    const triggersVerification = 
      text.includes('email address') || 
      text.includes('order number') ||
      text.includes('provide your email') ||
      text.includes('provide the email');
    
    // Check for bad phrases
    const hasNoAccess = 
      text.includes("don't have access") || 
      text.includes("cannot access") ||
      text.includes("i'm unable") ||
      text.includes("can't pull up");
    
    const correct = triggersVerification === shouldTrigger && !hasNoAccess;
    
    console.log(`${correct ? '✅' : '❌'} "${message}"`);
    
    if (!correct) {
      console.log(`   Expected trigger: ${shouldTrigger}, Got: ${triggersVerification}`);
      if (hasNoAccess) {
        console.log(`   ⚠️  Contains forbidden phrase!`);
      }
      console.log(`   Response: ${data.message.substring(0, 80)}...`);
    }
    
    return correct;
  } catch (error) {
    console.log(`❌ "${message}" - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n=== FINAL VALIDATION TEST ===');
  console.log('Target: 90%+ Success Rate\n');
  
  let passed = 0;
  let total = 0;
  
  // Category 1: Order Queries (MUST trigger verification)
  console.log('📁 Order Queries (should trigger):');
  const orderQueries = [
    "show me my recent orders",
    "where is my delivery?",
    "track my order",
    "my order status",
    "cancel my order",
    "my package location",
    "when will my order arrive",
    "I ordered last week",
    "check my purchase",
    "my invoice please",
    "list my orders",
    "MY ORDER IS LATE",
    "track my delivery",
    "find my order",
    "my recent purchases"
  ];
  
  for (const query of orderQueries) {
    total++;
    if (await testQuery(query, true)) passed++;
    await new Promise(r => setTimeout(r, 200)); // Small delay
  }
  
  // Category 2: Non-Order Queries (should NOT trigger)
  console.log('\n📁 Non-Order Queries (should NOT trigger):');
  const nonOrderQueries = [
    "what are your hours?",
    "do you sell cables?",
    "shipping costs?",
    "return policy?",
    "how to order?",
    "payment methods?",
    "company info",
    "product catalog",
    "I want to order something",
    "order process explanation",
    "how does ordering work?",
    "are you open weekends?",
    "what brands do you carry?"
  ];
  
  for (const query of nonOrderQueries) {
    total++;
    if (await testQuery(query, false)) passed++;
    await new Promise(r => setTimeout(r, 200)); // Small delay
  }
  
  // Results
  const rate = Math.round((passed / total) * 100);
  console.log(`\n=== RESULTS: ${passed}/${total} (${rate}%) ===`);
  
  if (rate >= 90) {
    console.log('✅ SUCCESS! Target of 90% achieved!');
    console.log('🎉 WooCommerce integration is production ready!');
  } else {
    console.log(`⚠️  Below target. Need ${90-rate}% more to reach 90%`);
  }
  
  process.exit(rate >= 90 ? 0 : 1);
}

// Check server first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/health', {
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Main
async function main() {
  console.log('🔍 Checking server...');
  
  if (!await checkServer()) {
    console.log('❌ Server not running on port 3001');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  await runTests();
}

main().catch(console.error);