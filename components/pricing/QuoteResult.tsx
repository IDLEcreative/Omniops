'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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

interface QuoteResultProps {
  quote: Quote;
  error: string | null;
  isLoading: boolean;
  hasUser: boolean;
  hasOrganization: boolean;
  onAccept: () => void;
  onReset: () => void;
  onContactSales: () => void;
}

export function QuoteResult({
  quote,
  error,
  isLoading,
  hasUser,
  hasOrganization,
  onAccept,
  onReset,
  onContactSales
}: QuoteResultProps) {
  return (
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
          onClick={onAccept}
          disabled={isLoading || !hasUser || !hasOrganization}
        >
          {isLoading ? 'Processing...' : 'Accept Quote & Start Subscription'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onReset}
          disabled={isLoading}
        >
          Get Another Quote
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={onContactSales}
          disabled={isLoading}
        >
          Talk to Sales Instead
        </Button>
      </div>

      {!hasUser && (
        <p className="text-sm text-slate-600 text-center mt-4">
          Please log in to accept this quote
        </p>
      )}
    </div>
  );
}
