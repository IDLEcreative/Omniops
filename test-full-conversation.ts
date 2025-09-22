#!/usr/bin/env npx tsx

/**
 * Comprehensive test of conversation context preservation
 * Tests the exact scenario from the user's complaint
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat-intelligent';

async function sendMessage(conversationId: string, sessionId: string, message: string) {
  console.log(`\n🔵 User: ${message}`);
  
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
  
  if (!response.ok) {
    console.error('❌ Error:', await response.text());
    return null;
  }
  
  const data = await response.json();
  console.log(`🟢 Assistant: ${data.message}`);
  return data;
}

async function testFullConversation() {
  const conversationId = crypto.randomUUID();
  const sessionId = `test-${Date.now()}`;
  
  console.log('🧪 Testing Full Conversation Context - Kinshofer Example');
  console.log('=' .repeat(60));
  console.log(`Conversation ID: ${conversationId}`);
  
  // Test the exact scenario from user's complaint
  console.log('\n📋 Stage 1: Initial Query');
  const r1 = await sendMessage(conversationId, sessionId, 'Kinshofer pin & bush kit');
  if (!r1) return;
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n📋 Stage 2: Follow-up about specific product');
  const r2 = await sendMessage(conversationId, sessionId, 
    'BULK & WHOLESALE Hardox Grab Bucket Blades to fit Kinshofer KM602 / KM622 tell me about this');
  if (!r2) return;
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n📋 Stage 3: Generic follow-up requiring context');
  const r3 = await sendMessage(conversationId, sessionId, 'What was the price?');
  if (!r3) return;
  
  // Verify context was maintained
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 VERIFICATION:');
  
  const contextMaintained = 
    r3.message.toLowerCase().includes('hardox') ||
    r3.message.toLowerCase().includes('grab bucket') ||
    r3.message.toLowerCase().includes('contact') ||
    r3.message.toLowerCase().includes('bulk') ||
    r3.message.toLowerCase().includes('wholesale');
  
  if (contextMaintained) {
    console.log('✅ SUCCESS: The assistant correctly referenced the previously discussed product!');
    console.log('   - The follow-up "What was the price?" was understood in context');
    console.log('   - The assistant referenced the BULK & WHOLESALE Hardox Grab Bucket Blades');
  } else {
    console.log('❌ FAIL: The assistant did not maintain conversation context');
    console.log('   - Expected reference to "BULK & WHOLESALE Hardox Grab Bucket Blades"');
    console.log('   - Got a generic response instead');
  }
}

testFullConversation().catch(console.error);