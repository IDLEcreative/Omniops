const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000';
const DOMAIN = 'thompsonseparts.co.uk';

async function runTests() {
  console.log('🔍 Running comprehensive WooCommerce integration tests...\n');
  
  const tests = [
    {
      name: '1. Direct WooCommerce API Test',
      run: async () => {
        const response = await fetch(`${API_URL}/api/test-woocommerce`);
        const data = await response.json();
        
        console.log('✅ WooCommerce API Connection:');
        console.log(`   - Store: ${data.configuration.business_name}`);
        console.log(`   - URL: ${data.configuration.woocommerce_url}`);
        console.log(`   - Products: ${data.test_results[0].count} retrieved`);
        console.log(`   - Sample: ${data.test_results[0].sample[0].name} - £${data.test_results[0].sample[0].price}`);
        return data.summary.status === 'ALL PASSED';
      }
    },
    
    {
      name: '2. Product Search Query',
      run: async () => {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "What Palfinger products do you have available?",
            session_id: "test-product-search",
            domain: DOMAIN
          })
        });
        const data = await response.json();
        
        console.log('✅ Product Search Response:');
        console.log(`   ${data.message.substring(0, 150)}...`);
        return !data.error;
      }
    },
    
    {
      name: '3. Price Query',
      run: async () => {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "How much is the Palfinger Epsilon worklight plug?",
            session_id: "test-price-query",
            domain: DOMAIN
          })
        });
        const data = await response.json();
        
        console.log('✅ Price Query Response:');
        console.log(`   ${data.message.substring(0, 150)}...`);
        return !data.error;
      }
    },
    
    {
      name: '4. Stock Status Query',
      run: async () => {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "Do you have any 110v generators in stock?",
            session_id: "test-stock-query",
            domain: DOMAIN
          })
        });
        const data = await response.json();
        
        console.log('✅ Stock Query Response:');
        console.log(`   ${data.message.substring(0, 150)}...`);
        return !data.error;
      }
    },
    
    {
      name: '5. Order Status Query',
      run: async () => {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "Can you check the status of order #119166?",
            session_id: "test-order-query",
            domain: DOMAIN
          })
        });
        const data = await response.json();
        
        console.log('✅ Order Query Response:');
        console.log(`   ${data.message.substring(0, 150)}...`);
        return !data.error;
      }
    },
    
    {
      name: '6. Category Browsing',
      run: async () => {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: "What categories of products do you offer?",
            session_id: "test-category-query",
            domain: DOMAIN
          })
        });
        const data = await response.json();
        
        console.log('✅ Category Query Response:');
        console.log(`   ${data.message.substring(0, 150)}...`);
        return !data.error;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await test.run();
      if (result) {
        passed++;
        console.log('   Status: ✅ PASSED');
      } else {
        failed++;
        console.log('   Status: ❌ FAILED');
      }
    } catch (error) {
      failed++;
      console.log(`   Status: ❌ ERROR - ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('─'.repeat(50));
  console.log(`   Total Tests: ${tests.length}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${Math.round(passed/tests.length * 100)}%`);
  console.log('═'.repeat(50));
  
  if (passed === tests.length) {
    console.log('\n🎉 All tests passed! WooCommerce integration is fully functional!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run all tests
runTests().catch(console.error);