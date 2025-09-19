
const API_URL = 'http://localhost:3000/api/chat';
const DOMAIN = 'thompsonseparts.co.uk';

// Test queries for shipping and order functionality
const orderTests = [
  {
    category: '📦 Shipping Information',
    queries: [
      'What are your shipping rates?',
      'How long does delivery take?',
      'Do you ship internationally?',
      'What shipping methods do you offer?',
      'Is next day delivery available?',
      'How much is shipping to London?',
      'Do you offer free shipping?',
      'Can I track my shipment?'
    ]
  },
  {
    category: '📋 Order Status & Tracking',
    queries: [
      'Where is my order?',
      'Check the status of order #119166',
      'I need to track order 119165',
      'What is the status of my recent order?',
      'My order number is 119164, what is its status?',
      'Can you check if order #119166 has shipped?',
      'When will order 119165 be delivered?',
      'I placed an order yesterday, where is it?'
    ]
  },
  {
    category: '👤 Customer Account Queries',
    queries: [
      'Show me my recent orders',
      'What orders do I have?',
      'Check my order history',
      'I need to see my past purchases',
      'My email is customer@example.com, show my orders',
      'Can you look up my account?',
      'What have I ordered before?',
      'Show my account details'
    ]
  },
  {
    category: '🔄 Returns & Refunds',
    queries: [
      'How do I return an item?',
      'What is your return policy?',
      'Can I return order #119164?',
      'I need to request a refund',
      'How long do returns take?',
      'Is there a restocking fee?',
      'Can I exchange a product?',
      'My order arrived damaged, what do I do?'
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
      })
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    // Analyze response for order/shipping specific content
    const hasOrderInfo = data.message.includes('order') || data.message.includes('Order') || 
                         data.message.includes('#119') || data.message.includes('tracking');
    const hasShippingInfo = data.message.includes('shipping') || data.message.includes('delivery') || 
                            data.message.includes('days') || data.message.includes('overnight');
    const requestsVerification = data.message.includes('verify') || data.message.includes('email') || 
                                 data.message.includes('security') || data.message.includes('privacy');
    const providesInfo = !data.message.includes("don't have") && !data.message.includes("cannot") && 
                        !data.message.includes("unable") && !data.message.includes("sorry");
    
    return {
      success: true,
      message: data.message.substring(0, 200) + (data.message.length > 200 ? '...' : ''),
      analysis: {
        hasOrderInfo,
        hasShippingInfo,
        requestsVerification,
        providesInfo,
        score: (hasOrderInfo ? 1 : 0) + (hasShippingInfo ? 1 : 0) + 
               (requestsVerification ? 1 : 0) + (providesInfo ? 1 : 0)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function runOrderTests() {
  console.log('🚢 SHIPPING & ORDER STATUS TESTING');
  console.log('═'.repeat(60));
  console.log(`Testing against: ${DOMAIN}`);
  console.log(`Focus: Order tracking, shipping info, customer accounts`);
  console.log('═'.repeat(60) + '\n');

  let totalTests = 0;
  let successfulTests = 0;
  let verificationRequests = 0;
  let informativeResponses = 0;

  for (const category of orderTests) {
    console.log(`\n${category.category}`);
    console.log('─'.repeat(60));

    for (const query of category.queries) {
      totalTests++;
      const sessionId = `order-test-${Date.now()}-${totalTests}`;
      
      process.stdout.write(`\n💬 Query: "${query}"\n`);
      
      const result = await testQuery(query, sessionId);
      
      if (result.success) {
        successfulTests++;
        
        // Determine response type
        let responseType = '';
        if (result.analysis.requestsVerification) {
          responseType = '🔐 VERIFICATION REQUIRED';
          verificationRequests++;
        } else if (result.analysis.hasOrderInfo || result.analysis.hasShippingInfo) {
          responseType = '✅ INFORMATIVE';
          informativeResponses++;
        } else if (result.analysis.providesInfo) {
          responseType = '📝 GENERAL INFO';
          informativeResponses++;
        } else {
          responseType = '⚠️ LIMITED INFO';
        }
        
        console.log(`   ${responseType}`);
        console.log(`   Response: ${result.message}`);
        console.log(`   Analysis:`);
        console.log(`      • Has Order Info: ${result.analysis.hasOrderInfo ? '✓' : '✗'}`);
        console.log(`      • Has Shipping Info: ${result.analysis.hasShippingInfo ? '✓' : '✗'}`);
        console.log(`      • Requests Verification: ${result.analysis.requestsVerification ? '✓' : '✗'}`);
        console.log(`      • Provides Useful Info: ${result.analysis.providesInfo ? '✓' : '✗'}`);
      } else {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary Report
  console.log('\n' + '═'.repeat(60));
  console.log('📊 ORDER & SHIPPING TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Successful Responses: ${successfulTests}/${totalTests} (${Math.round(successfulTests/totalTests * 100)}%)`);
  console.log(`Verification Requests: ${verificationRequests} (${Math.round(verificationRequests/totalTests * 100)}%)`);
  console.log(`Informative Responses: ${informativeResponses} (${Math.round(informativeResponses/totalTests * 100)}%)`);
  
  console.log('\n📋 Key Findings:');
  if (verificationRequests > 0) {
    console.log('✅ Customer verification system is ACTIVE for sensitive queries');
  } else {
    console.log('⚠️ Customer verification may not be working');
  }
  
  if (informativeResponses > totalTests * 0.5) {
    console.log('✅ System provides helpful information for most queries');
  } else {
    console.log('⚠️ System needs more comprehensive order/shipping data');
  }
  
  console.log('═'.repeat(60));
}

// Run the tests
console.log('Starting shipping and order status tests...\n');
runOrderTests().catch(console.error);