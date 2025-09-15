#!/usr/bin/env tsx

/**
 * Direct Chat API Test - Debug why tests are hanging
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testChatAPI() {
  const url = 'http://localhost:3000/api/chat';
  const payload = {
    message: 'Hello, do you have any pumps?',
    domain: 'thompsonseparts.co.uk',
    conversationId: `test-${Date.now()}`,
    session_id: `session-${Date.now()}`
  };
  
  console.log('Testing chat API...');
  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      console.log('Request aborted after 10 seconds');
    }, 10000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Success! Response:', data.response?.substring(0, 200) + '...');
    } else {
      console.log('\n❌ Error response:', text);
    }
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('\n❌ Request timed out after 10 seconds');
    } else {
      console.log('\n❌ Error:', error.message);
    }
  }
}

testChatAPI().catch(console.error);