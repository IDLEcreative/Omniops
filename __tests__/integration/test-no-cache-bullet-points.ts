#!/usr/bin/env npx tsx

/**
 * Test bullet points with cache-busting to ensure fresh responses
 */

import { v4 as uuidv4 } from 'uuid';

async function testWithNoCaching() {
  // Use completely unique IDs to avoid any caching
  const uniqueTimestamp = Date.now();
  const conversationId = `test-${uniqueTimestamp}-${uuidv4()}`;
  const sessionId = `session-${uniqueTimestamp}-${uuidv4()}`;
  
  console.log('🔍 Testing Bullet Points (Cache-Busted)\n');
  console.log(`Unique conversation ID: ${conversationId}`);
  console.log(`Unique session ID: ${sessionId}\n`);

  // Add cache-busting headers
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': uniqueTimestamp.toString()
  };

  // Test with a unique product query to avoid cached responses
  const uniqueQuery = `do you have products starting with letter A? timestamp=${uniqueTimestamp}`;
  
  console.log(`📤 Sending: "${uniqueQuery}"\n`);
  
  const response = await fetch(`http://localhost:3000/api/chat?t=${uniqueTimestamp}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: uniqueQuery,
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    })
  });

  const data = await response.json();
  console.log('📥 Response:');
  console.log(data.message);
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Analyze the format
  const lines = data.message.split('\n');
  let hasNumberedList = false;
  let hasBulletPoints = false;
  
  for (const line of lines) {
    if (/^\d+\./.test(line.trim())) {
      hasNumberedList = true;
      console.log(`Found numbered item: ${line.trim().substring(0, 50)}...`);
    }
    if (/^[-•]\s/.test(line.trim())) {
      hasBulletPoints = true;
      console.log(`Found bullet point: ${line.trim().substring(0, 50)}...`);
    }
  }
  
  console.log('\n📊 Format Analysis:');
  console.log(`Uses numbers: ${hasNumberedList ? '❌ Yes' : '✅ No'}`);
  console.log(`Uses bullets: ${hasBulletPoints ? '✅ Yes' : '❌ No'}`);
  
  // Also check the raw system prompt being sent
  console.log('\n🔍 Verifying System Prompt...\n');
  
  // Make a request that will fail but show us what's being sent
  const debugResponse = await fetch(`http://localhost:3000/api/chat?debug=true&t=${Date.now()}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: 'debug',
      conversation_id: 'debug-' + Date.now(),
      session_id: 'debug-session',
      domain: 'test.com'
    })
  });
  
  console.log('Debug response status:', debugResponse.status);
}

testWithNoCaching().catch(console.error);