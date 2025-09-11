#!/usr/bin/env npx tsx
/**
 * Test script to verify chat AI accuracy improvements
 * Tests that the AI no longer makes assumptions about product relationships
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';

interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
  domain: string;
  config?: {
    features?: {
      woocommerce?: { enabled: boolean };
      websiteScraping?: { enabled: boolean };
    };
  };
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
}

async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function testProductQueries() {
  const sessionId = uuidv4();
  let conversationId: string | undefined;

  console.log('🧪 Testing Chat AI Product Accuracy\n');
  console.log('Session ID:', sessionId);
  console.log('=' .repeat(60));

  // Test 1: Ask about pumps (general query)
  console.log('\n📝 Test 1: General product query');
  console.log('Query: "I need a pump for my Cifa mixer"');
  
  try {
    const response1 = await sendChatMessage({
      message: "I need a pump for my Cifa mixer",
      session_id: sessionId,
      domain: "thompsonseparts.co.uk",
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    });
    
    conversationId = response1.conversation_id;
    console.log('\n✅ Response received:');
    console.log(response1.message.substring(0, 500) + '...');
    
    // Check if response lists products without making assumptions
    const hasProducts = response1.message.includes('Cifa Mixer');
    const asksForClarification = response1.message.toLowerCase().includes('which') || 
                                 response1.message.toLowerCase().includes('what type');
    
    console.log('\nAnalysis:');
    console.log('- Lists products:', hasProducts ? '✅' : '❌');
    console.log('- Asks for clarification:', asksForClarification ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test 2: Ask if a product includes another (the problematic query)
  console.log('\n' + '=' .repeat(60));
  console.log('\n📝 Test 2: Product component query (the key test)');
  console.log('Query: "Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?"');
  
  try {
    const response2 = await sendChatMessage({
      message: "Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?",
      conversation_id: conversationId,
      session_id: sessionId,
      domain: "thompsonseparts.co.uk",
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    });
    
    console.log('\n✅ Response received:');
    console.log(response2.message);
    
    // Check if response admits uncertainty or makes false claims
    const admitsUncertainty = 
      response2.message.toLowerCase().includes("don't have specific details") ||
      response2.message.toLowerCase().includes("not clear") ||
      response2.message.toLowerCase().includes("contact customer service") ||
      response2.message.toLowerCase().includes("separate");
    
    const makesAssumption = 
      response2.message.toLowerCase().includes("yes") && 
      response2.message.toLowerCase().includes("includes");
    
    console.log('\nAnalysis:');
    console.log('- Admits uncertainty or clarifies separation:', admitsUncertainty ? '✅ GOOD' : '❌ BAD');
    console.log('- Makes false assumption:', makesAssumption ? '❌ BAD' : '✅ GOOD');
    
    if (admitsUncertainty && !makesAssumption) {
      console.log('\n🎉 SUCCESS: AI correctly handles uncertainty about product components!');
    } else {
      console.log('\n⚠️  WARNING: AI may still be making assumptions about products');
    }
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test 3: Follow-up question
  console.log('\n' + '=' .repeat(60));
  console.log('\n📝 Test 3: Follow-up clarification');
  console.log('Query: "What\'s the difference between them?"');
  
  try {
    const response3 = await sendChatMessage({
      message: "What's the difference between them?",
      conversation_id: conversationId,
      session_id: sessionId,
      domain: "thompsonseparts.co.uk",
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    });
    
    console.log('\n✅ Response received:');
    console.log(response3.message.substring(0, 500) + '...');
    
    // Check if response maintains context
    const maintainsContext = 
      response3.message.toLowerCase().includes('hydraulic') ||
      response3.message.toLowerCase().includes('chute') ||
      response3.message.toLowerCase().includes('pump');
    
    console.log('\nAnalysis:');
    console.log('- Maintains conversation context:', maintainsContext ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n✨ Testing complete!\n');
}

// Run the tests
testProductQueries().catch(console.error);