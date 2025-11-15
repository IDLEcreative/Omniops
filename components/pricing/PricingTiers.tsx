'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase-client';
import { PricingTierCard } from './PricingTierCard';

const PRICING_TIERS = [
  {
    id: 'small-business',
    name: 'Small Business',
    price: 500,
    period: '/month',
    description: 'Great for startups and growing businesses',
    repsReplaced: 'Replaces 1 half-time CS rep',
    savings: '£1,177/month',
    savingsPercent: 70,
    conversationsPerMonth: 2500,
    stripePriceId: 'price_small_business', // Replace with actual Stripe price ID
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
      author: 'Sarah Mitchell',
      company: 'Growing Online Business',
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
    stripePriceId: 'price_sme', // Replace with actual Stripe price ID
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
      company: 'Established B2B Company',
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
    stripePriceId: 'price_mid_market', // Replace with actual Stripe price ID
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
    stripePriceId: 'price_enterprise', // Replace with actual Stripe price ID
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

export function PricingTiers() {
  const { user, loading: authLoading } = useAuth();
  const [loadingTierId, setLoadingTierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string, tierId: string) => {
    try {
      setError(null);
      setLoadingTierId(tierId);

      // If user is not logged in, redirect to login
      if (!user) {
        // Store the pricing tier in sessionStorage for later redirect
        sessionStorage.setItem('intendedPricingTier', tierId);
        window.location.href = '/auth/login';
        return;
      }

      // Get user's organization
      const supabase = await createClient();
      if (!supabase) {
        throw new Error('Database service unavailable');
      }

      // Get the current user's organization
      const { data: org } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!org) {
        throw new Error('No organization found. Please create an organization first.');
      }

      // Call checkout API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          organizationId: org.organization_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Checkout failed');
      }

      const { sessionUrl } = await response.json();
      if (sessionUrl) {
        window.location.href = sessionUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate checkout');
    } finally {
      setLoadingTierId(null);
    }
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            Simple Per-Domain Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Everything Unlimited. Pay for Outcomes, Not Seats. Each domain gets unlimited usage,
            unlimited seats, and unlimited features. You only pay more when you're succeeding
            (with overage conversations).
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Pricing cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
          {PRICING_TIERS.map((tier) => (
            <PricingTierCard
              key={tier.id}
              {...tier}
              priceId={tier.stripePriceId}
              pricingTierId={tier.id}
              onSubscribe={() => handleSubscribe(tier.stripePriceId, tier.id)}
            />
          ))}
        </div>

        {/* Annual discount callout */}
        <div className="mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                💰 Save 15% with Annual Billing
              </h3>
              <p className="text-slate-600">
                Pay yearly and get one month free. All plans available on annual terms.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-right">
              <p className="text-sm text-slate-600 mb-2">Example Annual Pricing:</p>
              <p className="font-semibold text-slate-900">
                SME: £10,200/year (£850/month)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
