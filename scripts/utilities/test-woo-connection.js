// Test if WooCommerce connection is working
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== WooCommerce Environment Check ===');
console.log('URL:', process.env.WOOCOMMERCE_URL ? '✓ Set' : '✗ Missing');
console.log('Consumer Key:', process.env.WOOCOMMERCE_CONSUMER_KEY ? `✓ Set (${process.env.WOOCOMMERCE_CONSUMER_KEY.substring(0, 10)}...)` : '✗ Missing');
console.log('Consumer Secret:', process.env.WOOCOMMERCE_CONSUMER_SECRET ? `✓ Set (${process.env.WOOCOMMERCE_CONSUMER_SECRET.substring(0, 10)}...)` : '✗ Missing');

if (process.env.WOOCOMMERCE_URL && process.env.WOOCOMMERCE_CONSUMER_KEY && process.env.WOOCOMMERCE_CONSUMER_SECRET) {
  console.log('\n=== Testing WooCommerce API Connection ===');
  
  import fetch from 'node-fetch';
  const url = process.env.WOOCOMMERCE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  
  // Method 1: Query string authentication (for non-HTTPS or when OAuth doesn't work)
  console.log('\n1. Testing with Query String Authentication:');
  const queryAuthUrl = `${url}/wp-json/wc/v3/system/status?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
  
  fetch(queryAuthUrl)
    .then(res => {
      console.log('   Status:', res.status, res.statusText);
      if (res.status === 401) {
        console.log('   ❌ Query string auth failed - credentials may be invalid');
      }
      return res.json();
    })
    .then(data => {
      if (data.code !== 'woocommerce_rest_cannot_view') {
        console.log('   Response data:', JSON.stringify(data).substring(0, 200));
        console.log('   ✓ System status retrieved:', data.environment?.version || 'Success');
      } else {
        console.log('   Error:', data.message);
      }
    })
    .catch(err => console.error('   Error:', err.message))
    .then(() => {
      // Method 2: Basic Authentication
      console.log('\n2. Testing with Basic Authentication:');
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      
      return fetch(`${url}/wp-json/wc/v3/system/status`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });
    })
    .then(res => {
      console.log('   Status:', res.status, res.statusText);
      if (res.status === 401) {
        console.log('   ❌ Basic auth failed');
      }
      return res.json();
    })
    .then(data => {
      if (data.code !== 'woocommerce_rest_cannot_view') {
        console.log('   Response data:', JSON.stringify(data).substring(0, 200));
        console.log('   ✓ System status retrieved:', data.environment?.version || 'Success');
      } else {
        console.log('   Error:', data.message);
      }
    })
    .catch(err => console.error('   Error:', err.message))
    .then(() => {
      // Method 3: Test simpler endpoint
      console.log('\n3. Testing Products Endpoint (public data):');
      const productsUrl = `${url}/wp-json/wc/v3/products?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}&per_page=1`;
      
      return fetch(productsUrl);
    })
    .then(res => {
      console.log('   Status:', res.status, res.statusText);
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        console.log('   ✓ Products retrieved successfully');
      } else if (data.code) {
        console.log('   Error:', data.message);
      }
    })
    .catch(err => console.error('   Error:', err.message))
    .then(() => {
      // Try to get orders by order number
      console.log('\n4. Testing Order Lookup by Number:');
      const orderUrl = `${url}/wp-json/wc/v3/orders?search=119410&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;
      
      return fetch(orderUrl);
    })
    .then(res => {
      console.log('   Status:', res.status, res.statusText);
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        console.log('   Orders found:', data.length);
        data.forEach(order => {
          console.log(`   - Order #${order.number}: ${order.billing?.email || 'No email'}`);
        });
      } else if (data.code) {
        console.log('   Error:', data.message);
      }
    })
    .catch(err => console.error('   Error:', err.message))
    .then(() => {
      console.log('\n=== Troubleshooting Tips ===');
      console.log('If authentication is failing:');
      console.log('1. Verify the consumer key and secret are correct');
      console.log('2. Check that the keys have read permissions for orders and customers');
      console.log('3. Ensure the WooCommerce REST API is enabled on the store');
      console.log('4. Try regenerating the API keys in WooCommerce > Settings > Advanced > REST API');
      console.log('5. Check if the store URL needs www. prefix or different protocol');
    });
}