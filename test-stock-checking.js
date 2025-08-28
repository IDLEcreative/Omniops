#!/usr/bin/env node

/**
 * Test script for real-time stock checking feature
 * Tests various query patterns to ensure stock checking works correctly
 */

const testCases = [
  {
    name: "SKU-based query",
    message: "What's the stock status of SKU123?",
    expectedBehavior: "Should search for product by SKU 'SKU123' and return exact stock quantity"
  },
  {
    name: "Product name in quotes",
    message: "Is the 'Premium Widget' in stock?",
    expectedBehavior: "Should search for 'Premium Widget' by name and return stock status"
  },
  {
    name: "Multiple products",
    message: "Check stock for 'Blue Shirt' and 'Red Pants'",
    expectedBehavior: "Should return stock status for both products"
  },
  {
    name: "General availability query",
    message: "What products are currently out of stock?",
    expectedBehavior: "Should list products with out-of-stock status"
  },
  {
    name: "Stock quantity query",
    message: "How many units of the wireless headphones do you have in stock?",
    expectedBehavior: "Should return exact stock quantity for wireless headphones"
  },
  {
    name: "Mixed SKU and name",
    message: "Check availability of ABC-123 and 'Garden Tools'",
    expectedBehavior: "Should search by SKU for ABC-123 and by name for Garden Tools"
  }
];

async function testStockChecking(testCase) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Test: ${testCase.name}`);
  console.log(`Message: "${testCase.message}"`);
  console.log(`Expected: ${testCase.expectedBehavior}`);
  console.log(`${'='.repeat(50)}`);

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        session_id: 'test-stock-' + Date.now(),
        domain: 'example.com', // Replace with your test domain
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\nResponse:', data.message);
    
    // Check if response mentions stock or availability
    const hasStockInfo = /stock|available|availability|units|quantity|out of stock|in stock/i.test(data.message);
    console.log('\nContains stock information:', hasStockInfo ? 'Yes ✓' : 'No ✗');
    
    if (data.sources) {
      console.log('\nSources:', data.sources.map(s => s.url).join(', '));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('Starting Real-Time Stock Checking Tests');
  console.log('========================================');
  console.log('Note: Make sure your development server is running on http://localhost:3000');
  console.log('Note: Update the domain in the script to match your test WooCommerce store');
  
  for (const testCase of testCases) {
    await testStockChecking(testCase);
    // Wait a bit between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\nAll tests completed!');
  console.log('Check the server logs for detailed information about:');
  console.log('- SKU matching');
  console.log('- Product search queries');
  console.log('- Stock data retrieved from WooCommerce');
}

// Run the tests
runTests().catch(console.error);