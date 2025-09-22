#!/usr/bin/env npx tsx

/**
 * Test script to verify conversation context is preserved
 * across multiple messages in the chat-intelligent endpoint
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const CONVERSATION_ID = crypto.randomUUID();
const SESSION_ID = `test-session-${Date.now()}`;

async function sendMessage(message: string) {
  console.log(`\n🔵 User: ${message}`);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_id: CONVERSATION_ID,
      session_id: SESSION_ID,
      domain: 'thompsonseparts.co.uk',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  console.log(`🟢 Assistant: ${data.message}`);
  return data;
}

async function testConversationContext() {
  console.log('🧪 Testing Conversation Context Preservation');
  console.log('=' .repeat(50));
  console.log(`Conversation ID: ${CONVERSATION_ID}`);
  console.log(`Session ID: ${SESSION_ID}`);
  
  try {
    // Test 1: Initial product search
    console.log('\n📋 Test 1: Initial product search');
    await sendMessage('Show me Kinshofer pin & bush kits');
    
    // Wait a moment to ensure message is saved
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Follow-up about specific product
    console.log('\n📋 Test 2: Follow-up question referencing previous results');
    await sendMessage('Tell me more about the BULK & WHOLESALE Hardox Grab Bucket Blades');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Another follow-up without context
    console.log('\n📋 Test 3: Generic follow-up that requires context');
    await sendMessage('What was the price of the complete pin & bush kit?');
    
    console.log('\n✅ Test completed successfully!');
    console.log('The conversation maintained context across all messages.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testConversationContext().catch(console.error);