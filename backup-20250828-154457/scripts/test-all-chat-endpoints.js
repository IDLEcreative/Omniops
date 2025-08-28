const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/chat';
const DOMAIN = 'thompsonseparts.co.uk';

// Test queries covering all WooCommerce functionality
const testQueries = [
  {
    category: '🔍 Product Search',
    queries: [
      'What products do you have available?',
      'Show me Palfinger products',
      'Do you have any hydraulic equipment?',
      'What crane parts are in stock?',
      'Show me products for tippers'
    ]
  },
  {
    category: '💰 Price Inquiries',
    queries: [
      'How much are your Palfinger products?',
      'What are the prices for hydraulic pumps?',
      'Show me products under $50',
      'What is your most expensive item?',
      'Do you have any items on sale?'
    ]
  },
  {
    category: '📦 Stock Availability',
    queries: [
      'What items are currently in stock?',
      'Is the Palfinger Epsilon worklight available?',
      'Do you have any 110v generators available?',
      'Check stock for hydraulic cylinders',
      'What products can ship immediately?'
    ]
  },
  {
    category: '📂 Category Browsing',
    queries: [
      'What categories of products do you offer?',
      'Show me your electrical equipment',
      'What 12v products do you have?',
      'Browse 24v equipment',
      'What generator options are available?'
    ]
  },
  {
    category: '🔧 Specific Product Details',
    queries: [
      'Tell me about the Palfinger Epsilon sealing cap',
      'What are the specifications of your hydraulic valves?',
      'Details about the 2-pin worklight plug',
      'Information on load holding valves',
      'Describe your extension components'
    ]
  },
  {
    category: '📋 Order & Support',
    queries: [
      'How do I place an order?',
      'What are your shipping options?',
      'Do you offer bulk discounts?',
      'Can I get a quote for multiple items?',
      'What is your return policy?'
    ]
  }
];

async function testQuery(query, sessionId) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: sessionId,
        domain: DOMAIN
      }),
      timeout: 15000
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    // Analyze response quality
    const hasProducts = data.message.includes('$') || data.message.includes('stock') || data.message.includes('available');
    const hasSpecifics = data.message.includes('Palfinger') || data.message.includes('Epsilon') || data.message.includes('Thompson');
    const isHelpful = !data.message.includes("don't have") && !data.message.includes("cannot") && !data.message.includes("unable");
    
    return {
      success: true,
      message: data.message.substring(0, 150) + (data.message.length > 150 ? '...' : ''),
      quality: {
        hasProducts,
        hasSpecifics,
        isHelpful,
        score: (hasProducts ? 1 : 0) + (hasSpecifics ? 1 : 0) + (isHelpful ? 1 : 0)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 COMPREHENSIVE CHAT ENDPOINT TESTING');
  console.log('═'.repeat(60));
  console.log(`Testing against: ${DOMAIN}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('═'.repeat(60) + '\n');

  let totalTests = 0;
  let successfulTests = 0;
  let highQualityResponses = 0;

  for (const category of testQueries) {
    console.log(`\n${category.category}`);
    console.log('─'.repeat(60));

    for (const query of category.queries) {
      totalTests++;
      const sessionId = `test-${Date.now()}-${totalTests}`;
      
      process.stdout.write(`\n📝 Query: "${query}"\n`);
      
      const result = await testQuery(query, sessionId);
      
      if (result.success) {
        successfulTests++;
        const qualityEmoji = result.quality.score === 3 ? '🌟' : 
                             result.quality.score === 2 ? '✅' : 
                             result.quality.score === 1 ? '⚠️' : '❌';
        
        if (result.quality.score >= 2) highQualityResponses++;
        
        console.log(`   ${qualityEmoji} Response: ${result.message}`);
        console.log(`   📊 Quality Score: ${result.quality.score}/3`);
        console.log(`      • Has Products: ${result.quality.hasProducts ? '✓' : '✗'}`);
        console.log(`      • Has Specifics: ${result.quality.hasSpecifics ? '✓' : '✗'}`);
        console.log(`      • Is Helpful: ${result.quality.isHelpful ? '✓' : '✗'}`);
      } else {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary Report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('═'.repeat(60));
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Successful Responses: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests * 100)}%)`);
  console.log(`High Quality Responses: ${highQualityResponses}/${successfulTests} (${Math.round(highQualityResponses/successfulTests * 100)}%)`);
  
  const overallScore = (successfulTests/totalTests) * (highQualityResponses/successfulTests) * 100;
  console.log(`\nOverall Integration Score: ${Math.round(overallScore)}%`);
  
  if (overallScore >= 80) {
    console.log('✅ WooCommerce Integration: EXCELLENT');
  } else if (overallScore >= 60) {
    console.log('⚠️ WooCommerce Integration: GOOD (needs improvement)');
  } else {
    console.log('❌ WooCommerce Integration: NEEDS ATTENTION');
  }
  
  console.log('═'.repeat(60));
}

// Run all tests
console.log('Starting comprehensive chat endpoint tests...\n');
runAllTests().catch(console.error);