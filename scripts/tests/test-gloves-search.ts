#!/usr/bin/env node
/**
 * Test script to verify chat agent uses correct tool for product searches
 * Tests the fix for tool selection ambiguity (search_website_content vs woocommerce_operations)
 */

const TEST_DOMAIN = 'thompsonseparts.co.uk';
const TEST_QUERY = 'do you sell gloves';

async function testGlovesSearch() {
  console.log('🧪 Testing chat agent tool selection for product search...\n');
  console.log(`Domain: ${TEST_DOMAIN}`);
  console.log(`Query: "${TEST_QUERY}"\n`);
  console.log('Expected: AI should use woocommerce_operations tool\n');
  console.log('---\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_QUERY,
        session_id: `test-session-${Date.now()}`,
        domain: TEST_DOMAIN,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API request failed:', response.status, response.statusText);
      console.error('Error details:', errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ Response received\n');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n---\n');

    // Check server logs for tool selection
    console.log('📋 Check server console logs for:');
    console.log('   [Tool Selection] AI selected ...');
    console.log('   Should show: woocommerce_operations (not search_website_content)');
    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\nMake sure dev server is running: npm run dev');
  }
}

testGlovesSearch();
