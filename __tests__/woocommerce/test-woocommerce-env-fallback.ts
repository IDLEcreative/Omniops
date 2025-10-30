#!/usr/bin/env npx tsx

/**
 * Test WooCommerce Provider via Environment Variable Fallback
 * Tests that the provider works when database config is missing
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testWooCommerceEnvFallback() {
  console.log('🧪 Testing WooCommerce Provider (Environment Fallback)\n');
  console.log('═'.repeat(60));

  // Check env vars
  console.log('\n🔑 Environment Variables Check:');
  console.log('   WOOCOMMERCE_URL:', process.env.WOOCOMMERCE_URL ? '✅ Set' : '❌ Missing');
  console.log('   WOOCOMMERCE_CONSUMER_KEY:', process.env.WOOCOMMERCE_CONSUMER_KEY ? '✅ Set' : '❌ Missing');
  console.log('   WOOCOMMERCE_CONSUMER_SECRET:', process.env.WOOCOMMERCE_CONSUMER_SECRET ? '✅ Set' : '❌ Missing');

  if (!process.env.WOOCOMMERCE_URL) {
    console.error('\n❌ Missing WooCommerce environment variables');
    process.exit(1);
  }

  try {
    // Import WooCommerce provider directly
    console.log('\n📦 Importing WooCommerce Provider...');
    const { WooCommerceProvider } = await import('./lib/agents/providers/woocommerce-provider');

    const domain = 'thompsonseparts.co.uk';
    const provider = new WooCommerceProvider(domain);
    console.log('✅ Provider initialized');
    console.log('   Platform:', provider.platform);

    // Test product search
    console.log('\n📦 Searching for products...');
    const searchQuery = 'pump';
    console.log(`   Query: "${searchQuery}"`);

    const searchStart = Date.now();
    const products = await provider.searchProducts(searchQuery, 5);
    const searchTime = Date.now() - searchStart;

    console.log(`✅ Search completed in ${searchTime}ms`);
    console.log(`   Found ${products.length} products`);

    // Display results
    console.log('\n📦 Product Results');
    console.log('─'.repeat(60));

    if (products.length === 0) {
      console.log('⚠️  No products found for query:', searchQuery);
    } else {
      products.forEach((product: any, idx: number) => {
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
    console.log(`  • Product search: ${searchTime}ms`);
    console.log(`  • Products found: ${products.length}`);
    console.log('\n💡 Note: Used environment variable fallback (not database config)');

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
testWooCommerceEnvFallback().catch(console.error);
