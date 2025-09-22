#!/usr/bin/env npx tsx
/**
 * Test to verify stock checking now works with WooCommerce data
 */

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const SESSION_ID = 'stock-test-' + Date.now();

async function testStockChecking() {
  console.log('🧪 Testing Stock Checking with WooCommerce Integration\n');
  console.log('=====================================\n');
  
  let conversationId: string | undefined;
  
  // Test 1: Search for products (should include stock status)
  console.log('📝 Test 1: Search for products with stock status');
  console.log('User: "show me teng torque wrenches"');
  
  try {
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'show me teng torque wrenches',
        session_id: SESSION_ID,
        domain: 'thompsonseparts.co.uk'
      })
    });
    
    const data1 = await response1.json();
    conversationId = data1.conversation_id;
    
    console.log('\nBot Response:');
    console.log(data1.message.substring(0, 500));
    
    // Check if stock status indicators are present
    if (data1.message.includes('✓') || data1.message.includes('✗')) {
      console.log('\n✅ Stock status indicators found in response');
    } else {
      console.log('\n⚠️ No stock status indicators in response');
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 2: Ask about specific item stock
    console.log('\n=====================================\n');
    console.log('📝 Test 2: Ask about specific item stock');
    console.log('User: "is item 3 in stock?"');
    
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'is item 3 in stock?',
        session_id: SESSION_ID,
        conversation_id: conversationId,
        domain: 'thompsonseparts.co.uk'
      })
    });
    
    const data2 = await response2.json();
    console.log('\nBot Response:');
    console.log(data2.message);
    
    // Verify proper stock checking response
    if (data2.message.includes('currently in stock') || 
        data2.message.includes('currently out of stock') ||
        data2.message.includes('available on backorder')) {
      console.log('\n✅ Proper stock status reported from WooCommerce data');
    } else if (data2.message.includes("can't check live stock") ||
               data2.message.includes("contact") ||
               data2.message.includes("I'll need to check")) {
      console.log('\n❌ Still using old behavior - not checking WooCommerce stock data');
    } else {
      console.log('\n⚠️ Unclear response about stock status');
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Test 3: Ask about multiple items stock
    console.log('\n=====================================\n');
    console.log('📝 Test 3: Check stock for multiple items');
    console.log('User: "which of those are in stock?"');
    
    const response3 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'which of those are in stock?',
        session_id: SESSION_ID,
        conversation_id: conversationId,
        domain: 'thompsonseparts.co.uk'
      })
    });
    
    const data3 = await response3.json();
    console.log('\nBot Response:');
    console.log(data3.message.substring(0, 500));
    
    if (data3.message.includes('in stock') && !data3.message.includes("can't check")) {
      console.log('\n✅ Successfully reports stock status for multiple items');
    } else {
      console.log('\n❌ Not properly reporting stock status');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n=====================================\n');
  console.log('📊 Summary of Stock Checking Capability:\n');
  console.log('Expected behavior:');
  console.log('✅ Products should show with stock indicators (✓/✗)');
  console.log('✅ When asked about stock, should report actual WooCommerce status');
  console.log('✅ Should say "currently in stock" or "currently out of stock"');
  console.log('\nNOT expected:');
  console.log('❌ Should NOT say "I can\'t check live stock"');
  console.log('❌ Should NOT always defer to "contact us"');
  console.log('❌ Should NOT pretend to not have access');
}

// Run the test
testStockChecking().catch(console.error);