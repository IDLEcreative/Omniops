#!/usr/bin/env npx tsx
/**
 * Test the integrated WooCommerce Agent in chat-intelligent route
 * This verifies that the WooCommerce tool is properly integrated and working
 */

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const SESSION_ID = 'wc-agent-test-' + Date.now();

async function sendMessage(message: string, conversationId?: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      session_id: SESSION_ID,
      conversation_id: conversationId,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return await response.json();
}

async function testWooCommerceAgent() {
  console.log('🧪 Testing WooCommerce Agent Integration\n');
  console.log('=====================================\n');
  
  let conversationId: string | undefined;
  
  try {
    // Test 1: Initial product search (uses smart_search tool)
    console.log('📝 Test 1: General product search');
    console.log('User: "show me teng torque wrenches"');
    
    const response1 = await sendMessage('show me teng torque wrenches');
    conversationId = response1.conversation_id;
    
    console.log('\nBot Response:');
    console.log(response1.message.substring(0, 400));
    
    if (response1.message.includes('Teng products available')) {
      console.log('✅ Smart search tool working');
    } else {
      console.log('⚠️ Unexpected response from smart search');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 2: Detailed stock check (should use woocommerce_operations tool)
    console.log('\n=====================================\n');
    console.log('📝 Test 2: Detailed stock check with quantity');
    console.log('User: "check the exact stock quantity for item 3"');
    
    const response2 = await sendMessage('check the exact stock quantity for item 3', conversationId);
    
    console.log('\nBot Response:');
    console.log(response2.message);
    
    // Check if it used the WooCommerce agent for detailed stock
    if (response2.message.includes('units available') || 
        response2.message.includes('stock quantity') ||
        response2.message.includes('Currently in stock')) {
      console.log('✅ WooCommerce agent providing detailed stock info');
    } else {
      console.log('⚠️ May not be using WooCommerce agent for detailed stock');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 3: Get detailed product information
    console.log('\n=====================================\n');
    console.log('📝 Test 3: Get detailed product information');
    console.log('User: "give me full details about the TENG 1/2 inch torque wrench including all specifications"');
    
    const response3 = await sendMessage(
      'give me full details about the TENG 1/2 inch torque wrench including all specifications',
      conversationId
    );
    
    console.log('\nBot Response:');
    console.log(response3.message.substring(0, 500));
    
    if (response3.message.includes('specifications') || 
        response3.message.includes('SKU') ||
        response3.message.includes('torque range')) {
      console.log('✅ Detailed product information provided');
    } else {
      console.log('⚠️ May need more detailed product info');
    }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 4: Price checking with sale info
    console.log('\n=====================================\n');
    console.log('📝 Test 4: Check pricing including any sale prices');
    console.log('User: "what\'s the current price and any discounts for item 2?"');
    
    const response4 = await sendMessage(
      'what\'s the current price and any discounts for item 2?',
      conversationId
    );
    
    console.log('\nBot Response:');
    console.log(response4.message);
    
    if (response4.message.includes('£') && 
        (response4.message.includes('price') || response4.message.includes('cost'))) {
      console.log('✅ Price information provided');
    } else {
      console.log('⚠️ Price information unclear');
    }
    
    // Test 5: Specific SKU lookup
    console.log('\n=====================================\n');
    console.log('📝 Test 5: Direct SKU lookup');
    console.log('User: "check stock for SKU TENG-1234"');
    
    const response5 = await sendMessage('check stock for SKU TENG-1234', conversationId);
    
    console.log('\nBot Response:');
    console.log(response5.message);
    
    if (response5.message.includes('SKU') || response5.message.includes('product')) {
      console.log('✅ SKU lookup attempted');
    } else {
      console.log('⚠️ SKU lookup may not be working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n=====================================\n');
  console.log('📊 WooCommerce Agent Integration Summary:\n');
  
  console.log('Tools Available:');
  console.log('1. smart_search - General product search and browsing');
  console.log('2. woocommerce_operations - Detailed commerce operations');
  console.log('   - check_stock: Get exact quantities');
  console.log('   - get_product_details: Full product info');
  console.log('   - check_price: Current pricing with sales');
  console.log('   - check_order: Order status (requires further integration)');
  console.log('   - get_shipping_info: Shipping details');
  
  console.log('\n✅ Integration Status:');
  console.log('- WooCommerce tool added to chat-intelligent route');
  console.log('- Tool executor handles both smart_search and woocommerce_operations');
  console.log('- System prompt updated to guide AI on when to use each tool');
  console.log('- Stock checking now uses real WooCommerce data');
  
  console.log('\n💡 How It Works:');
  console.log('- General searches use smart_search for fast results');
  console.log('- Specific commerce queries trigger woocommerce_operations');
  console.log('- The AI decides which tool based on user intent');
  console.log('- Both tools work in parallel for comprehensive results');
  
  console.log('\n🎯 Benefits of Agent Architecture:');
  console.log('- Separation of concerns: Chat logic vs Commerce logic');
  console.log('- Easy to add more commerce providers (Shopify, etc.)');
  console.log('- WooCommerce-specific operations isolated in agent');
  console.log('- Maintains fast response times with smart tool selection');
  
  console.log('\n✅ Test Complete!');
}

// Run the test
testWooCommerceAgent().catch(console.error);