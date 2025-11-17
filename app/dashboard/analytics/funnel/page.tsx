"use client";

import { useState, useEffect } from 'react';
import { FunnelChart } from '@/components/dashboard/analytics/FunnelChart';
import { FunnelTrends } from '@/components/dashboard/analytics/FunnelTrends';
import { CartRecoveryTable } from '@/components/dashboard/analytics/CartRecoveryTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { FunnelMetrics, FunnelTrend, ConversationFunnel } from '@/types/purchase-attribution';

export default function FunnelDashboardPage() {
  const { toast } = useToast();
  const [domain, setDomain] = useState<string>('');
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null);
  const [trends, setTrends] = useState<FunnelTrend[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<ConversationFunnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Fetch domain from URL or local storage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const domainParam = params.get('domain') || localStorage.getItem('selectedDomain') || '';
    setDomain(domainParam);

    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({
      start: start.toISOString().split('T')[0] || start.toISOString().substring(0, 10),
      end: end.toISOString().split('T')[0] || end.toISOString().substring(0, 10),
    });
  }, []);

  // Fetch funnel data
  useEffect(() => {
    if (!domain) return;
    loadFunnelData();
  }, [domain, dateRange]);

  const loadFunnelData = async () => {
    setIsLoading(true);
    try {
      // Fetch metrics
      const metricsRes = await fetch(
        `/api/analytics/funnel?domain=${domain}&start=${dateRange.start}&end=${dateRange.end}`
      );
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      // Fetch trends
      const trendsRes = await fetch(
        `/api/analytics/funnel?domain=${domain}&action=trends&days=30`
      );
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrends(trendsData.trends || []);
      }

      // Fetch abandoned carts from conversation_funnel table
      // For now, we'll use a placeholder - in production, add an API endpoint
      // GET /api/analytics/funnel/abandoned-carts?domain=X
      setAbandonedCarts([]); // Placeholder
    } catch (error) {
      console.error('Error loading funnel data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load funnel analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactCustomer = (email: string) => {
    toast({
      title: 'Contact Customer',
      description: `Opening email client for ${email}...`,
    });
    window.location.href = `mailto:${email}?subject=Your Cart is Waiting&body=Hi, we noticed you left items in your cart...`;
  };

  if (!domain) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select a domain to view funnel analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversion Funnel Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track customer journey from chat to purchase for {domain}
          </p>
        </div>
        <Button onClick={loadFunnelData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overview.totalChats.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Conversations initiated
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cart Additions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overview.totalCarts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.conversionRates.chatToCart.toFixed(1)}% from chats
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Purchases</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overview.totalPurchases.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.conversionRates.overallConversion.toFixed(1)}% overall conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£{metrics.overview.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Lost: £{metrics.revenueMetrics.lostRevenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funnel Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics && <FunnelChart metrics={metrics} isLoading={isLoading} />}
        {trends.length > 0 && <FunnelTrends trends={trends} isLoading={isLoading} />}
      </div>

      {/* Cart Recovery */}
      <CartRecoveryTable
        abandonedCarts={abandonedCarts}
        isLoading={isLoading}
        onContactCustomer={handleContactCustomer}
      />

      {/* Timing Insights */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Time to Conversion Insights</CardTitle>
            <CardDescription>
              Understanding customer decision-making timelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg. Time to Cart</p>
                <p className="text-3xl font-bold">
                  {metrics.timingMetrics.avgTimeToCartMinutes.toFixed(0)}m
                </p>
                <p className="text-xs text-muted-foreground">
                  Median: {metrics.timingMetrics.medianTimeToCartMinutes.toFixed(0)}m
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg. Cart to Purchase</p>
                <p className="text-3xl font-bold">
                  {metrics.timingMetrics.avgCartToPurchaseMinutes.toFixed(0)}m
                </p>
                <p className="text-xs text-muted-foreground">
                  Time from cart to completion
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg. Total Journey</p>
                <p className="text-3xl font-bold">
                  {metrics.timingMetrics.avgTimeToPurchaseMinutes.toFixed(0)}m
                </p>
                <p className="text-xs text-muted-foreground">
                  Median: {metrics.timingMetrics.medianTimeToPurchaseMinutes.toFixed(0)}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
