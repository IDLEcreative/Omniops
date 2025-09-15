import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';
const DOMAIN = 'thompsonseparts.co.uk';

async function findRealCustomerAndTest() {
  console.log('🔍 FINDING REAL CUSTOMER DATA FROM WOOCOMMERCE');
  console.log('═'.repeat(60));
  
  try {
    // First, use test-woocommerce endpoint to get recent orders
    console.log('📦 Fetching recent orders from WooCommerce...');
    const testResponse = await fetch(`${API_BASE}/api/test-woocommerce`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const testData = await testResponse.json();
    
    if (!testData.success) {
      console.error('❌ Could not connect to WooCommerce:', testData.error);
      return;
    }
    
    console.log('✅ Connected to WooCommerce\n');
    
    const orders = testData.data?.recentOrders || [];
    
    if (!orders || orders.length === 0) {
      console.log('❌ No orders found in WooCommerce');
      return;
    }
    
    console.log(`Found ${orders.length} recent orders\n`);
    
    // Pick the first order with customer email
    const testOrder = orders.find(o => o.billing && o.billing.email) || orders[0];
    const customerEmail = testOrder.billing.email;
    const orderNumber = testOrder.number || testOrder.id;
    
    console.log('📋 Test Order Details:');
    console.log(`   Order #: ${orderNumber}`);
    console.log(`   Customer: ${testOrder.billing.first_name} ${testOrder.billing.last_name}`);
    console.log(`   Email: ${customerEmail}`);
    console.log(`   Status: ${testOrder.status}`);
    console.log(`   Total: ${testOrder.currency} ${testOrder.total}`);
    console.log(`   Date: ${testOrder.date_created}`);
    
    // Show line items
    if (testOrder.line_items && testOrder.line_items.length > 0) {
      console.log('\n   Items:');
      testOrder.line_items.forEach(item => {
        console.log(`   - ${item.name} (Qty: ${item.quantity}, Price: ${item.price})`);
      });
    }
    
    // Show shipping address
    if (testOrder.shipping) {
      console.log('\n   Shipping Address:');
      console.log(`   ${testOrder.shipping.address_1}`);
      if (testOrder.shipping.address_2) {
        console.log(`   ${testOrder.shipping.address_2}`);
      }
      console.log(`   ${testOrder.shipping.city}, ${testOrder.shipping.postcode}`);
      console.log(`   ${testOrder.shipping.country}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('🧪 TESTING CHAT SYSTEM WITH REAL CUSTOMER DATA');
    console.log('═'.repeat(60) + '\n');
    
    const sessionId = `real-customer-test-${Date.now()}`;
    let conversationId = null;
    
    // Test scenarios with real data
    const scenarios = [
      {
        title: '1️⃣ ASKING ABOUT ORDER STATUS (Should Request Verification)',
        message: `I need to check the status of my order #${orderNumber}`
      },
      {
        title: '2️⃣ PROVIDING EMAIL FOR VERIFICATION',
        message: `My email is ${customerEmail}`
      },
      {
        title: '3️⃣ ASKING FOR ORDER DETAILS (After providing email)',
        message: `Can you show me the details of my order?`
      },
      {
        title: '4️⃣ ASKING ABOUT DELIVERY',
        message: `When will my order be delivered?`
      },
      {
        title: '5️⃣ REQUESTING ORDER HISTORY',
        message: `Show me all my recent orders`
      }
    ];
    
    // Test each scenario
    for (const scenario of scenarios) {
      console.log(`\n${scenario.title}`);
      console.log('─'.repeat(60));
      console.log(`👤 Customer: "${scenario.message}"`);
      
      const requestBody = {
        message: scenario.message,
        session_id: sessionId,
        domain: DOMAIN
      };
      
      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }
      
      try {
        const response = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        
        if (data.conversation_id) {
          conversationId = data.conversation_id;
        }
        
        const responseMessage = data.message || data.error || 'No response';
        
        // Show response preview
        console.log(`\n🤖 Assistant Response:`);
        if (responseMessage.length > 300) {
          console.log(responseMessage.substring(0, 300) + '...');
          console.log(`   [Full response: ${responseMessage.length} characters]`);
        } else {
          console.log(responseMessage);
        }
        
        // Check for verification status
        if (data.requiresVerification) {
          console.log('\n   ⚠️  Verification Required: YES');
        }
        if (data.verified) {
          console.log('\n   ✅ Customer Verified: YES');
        }
        
        // Check if WooCommerce data was accessed
        if (responseMessage.includes(orderNumber) || 
            responseMessage.includes(customerEmail) ||
            responseMessage.includes(testOrder.billing.first_name)) {
          console.log('   ✅ Real customer data accessed');
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test the stock check API with a real product
    console.log('\n\n' + '═'.repeat(60));
    console.log('🔧 TESTING STOCK CHECK API');
    console.log('═'.repeat(60));
    
    // Get a product from the order to check stock
    if (testOrder.line_items && testOrder.line_items.length > 0) {
      const testProduct = testOrder.line_items[0];
      console.log(`\nChecking stock for: ${testProduct.name}`);
      
      try {
        const stockResponse = await fetch(`${API_BASE}/api/woocommerce/stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: DOMAIN,
            productName: testProduct.name
          })
        });
        
        const stockData = await stockResponse.json();
        if (stockData.success) {
          console.log(`✅ Stock Status: ${stockData.message}`);
          if (stockData.products && stockData.products.length > 0) {
            stockData.products.forEach(p => {
              console.log(`   - ${p.name}: ${p.stock_status} (Qty: ${p.stock_quantity || 'N/A'})`);
            });
          }
        } else {
          console.log(`❌ ${stockData.error}`);
        }
      } catch (error) {
        console.error(`❌ Stock check error: ${error.message}`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ REAL CUSTOMER TEST COMPLETE');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
findRealCustomerAndTest().catch(console.error);