#!/usr/bin/env npx tsx
/**
 * Direct test of chat API to examine token logging response
 */

import 'dotenv/config';

async function testDirectTokenLogging() {
  console.log('🔍 Testing Direct Token Logging\n');
  
  const sessionId = `direct-test-${Date.now()}`;
  
  try {
    console.log('Making chat request...');
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What pumps do you have?',
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
      }),
    });

    const data = await response.json();
    
    console.log('\n📊 Response Analysis:');
    console.log('Status:', response.status);
    console.log('Response keys:', Object.keys(data));
    
    if (data.tokenUsage) {
      console.log('\n✅ Token Usage Found:');
      console.log(JSON.stringify(data.tokenUsage, null, 2));
    } else {
      console.log('\n❌ No tokenUsage in response');
    }
    
    if (data.searchMetadata) {
      console.log('\n📈 Search Metadata:');
      console.log('- Iterations:', data.searchMetadata.iterations);
      console.log('- Total searches:', data.searchMetadata.totalSearches);
      console.log('- Search log entries:', data.searchMetadata.searchLog?.length || 0);
    }
    
    if (data.message) {
      console.log('\n💬 Response preview:');
      console.log(data.message.substring(0, 200) + '...');
    }
    
    if (data.error) {
      console.log('\n❌ Error:', data.error);
    }
    
    // Raw response for debugging
    console.log('\n🔧 Raw tokenUsage value:');
    console.log(data.tokenUsage);
    
  } catch (error: any) {
    console.error('❌ Request failed:', error.message);
  }
}

testDirectTokenLogging();