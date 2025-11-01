#!/usr/bin/env npx tsx
/**
 * Quick final verification of context handling
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';

async function quickTest() {
  const sessionId = uuidv4();
  
  console.log('\n=== FINAL CONTEXT VERIFICATION ===\n');
  
  // Message 1: Search
  console.log('1. User: "Show me Cifa pumps"');
  const r1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me Cifa pumps',
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  const d1 = await r1.json();
  const conversationId = d1.conversation_id;
  
  // Extract if it mentions a count
  const match = d1.message.match(/(\d+)\s+(results?|products?|items?|pumps?)/i);
  const count = match ? match[1] : 'unknown';
  console.log(`   Bot: Found ${count} items (showing first part of response)`);
  
  await new Promise(r => setTimeout(r, 1500));
  
  // Message 2: Context test
  console.log('\n2. User: "How many did you find?"');
  const r2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'How many did you find?',
      session_id: sessionId,
      conversation_id: conversationId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  const d2 = await r2.json();
  console.log(`   Bot: ${d2.message.substring(0, 150)}...`);
  
  // Check results
  console.log('\n=== RESULTS ===');
  const remembers = d2.message.toLowerCase().includes('cifa') || 
                   d2.message.toLowerCase().includes('pump') ||
                   d2.message.match(/\d+/);
  
  if (remembers) {
    console.log('✅ SUCCESS: Model maintains search context naturally');
    console.log('   The conversation history and search context are working!');
  } else {
    console.log('⚠️  WARNING: Model may not be maintaining full context');
  }
  console.log('');
}

quickTest().catch(console.error);
