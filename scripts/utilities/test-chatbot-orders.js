// Test the chatbot's ability to retrieve orders with mock data fallback
require('dotenv').config({ path: '.env.local' });

async function testChatbotOrderLookup() {
  console.log('=== Testing Chatbot Order Lookup ===\n');
  
  // Test the WooCommerce customer module directly
  const { WooCommerceCustomer } = require('./lib/woocommerce-customer');
  
  const customer = WooCommerceCustomer.fromEnvironment();
  
  // Test 1: Search for customer by email
  console.log('1. Testing customer search for samguy@thompsonsuk.com:');
  try {
    const customerData = await customer.searchCustomerByEmail('samguy@thompsonsuk.com');
    if (customerData) {
      console.log('   ✓ Customer found!');
      console.log('   - Name:', customerData.first_name, customerData.last_name);
      console.log('   - Email:', customerData.email);
      console.log('   - ID:', customerData.id);
    } else {
      console.log('   ✗ Customer not found');
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  // Test 2: Get orders by email
  console.log('\n2. Testing order retrieval by email:');
  try {
    const orders = await customer.getCustomerOrdersByEmail('samguy@thompsonsuk.com', 10);
    console.log('   Orders found:', orders.length);
    if (orders.length > 0) {
      console.log('   ✓ Successfully retrieved orders!');
      orders.forEach(order => {
        console.log(`   - Order #${order.number}: ${order.status} - ${order.currency} ${order.total}`);
        console.log(`     Date: ${new Date(order.date_created).toLocaleDateString()}`);
        if (order.customer_note) {
          console.log(`     Note: ${order.customer_note}`);
        }
      });
    } else {
      console.log('   ✗ No orders found');
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  // Test 3: Verify specific order ownership
  console.log('\n3. Testing order ownership verification:');
  try {
    const verification = await customer.verifyOrderOwnership('119410', 'samguy@thompsonsuk.com');
    if (verification.verified) {
      console.log('   ✓ Order ownership verified!');
      console.log('   - Order ID:', verification.orderId);
      console.log('   - Customer ID:', verification.customerId);
    } else {
      console.log('   ✗ Order ownership not verified');
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  // Test 4: Get customer context for chat
  console.log('\n4. Testing customer context generation:');
  try {
    const context = await customer.getCustomerContext('samguy@thompsonsuk.com', 'test-conversation-001');
    if (context) {
      console.log('   ✓ Context generated successfully!');
      console.log('   Context preview:');
      console.log(context.substring(0, 500) + '...');
    } else {
      console.log('   ✗ No context generated');
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
  console.log('If you see customer and order data above, the mock fallback is working!');
  console.log('The chatbot should now be able to help customers with order lookups.');
}

testChatbotOrderLookup().catch(console.error);