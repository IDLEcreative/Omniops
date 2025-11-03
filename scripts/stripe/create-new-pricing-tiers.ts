#!/usr/bin/env npx tsx

/**
 * Create New 4-Tier Pricing Structure in Stripe
 * Based on ARCHITECTURE_PRICING_MODEL.md
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number; // in pence
  tier: string;
  conversations: number;
  targetVisitors: string;
  overageRate: string; // per conversation in £
  popular?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Small Business',
    description: 'Perfect for growing online shops and local businesses (2,500 conversations/month)',
    monthlyPrice: 50000, // £500
    tier: 'small_business',
    conversations: 2500,
    targetVisitors: '20,000-100,000',
    overageRate: '0.12',
  },
  {
    name: 'SME',
    description: 'Established e-commerce brands and B2B businesses (5,000 conversations/month)',
    monthlyPrice: 100000, // £1,000
    tier: 'sme',
    conversations: 5000,
    targetVisitors: '100,000-500,000',
    overageRate: '0.10',
    popular: true,
  },
  {
    name: 'Mid-Market',
    description: 'Large e-commerce operations and enterprise retailers (25,000 conversations/month)',
    monthlyPrice: 500000, // £5,000
    tier: 'mid_market',
    conversations: 25000,
    targetVisitors: '500,000-2,000,000',
    overageRate: '0.08',
  },
  {
    name: 'Enterprise',
    description: 'Enterprise-level support with dedicated account management (100,000 conversations/month)',
    monthlyPrice: 1000000, // £10,000
    tier: 'enterprise',
    conversations: 100000,
    targetVisitors: '2,000,000+',
    overageRate: '0.05',
  },
];

async function createPricingTiers() {
  console.log('🎯 Creating New 4-Tier Pricing Structure in Stripe...\n');

  const results: Array<{
    tier: string;
    productId: string;
    priceId: string;
  }> = [];

  for (const tierConfig of PRICING_TIERS) {
    console.log(`\n✨ Creating: ${tierConfig.name} (£${tierConfig.monthlyPrice / 100}/month)`);

    try {
      // Create product
      const product = await stripe.products.create({
        name: tierConfig.name,
        description: tierConfig.description,
        metadata: {
          tier: tierConfig.tier,
          conversations: tierConfig.conversations.toString(),
          target_visitors: tierConfig.targetVisitors,
          overage_rate: tierConfig.overageRate,
          ...(tierConfig.popular && { popular: 'true' }),
        },
      });

      console.log(`  ✅ Product created: ${product.id}`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tierConfig.monthlyPrice,
        currency: 'gbp',
        recurring: {
          interval: 'month',
        },
        metadata: {
          tier: tierConfig.tier,
          included_conversations: tierConfig.conversations.toString(),
          overage_rate: tierConfig.overageRate,
          ...(tierConfig.popular && { popular: 'true' }),
        },
      });

      console.log(`  ✅ Price created: ${price.id}`);

      results.push({
        tier: tierConfig.tier,
        productId: product.id,
        priceId: price.id,
      });

    } catch (error) {
      console.error(`  ❌ Error creating ${tierConfig.name}:`, error);
      throw error;
    }
  }

  // Output configuration
  console.log('\n' + '='.repeat(60));
  console.log('✅ All pricing tiers created successfully!');
  console.log('='.repeat(60));
  console.log('\n📝 Add these to your .env.local:\n');

  console.log('# New 4-Tier Pricing Structure');
  results.forEach(({ tier, priceId }) => {
    const envVarName = `NEXT_PUBLIC_STRIPE_${tier.toUpperCase()}_PRICE_ID`;
    console.log(`${envVarName}=${priceId}`);
  });

  console.log('\n# Product IDs (for reference)');
  results.forEach(({ tier, productId }) => {
    const envVarName = `STRIPE_${tier.toUpperCase()}_PRODUCT_ID`;
    console.log(`${envVarName}=${productId}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Next Steps:');
  console.log('1. Copy the environment variables above to .env.local');
  console.log('2. Run the database migration: npx tsx scripts/database/migrate-pricing-model.ts');
  console.log('3. Update the billing components to use new pricing');
  console.log('4. Test the checkout flow\n');

  console.log('📚 Migration Guide:');
  console.log('See docs/01-ARCHITECTURE/ARCHITECTURE_PRICING_MODEL.md#migration-from-old-model\n');

  return results;
}

// Run the script
createPricingTiers()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create pricing tiers:', error.message);
    process.exit(1);
  });
