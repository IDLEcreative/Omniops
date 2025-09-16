#!/usr/bin/env npx tsx
/**
 * Test actual chat API responses for agricultural queries
 * Simulates the exact scenario from the user's report
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testChatQuery(message: string, conversationContext?: string[]) {
  const baseUrl = 'http://localhost:3000';
  
  // Generate a unique session ID for this test
  const sessionId = `test-session-${Date.now()}`;
  const conversationId = crypto.randomUUID();
  
  console.log(`\n📝 Testing query: "${message}"`);
  console.log('-'.repeat(60));
  
  try {
    // First, send context messages if provided
    if (conversationContext) {
      console.log('Setting up conversation context...');
      for (const contextMessage of conversationContext) {
        // Simulate previous messages in conversation
        console.log(`  Context: "${contextMessage}"`);
      }
    }
    
    // Make the actual chat API request
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
        config: {
          contextDepth: 20,  // Use more context
          temperatureControl: 0.3,
          similarityThreshold: 0.15  // Lower threshold
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('\n✅ Chat Response:');
    console.log(result.message.substring(0, 500) + (result.message.length > 500 ? '...' : ''));
    
    // Check if Agri Flip is mentioned in the response
    const mentionsAgriFlip = result.message.toLowerCase().includes('agri flip') || 
                            result.message.toLowerCase().includes('agri-flip') ||
                            result.message.includes('AGRIFLIP');
    
    if (mentionsAgriFlip) {
      console.log('\n🎯 SUCCESS: Response mentions Agri Flip product!');
    } else {
      console.log('\n⚠️  WARNING: Response does not mention Agri Flip product');
    }
    
    // Check for hallucination prevention
    if (result.message.includes("don't have") || result.message.includes("no information")) {
      console.log('\n⚠️  CONCERN: Response indicates lack of information despite product existing');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to test chat query:', error);
    return null;
  }
}

async function main() {
  console.log('🔬 TESTING CHAT API WITH AGRICULTURAL QUERIES');
  console.log('='.repeat(80));
  
  // Test 1: Direct Agri Flip query
  await testChatQuery('Do you have the Agri Flip product?');
  
  // Test 2: The exact scenario from the user's report
  console.log('\n' + '='.repeat(80));
  console.log('📋 REPRODUCING USER\'S REPORTED SCENARIO:');
  await testChatQuery(
    'its for agriculture',
    ['User asked about buying a tipper']  // Context from conversation
  );
  
  // Test 3: Agricultural tipper query
  await testChatQuery('I need an agricultural tipper with sheeting');
  
  // Test 4: Generic farming query
  await testChatQuery('What tippers do you have for farming?');
  
  // Test 5: Specific product features
  await testChatQuery('Do you have front to rear sheeting systems for agricultural dumper trailers?');
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST COMPLETE\n');
  console.log('Expected behavior:');
  console.log('- All queries should find and mention the Agri Flip product');
  console.log('- The response should include product details and a link');
  console.log('- No hallucination or "no information" responses');
}

// Run the test
main().catch(console.error);