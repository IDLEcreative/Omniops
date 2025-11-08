'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  PricingHero,
  PricingTiers,
  FeatureComparisonTable,
  MultiDomainCalculator,
  ROICalculator,
  SocialProof,
  PricingFAQ,
  FinalCTA,
} from '@/components/pricing';

// Dynamically import AIQuoteWidget to avoid SSR issues
const AIQuoteWidget = dynamic(
  // eslint-disable-next-line no-restricted-syntax -- React component path, not product reference
  () => import('@/components/pricing/AIQuoteWidget').then(mod => ({ default: mod.AIQuoteWidget })),
  { ssr: false, loading: () => <div className="min-h-[400px] flex items-center justify-center">Loading...</div> }
);

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
