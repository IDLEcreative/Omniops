#!/usr/bin/env npx tsx
/**
 * Test product context and pronoun resolution
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';

async function test() {
  const sessionId = uuidv4();
  let conversationId: string | undefined;
  
  try {
    // Message 1: Ask about a specific pump
    console.log('\n1. User: "Tell me about the A4VTG90 hydraulic pump"');
    const r1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Tell me about the A4VTG90 hydraulic pump',
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
      }),
    });
    const d1 = await r1.json();
    conversationId = d1.conversation_id;
    console.log('   Bot:', d1.message.substring(0, 150) + '...');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Message 2: Use pronoun "it"
    console.log('\n2. User: "How much does it cost?"');
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
    console.log('   Bot:', d2.message.substring(0, 200) + '...');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Message 3: Switch topic
    console.log('\n3. User: "Do you ship internationally?"');
    const r3 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Do you ship internationally?',
        session_id: sessionId,
        conversation_id: conversationId,
        domain: 'thompsonseparts.co.uk',
      }),
    });
    const d3 = await r3.json();
    console.log('   Bot:', d3.message.substring(0, 150) + '...');
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Message 4: Return to pump topic
    console.log('\n4. User: "Back to the pump - is it in stock?"');
    const r4 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Back to the pump - is it in stock?',
        session_id: sessionId,
        conversation_id: conversationId,
        domain: 'thompsonseparts.co.uk',
      }),
    });
    const d4 = await r4.json();
    console.log('   Bot:', d4.message);
    
    // Analysis
    console.log('\n' + '='.repeat(60));
    console.log('CONTEXT TEST RESULTS:');
    
    // Check if message 2 understood "it"
    const m2 = d2.message.toLowerCase();
    if (m2.includes('a4vtg90') || m2.includes('pump') || m2.includes('£')) {
      console.log('✅ Pronoun resolution: Understood "it" refers to the pump');
    } else {
      console.log('❌ Pronoun resolution: Did not understand "it"');
    }
    
    // Check if message 4 returned to pump context
    const m4 = d4.message.toLowerCase();
    if (m4.includes('a4vtg90') || m4.includes('pump') || m4.includes('stock')) {
      console.log('✅ Topic return: Successfully returned to pump discussion');
    } else {
      console.log('❌ Topic return: Failed to return to pump context');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();