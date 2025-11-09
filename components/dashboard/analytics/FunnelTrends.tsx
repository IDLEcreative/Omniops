"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { FunnelTrend } from '@/types/purchase-attribution';

interface FunnelTrendsProps {
  trends: FunnelTrend[];
  isLoading?: boolean;
}

export function FunnelTrends({ trends, isLoading }: FunnelTrendsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Trends</CardTitle>
          <CardDescription>Historical funnel performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-md bg-muted animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = trends.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    chats: day.totalChats,
    carts: day.totalCarts,
    purchases: day.totalPurchases,
    chatToCartRate: day.chatToCartRate,
    cartToPurchaseRate: day.cartToPurchaseRate,
    overallConversion: day.overallConversionRate,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.date}</p>
          <div className="space-y-1 text-sm">
            <p className="text-primary">Chats: {data.chats}</p>
            <p className="text-chart-2">Carts: {data.carts}</p>
            <p className="text-chart-3">Purchases: {data.purchases}</p>
            <div className="border-t pt-2 mt-2 space-y-1 text-xs text-muted-foreground">
              <p>Chat → Cart: {data.chatToCartRate.toFixed(1)}%</p>
              <p>Cart → Purchase: {data.cartToPurchaseRate.toFixed(1)}%</p>
              <p>Overall: {data.overallConversion.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate averages for summary
  const avgChats = trends.reduce((sum, d) => sum + d.totalChats, 0) / trends.length;
  const avgCarts = trends.reduce((sum, d) => sum + d.totalCarts, 0) / trends.length;
  const avgPurchases = trends.reduce((sum, d) => sum + d.totalPurchases, 0) / trends.length;
  const avgConversion = trends.reduce((sum, d) => sum + d.overallConversionRate, 0) / trends.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Trends</CardTitle>
        <CardDescription>
          Daily funnel performance over the last {trends.length} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Chats/Day</p>
              <p className="text-2xl font-bold">{avgChats.toFixed(0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Carts/Day</p>
              <p className="text-2xl font-bold">{avgCarts.toFixed(0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Purchases/Day</p>
              <p className="text-2xl font-bold">{avgPurchases.toFixed(0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Conversion</p>
              <p className="text-2xl font-bold">{avgConversion.toFixed(1)}%</p>
            </div>
          </div>

          {/* Line Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="chats"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Chats"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="carts"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                name="Carts"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="purchases"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                name="Purchases"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Conversion Rate Trend */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Conversion Rate Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  label={{ value: 'Conversion %', angle: -90, position: 'insideLeft' }}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="chatToCartRate"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Chat → Cart %"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="cartToPurchaseRate"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Cart → Purchase %"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="overallConversion"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Overall %"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
