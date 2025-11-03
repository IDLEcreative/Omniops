'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface FinalCTAProps {
  onGetQuoteClick?: () => void;
}

export function FinalCTA({ onGetQuoteClick }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to Replace Your CS Team with AI?
        </h2>

        <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
          Join 500+ businesses saving 70-85% on customer service costs
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
            onClick={onGetQuoteClick}
          >
            Get Your Free AI Quote in 30 Seconds
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 border-white text-white hover:bg-blue-600/20"
          >
            Start 14-Day Free Trial
          </Button>
        </div>

        <p className="text-sm text-blue-100 mb-12">
          <a href="mailto:sales@omniops.co.uk" className="hover:text-white underline">
            Talk to Sales
          </a>
        </p>

        {/* Trust line */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-blue-500">
          {[
            '✓ No credit card required',
            '✓ 2-minute setup',
            '✓ Cancel anytime'
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-center gap-2 text-blue-100">
              <CheckCircle2 className="h-5 w-5" />
              <span>{item.replace('✓ ', '')}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
