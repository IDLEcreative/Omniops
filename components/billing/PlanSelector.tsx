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
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold animate-in slide-in-from-top duration-500">
          Choose the plan that fits your needs
        </h2>
        <Badge variant="secondary" className="text-sm px-3 py-1 animate-in slide-in-from-top duration-500 delay-100">
          <Sparkles className="mr-1 h-3 w-3" />
          Flexible monthly billing • Cancel anytime
        </Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {PLANS.map((plan, index) => (
          <Card
            key={plan.name}
            className={cn(
              "relative hover:scale-105 hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom",
              plan.popular && "border-primary shadow-lg scale-[1.02]",
              index === 0 && "delay-200",
              index === 1 && "delay-300"
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse">
                Most Popular
              </Badge>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-xs">{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 animate-in fade-in duration-500" style={{ animationDelay: `${(index * 100) + (i * 50)}ms` }}>
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-xs">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelectPlan(plan.priceId)}
                disabled={!canManage || loading === plan.priceId}
                className="w-full transition-all duration-300 hover:scale-105"
                variant={plan.popular ? "default" : "outline"}
              >
                {loading === plan.priceId ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Processing...
                  </span>
                ) : (
                  'Get Started'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-xs text-muted-foreground animate-in fade-in duration-500 delay-500">
        Need enterprise features?{' '}
        <button className="underline hover:text-primary transition-colors">
          Contact sales
        </button>
      </div>

      {!canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-3xl mx-auto animate-in slide-in-from-bottom duration-500">
          <p className="text-xs text-yellow-800 text-center">
            Only organization owners and admins can manage subscriptions.
          </p>
        </div>
      )}
    </div>
  );
}
