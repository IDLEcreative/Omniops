'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useOrganization } from '@/lib/contexts/organization-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Sparkles, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { getPriceIdForTier } from '@/lib/pricing-helpers';

interface Quote {
  tier: string;
  price: number;
  conversationsPerMonth: number;
  features: string[];
  tierData: {
    id: string;
    name: string;
    stripePriceId: string;
  };
}

export function AIQuoteWidget() {
  const [mounted, setMounted] = useState(false);
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  // Only render on client to avoid SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-[400px]" />; // Placeholder during SSR
  }

  const handleGetQuote = async () => {
    if (!domain) return;

    setIsLoading(true);
    setError(null);
    setQuote(null);

    try {
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate a quote based on the domain
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock quote generation logic
      const mockQuote: Quote = {
        tier: 'sme',
        price: 1000,
        conversationsPerMonth: 5000,
        features: [
          '5,000 completed conversations/month',
          'Unlimited team seats',
          'Unlimited website scraping',
          'WooCommerce & Shopify integration',
          'Priority support',
          'Custom branding',
          'API access',
        ],
        tierData: {
          id: 'sme',
          name: 'SME',
          stripePriceId: 'price_sme',
        },
      };

      setQuote(mockQuote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote || !user) {
      setError('Please log in to accept a quote');
      return;
    }

    if (!currentOrganization) {
      setError('Please select an organization first');
      return;
    }

    try {
      setIsLoading(true);

      // Get the price ID for the recommended tier
      const priceId = getPriceIdForTier(quote.tier);

      if (!priceId || priceId.startsWith('price_')) {
        setError('Stripe pricing is not properly configured. Please contact support.');
        return;
      }

      // Note: The current checkout endpoint requires domainId and pricingTierId.
      // For quote acceptance flow, these should be obtained from organization context.
      // This is a simplified version - in production, you'd fetch the domain/tier IDs first.
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          organizationId: currentOrganization.id,
          // In production, fetch actual domain and pricing tier IDs
          // For now, we redirect to pricing page with tier selection
          domainId: currentOrganization.id, // Placeholder - should be replaced with actual domain
          pricingTierId: quote.tierData.id, // Placeholder - should be replaced with actual tier ID
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // If checkout fails, user can proceed to select domain first
        if (data.error?.includes('Domain')) {
          window.location.href = '/dashboard/domains?selectForPricing=true';
          return;
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process quote acceptance');
    } finally {
      setIsLoading(false);
    }
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
          {!quote ? (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input
                  type="text"
                  placeholder="yourwebsite.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
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

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

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
            </>
          ) : (
            /* Quote result section */
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-blue-200 p-8">
              <div className="flex gap-3 mb-6">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-1">
                    Quote Generated: {quote.tierData.name} Tier
                  </h3>
                  <p className="text-slate-600">
                    Perfect for your business size and requirements
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Monthly Price</p>
                  <p className="text-2xl font-bold text-slate-900">£{quote.price}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-1">Monthly Conversations</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {quote.conversationsPerMonth.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-semibold text-slate-900 mb-3">Included Features:</h4>
                <ul className="space-y-2">
                  {quote.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2 text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={handleAcceptQuote}
                  disabled={isLoading || !user || !currentOrganization}
                >
                  {isLoading ? 'Processing...' : 'Accept Quote & Start Subscription'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setQuote(null);
                    setDomain('');
                  }}
                  disabled={isLoading}
                >
                  Get Another Quote
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={() => (window.location.href = '/contact')}
                  disabled={isLoading}
                >
                  Talk to Sales Instead
                </Button>
              </div>

              {!user && (
                <p className="text-sm text-slate-600 text-center mt-4">
                  Please log in to accept this quote
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
