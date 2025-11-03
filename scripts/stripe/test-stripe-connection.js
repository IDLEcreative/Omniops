#!/usr/bin/env node

/**
 * Quick Stripe Connection Test
 * Tests both API key validity and network connectivity
 */

require('dotenv').config({ path: '.env.local' });

async function testStripeConnection() {
  console.log('🔍 Testing Stripe Connection...\n');

  // Check environment variables
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found in environment');
    process.exit(1);
  }

  if (!publishableKey) {
    console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment');
    process.exit(1);
  }

  // Validate key format
  console.log('📋 Key Format Check:');
  console.log(`  Secret Key: ${secretKey.substring(0, 7)}...${secretKey.slice(-4)}`);
  console.log(`  Publishable Key: ${publishableKey.substring(0, 7)}...${publishableKey.slice(-4)}`);

  if (secretKey.startsWith('sk_test_')) {
    console.log('  ℹ️  Using TEST mode secret key');
  } else if (secretKey.startsWith('sk_live_')) {
    console.log('  ⚠️  Using LIVE mode secret key');
  } else {
    console.error('  ❌ Invalid secret key format');
  }

  if (publishableKey.startsWith('pk_test_')) {
    console.log('  ℹ️  Using TEST mode publishable key');
  } else if (publishableKey.startsWith('pk_live_')) {
    console.log('  ⚠️  Using LIVE mode publishable key');
  } else {
    console.error('  ❌ Invalid publishable key format');
  }

  console.log('\n📡 Testing API Connection:');

  try {
    // Dynamically import Stripe
    const stripe = require('stripe')(secretKey);

    // Try to retrieve balance (simplest API call)
    const balance = await stripe.balance.retrieve();

    console.log('✅ Successfully connected to Stripe API!');
    console.log('\n💰 Account Balance:');
    balance.available.forEach(b => {
      console.log(`  ${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`);
    });

    // Try to list products
    console.log('\n📦 Checking Products:');
    const products = await stripe.products.list({ limit: 3 });

    if (products.data.length === 0) {
      console.log('  ℹ️  No products found. Run ./create-products.sh to create them.');
    } else {
      console.log(`  ✅ Found ${products.data.length} product(s):`);
      products.data.forEach(p => {
        console.log(`    - ${p.name} (${p.id})`);
      });
    }

    // Check for prices
    console.log('\n💵 Checking Prices:');
    const prices = await stripe.prices.list({ limit: 5 });

    if (prices.data.length === 0) {
      console.log('  ℹ️  No prices found. Run ./create-products.sh to create them.');
    } else {
      console.log(`  ✅ Found ${prices.data.length} price(s):`);
      prices.data.forEach(p => {
        const amount = (p.unit_amount / 100).toFixed(2);
        console.log(`    - ${p.id}: ${amount} ${p.currency.toUpperCase()}/${p.recurring?.interval || 'one-time'}`);
      });
    }

    console.log('\n✅ All tests passed! Your Stripe integration is properly configured.');

  } catch (error) {
    console.error('\n❌ Connection failed:');

    if (error.type === 'StripeAuthenticationError') {
      console.error('  Invalid API key. Please check your STRIPE_SECRET_KEY.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('  Network error. Cannot reach Stripe API.');
      console.error('  Check your internet connection and firewall settings.');
    } else if (error.statusCode === 403) {
      console.error('  Access denied. This might be a network proxy/firewall issue.');
    } else {
      console.error('  Error details:', error.message);
    }

    process.exit(1);
  }
}

// Run the test
testStripeConnection().catch(console.error);