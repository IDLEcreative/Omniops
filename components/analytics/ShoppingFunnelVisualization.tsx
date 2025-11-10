'use client';

import { Card } from '@/components/ui/card';
import { ShoppingCart, Eye, CreditCard, CheckCircle } from 'lucide-react';

interface ShoppingBehavior {
  productViews: number;
  uniqueProducts: number;
  cartViews: number;
  checkoutViews: number;
  conversionRate: number;
  avgProductsPerSession: number;
}

interface PageViews {
  total: number;
  uniquePages: number;
  avgPerSession: number;
  topPages: Array<{ url: string; views: number; }>;
}

interface ShoppingFunnelProps {
  shoppingBehavior: ShoppingBehavior;
  pageViews: PageViews;
}

export function ShoppingFunnelVisualization({ shoppingBehavior, pageViews }: ShoppingFunnelProps) {
  const funnel = [
    {
      stage: 'Browse',
      icon: Eye,
      value: pageViews.total,
      percentage: 100,
      color: 'bg-blue-500',
      description: 'Total page views',
    },
    {
      stage: 'Product View',
      icon: ShoppingCart,
      value: shoppingBehavior.productViews,
      percentage: pageViews.total > 0
        ? Math.round((shoppingBehavior.productViews / pageViews.total) * 100)
        : 0,
      color: 'bg-indigo-500',
      description: `${shoppingBehavior.uniqueProducts} unique products`,
    },
    {
      stage: 'Cart',
      icon: ShoppingCart,
      value: shoppingBehavior.cartViews,
      percentage: shoppingBehavior.productViews > 0
        ? Math.round((shoppingBehavior.cartViews / shoppingBehavior.productViews) * 100)
        : 0,
      color: 'bg-purple-500',
      description: 'Added to cart',
    },
    {
      stage: 'Checkout',
      icon: CreditCard,
      value: shoppingBehavior.checkoutViews,
      percentage: shoppingBehavior.cartViews > 0
        ? Math.round((shoppingBehavior.checkoutViews / shoppingBehavior.cartViews) * 100)
        : 0,
      color: 'bg-green-500',
      description: 'Reached checkout',
    },
  ];

  const dropoffRates = funnel.map((stage, index) => {
    if (index === 0) return 0;
    const previous = funnel[index - 1];
    if (!previous || previous.value === 0) return 0;
    return Math.round(((previous.value - stage.value) / previous.value) * 100);
  });

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Shopping Funnel</h3>
        <p className="text-sm text-muted-foreground">
          Track user journey from browsing to checkout
        </p>
      </div>

      <div className="space-y-4">
        {funnel.map((stage, index) => {
          const Icon = stage.icon;
          const width = `${stage.percentage}%`;
          const dropoff = dropoffRates[index];

          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stage.stage}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{stage.value.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    {stage.percentage}% of total
                  </div>
                </div>
              </div>

              <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`h-full ${stage.color} flex items-center px-3 transition-all duration-500`}
                  style={{ width }}
                >
                  <span className="text-xs text-white font-medium">
                    {stage.description}
                  </span>
                </div>
              </div>

              {index < funnel.length - 1 && dropoff !== undefined && dropoff > 0 && (
                <div className="mt-1 text-xs text-red-500 text-right">
                  {dropoff}% drop-off to next stage
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Overall Conversion</div>
            <div className="text-2xl font-bold text-green-600">
              {shoppingBehavior.conversionRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              Product view to checkout
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Avg Products/Session</div>
            <div className="text-2xl font-bold">
              {shoppingBehavior.avgProductsPerSession.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              Per user session
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
