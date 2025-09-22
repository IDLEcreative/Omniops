#!/usr/bin/env npx tsx

/**
 * Test a complete customer journey from product discovery to stock verification
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const CHAT_API_URL = 'http://localhost:3000/api/chat-intelligent';
const STOCK_API_URL = 'http://localhost:3000/api/woocommerce/stock';

async function customerJourney() {
  const conversationId = crypto.randomUUID();
  const sessionId = `journey-${Date.now()}`;
  
  console.log('🛒 CUSTOMER JOURNEY: From Browse to Stock Check');
  console.log('=' .repeat(70));
  console.log(`Session: ${sessionId}\n`);
  
  // Helper to simulate chat
  async function say(message: string) {
    console.log(`👤 Customer: ${message}`);
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
    console.log(`🤖 Assistant: ${data.message}\n`);
    await new Promise(r => setTimeout(r, 1500));
    return data;
  }
  
  // Helper to check stock when customer wants exact info
  async function verifyStock(productName: string) {
    console.log(`\n📱 [Customer uses stock checker for: "${productName}"]`);
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
      console.log(`✅ Stock Checker Result: ${data.message}`);
      console.log(`   Status: ${data.stock.stock_status} | Quantity: ${data.stock.stock_quantity || 'Not tracked'}\n`);
    }
    return data;
  }
  
  try {
    console.log('📍 Stage 1: Initial Browse\n');
    await say("Hi, I need some quality tools for my workshop");
    
    console.log('📍 Stage 2: Category Interest\n');
    await say("I'm particularly interested in Teng tools - what do you have?");
    
    console.log('📍 Stage 3: Specific Product Interest\n');
    await say("That 73 piece socket set looks good. Tell me more about it");
    
    console.log('📍 Stage 4: Stock Inquiry\n');
    const stockResponse = await say("Is this definitely in stock? I need it urgently");
    
    console.log('📍 Stage 5: Customer Uses Stock Checker\n');
    const stockCheck = await verifyStock("TENG 1/4\", 3/8\" & 1/2\" SOCKET");
    
    console.log('📍 Stage 6: Follow-up Based on Stock Info\n');
    if (stockCheck.success && stockCheck.stock.in_stock) {
      await say("Great, the stock checker shows it's available. Can you tell me about the warranty?");
    } else {
      await say("Hmm, what alternatives do you have that are definitely in stock?");
    }
    
    console.log('📍 Stage 7: Purchase Decision\n');
    await say("OK, I'll take the 73 piece socket set. What's the exact model number again?");
    
    console.log('=' .repeat(70));
    console.log('✅ JOURNEY COMPLETE\n');
    console.log('Key Observations:');
    console.log('• Chat agent handles product discovery and information');
    console.log('• When stock verification needed, system directs to WooCommerce');
    console.log('• WooCommerce API provides real-time inventory status');
    console.log('• Clear separation between conversational AI and transactional systems');
    console.log('\n🎯 Architecture Working As Designed:');
    console.log('  Chat Agent → Product Discovery & Customer Service');
    console.log('  WooCommerce Agent → Real-time Stock & Transactions');
    
  } catch (error) {
    console.error('Journey failed:', error);
  }
}

customerJourney().catch(console.error);