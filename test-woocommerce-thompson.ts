#!/usr/bin/env npx tsx

/**
 * Test WooCommerce Provider with Thompson's Account
 * Tests the new registry pattern with a real customer
 */

import { getCommerceProvider } from './lib/agents/commerce-provider';

async function testThompsonWooCommerce() {
  console.log('🧪 Testing WooCommerce Provider with Thompson\'s Account\n');
  console.log('═'.repeat(60));

  const domain = 'thompsonseparts.co.uk';

  try {
    // Step 1: Get provider via registry
    console.log('\n📦 Step 1: Resolving commerce provider...');
    const startTime = Date.now();
    const provider = await getCommerceProvider(domain);
    const resolutionTime = Date.now() - startTime;

    if (!provider) {
      console.error('❌ No provider found for Thompson\'s domain');
      console.log('   Domain:', domain);
      console.log('   This likely means WooCommerce is not configured in customer_configs');
      process.exit(1);
    }

    console.log(`✅ Provider resolved: ${provider.platform}`);
    console.log(`⚡ Resolution time: ${resolutionTime}ms`);

    // Step 2: Search for a product
    console.log('\n📦 Step 2: Searching for products...');
    const searchQuery = 'pump';
    console.log(`   Query: "${searchQuery}"`);

    const searchStart = Date.now();
    const products = await provider.searchProducts(searchQuery, 5);
    const searchTime = Date.now() - searchStart;

    console.log(`✅ Search completed in ${searchTime}ms`);
    console.log(`   Found ${products.length} products`);

    // Step 3: Display results
    console.log('\n📦 Step 3: Product Results');
    console.log('─'.repeat(60));

    if (products.length === 0) {
      console.log('⚠️  No products found for query:', searchQuery);
    } else {
      products.forEach((product, idx) => {
        console.log(`\n${idx + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku || 'N/A'}`);
        console.log(`   Price: £${product.price || 'N/A'}`);
        console.log(`   Stock: ${product.stock_status || 'N/A'}`);
        if (product.permalink) {
          console.log(`   URL: ${product.permalink}`);
        }
      });
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('✅ TEST SUCCESSFUL\n');
    console.log('Summary:');
    console.log(`  • Platform: ${provider.platform}`);
    console.log(`  • Provider resolution: ${resolutionTime}ms`);
    console.log(`  • Product search: ${searchTime}ms`);
    console.log(`  • Products found: ${products.length}`);
    console.log(`  • Total time: ${resolutionTime + searchTime}ms`);

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testThompsonWooCommerce().catch(console.error);
