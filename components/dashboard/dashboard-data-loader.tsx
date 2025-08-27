'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface DashboardData {
  conversations?: {
    total: number;
    change: number;
    recent: Array<{ id: string; message: string; timestamp: string }>;
  };
  analytics?: {
    responseTime: number;
    satisfactionScore: number;
    resolutionRate: number;
  };
  scraped?: {
    totalPages: number;
    lastUpdated: string;
    queuedJobs: number;
  };
  woocommerce?: {
    totalProducts: number;
    totalOrders: number;
    revenue: number;
  };
}

interface LoadingState {
  conversations: boolean;
  analytics: boolean;
  scraped: boolean;
  woocommerce: boolean;
}

interface ErrorState {
  conversations?: string;
  analytics?: string;
  scraped?: string;
  woocommerce?: string;
}

export function DashboardDataLoader() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState<LoadingState>({
    conversations: true,
    analytics: true,
    scraped: true,
    woocommerce: true,
  });
  const [errors, setErrors] = useState<ErrorState>({});

  useEffect(() => {
    // Fetch all dashboard data in parallel
    const fetchDashboardData = async () => {
      const startTime = performance.now();

      // Create all fetch promises
      const conversationsPromise = fetch('/api/dashboard/conversations')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch conversations'))
        .catch(error => {
          setErrors(prev => ({ ...prev, conversations: error.toString() }));
          return null;
        });

      const analyticsPromise = fetch('/api/dashboard/analytics')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch analytics'))
        .catch(error => {
          setErrors(prev => ({ ...prev, analytics: error.toString() }));
          return null;
        });

      const scrapedPromise = fetch('/api/dashboard/scraped')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch scraping data'))
        .catch(error => {
          setErrors(prev => ({ ...prev, scraped: error.toString() }));
          return null;
        });

      const woocommercePromise = fetch('/api/dashboard/woocommerce')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch WooCommerce data'))
        .catch(error => {
          setErrors(prev => ({ ...prev, woocommerce: error.toString() }));
          return null;
        });

      // Execute all fetches in parallel using Promise.allSettled
      const results = await Promise.allSettled([
        conversationsPromise,
        analyticsPromise,
        scrapedPromise,
        woocommercePromise,
      ]);

      const endTime = performance.now();
      console.log(`Dashboard data loaded in ${(endTime - startTime).toFixed(2)}ms`);

      // Process results and update state
      const [conversationsResult, analyticsResult, scrapedResult, woocommerceResult] = results;

      setData({
        conversations: conversationsResult.status === 'fulfilled' ? conversationsResult.value : undefined,
        analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : undefined,
        scraped: scrapedResult.status === 'fulfilled' ? scrapedResult.value : undefined,
        woocommerce: woocommerceResult.status === 'fulfilled' ? woocommerceResult.value : undefined,
      });

      // Update loading states
      setLoading({
        conversations: false,
        analytics: false,
        scraped: false,
        woocommerce: false,
      });
    };

    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Render loading state
  if (Object.values(loading).some(isLoading => isLoading)) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(loading).map(([key, isLoading]) => (
          isLoading && (
            <Card key={key}>
              <CardHeader className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    );
  }

  // Render error alerts for failed fetches
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-4">
      {hasErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some dashboard data could not be loaded. Partial data is displayed.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Conversations Card */}
        {data.conversations && (
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Total customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.conversations.total.toLocaleString()}</div>
              <p className={`text-xs ${data.conversations.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.conversations.change > 0 ? '+' : ''}{data.conversations.change}% from last period
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analytics Card */}
        {data.analytics && (
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>Key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-medium">{data.analytics.responseTime}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Satisfaction</span>
                  <span className="text-sm font-medium">{data.analytics.satisfactionScore}/5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolution</span>
                  <span className="text-sm font-medium">{data.analytics.resolutionRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scraped Content Card */}
        {data.scraped && (
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Scraped pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.scraped.totalPages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(data.scraped.lastUpdated).toLocaleDateString()}
              </p>
              {data.scraped.queuedJobs > 0 && (
                <p className="text-xs text-blue-600">{data.scraped.queuedJobs} jobs in queue</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* WooCommerce Card */}
        {data.woocommerce && (
          <Card>
            <CardHeader>
              <CardTitle>WooCommerce</CardTitle>
              <CardDescription>E-commerce data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Products</span>
                  <span className="text-sm font-medium">{data.woocommerce.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Orders</span>
                  <span className="text-sm font-medium">{data.woocommerce.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Revenue</span>
                  <span className="text-sm font-medium">${data.woocommerce.revenue.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Hook for using dashboard data in other components
export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [conversations, analytics, scraped, woocommerce] = await Promise.all([
          fetch('/api/dashboard/conversations').then(r => r.json()),
          fetch('/api/dashboard/analytics').then(r => r.json()),
          fetch('/api/dashboard/scraped').then(r => r.json()),
          fetch('/api/dashboard/woocommerce').then(r => r.json()),
        ]);

        setData({ conversations, analytics, scraped, woocommerce });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}