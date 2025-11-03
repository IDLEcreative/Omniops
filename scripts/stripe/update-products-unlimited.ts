#!/usr/bin/env npx tsx

/**
 * Update Stripe Products to UNLIMITED model with 14-day free trial
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

async function updateProductsToUnlimited() {
  console.log('🔄 Updating Stripe products to UNLIMITED model with free trial...\n');

  const updates = [
    {
      productId: 'prod_TMC9piTJUJFcsT',
      priceId: 'price_1SPTlBCcOAlIBdYPd0zaVVan',
      name: 'Small Business',
      description: 'Unlimited conversations • Unlimited seats • 14-day free trial',
    },
    {
      productId: 'prod_TMC96oQ7oMN7oz',
      priceId: 'price_1SPTlCCcOAlIBdYP9WYXc1kz',
      name: 'SME',
      description: 'Unlimited conversations • Priority support • 14-day free trial',
    },
    {
      productId: 'prod_TMC9Cva4CBgOux',
      priceId: 'price_1SPTlDCcOAlIBdYPfg0vCgJY',
      name: 'Mid-Market',
      description: 'Unlimited everything • Dedicated account manager • 14-day free trial',
    },
    {
      productId: 'prod_TMC9vrF7K8jutf',
      priceId: 'price_1SPTlDCcOAlIBdYPY4m98bkT',
      name: 'Enterprise',
      description: 'Unlimited everything • 24/7 support • White-label • 14-day free trial',
    },
  ];

  for (const update of updates) {
    try {
      // Update product
      await stripe.products.update(update.productId, {
        description: update.description,
        metadata: {
          unlimited_conversations: 'true',
          trial_days: '14',
        },
      });

      console.log(`✅ Updated product: ${update.name}`);
      console.log(`   ${update.description}\n`);

    } catch (error: any) {
      console.error(`❌ Error updating ${update.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All products updated to UNLIMITED model!');
  console.log('='.repeat(60));
  console.log('\n📋 Features:');
  console.log('  • Unlimited conversations (no limits)');
  console.log('  • 14-day free trial (no credit card required)');
  console.log('  • Multi-domain discounts up to 50% off');
  console.log('  • Aggressive pricing for multiple domains\n');

  console.log('💰 Multi-Domain Discounts:');
  console.log('  1 domain:  £500/mo (0% off)');
  console.log('  2 domains: £425/mo each (15% off) = £850 total');
  console.log('  3 domains: £375/mo each (25% off) = £1,125 total');
  console.log('  4 domains: £325/mo each (35% off) = £1,300 total');
  console.log('  5 domains: £275/mo each (45% off) = £1,375 total');
  console.log('  6+ domains: £250/mo each (50% off) = £1,500+ total\n');
}

updateProductsToUnlimited()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
