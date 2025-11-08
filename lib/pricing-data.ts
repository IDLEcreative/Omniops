/**
 * Centralized pricing tier configuration
 *
 * This file defines all pricing tiers used across the application.
 * Each tier includes:
 * - Display information (name, price, description)
 * - Feature list
 * - Stripe integration IDs
 * - Billing metrics (conversations per month, overage rates)
 *
 * Last Updated: 2025-11-03
 * Status: Active
 */

export interface PricingFeature {
  name: string;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  repsReplaced: string;
  savings: string;
  savingsPercent: number;
  conversationsPerMonth: number;
  stripePriceId: string;
  features: PricingFeature[];
  overage: string;
  cta: string;
  featured?: boolean;
  perfectFor: string[];
  testimonial: {
    quote: string;
    author: string;
    company: string;
  };
}

/**
 * All pricing tiers available in the application
 *
 * NOTE: stripePriceId values must be replaced with actual Stripe price IDs
 * from your Stripe Dashboard (https://dashboard.stripe.com/prices)
 *
 * Format: price_[tier_identifier]
 * Example: price_1234567890abcdef
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'small-business',
    name: 'Small Business',
    price: 500,
    period: '/month',
    description: 'Great for startups and growing businesses',
    repsReplaced: 'Replaces 1 CS representative',
    savings: '£1,177/month',
    savingsPercent: 70,
    conversationsPerMonth: 2500,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SMALL_BUSINESS_PRICE_ID || 'price_1SPTlBCcOAlIBdYPd0zaVVan',
    features: [
      { name: '2,500 completed conversations/month', included: true },
      { name: 'Unlimited team seats', included: true },
      { name: 'Unlimited website scraping', included: true },
      { name: 'WooCommerce integration', included: true },
      { name: 'Shopify integration', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Mobile responsive widget', included: true },
      { name: 'Custom branding', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false },
    ],
    overage: '£0.12 per additional conversation',
    cta: 'Start Free Trial',
    featured: false,
    perfectFor: [
      'Growing online shops',
      'Local businesses',
      'Service businesses',
      '5-15 employees',
      '20k-100k monthly visitors',
    ],
    testimonial: {
      quote: 'Cut our support costs by 65% in the first month',
      author: 'Sarah Thompson',
      company: 'E-Commerce Business',
    },
  },
  {
    id: 'sme',
    name: 'SME',
    price: 1000,
    period: '/month',
    description: 'Perfect for established businesses',
    repsReplaced: 'Replaces 2 full-time CS reps',
    savings: '£5,708/month',
    savingsPercent: 85,
    conversationsPerMonth: 5000,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SME_PRICE_ID || 'price_1SPTlCCcOAlIBdYP9WYXc1kz',
    features: [
      { name: '5,000 completed conversations/month', included: true },
      { name: 'Unlimited team seats', included: true },
      { name: 'Unlimited website scraping', included: true },
      { name: 'WooCommerce integration', included: true },
      { name: 'Shopify integration', included: true },
      { name: 'Priority support (< 2 hour response)', included: true },
      { name: 'Advanced analytics dashboard', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Conversation history export', included: true },
      { name: 'Dedicated account manager', included: false },
    ],
    overage: '£0.10 per additional conversation',
    cta: 'Start Free Trial',
    featured: true,
    perfectFor: [
      'Established e-commerce',
      'B2B businesses',
      'Multi-location companies',
      '15-50 employees',
      '100k-500k monthly visitors',
    ],
    testimonial: {
      quote:
        'Handles 3,000+ conversations monthly. Our CS team now focuses on complex issues only.',
      author: 'Mike Johnson',
      company: 'Industrial Supplier',
    },
  },
  {
    id: 'mid-market',
    name: 'Mid-Market',
    price: 5000,
    period: '/month',
    description: 'For growing enterprises',
    repsReplaced: 'Replaces 5-10 CS reps',
    savings: '£11,770/month',
    savingsPercent: 70,
    conversationsPerMonth: 25000,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MID_MARKET_PRICE_ID || 'price_1SPTlDCcOAlIBdYPfg0vCgJY',
    features: [
      { name: '25,000 completed conversations/month', included: true },
      { name: 'Unlimited team seats', included: true },
      { name: 'Unlimited website scraping', included: true },
      { name: 'WooCommerce integration', included: true },
      { name: 'Shopify integration', included: true },
      { name: 'Custom branding', included: true },
      { name: 'API access', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'SLA guarantees (99.9% uptime)', included: true },
      { name: 'Onboarding assistance', included: true },
    ],
    overage: '£0.08 per additional conversation',
    cta: 'Talk to Sales',
    featured: false,
    perfectFor: [
      'Large e-commerce operations',
      'Multi-brand retailers',
      'B2B suppliers',
      '50-250 employees',
      '500k-2M monthly visitors',
    ],
    testimonial: {
      quote:
        'Reduced CS costs by £140k annually while improving response times by 80%',
      author: 'David Jenkins',
      company: 'Regional Retailer',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 10000,
    period: '/month',
    description: 'For enterprise-scale operations',
    repsReplaced: 'Replaces 15-30 CS reps',
    savings: '£23,540/month',
    savingsPercent: 70,
    conversationsPerMonth: 100000,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_1SPTlDCcOAlIBdYPY4m98bkT',
    features: [
      { name: '100,000 completed conversations/month', included: true },
      { name: 'Unlimited team seats', included: true },
      { name: 'Unlimited website scraping', included: true },
      { name: 'White-label capability', included: true },
      { name: 'On-premise deployment option', included: true },
      { name: 'Custom AI model training', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'Custom contract terms', included: true },
      { name: 'Volume discounts available', included: true },
      { name: 'SLA guarantees (99.99% uptime)', included: true },
      { name: 'Quarterly strategy reviews', included: true },
    ],
    overage: '£0.05 per additional conversation',
    cta: 'Contact Sales Team',
    featured: false,
    perfectFor: [
      'Enterprise e-commerce',
      'Multi-national brands',
      'Franchise systems',
      '250+ employees',
      '2M+ monthly visitors',
    ],
    testimonial: {
      quote:
        'Handles 75k+ conversations monthly across 5 brands. ROI in 3 months.',
      author: 'Enterprise Customer',
      company: 'Multi-Brand Organization',
    },
  },
];

/**
 * Get a pricing tier by ID
 * @param tierId - The tier ID to look up
 * @returns The pricing tier or undefined if not found
 */
export function getPricingTierById(tierId: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === tierId);
}

/**
 * Get a pricing tier by Stripe price ID
 * @param stripePriceId - The Stripe price ID to look up
 * @returns The pricing tier or undefined if not found
 */
export function getPricingTierByStripeId(stripePriceId: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.stripePriceId === stripePriceId);
}

/**
 * Get all featured tiers (those marked as featured)
 * @returns Array of featured pricing tiers
 */
export function getFeaturedTiers(): PricingTier[] {
  return PRICING_TIERS.filter(tier => tier.featured);
}

/**
 * Get all non-featured tiers
 * @returns Array of non-featured pricing tiers
 */
export function getNonFeaturedTiers(): PricingTier[] {
  return PRICING_TIERS.filter(tier => !tier.featured);
}
