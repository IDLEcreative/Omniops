// Direct test of WooCommerce API
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const WooCommerce = new WooCommerceRestApi({
  url: 'https://www.thompsonseparts.co.uk',
  consumerKey: 'ck_4dd9a1a797b1a24cde23e55bb26a0aa0dc10e151',
  consumerSecret: 'cs_a3a6a520ccd79f14e9a93740d652bd191bc8a231',
  version: 'wc/v3',
  queryStringAuth: true // Force Basic Authentication
});

async function testWooCommerce() {
  console.log('🧪 Testing direct WooCommerce API connection...');
  console.log('🌐 Store: https://www.thompsonseparts.co.uk');
  
  try {
    // Test 1: Get store info
    console.log('\n📊 Test 1: Getting store system status...');
    const systemStatus = await WooCommerce.get('system_status');
    console.log('✅ Store name:', systemStatus.data.environment.site_title);
    console.log('✅ WooCommerce version:', systemStatus.data.environment.version);
    console.log('✅ Currency:', systemStatus.data.settings.currency);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('⚠️  System status endpoint not available, trying products...');
    } else {
      console.log('❌ System status error:', error.message);
    }
  }
  
  try {
    // Test 2: Get products
    console.log('\n📦 Test 2: Getting products...');
    const products = await WooCommerce.get('products', {
      per_page: 5,
      status: 'publish'
    });
    
    if (products.data && products.data.length > 0) {
      console.log(`✅ Found ${products.data.length} products:`);
      products.data.forEach(product => {
        console.log(`   - ${product.name} (SKU: ${product.sku || 'N/A'}) - Price: ${product.price}`);
      });
    } else {
      console.log('⚠️  No products found');
    }
  } catch (error) {
    console.log('❌ Products error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
  
  try {
    // Test 3: Get categories
    console.log('\n📂 Test 3: Getting product categories...');
    const categories = await WooCommerce.get('products/categories', {
      per_page: 5
    });
    
    if (categories.data && categories.data.length > 0) {
      console.log(`✅ Found ${categories.data.length} categories:`);
      categories.data.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.count} products)`);
      });
    } else {
      console.log('⚠️  No categories found');
    }
  } catch (error) {
    console.log('❌ Categories error:', error.message);
  }
  
  try {
    // Test 4: Get orders (if accessible)
    console.log('\n📋 Test 4: Getting recent orders...');
    const orders = await WooCommerce.get('orders', {
      per_page: 3,
      orderby: 'date',
      order: 'desc'
    });
    
    if (orders.data && orders.data.length > 0) {
      console.log(`✅ Found ${orders.data.length} recent orders:`);
      orders.data.forEach(order => {
        console.log(`   - Order #${order.number} - Status: ${order.status} - Total: ${order.total}`);
      });
    } else {
      console.log('⚠️  No orders found or not accessible');
    }
  } catch (error) {
    console.log('❌ Orders error:', error.message);
    if (error.response && error.response.status === 401) {
      console.log('   (Orders endpoint requires higher privileges)');
    }
  }
  
  console.log('\n✨ WooCommerce API test complete!');
}

testWooCommerce().catch(console.error);