import { WooCommerceAPI } from './lib/woocommerce-api';

async function testWooCommerceConnection() {
  console.log('Testing WooCommerce API Connection...\n');

  // Get credentials from environment
  const url = process.env.WOOCOMMERCE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  console.log('Configuration:');
  console.log(`  URL: ${url}`);
  console.log(`  Consumer Key: ${consumerKey?.substring(0, 10)}...`);
  console.log(`  Consumer Secret: ${consumerSecret?.substring(0, 10)}...\n`);

  if (!url || !consumerKey || !consumerSecret) {
    console.error('❌ WooCommerce credentials not found in environment');
    process.exit(1);
  }

  // Create WooCommerce API instance
  const wc = new WooCommerceAPI({
    url,
    consumerKey,
    consumerSecret,
  });

  try {
    console.log('Test 1: Fetching system status...');
    const systemStatus = await wc.getSystemStatus();
    console.log(`✅ System Status: WC ${systemStatus.environment?.version}\n`);

    console.log('Test 2: Fetching products...');
    const products = await wc.getProducts({ per_page: 3 });
    console.log(`✅ Products: Found ${products.length} products`);
    products.forEach((p) => {
      console.log(`  - ${p.name} (${p.sku}) - £${p.price}`);
    });
    console.log();

    console.log('Test 3: Fetching categories...');
    const categories = await wc.getProductCategories({ per_page: 3 });
    console.log(`✅ Categories: Found ${categories.length} categories`);
    categories.forEach((c) => {
      console.log(`  - ${c.name} (${c.count} products)`);
    });
    console.log();

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as any;
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
    }
    process.exit(1);
  }
}

testWooCommerceConnection();
