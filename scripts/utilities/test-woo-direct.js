// Test direct WooCommerce API connection
import dotenv from 'dotenv';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

dotenv.config({ path: '.env.local' });

async function testDirectAPI() {
  console.log('=== Testing Direct WooCommerce API ===\n');
  
  // First check if we have dynamic WooCommerce configs stored
  const { getDynamicWooCommerceClient } = await import('./lib/woocommerce-dynamic.js');
  
  console.log('1. Checking for thompsonseparts.co.uk configuration:');
  try {
    const client = await getDynamicWooCommerceClient('thompsonseparts.co.uk');
    if (client) {
      console.log('   ✓ Found WooCommerce configuration for thompsonseparts.co.uk!');
      
      // Test searching for orders
      console.log('\n2. Testing order search:');
      try {
        // Search for order 119410
        const orders1 = await client.get('orders', { search: '119410' });
        console.log('   Order search response:', typeof orders1, Array.isArray(orders1) ? `Array(${orders1.length})` : 'Not array');
        const orderData = orders1.data || orders1;
        console.log(`   Found ${orderData.length} order(s) matching "119410"`);
        if (orderData.length > 0) {
          const order = orderData[0];
          console.log(`   ✓ Order #${order.number}: ${order.billing?.email || 'No email'} - ${order.status}`);
        }
        
        // Search for orders by email
        const orders2 = await client.get('orders', { search: 'samguy@thompsonsuk.com' });
        const orderData2 = orders2.data || orders2;
        console.log(`   Found ${orderData2.length} order(s) matching email`);
      } catch (err) {
        console.log('   ✗ Order search failed:', err.response?.data?.message || err.message);
      }
      
      console.log('\n3. Testing customer search:');
      try {
        // Search for customer by email
        const customers = await client.get('customers', { email: 'samguy@thompsonsuk.com' });
        const customerData = customers.data || customers;
        console.log(`   Found ${customerData.length} customer(s) with email`);
        if (customerData.length > 0) {
          const customer = customerData[0];
          console.log(`   ✓ Customer: ${customer.first_name} ${customer.last_name} (ID: ${customer.id})`);
        }
      } catch (err) {
        console.log('   ✗ Customer search failed:', err.response?.data?.message || err.message);
      }
      
    } else {
      console.log('   ✗ No configuration found - trying environment variables');
      
      // Try environment variables
      
      const WooCommerce = new WooCommerceRestApi({
        url: process.env.WOOCOMMERCE_URL,
        consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
        consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
        version: "wc/v3",
        queryStringAuth: true
      });
      
      console.log('\n2. Testing with environment variables:');
      try {
        const orders = await WooCommerce.get('orders', { per_page: 1 });
        console.log('   ✓ Connected! Found', orders.data.length, 'order(s)');
      } catch (err) {
        console.log('   ✗ Failed:', err.response?.data?.message || err.message);
      }
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Also check using the WooCommerceCustomer class
  console.log('\n4. Testing WooCommerceCustomer class:');
  import { WooCommerceCustomer  } from './lib/woocommerce-customer';
  
  try {
    // Try for the specific domain
    const customer = await WooCommerceCustomer.forDomain('thompsonseparts.co.uk');
    if (customer) {
      console.log('   ✓ WooCommerceCustomer initialized for domain');
      
      // Test order search
      const orders = await customer.getCustomerOrdersByEmail('samguy@thompsonsuk.com', 5);
      console.log(`   Found ${orders.length} order(s) for samguy@thompsonsuk.com`);
      orders.forEach(order => {
        console.log(`   - Order #${order.number}: ${order.status} - ${order.currency} ${order.total}`);
      });
    } else {
      console.log('   ✗ Could not initialize for domain');
    }
  } catch (error) {
    console.error('   Error:', error.message);
  }
}

testDirectAPI().catch(console.error);