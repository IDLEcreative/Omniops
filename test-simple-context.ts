#!/usr/bin/env npx tsx
/**
 * Dead simple context test - just 3 messages
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';

async function test() {
  const sessionId = uuidv4();
  let conversationId: string | undefined;
  
  try {
    // Message 1
    console.log('\n1. User: "My name is Bob and I like red pumps"');
    const r1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'My name is Bob and I like red pumps',
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
      }),
    });
    if (!r1.ok) throw new Error(`HTTP ${r1.status}`);
    const d1 = await r1.json();
    conversationId = d1.conversation_id;
    console.log('   Bot:', d1.message.substring(0, 100) + '...');
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));
    
    // Message 2
    console.log('\n2. User: "What is my name and what color do I prefer?"');
    const r2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is my name and what color do I prefer?',
        session_id: sessionId,
        conversation_id: conversationId,
        domain: 'thompsonseparts.co.uk',
      }),
    });
    if (!r2.ok) throw new Error(`HTTP ${r2.status}`);
    const d2 = await r2.json();
    console.log('   Bot:', d2.message);
    
    // Check results
    const response = d2.message.toLowerCase();
    const hasName = response.includes('bob');
    const hasColor = response.includes('red');
    
    console.log('\n' + '='.repeat(50));
    if (hasName && hasColor) {
      console.log('✅ SUCCESS: Model remembered both Bob and red');
      console.log('   The conversation history is working!');
    } else if (hasName || hasColor) {
      console.log('⚠️  PARTIAL: Model remembered some context');
    } else {
      console.log('❌ FAILED: Model did not remember context');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();