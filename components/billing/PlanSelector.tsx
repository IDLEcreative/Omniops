'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  name: string;
  price: string;
  description: string;
  priceId: string;
  features: string[];
  popular: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '£29',
    description: 'Perfect for small businesses',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    features: [
      '500 conversations/month',
      'Basic AI chat widget',
      'Single website',
      'Email support',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: '£499',
    description: 'For growing companies',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || '',
    features: [
      '10,000 conversations/month',
      'Advanced AI (86% accuracy)',
      'Full WooCommerce & Shopify',
      'Advanced analytics dashboard',
      'Priority support',
      'Unlimited websites',
    ],
    popular: true,
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
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">
          Choose the plan that fits your needs
        </h2>
        <p className="text-xl text-muted-foreground mb-4">
          Simple, transparent pricing
        </p>
        <Badge variant="secondary" className="text-base px-4 py-2">
          <Sparkles className="mr-1 h-4 w-4" />
          Flexible monthly billing • Cancel anytime
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative hover:shadow-lg transition-shadow",
              plan.popular && "border-primary shadow-lg"
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectPlan(plan.priceId)}
                disabled={!canManage || loading === plan.priceId}
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.priceId ? 'Processing...' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50 max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold text-xl mb-2">Enterprise</h3>
            <p className="text-muted-foreground mb-4">
              Custom pricing tailored for large organizations
            </p>
            <Button variant="outline">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>

      {!canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-4xl mx-auto">
          <p className="text-sm text-yellow-800 text-center">
            Only organization owners and admins can manage subscriptions.
          </p>
        </div>
      )}
    </div>
  );
}
