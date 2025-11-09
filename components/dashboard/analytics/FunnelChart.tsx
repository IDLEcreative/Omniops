"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { FunnelMetrics } from '@/types/purchase-attribution';

interface FunnelChartProps {
  metrics: FunnelMetrics;
  isLoading?: boolean;
}

export function FunnelChart({ metrics, isLoading }: FunnelChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Customer journey from chat to purchase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const funnelData = [
    {
      stage: 'Chat Started',
      count: metrics.overview.totalChats,
      percentage: 100,
      color: 'hsl(var(--primary))',
    },
    {
      stage: 'Added to Cart',
      count: metrics.overview.totalCarts,
      percentage: metrics.conversionRates.chatToCart,
      color: 'hsl(var(--chart-2))',
    },
    {
      stage: 'Purchased',
      count: metrics.overview.totalPurchases,
      percentage: metrics.conversionRates.overallConversion,
      color: 'hsl(var(--chart-3))',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.stage}</p>
          <p className="text-sm text-muted-foreground">
            {data.count.toLocaleString()} users ({data.percentage.toFixed(1)}%)
          </p>
          {data.stage !== 'Chat Started' && (
            <p className="text-xs text-muted-foreground mt-1">
              {(100 - data.percentage).toFixed(1)}% drop-off
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Customer journey from chat initiation to purchase completion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Conversion Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Chat → Cart</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {metrics.conversionRates.chatToCart.toFixed(1)}%
                </p>
                {metrics.conversionRates.chatToCart >= 30 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cart → Purchase</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {metrics.conversionRates.cartToPurchase.toFixed(1)}%
                </p>
                {metrics.conversionRates.cartToPurchase >= 50 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Overall</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {metrics.conversionRates.overallConversion.toFixed(1)}%
                </p>
                {metrics.conversionRates.overallConversion >= 15 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Funnel Visualization */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="stage"
                className="text-xs"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Drop-off Analysis */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium">Chat Only (No Cart)</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics.dropOffAnalysis.chatOnlyRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.overview.totalChats - metrics.overview.totalCarts} users
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Cart Abandonment</p>
              <p className="text-2xl font-bold text-orange-600">
                {metrics.dropOffAnalysis.cartAbandonmentRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.overview.totalCarts - metrics.overview.totalPurchases} carts
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
