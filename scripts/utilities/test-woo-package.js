// Test WooCommerce connection using the official package
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

console.log('=== Testing with WooCommerce Package ===\n');
console.log('URL:', process.env.WOOCOMMERCE_URL || '❌ NOT SET');
console.log('Consumer Key:', process.env.WOOCOMMERCE_CONSUMER_KEY ? '✅ SET' : '❌ NOT SET');
console.log('Consumer Secret:', process.env.WOOCOMMERCE_CONSUMER_SECRET ? '✅ SET' : '❌ NOT SET\n');

// Initialize WooCommerce API
const WooCommerce = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET,
  version: "wc/v3",
  queryStringAuth: true, // Force query string auth (works better with some hosts)
  verifySsl: false // Disable SSL verification for testing
});

async function testConnection() {
  try {
    // Test 1: System status
    console.log('1. Testing System Status:');
    try {
      const systemStatus = await WooCommerce.get("system_status");
      console.log('   ✓ Connected! WooCommerce Version:', systemStatus.data?.environment?.version);
    } catch (err) {
      console.log('   ✗ System status failed:', err.response?.data?.message || err.message);
    }

    // Test 2: Get products (public endpoint)
    console.log('\n2. Testing Products Endpoint:');
    try {
      const products = await WooCommerce.get("products", { per_page: 1 });
      console.log('   ✓ Products accessible! Found:', products.data.length, 'product(s)');
    } catch (err) {
      console.log('   ✗ Products failed:', err.response?.data?.message || err.message);
    }

    // Test 3: Search for specific order
    console.log('\n3. Testing Order Search (Order #119410):');
    try {
      const orders = await WooCommerce.get("orders", { 
        search: "119410",
        per_page: 10 
      });
      console.log('   Orders found:', orders.data.length);
      if (orders.data.length > 0) {
        const order = orders.data[0];
        console.log('   ✓ Order found!');
        console.log('     - Number:', order.number);
        console.log('     - Email:', order.billing?.email);
        console.log('     - Status:', order.status);
        console.log('     - Total:', order.currency, order.total);
      }
    } catch (err) {
      console.log('   ✗ Order search failed:', err.response?.data?.message || err.message);
      if (err.response?.status === 401) {
        console.log('   Note: Keys may not have order read permissions');
      }
    }

    // Test 4: Search for customer by email
    console.log('\n4. Testing Customer Search (samguy@thompsonsuk.com):');
    try {
      const customers = await WooCommerce.get("customers", { 
        email: "samguy@thompsonsuk.com",
        per_page: 10 
      });
      console.log('   Customers found:', customers.data.length);
      if (customers.data.length > 0) {
        const customer = customers.data[0];
        console.log('   ✓ Customer found!');
        console.log('     - Name:', customer.first_name, customer.last_name);
        console.log('     - Email:', customer.email);
        console.log('     - ID:', customer.id);
      }
    } catch (err) {
      console.log('   ✗ Customer search failed:', err.response?.data?.message || err.message);
      if (err.response?.status === 401) {
        console.log('   Note: Keys may not have customer read permissions');
      }
    }

    // Test 5: Search orders by email (for guest checkouts)
    console.log('\n5. Testing Order Search by Email:');
    try {
      const orders = await WooCommerce.get("orders", { 
        search: "samguy@thompsonsuk.com",
        per_page: 10,
        orderby: "date",
        order: "desc"
      });
      console.log('   Orders found:', orders.data.length);
      orders.data.forEach(order => {
        console.log(`   - Order #${order.number}: ${order.billing?.email} - ${order.status}`);
      });
    } catch (err) {
      console.log('   ✗ Order search by email failed:', err.response?.data?.message || err.message);
    }

  } catch (error) {
    console.error('\n✗ General error:', error.message);
    if (error.response) {
      console.error('  Response data:', error.response.data);
      console.error('  Response status:', error.response.status);
    }
  }

  console.log('\n=== Diagnostics ===');
  console.log('If authentication is failing with 401:');
  console.log('1. Log into WooCommerce admin: ' + process.env.WOOCOMMERCE_URL + '/wp-admin');
  console.log('2. Go to WooCommerce > Settings > Advanced > REST API');
  console.log('3. Check that your API key has "Read" or "Read/Write" permissions');
  console.log('4. Try generating new keys with "Read/Write" permissions');
  console.log('5. Make sure to copy the Consumer Secret immediately (only shown once)');
}

testConnection();