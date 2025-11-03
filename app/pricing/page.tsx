'use client';

import { useRef } from 'react';
import {
  PricingHero,
  AIQuoteWidget,
  PricingTiers,
  FeatureComparisonTable,
  MultiDomainCalculator,
  ROICalculator,
  SocialProof,
  PricingFAQ,
  FinalCTA,
} from '@/components/pricing';

export default function PricingPage() {
  const quoteWidgetRef = useRef<HTMLDivElement>(null);

  const handleGetQuoteClick = () => {
    quoteWidgetRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <PricingHero onGetQuoteClick={handleGetQuoteClick} />

      {/* AI Quote Widget */}
      <div ref={quoteWidgetRef}>
        <AIQuoteWidget />
      </div>

      {/* Pricing Tiers */}
      <PricingTiers />

      {/* Feature Comparison Table */}
      <FeatureComparisonTable />

      {/* Multi-Domain Calculator */}
      <MultiDomainCalculator />

      {/* ROI Calculator */}
      <ROICalculator />

      {/* Social Proof */}
      <SocialProof />

      {/* FAQ */}
      <PricingFAQ />

      {/* Final CTA */}
      <FinalCTA onGetQuoteClick={handleGetQuoteClick} />
    </main>
  );
}
