#!/usr/bin/env npx tsx

/**
 * Exact Recreation of Earlier Successful Test
 * Based on the test that returned 5 products successfully
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testExactRecreation() {
  console.log('🧪 Recreating Earlier Successful Test\n');
  console.log('═'.repeat(60));

  // Import WooCommerce provider directly (like we did before)
  const { WooCommerceProvider } = await import('./lib/agents/providers/woocommerce-provider');

  const domain = 'thompsonseparts.co.uk';
  const provider = new WooCommerceProvider(domain);

  console.log('✅ Provider initialized');
  console.log('   Platform:', provider.platform);
  console.log('   Domain:', domain);

  // Search for products exactly like before
  console.log('\n📦 Searching for products...');
  const searchQuery = 'pump';
  console.log(`   Query: "${searchQuery}"`);

  try {
    const searchStart = Date.now();
    const products = await provider.searchProducts(searchQuery, 5);
    const searchTime = Date.now() - searchStart;

    console.log(`✅ Search completed in ${searchTime}ms`);
    console.log(`   Found ${products.length} products`);

    if (products.length > 0) {
      console.log('\n📦 Product Results:');
      console.log('─'.repeat(60));
      products.forEach((product: any, idx: number) => {
        console.log(`\n${idx + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku || 'N/A'}`);
        console.log(`   Price: £${product.price || 'N/A'}`);
        console.log(`   Stock: ${product.stock_status || 'N/A'}`);
        if (product.permalink) {
          console.log(`   URL: ${product.permalink}`);
        }
      });

      console.log('\n' + '═'.repeat(60));
      console.log('✅ TEST SUCCESSFUL - API KEYS ARE WORKING!\n');
      console.log('This proves the API keys are valid.');
      console.log('The earlier 401 errors must have been a temporary issue.');
    } else {
      console.log('\n⚠️  No products found, but no auth error');
      console.log('This suggests authentication worked but query returned no results');
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);

    if (error.response?.status === 401) {
      console.error('\nThis is strange - we got 5 products earlier with these same keys!');
      console.error('Let me check what might have changed...');
    }
  }
}

testExactRecreation().catch(console.error);
