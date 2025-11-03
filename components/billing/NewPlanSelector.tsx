'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  displayName: string;
  monthlyPrice: number;
  description: string;
  features: string[];
  isPopular: boolean;
  stripeProductId: string;
  stripePriceId: string;
}

export default function NewPlanSelector() {
  const [isLoading, setIsLoading] = useState(false);

  const tiers: PricingTier[] = [
    {
      id: 'small_business',
      name: 'small_business',
      displayName: 'Small Business',
      monthlyPrice: 500,
      description: 'Perfect for growing online shops',
      features: [
        'Unlimited conversations',
        'Unlimited team seats',
        'Unlimited website scraping',
        'WooCommerce & Shopify integration',
        '86% AI accuracy',
        'Email support',
      ],
      isPopular: false,
      stripeProductId: process.env.NEXT_PUBLIC_STRIPE_SMALL_BUSINESS_PRODUCT_ID!,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SMALL_BUSINESS_PRICE_ID!,
    },
    {
      id: 'sme',
      name: 'sme',
      displayName: 'SME',
      monthlyPrice: 1000,
      description: 'Established e-commerce & B2B',
      features: [
        'Everything in Small Business',
        'Unlimited conversations',
        'Priority support',
        'Advanced analytics',
        'Custom AI training',
        'Multi-language support',
      ],
      isPopular: true,
      stripeProductId: process.env.NEXT_PUBLIC_STRIPE_SME_PRODUCT_ID!,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_SME_PRICE_ID!,
    },
    {
      id: 'mid_market',
      name: 'mid_market',
      displayName: 'Mid-Market',
      monthlyPrice: 5000,
      description: 'Large e-commerce operations',
      features: [
        'Everything in SME',
        'Unlimited conversations',
        'Dedicated account manager',
        'Custom integrations',
        'API access',
        'SLA guarantee',
        'Quarterly business reviews',
      ],
      isPopular: false,
      stripeProductId: process.env.NEXT_PUBLIC_STRIPE_MID_MARKET_PRODUCT_ID!,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_MID_MARKET_PRICE_ID!,
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      displayName: 'Enterprise',
      monthlyPrice: 10000,
      description: 'Enterprise-level support',
      features: [
        'Everything in Mid-Market',
        'Unlimited everything',
        'White-label options',
        'Custom SLA',
        'Dedicated infrastructure',
        '24/7 phone support',
        'Custom contract terms',
      ],
      isPopular: false,
      stripeProductId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRODUCT_ID!,
      stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID!,
    },
  ];

  const handleSelectPlan = async (tier: PricingTier) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: tier.stripePriceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          Replace Your Customer Service Team with AI
        </h1>
        <p className="text-xl text-gray-600">
          Save 70-85% While Delivering Better Support
        </p>
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full font-medium">
          <Sparkles className="w-4 h-4" />
          14-Day Free Trial • No Credit Card Required
        </div>
      </div>

      {/* Multi-Domain Discount Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-2">Multi-Domain Discounts</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div>
            <div className="font-bold text-gray-900">2 domains</div>
            <div className="text-purple-600">15% off each</div>
          </div>
          <div>
            <div className="font-bold text-gray-900">3 domains</div>
            <div className="text-purple-600">25% off each</div>
          </div>
          <div>
            <div className="font-bold text-gray-900">4 domains</div>
            <div className="text-purple-600">35% off each</div>
          </div>
          <div>
            <div className="font-bold text-gray-900">5 domains</div>
            <div className="text-purple-600">45% off each</div>
          </div>
          <div className="col-span-2">
            <div className="font-bold text-gray-900">6+ domains</div>
            <div className="text-purple-600 font-bold">50% off each! 🎉</div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-2xl border-2 p-8 ${
              tier.isPopular
                ? 'border-blue-500 shadow-xl scale-105'
                : 'border-gray-200 hover:border-gray-300'
            } transition-all`}
          >
            {tier.isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
            )}

            {/* Tier Name */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold">{tier.displayName}</h3>
              <p className="text-gray-600 text-sm mt-1">{tier.description}</p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">£{tier.monthlyPrice.toLocaleString()}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">per domain</div>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <button
              onClick={() => handleSelectPlan(tier)}
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                tier.isPopular
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } disabled:opacity-50`}
            >
              {isLoading ? 'Loading...' : 'Start Free Trial'}
            </button>
          </div>
        ))}
      </div>

      {/* AI Quote CTA */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-center text-white">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI-Powered Recommendation
          </div>
          <h2 className="text-3xl font-bold">Not sure which plan is right for you?</h2>
          <p className="text-lg text-indigo-100">
            Get a personalized quote in 30 seconds. Our AI analyzes your website and recommends the perfect tier.
          </p>
          <button
            onClick={() => window.location.href = '/pricing/quote'}
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Get Your AI Quote Now
          </button>
          <p className="text-sm text-indigo-200">
            Free • No signup required • Instant results
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t pt-12 mt-12">
        <h3 className="text-2xl font-bold text-center mb-8">All Plans Include</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="text-4xl mb-3">∞</div>
            <h4 className="font-semibold mb-2">Unlimited Conversations</h4>
            <p className="text-gray-600 text-sm">No limits. Ever. Handle as many chats as you need.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">👥</div>
            <h4 className="font-semibold mb-2">Unlimited Team Seats</h4>
            <p className="text-gray-600 text-sm">Add your entire team. No per-seat fees.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-3">🎯</div>
            <h4 className="font-semibold mb-2">86% AI Accuracy</h4>
            <p className="text-gray-600 text-sm">Verified performance. Real results.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
