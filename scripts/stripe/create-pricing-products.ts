#!/usr/bin/env npx tsx

/**
 * Create Stripe Products for Per-Domain Pricing Model
 *
 * Creates 4 products (Small Business, SME, Mid-Market, Enterprise)
 * with monthly prices (£500, £1k, £5k, £10k) in GBP.
 *
 * Usage:
 *   npx tsx scripts/stripe/create-pricing-products.ts
 *
 * Prerequisites:
 *   - STRIPE_SECRET_KEY environment variable set
 *
 * Output:
 *   - Stripe product and price IDs logged to console
 *   - Updates to Supabase pricing_tiers table
 */

import Stripe from 'stripe';
import { createServiceRoleClient } from '@/lib/supabase-server';

interface PricingTierInput {
  tier_name: string;
  display_name: string;
  monthly_price: number;
  included_completions: number;
  overage_rate: number;
  features: Record<string, boolean>;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

const PRICING_TIERS: PricingTierInput[] = [
  {
    tier_name: 'small_business',
    display_name: 'Small Business',
    monthly_price: 500,
    included_completions: 2500,
    overage_rate: 0.12,
    features: {
      unlimited_seats: true,
      unlimited_scraping: true,
      woocommerce: true,
      shopify: true,
      email_support: true,
    },
  },
  {
    tier_name: 'sme',
    display_name: 'SME',
    monthly_price: 1000,
    included_completions: 5000,
    overage_rate: 0.10,
    features: {
      unlimited_seats: true,
      unlimited_scraping: true,
      woocommerce: true,
      shopify: true,
      priority_support: true,
      advanced_analytics: true,
    },
  },
  {
    tier_name: 'mid_market',
    display_name: 'Mid-Market',
    monthly_price: 5000,
    included_completions: 25000,
    overage_rate: 0.08,
    features: {
      unlimited_seats: true,
      unlimited_scraping: true,
      woocommerce: true,
      shopify: true,
      account_manager: true,
      sla_guarantees: true,
      custom_integrations: true,
    },
  },
  {
    tier_name: 'enterprise',
    display_name: 'Enterprise',
    monthly_price: 10000,
    included_completions: 100000,
    overage_rate: 0.05,
    features: {
      unlimited_seats: true,
      unlimited_scraping: true,
      woocommerce: true,
      shopify: true,
      white_label: true,
      on_premise: true,
      dedicated_support: true,
      custom_ai: true,
    },
  },
];

async function createStripePricingProducts(): Promise<void> {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  const stripe = new Stripe(apiKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    throw new Error('Failed to initialize Supabase client');
  }

  console.log('Creating Stripe products for per-domain pricing...\n');

  for (const tier of PRICING_TIERS) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: tier.display_name,
        description: `${tier.display_name} tier - ${tier.included_completions.toLocaleString()} conversations/month`,
        metadata: {
          tier_name: tier.tier_name,
          monthly_price_gbp: tier.monthly_price.toString(),
          included_completions: tier.included_completions.toString(),
          overage_rate: tier.overage_rate.toString(),
        },
        type: 'service',
      });

      // Create price (recurring monthly in GBP)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.monthly_price * 100, // Convert to pence
        currency: 'gbp',
        recurring: {
          interval: 'month',
          interval_count: 1,
          usage_type: 'licensed',
        },
        metadata: {
          tier_name: tier.tier_name,
          included_completions: tier.included_completions.toString(),
        },
      });

      // Update Supabase pricing_tiers table
      const { error: updateError } = await supabase
        .from('pricing_tiers')
        .update({
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          updated_at: new Date().toISOString(),
        })
        .eq('tier_name', tier.tier_name);

      if (updateError) {
        console.error(
          `✗ Failed to update tier ${tier.tier_name} in Supabase:`,
          updateError.message
        );
        continue;
      }

      console.log(`✓ ${tier.display_name} (£${tier.monthly_price}/month)`);
      console.log(`  Product ID: ${product.id}`);
      console.log(`  Price ID: ${price.id}`);
      console.log(`  Included: ${tier.included_completions.toLocaleString()} conversations`);
      console.log(`  Overage: £${tier.overage_rate} per additional conversation\n`);
    } catch (error) {
      const stripeError = error as Stripe.StripeInvalidRequestError;
      console.error(
        `✗ Failed to create product for ${tier.display_name}:`,
        stripeError.message
      );
    }
  }

  console.log('✓ All products created successfully!');
  console.log(
    '\nNext steps:'
  );
  console.log(
    '1. Create domain subscription: npx tsx scripts/stripe/create-domain-subscription.ts'
  );
  console.log('2. Deploy webhook handler for subscription updates');
  console.log('3. Test in Stripe dashboard: https://dashboard.stripe.com');
}

// Main execution
createStripePricingProducts().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
