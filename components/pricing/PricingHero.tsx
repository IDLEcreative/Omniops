'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface PricingHeroProps {
  onGetQuoteClick?: () => void;
}

export function PricingHero({ onGetQuoteClick }: PricingHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-20 sm:pt-32 lg:pt-40">
      {/* Background gradient elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -bottom-32 -left-40 h-80 w-80 rounded-full bg-purple-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Main heading */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6">
            Replace Your Customer Service Team with AI
          </h1>

          <p className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
            Save 70-85% While Delivering Better Support
          </p>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
            Omniops replaces expensive customer service reps with AI that works 24/7, handles unlimited conversations, and never takes a break. Simple per-domain pricing with no seat limits.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={onGetQuoteClick}
          >
            Get Instant AI-Powered Quote
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
          >
            See How It Works
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-12 border-t border-slate-200">
          {[
            '✓ No credit card required',
            '✓ 14-day free trial',
            '✓ Cancel anytime',
            '✓ 86% AI accuracy verified'
          ].map((badge, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span>{badge.replace('✓ ', '')}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
