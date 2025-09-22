#!/usr/bin/env npx tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat-intelligent';

async function testAvailability() {
  const conversationId = crypto.randomUUID();
  const sessionId = `availability-test-${Date.now()}`;
  
  console.log('🧪 Testing Stock Availability Checking');
  console.log('=' .repeat(60));
  
  async function ask(message: string) {
    console.log(`\n👤 Customer: ${message}`);
    
    const response = await fetch(API_URL, {
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
  
  // Test 1: Ask about a specific product
  const r1 = await ask("Show me the TENG 1/4\", 3/8\" & 1/2\" SOCKET SET FOAM4X4 73 PIECES");
  await new Promise(r => setTimeout(r, 1500));
  
  // Test 2: Direct availability question
  const r2 = await ask("Is this item in stock?");
  await new Promise(r => setTimeout(r, 1500));
  
  // Test 3: Stock quantity question
  const r3 = await ask("How many do you have available?");
  await new Promise(r => setTimeout(r, 1500));
  
  // Test 4: Alternative with availability
  const r4 = await ask("Can you check if you have any Teng socket sets that are definitely in stock right now?");
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Analysis:');
  
  const mentionsStock = 
    r2.toLowerCase().includes('stock') ||
    r2.toLowerCase().includes('available') ||
    r2.toLowerCase().includes('contact');
  
  const hasQuantity = /\d+/.test(r3);
  
  if (mentionsStock) {
    console.log('✅ Assistant responded to stock inquiry');
  } else {
    console.log('⚠️  Assistant may not have stock information');
  }
  
  if (hasQuantity) {
    console.log('✅ Assistant provided quantity information');
  } else {
    console.log('⚠️  Assistant could not provide specific quantity');
  }
  
  if (r2.toLowerCase().includes('contact') || r3.toLowerCase().includes('contact')) {
    console.log('ℹ️  Stock info may require contacting seller');
  }
}

testAvailability().catch(console.error);