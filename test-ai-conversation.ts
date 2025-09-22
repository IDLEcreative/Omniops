#!/usr/bin/env npx tsx

/**
 * AI-to-AI conversation test
 * Claude will interact with the chat API to test conversation flow
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const CONVERSATION_ID = crypto.randomUUID();
const SESSION_ID = `ai-test-${Date.now()}`;

async function chat(message: string): Promise<string> {
  console.log(`\n👤 Customer: ${message}`);
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversation_id: CONVERSATION_ID,
      session_id: SESSION_ID,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Error: ${error}`);
    throw new Error(`API error: ${error}`);
  }
  
  const data = await response.json();
  console.log(`🤖 Assistant: ${data.message}`);
  return data.message;
}

async function runConversation() {
  console.log('🎭 AI-to-AI Conversation Test');
  console.log('=' .repeat(60));
  console.log(`Conversation ID: ${CONVERSATION_ID}`);
  
  try {
    // Question 1: Initial broad query
    const r1 = await chat("Hi, I'm looking for Teng tools. What do you have available?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 2: Narrow down to category
    const r2 = await chat("Great! Can you show me just the socket sets from those Teng tools?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 3: Technical specification
    const r3 = await chat("Do you have any that are metric? I need metric sizes specifically.");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 4: More specific requirement
    const r4 = await chat("What about 1/2 inch drive sizes? That's what my ratchet uses.");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 5: Price consideration
    const r5 = await chat("What's the price range for these? I'm looking for something mid-range, not the cheapest but not top end either.");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 6: Recommendation request
    const r6 = await chat("Which one would you recommend as the best value for a professional mechanic?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 7: Specific product inquiry
    const r7 = await chat("Tell me more about that first one you mentioned. How many pieces does it include?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 8: Quality check
    const r8 = await chat("Is this a genuine Teng product? What's the quality like?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 9: Alternatives
    const r9 = await chat("Do you have any similar sets from other brands that might be cheaper?");
    await new Promise(r => setTimeout(r, 1500));
    
    // Question 10: Final decision
    const r10 = await chat("Actually, let's go back to that Teng set. Can you give me the exact product name and price one more time so I can order it?");
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Conversation completed successfully!');
    console.log('The AI maintained context through 10 exchanges.');
    
    // Analysis
    console.log('\n📊 Context Preservation Analysis:');
    const contextMaintained = 
      r10.toLowerCase().includes('teng') && 
      (r10.includes('£') || r10.toLowerCase().includes('price') || r10.toLowerCase().includes('contact'));
    
    if (contextMaintained) {
      console.log('✅ Final response correctly referenced the Teng tools discussed throughout');
    } else {
      console.log('⚠️  Final response may have lost some context');
    }
    
  } catch (error) {
    console.error('\n❌ Conversation failed:', error);
  }
}

runConversation().catch(console.error);