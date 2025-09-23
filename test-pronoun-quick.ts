#!/usr/bin/env npx tsx
/**
 * Quick pronoun test
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat-intelligent';

async function test() {
  const sessionId = uuidv4();
  
  // Message 1
  console.log('Sending: "Show me the A4VTG90 pump"');
  const r1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me the A4VTG90 pump',
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  const d1 = await r1.json();
  const conversationId = d1.conversation_id;
  console.log('Response preview:', d1.message.substring(0, 150) + '...\n');
  
  // Message 2
  console.log('Sending: "How much does it cost?"');
  const r2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'How much does it cost?',
      session_id: sessionId,
      conversation_id: conversationId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  const d2 = await r2.json();
  console.log('Response:', d2.message.substring(0, 300));
  
  // Check if it understood "it"
  const response = d2.message.toLowerCase();
  if (response.includes('a4vtg90') || response.includes('pump') || response.includes('£')) {
    console.log('\n✅ PRONOUN RESOLUTION WORKS - understood "it" refers to the pump');
  } else {
    console.log('\n❌ PRONOUN RESOLUTION FAILED - did not understand "it"');
  }
}

test().catch(console.error);