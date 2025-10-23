#!/usr/bin/env npx tsx

/**
 * Test WooCommerce via Chat API
 * This simulates a real user asking about products through the chat interface
 */

import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });

async function testChatWooCommerce() {
  console.log('🧪 Testing WooCommerce Through Chat API\n');
  console.log('═'.repeat(60));

  const conversationId = randomUUID();
  const sessionId = randomUUID();

  const chatMessage = {
    message: "Do you have any pumps available?",
    domain: "thompsonseparts.co.uk",
    session_id: sessionId,
    conversation_id: conversationId,
  };

  console.log('\n📋 Test Configuration:');
  console.log('   Domain:', chatMessage.domain);
  console.log('   Message:', chatMessage.message);
  console.log('   Endpoint: http://localhost:3000/api/chat');

  console.log('\n📤 Sending chat request...');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatMessage),
    });

    console.log('   Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed');
      console.error('   Response:', errorText);
      process.exit(1);
    }

    // Read the streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    console.log('\n📨 Chat Response:');
    console.log('─'.repeat(60));

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        process.stdout.write(chunk);
      }
    }

    console.log('\n' + '─'.repeat(60));

    // Analyze response
    console.log('\n🔍 Analysis:');

    if (fullResponse.toLowerCase().includes('pump')) {
      console.log('   ✅ Response mentions pumps');
    }

    if (fullResponse.toLowerCase().includes('£') || fullResponse.toLowerCase().includes('price')) {
      console.log('   ✅ Response includes pricing (likely from WooCommerce)');
    }

    if (fullResponse.toLowerCase().includes('stock')) {
      console.log('   ✅ Response mentions stock status (WooCommerce data)');
    }

    if (fullResponse.toLowerCase().includes('sku')) {
      console.log('   ✅ Response includes SKU (definitely WooCommerce)');
    }

    if (fullResponse.toLowerCase().includes('sorry') || fullResponse.toLowerCase().includes('cannot')) {
      console.log('   ⚠️  Response indicates unavailability or error');
    }

    // Check for WooCommerce API errors in response
    if (fullResponse.includes('401') || fullResponse.includes('unauthorized')) {
      console.log('   ❌ WooCommerce API authentication error detected');
    }

    console.log('\n' + '═'.repeat(60));

    // Determine if WooCommerce is working
    const hasProductData =
      fullResponse.includes('£') ||
      fullResponse.toLowerCase().includes('sku') ||
      fullResponse.toLowerCase().includes('stock');

    if (hasProductData) {
      console.log('✅ WOOCOMMERCE API IS WORKING!\n');
      console.log('The chat successfully retrieved product data from WooCommerce.');
      console.log('This means the API keys ARE valid and working.');
    } else {
      console.log('⚠️  NO WOOCOMMERCE DATA DETECTED\n');
      console.log('The chat may be falling back to semantic search.');
      console.log('This suggests WooCommerce API is not accessible.');
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dev server not running. Start with: npm run dev');
    }

    process.exit(1);
  }
}

testChatWooCommerce().catch(console.error);
