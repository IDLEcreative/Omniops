#!/usr/bin/env npx tsx

/**
 * Health check script to verify production API status
 */

async function testHealthCheck() {
  console.log('🏥 Running production health check...\n');

  const tests = [
    {
      name: 'Homepage',
      url: 'https://www.omniops.co.uk',
      method: 'GET'
    },
    {
      name: 'API Health',
      url: 'https://www.omniops.co.uk/api/health',
      method: 'GET'
    },
    {
      name: 'Chat API OPTIONS',
      url: 'https://www.omniops.co.uk/api/chat',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://epartstaging.wpengine.com'
      }
    },
    {
      name: 'Minimal Chat Request',
      url: 'https://www.omniops.co.uk/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test',
        session_id: 'test-123'
        // Intentionally omit domain to test minimal request
      })
    },
    {
      name: 'Chat with Production Domain',
      url: 'https://www.omniops.co.uk/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'test',
        session_id: 'test-456',
        domain: 'thompsonseparts.co.uk'
      })
    }
  ];

  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    console.log(`  ${test.method} ${test.url}`);

    try {
      const options: any = {
        method: test.method,
        headers: test.headers || {}
      };

      if (test.body) {
        options.body = test.body;
      }

      const startTime = Date.now();
      const response = await fetch(test.url, options);
      const responseTime = Date.now() - startTime;

      console.log(`  Status: ${response.status} (${responseTime}ms)`);

      if (test.method === 'OPTIONS') {
        console.log(`  CORS Headers:`);
        console.log(`    - Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
        console.log(`    - Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
      }

      if (!response.ok && response.headers.get('content-type')?.includes('json')) {
        const error = await response.json();
        console.log(`  ❌ Error: ${error.error || error.message}`);
      } else if (response.ok) {
        console.log(`  ✅ Success`);
      }
    } catch (error: any) {
      console.log(`  ❌ Failed: ${error.message}`);
    }

    console.log('');
  }

  console.log('📊 Health check complete\n');
}

testHealthCheck().catch(console.error);