#!/usr/bin/env npx tsx

/**
 * Test script to verify chat functionality works for Thompson's staging domain
 * Tests against local development server to see actual errors
 */

async function testStagingChatLocal() {
  console.log('🧪 Testing Thompson\'s staging domain chat functionality locally...\n');

  const testUrl = 'http://localhost:3000/api/chat';
  const testMessage = 'Do you have any pumps available?';

  console.log(`📡 Sending test message to: ${testUrl}`);
  console.log(`💬 Message: "${testMessage}"\n`);

  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://epartstaging.wpengine.com'
      },
      body: JSON.stringify({
        message: testMessage,
        session_id: `test-session-${Date.now()}`,
        domain: 'epartstaging.wpengine.com'
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response Headers:`);
    console.log(`  - Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`  - Content-Type: ${response.headers.get('Content-Type')}\n`);

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Chat API responded successfully!\n');
      console.log('🤖 Assistant Response:');
      console.log('---');
      console.log(data.message);
      console.log('---\n');

      if (data.sources && data.sources.length > 0) {
        console.log(`📚 Found ${data.sources.length} source(s):`);
        data.sources.slice(0, 3).forEach((source: any, i: number) => {
          console.log(`  ${i + 1}. ${source.title} (${(source.relevance * 100).toFixed(1)}% match)`);
        });
      }

      console.log('\n🎉 SUCCESS: Staging domain can now access production content!');
    } else {
      console.error('❌ Chat API returned an error:\n');
      console.error(JSON.stringify(data, null, 2));

      if (data.error) {
        console.error(`\n🔍 Error Details: ${data.error}`);
        if (data.message) {
          console.error(`📝 Error Message: ${data.message}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to connect to chat API:\n');
    console.error(error);
  }
}

// Run the test
testStagingChatLocal().catch(console.error);