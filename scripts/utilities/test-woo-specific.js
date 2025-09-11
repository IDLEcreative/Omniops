// Test specific WooCommerce searches
require('dotenv').config({ path: '.env.local' });

async function testSpecificSearches() {
  console.log('=== Testing Specific WooCommerce Searches ===\n');
  
  const { WooCommerceCustomer } = require('./lib/woocommerce-customer');
  const customer = await WooCommerceCustomer.forDomain('thompsonseparts.co.uk');
  
  if (!customer) {
    console.log('Could not initialize WooCommerce for domain');
    return;
  }
  
  // Test 1: Search for exact order 119410
  console.log('1. Searching for order #119410 specifically:');
  try {
    const verification = await customer.verifyOrderOwnership('119410', 'samguy@thompsonsuk.com');
    if (verification.verified) {
      console.log('   ✓ Order verified!');
      console.log('   - Order ID:', verification.orderId);
      console.log('   - Customer ID:', verification.customerId);
      
      // Get full order details
      const orderDetails = await customer.getOrderDetails(verification.orderId);
      if (orderDetails) {
        console.log('   - Status:', orderDetails.status);
        console.log('   - Total:', orderDetails.currency, orderDetails.total);
        console.log('   - Customer Email:', orderDetails.billing.email);
        console.log('   - Items:');
        orderDetails.line_items.forEach(item => {
          console.log(`     • ${item.name} x${item.quantity} - ${item.total}`);
        });
      }
    } else {
      console.log('   ✗ Order not verified');
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test 2: Get all orders for email
  console.log('\n2. Getting all orders for samguy@thompsonsuk.com:');
  try {
    const orders = await customer.getCustomerOrdersByEmail('samguy@thompsonsuk.com', 10);
    console.log(`   Found ${orders.length} order(s):`);
    orders.forEach(order => {
      console.log(`   - Order #${order.number}: ${order.status} - ${order.currency} ${order.total}`);
      console.log(`     Created: ${new Date(order.date_created).toLocaleDateString()}`);
    });
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test 3: Search for customer
  console.log('\n3. Searching for customer samguy@thompsonsuk.com:');
  try {
    const customerData = await customer.searchCustomerByEmail('samguy@thompsonsuk.com');
    if (customerData) {
      console.log('   ✓ Customer found!');
      console.log('   - Name:', customerData.first_name, customerData.last_name);
      console.log('   - Customer ID:', customerData.id);
      console.log('   - Username:', customerData.username);
      console.log('   - Created:', new Date(customerData.date_created).toLocaleDateString());
    } else {
      console.log('   ✗ Customer not found');
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test 4: Get customer context for AI
  console.log('\n4. Generating customer context for AI:');
  try {
    const context = await customer.getCustomerContext('samguy@thompsonsuk.com', 'test-session');
    if (context) {
      console.log('   ✓ Context generated:');
      console.log(context);
    } else {
      console.log('   ✗ No context generated');
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
}

testSpecificSearches().catch(console.error);