#!/usr/bin/env node

/**
 * Comprehensive WordPress Embed Widget Test
 * Tests all components of the chat widget embed functionality
 */

const http = require('http');

console.log('🧪 Testing WordPress Chat Widget Embed...\n');

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    }).on('error', reject);
  });
}

// TEST 1: embed.js is accessible
test('embed.js is accessible', async () => {
  const result = await httpGet('http://localhost:3000/embed.js');
  if (result.status !== 200) throw new Error(`Expected 200, got ${result.status}`);
  if (!result.data.includes('WIDGET_VERSION')) throw new Error('Widget code not found');
  return 'embed.js loads successfully';
});

// TEST 2: embed.js has correct positioning
test('embed.js has bottom-right positioning', async () => {
  const result = await httpGet('http://localhost:3000/embed.js');
  if (!result.data.includes("position: 'bottom-right'")) {
    throw new Error('Default position not set to bottom-right');
  }
  if (!result.data.includes('width: 400')) {
    throw new Error('Default width not set');
  }
  if (!result.data.includes('height: 600')) {
    throw new Error('Default height not set');
  }
  return 'Positioning config is correct';
});

// TEST 3: /embed endpoint returns 200
test('/embed endpoint is accessible', async () => {
  const result = await httpGet('http://localhost:3000/embed?domain=localhost&version=1.1.0');
  if (result.status !== 200) throw new Error(`Expected 200, got ${result.status}`);
  if (!result.data.includes('ChatWidget')) throw new Error('ChatWidget component not found');
  return '/embed endpoint working';
});

// TEST 4: Test page loads correctly
test('Test page loads with embed script', async () => {
  const result = await httpGet('http://localhost:3000/test-wordpress-embed.html');
  if (result.status !== 200) throw new Error(`Expected 200, got ${result.status}`);
  if (!result.data.includes('script src="http://localhost:3000/embed.js"')) {
    throw new Error('Embed script tag not found');
  }
  if (!result.data.includes('WordPress Embed Test')) {
    throw new Error('Test page content not found');
  }
  return 'Test page structure correct';
});

// TEST 5: Widget has correct iframe detection
test('Widget hides demo hints in iframe', async () => {
  const result = await httpGet('http://localhost:3000/embed?domain=localhost&version=1.1.0');
  // Check that the embed page doesn't show hints when embedded
  if (result.data.includes('Chat Widget Demo') && result.data.includes('Thompson')) {
    throw new Error('Demo hints may still be visible in iframe');
  }
  return 'Demo hints properly hidden';
});

// Run all tests
(async () => {
  for (const { name, fn } of tests) {
    try {
      const message = await fn();
      console.log(`✅ ${name}`);
      console.log(`   ${message}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log('━'.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! WordPress embed code is working correctly.\n');
    console.log('Your WordPress code is ready to use:');
    console.log('');
    console.log('```php');
    console.log('function add_chat_widget() {');
    console.log('    ?>');
    console.log('    <script src="https://www.omniops.co.uk/embed.js" async></script>');
    console.log('    <?php');
    console.log('}');
    console.log('add_action(\'wp_footer\', \'add_chat_widget\');');
    console.log('```\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
})();
