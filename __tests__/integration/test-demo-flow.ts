/**
 * Test script for demo scraping flow
 * Run: npx tsx test-demo-flow.ts
 */

const API_BASE = 'http://localhost:3000';
const TEST_URL = 'https://example.com';

async function testDemoFlow() {
  console.log('🧪 Testing Demo Flow\n');

  try {
    // Step 1: Test scrape endpoint
    console.log('📡 Step 1: Testing /api/demo/scrape...');
    const scrapeResponse = await fetch(`${API_BASE}/api/demo/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: TEST_URL })
    });

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.json();
      throw new Error(`Scrape failed: ${JSON.stringify(error)}`);
    }

    const scrapeData = await scrapeResponse.json();
    console.log('✅ Scrape successful!');
    console.log(`   Session ID: ${scrapeData.session_id}`);
    console.log(`   Pages scraped: ${scrapeData.pages_scraped}`);
    console.log(`   Chunks: ${scrapeData.content_chunks}`);
    console.log(`   Time: ${scrapeData.scrape_time_ms}ms\n`);

    // Step 2: Test chat endpoint
    console.log('💬 Step 2: Testing /api/demo/chat...');
    const chatResponse = await fetch(`${API_BASE}/api/demo/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: scrapeData.session_id,
        message: 'What is this website about?'
      })
    });

    if (!chatResponse.ok) {
      const error = await chatResponse.json();
      throw new Error(`Chat failed: ${JSON.stringify(error)}`);
    }

    const chatData = await chatResponse.json();
    console.log('✅ Chat successful!');
    console.log(`   Response: ${chatData.response}`);
    console.log(`   Messages used: ${chatData.message_count}/${scrapeData.max_messages || 20}\n`);

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDemoFlow();
