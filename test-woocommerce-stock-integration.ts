#!/usr/bin/env npx tsx

/**
 * Comprehensive test of WooCommerce stock checking integration
 * Tests how the chat agent handles stock queries and references the WooCommerce agent
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CHAT_API_URL = 'http://localhost:3000/api/chat-intelligent';
const STOCK_API_URL = 'http://localhost:3000/api/woocommerce/stock';

// Helper to send chat message
async function chatMessage(conversationId: string, sessionId: string, message: string) {
  console.log(`\n👤 Customer: ${message}`);
  
  const response = await fetch(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  const data = await response.json();
  console.log(`🤖 Assistant: ${data.message}`);
  return data.message;
}

// Helper to check stock directly via WooCommerce API
async function checkStockDirectly(productName: string) {
  console.log(`\n🔍 Direct Stock Check: "${productName}"`);
  
  const response = await fetch(STOCK_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain: 'thompsonseparts.co.uk',
      productName
    })
  });
  
  const data = await response.json();
  if (data.success) {
    console.log(`📦 WooCommerce Response: ${data.message}`);
    console.log(`   - Stock Status: ${data.stock.stock_status}`);
    console.log(`   - Stock Quantity: ${data.stock.stock_quantity || 'Not tracked'}`);
    console.log(`   - In Stock: ${data.stock.in_stock}`);
  } else {
    console.log(`❌ Stock Check Failed: ${data.error}`);
  }
  return data;
}

async function runTests() {
  const conversationId = crypto.randomUUID();
  const sessionId = `stock-test-${Date.now()}`;
  
  console.log('🧪 Testing WooCommerce Stock Integration');
  console.log('=' .repeat(70));
  console.log(`Conversation ID: ${conversationId}\n`);
  
  try {
    // Test 1: Basic product search
    console.log('\n📋 TEST 1: Basic Product Search with Availability');
    console.log('-' .repeat(50));
    const r1 = await chatMessage(conversationId, sessionId, 
      "Show me the Teng socket set FOAM4X4 73 pieces");
    await new Promise(r => setTimeout(r, 1500));
    
    // Test 2: Direct stock quantity question
    console.log('\n📋 TEST 2: Direct Stock Quantity Question');
    console.log('-' .repeat(50));
    const r2 = await chatMessage(conversationId, sessionId, 
      "How many units of this socket set do you have in stock?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Test 3: Is this in stock question
    console.log('\n📋 TEST 3: Simple Stock Availability Question');
    console.log('-' .repeat(50));
    const r3 = await chatMessage(conversationId, sessionId, 
      "Is the TENG 1/4\", 3/8\" & 1/2\" SOCKET SET currently in stock?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Test 4: Check stock for specific SKU
    console.log('\n📋 TEST 4: Stock Check by SKU');
    console.log('-' .repeat(50));
    const r4 = await chatMessage(conversationId, sessionId, 
      "Can you check if SKU TTEMD114 is available?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Test 5: Compare stock for multiple items
    console.log('\n📋 TEST 5: Multiple Product Stock Comparison');
    console.log('-' .repeat(50));
    const r5 = await chatMessage(conversationId, sessionId, 
      "Which Teng socket sets do you have in stock right now?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Now demonstrate the WooCommerce API direct call
    console.log('\n' + '=' .repeat(70));
    console.log('🔧 DEMONSTRATING DIRECT WOOCOMMERCE API CALLS');
    console.log('=' .repeat(70));
    
    await checkStockDirectly("TENG SOCKET SET");
    await new Promise(r => setTimeout(r, 1000));
    
    await checkStockDirectly("TENG Screwdriver");
    await new Promise(r => setTimeout(r, 1000));
    
    // Analysis
    console.log('\n' + '=' .repeat(70));
    console.log('📊 ANALYSIS OF RESPONSES');
    console.log('=' .repeat(70));
    
    // Check if the assistant mentions the WooCommerce system
    const mentionsInventorySystem = 
      r2.toLowerCase().includes('inventory') || 
      r2.toLowerCase().includes('stock checking') ||
      r2.toLowerCase().includes('woocommerce') ||
      r2.toLowerCase().includes('contact');
    
    const avoidsSpecificQuantity = 
      !(/\d+\s*(units?|items?|pieces?)/.test(r2) && !r2.toLowerCase().includes('we have'));
    
    const suggestsVerification = 
      r3.toLowerCase().includes('verify') ||
      r3.toLowerCase().includes('check') ||
      r3.toLowerCase().includes('contact') ||
      r3.toLowerCase().includes('system');
    
    console.log('\n✅ Correct Behaviors:');
    if (mentionsInventorySystem) {
      console.log('  • Assistant correctly references inventory system for exact quantities');
    }
    if (avoidsSpecificQuantity) {
      console.log('  • Assistant avoids making up specific stock quantities');
    }
    if (suggestsVerification) {
      console.log('  • Assistant suggests proper verification for stock status');
    }
    
    console.log('\n⚠️  Areas for Improvement:');
    if (!mentionsInventorySystem) {
      console.log('  • Should mention the inventory/WooCommerce system for stock checks');
    }
    if (!avoidsSpecificQuantity) {
      console.log('  • Should not provide specific quantities without real data');
    }
    if (!suggestsVerification) {
      console.log('  • Should guide users to verify stock through proper channels');
    }
    
    console.log('\n💡 Key Insight:');
    console.log('The chat agent should act as a product discovery tool, while the');
    console.log('WooCommerce agent handles real-time inventory and transactional data.');
    console.log('This separation ensures accurate stock information and proper system architecture.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTests().catch(console.error);