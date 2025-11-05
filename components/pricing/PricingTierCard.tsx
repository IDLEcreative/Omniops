'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  name: string;
  included: boolean;
}

interface PricingTierCardProps {
  name: string;
  price: number;
  period: string;
  description: string;
  repsReplaced: string;
  savings: string;
  savingsPercent: number;
  features: Feature[];
  overage: string;
  cta: string;
  featured?: boolean;
  conversationsPerMonth: number;
  perfectFor: string[];
  testimonial: {
    quote: string;
    author: string;
    company: string;
  };
  priceId?: string;
  pricingTierId?: string;
  onSubscribe?: () => void;
}

export function PricingTierCard({
  name,
  price,
  period,
  description,
  repsReplaced,
  savings,
  savingsPercent,
  features,
  overage,
  cta,
  featured = false,
  conversationsPerMonth,
  perfectFor,
  testimonial,
  priceId,
  pricingTierId,
  onSubscribe,
}: PricingTierCardProps) {
  return (
    <Card
      className={cn(
        'flex flex-col h-full relative transition-all duration-300',
        featured
          ? 'border-purple-300 shadow-2xl scale-105 lg:scale-110 bg-gradient-to-b from-blue-50 to-white'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
      )}
    >
      {/* Featured badge */}
      {featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            MOST POPULAR
          </div>
        </div>
      )}

      <CardHeader className={featured ? 'pt-8' : ''}>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>

        {/* Pricing */}
        <div className="mt-6">
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-5xl font-bold text-slate-900">£{price}</span>
            <span className="text-slate-600">{period}</span>
          </div>
          <p className="text-sm text-slate-600">per domain</p>
        </div>

        {/* Value proposition */}
        <div className="mt-6 space-y-2">
          <p className="text-slate-700">
            <span className="font-semibold">{repsReplaced}</span>
          </p>
          <p className="text-slate-600">
            Save <span className="font-bold text-green-600">{savings}</span> ({savingsPercent}%)
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Conversations */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-600 mb-1">Completed Conversations/Month</p>
          <p className="text-2xl font-bold text-slate-900">
            {conversationsPerMonth.toLocaleString()}
          </p>
        </div>

        {/* Perfect for */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Perfect For:</h4>
          <ul className="space-y-2">
            {perfectFor.map((item, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">What's Included:</h4>
          <ul className="space-y-2">
            {features.map((feature, idx) => (
              <li
                key={idx}
                className={cn(
                  'text-sm flex items-center gap-2',
                  feature.included ? 'text-slate-700' : 'text-slate-400'
                )}
              >
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    feature.included ? 'text-green-600' : 'text-slate-300'
                  )}
                />
                {feature.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Overage and CTA */}
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Overage:</span> {overage}
            </p>
          </div>

          {/* Testimonial */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200">
            <p className="text-sm italic text-slate-700 mb-2">"{testimonial.quote}"</p>
            <p className="text-xs font-semibold text-slate-900">— {testimonial.author}</p>
            <p className="text-xs text-slate-600">{testimonial.company}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={onSubscribe}
          disabled={!onSubscribe}
          size="lg"
          className={cn(
            'w-full gap-2',
            featured
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              : ''
          )}
          variant={featured ? 'default' : 'outline'}
        >
          {cta}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
