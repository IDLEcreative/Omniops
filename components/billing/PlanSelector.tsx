'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Plan {
  name: string;
  price: string;
  priceId: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '£29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    features: [
      '1,000 messages/month',
      'Web scraping',
      'Basic integrations',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: '£99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || '',
    features: [
      '10,000 messages/month',
      'Priority support',
      'Advanced analytics',
      'WooCommerce & Shopify',
      'Custom branding',
    ],
  },
];

interface PlanSelectorProps {
  organizationId: string;
  canManage: boolean;
}

export function PlanSelector({ organizationId, canManage }: PlanSelectorProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (priceId: string) => {
    setLoading(priceId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, organizationId }),
      });
      const { sessionUrl } = await response.json();
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-gray-600 mt-2">Select a plan to get started</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {PLANS.map((plan) => (
          <Card key={plan.name} className="hover:shadow-lg transition">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan.priceId)}
                disabled={!canManage || loading === plan.priceId}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading === plan.priceId ? 'Processing...' : 'Select Plan'}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gray-50">
        <CardContent>
          <h3 className="font-semibold text-lg">Enterprise</h3>
          <p className="text-gray-600 mt-2">Custom pricing for large organizations</p>
          <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white">
            Contact Sales
          </button>
        </CardContent>
      </Card>

      {!canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-sm text-yellow-800">
            Only organization owners and admins can manage subscriptions.
          </p>
        </div>
      )}
    </div>
  );
}
