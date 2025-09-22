#!/usr/bin/env npx tsx

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat-intelligent';

async function testSimpleContext() {
  const conversationId = crypto.randomUUID();
  const sessionId = `test-${Date.now()}`;
  
  console.log('Testing conversation context...');
  console.log('Conversation ID:', conversationId);
  
  // First message
  console.log('\n1. First message: "Show me Kinshofer products"');
  const response1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me Kinshofer products',
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  if (!response1.ok) {
    console.error('Error:', await response1.text());
    process.exit(1);
  }
  
  const data1 = await response1.json();
  console.log('Response received (truncated):', data1.message.substring(0, 100) + '...');
  
  // Wait for message to be saved
  await new Promise(r => setTimeout(r, 2000));
  
  // Second message - follow-up
  console.log('\n2. Follow-up: "What are the prices?"');
  const response2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What are the prices?',
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  if (!response2.ok) {
    console.error('Error:', await response2.text());
    process.exit(1);
  }
  
  const data2 = await response2.json();
  console.log('Response received:', data2.message);
  
  // Check if the response references previously mentioned products
  if (data2.message.toLowerCase().includes('kinshofer') || 
      data2.message.toLowerCase().includes('contact') ||
      data2.message.toLowerCase().includes('mentioned')) {
    console.log('\n✅ SUCCESS: Context was preserved! The assistant referenced previous products.');
  } else {
    console.log('\n⚠️  WARNING: The response might not be using conversation context.');
  }
}

testSimpleContext().catch(console.error);