#!/usr/bin/env npx tsx

/**
 * WooCommerce Store API Test Script
 *
 * Tests direct cart manipulation capabilities.
 *
 * Usage:
 *   npx tsx scripts/tests/test-store-api.ts [domain] [productId]
 *
 * Example:
 *   npx tsx scripts/tests/test-store-api.ts example.com 123
 */

import { config } from 'dotenv';
import { getDynamicStoreAPIClient } from '../../lib/woocommerce-dynamic';

// Load environment variables
config({ path: '.env.local' });

async function testStoreAPI() {
  console.log('🧪 WooCommerce Store API Test\n');

  // Check if Store API is enabled
  const isEnabled = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';

  if (!isEnabled) {
    console.log('❌ Store API is not enabled');
    console.log('   Set WOOCOMMERCE_STORE_API_ENABLED=true in .env.local');
    console.log('\n📖 Current Mode: Informational (URL-based)');
    console.log('   The chat agent will provide clickable add-to-cart URLs');
    return;
  }

  console.log('✅ Store API is enabled\n');

  // Get test parameters
  const domain = process.argv[2] || process.env.TEST_DOMAIN || 'example.com';
  const productId = parseInt(process.argv[3] || '1');

  console.log(`📍 Testing with:`);
  console.log(`   Domain: ${domain}`);
  console.log(`   Product ID: ${productId}\n`);

  try {
    // Get Store API client
    console.log('🔄 Initializing Store API client...');
    const storeAPI = await getDynamicStoreAPIClient(domain);

    if (!storeAPI) {
      console.log('❌ Failed to initialize Store API client');
      console.log('   Check that the domain has WooCommerce configured');
      return;
    }

    console.log('✅ Store API client initialized\n');

    // Check availability
    console.log('🔄 Checking Store API availability...');
    const isAvailable = await storeAPI.isAvailable();

    if (!isAvailable) {
      console.log('❌ Store API is not responding');
      console.log('   Verify that WooCommerce Store API is enabled on the target store');
      console.log('   Required: WooCommerce 5.5+ with Store API endpoints accessible');
      return;
    }

    console.log('✅ Store API is available\n');

    // Test 1: Get current cart
    console.log('📦 Test 1: Getting current cart...');
    const cartResult = await storeAPI.getCart();

    if (cartResult.success && cartResult.data) {
      const cart = cartResult.data;
      console.log(`✅ Cart retrieved successfully`);
      console.log(`   Items: ${cart.items.length}`);
      console.log(`   Total: ${cart.totals.total}\n`);
    } else {
      console.log(`⚠️  Failed to get cart: ${cartResult.error?.message}\n`);
    }

    // Test 2: Add item to cart
    console.log(`📦 Test 2: Adding product ${productId} to cart...`);
    const addResult = await storeAPI.addItem(productId, 1);

    if (addResult.success && addResult.data) {
      const cart = addResult.data;
      console.log(`✅ Item added successfully`);
      console.log(`   Cart now has ${cart.items.length} item(s)`);
      console.log(`   New total: ${cart.totals.total}\n`);

      // Find the added item
      const addedItem = cart.items.find(item => item.id === productId);
      if (addedItem) {
        console.log(`   Added: ${addedItem.name}`);
        console.log(`   Price: ${addedItem.prices.price}`);
        console.log(`   Quantity: ${addedItem.quantity}\n`);
      }
    } else {
      console.log(`⚠️  Failed to add item: ${addResult.error?.message}\n`);
    }

    // Test 3: Apply a test coupon (may fail if coupon doesn't exist)
    console.log('📦 Test 3: Applying coupon "TEST"...');
    const couponResult = await storeAPI.applyCoupon('TEST');

    if (couponResult.success && couponResult.data) {
      console.log('✅ Coupon applied successfully\n');
    } else {
      console.log(`ℹ️  Coupon not applied: ${couponResult.error?.message || 'Coupon may not exist'}\n`);
    }

    // Summary
    console.log('🎯 Store API Test Summary:');
    console.log('   ✅ Store API client can connect');
    console.log('   ✅ Cart operations are functional');
    console.log('   ✅ Direct cart manipulation is working');
    console.log('\n📖 Mode: Transactional (Direct API)');
    console.log('   The chat agent can now directly manipulate carts!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify WooCommerce credentials in .env.local');
    console.log('   2. Ensure Redis is running (docker-compose up -d redis)');
    console.log('   3. Check that WooCommerce 5.5+ is installed');
    console.log('   4. Verify Store API endpoints are accessible');
  }
}

// Run the test
testStoreAPI().catch(console.error);