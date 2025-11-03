'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

export function AIQuoteWidget() {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetQuote = async () => {
    if (!domain) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // In a real implementation, this would open a modal or navigate to quote results
      alert(`Getting quote for ${domain}...`);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGetQuote();
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Get Your Personalized Quote in 30 Seconds
            </h2>
          </div>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our AI analyzes your website traffic, company size, and support needs to recommend the perfect plan. No forms, no calls, no waiting.
          </p>
        </div>

        {/* Input section */}
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Input
              type="text"
              placeholder="yourwebsite.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-12 text-base"
            />
            <Button
              size="lg"
              onClick={handleGetQuote}
              disabled={!domain || isLoading}
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 whitespace-nowrap"
            >
              {isLoading ? 'Getting Quote...' : 'Get Quote'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          <p className="text-center text-sm text-slate-600 mb-8">
            Instant quote • No signup required • 100% free
          </p>

          {/* Social proof */}
          <div className="bg-slate-50 rounded-lg p-6 text-center border border-slate-200">
            <p className="text-slate-700 font-medium mb-2">
              Used by 500+ businesses to replace CS teams
            </p>
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-slate-600 font-medium">4.9/5 from 127 reviews</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
