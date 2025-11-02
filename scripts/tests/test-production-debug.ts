#!/usr/bin/env npx tsx

/**
 * Debug script to test production chat API with detailed error logging
 */

async function testProductionDebug() {
  console.log('🔍 Debugging production chat API...\n');

  // Test 1: Check if domain is registered
  console.log('Test 1: Checking domain registration...');
  const domainCheckUrl = 'https://www.omniops.co.uk/api/scrape/check';

  try {
    const domainResponse = await fetch(domainCheckUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: 'epartstaging.wpengine.com'
      })
    });

    const domainData = await domainResponse.json();
    console.log('Domain check response:', domainData);
    console.log('');
  } catch (error) {
    console.error('Domain check failed:', error);
  }

  // Test 2: Simple chat request
  console.log('Test 2: Simple chat request...');
  const chatUrl = 'https://www.omniops.co.uk/api/chat';

  try {
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://epartstaging.wpengine.com'
      },
      body: JSON.stringify({
        message: 'Hello',
        session_id: `debug-${Date.now()}`,
        domain: 'epartstaging.wpengine.com'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:');
    console.log('  - CORS:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('  - Content-Type:', response.headers.get('Content-Type'));

    const data = await response.json();

    if (!response.ok) {
      console.error('\n❌ Error response:', JSON.stringify(data, null, 2));

      // Test 3: Try with thompsonseparts.co.uk domain
      console.log('\nTest 3: Trying with production domain (thompsonseparts.co.uk)...');

      const prodResponse = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://thompsonseparts.co.uk'
        },
        body: JSON.stringify({
          message: 'Hello',
          session_id: `debug-prod-${Date.now()}`,
          domain: 'thompsonseparts.co.uk'
        })
      });

      const prodData = await prodResponse.json();

      if (prodResponse.ok) {
        console.log('✅ Production domain works!');
        console.log('This confirms the issue is specific to the staging domain mapping.');
      } else {
        console.log('❌ Production domain also fails:', prodData.error);
      }
    } else {
      console.log('✅ Chat API working!');
      console.log('Response:', data.message?.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }

  // Test 4: Check if it's a WooCommerce provider issue
  console.log('\nTest 4: Checking WooCommerce provider resolution...');

  try {
    const wooResponse = await fetch('https://www.omniops.co.uk/api/woocommerce/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: 'epartstaging.wpengine.com'
      })
    });

    const wooData = await wooResponse.json();
    console.log('WooCommerce test response:', wooData);
  } catch (error) {
    console.error('WooCommerce test failed:', error);
  }
}

testProductionDebug().catch(console.error);