'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';

import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';
import { useBusinessIntelligence } from '@/hooks/use-business-intelligence';
import { useSupabaseRealtimeAnalytics } from '@/hooks/use-supabase-realtime-analytics';

import { MetricsOverview } from '@/components/analytics/MetricsOverview';
import { ResponseTimeChart } from '@/components/analytics/ResponseTimeChart';
import { MessageVolumeChart } from '@/components/analytics/MessageVolumeChart';
import { SentimentChart } from '@/components/analytics/SentimentChart';
import { PeakUsageChart } from '@/components/analytics/PeakUsageChart';
import { CustomerJourneyFlow } from '@/components/analytics/CustomerJourneyFlow';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<number>(7);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
    refresh: refreshAnalytics
  } = useDashboardAnalytics({ days: timeRange });

  const {
    data: biData,
    loading: biLoading,
    error: biError,
    refresh: refreshBI
  } = useBusinessIntelligence({
    days: timeRange,
    metric: 'all',
    disabled: activeTab !== 'intelligence'
  });

  const organizationId = analyticsData?.metrics ? '1' : null;

  const { isConnected, latestUpdate } = useSupabaseRealtimeAnalytics({
    organizationId,
    enabled: true,
  });

  useEffect(() => {
    if (latestUpdate) {
      if (activeTab === 'overview') {
        refreshAnalytics();
      } else {
        refreshBI();
      }
    }
  }, [latestUpdate, activeTab, refreshAnalytics, refreshBI]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (activeTab === 'overview') {
        refreshAnalytics();
      } else {
        refreshBI();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab, refreshAnalytics, refreshBI]);

  const handleRefresh = async () => {
    if (activeTab === 'overview') {
      await refreshAnalytics();
    } else {
      await refreshBI();
    }
  };

  const isLoading = activeTab === 'overview' ? analyticsLoading : biLoading;
  const hasError = activeTab === 'overview' ? analyticsError : biError;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <div className="flex items-center gap-2 text-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
                title={isConnected ? 'Live updates enabled' : 'Offline'}
              />
              <span className="text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-muted-foreground">
            Comprehensive insights into your chat performance and customer behavior
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={timeRange.toString()}
            onValueChange={(value) => setTimeRange(parseInt(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="auto-refresh"
          checked={autoRefresh}
          onCheckedChange={setAutoRefresh}
        />
        <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
          Auto-refresh every 5 minutes
        </Label>
      </div>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {hasError.message || 'Failed to load analytics data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Business Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading && !analyticsData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyticsData ? (
            <>
              <MetricsOverview data={analyticsData} />

              <div className="grid gap-6 md:grid-cols-2">
                <ResponseTimeChart data={analyticsData} />
                <MessageVolumeChart data={analyticsData} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <SentimentChart data={analyticsData} />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Top User Queries</h3>
                  <div className="space-y-2">
                    {analyticsData.topQueries.slice(0, 5).map((query, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted rounded-lg"
                      >
                        <span className="text-sm">{query.query}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {query.count} times
                          </span>
                          <span className="text-xs font-medium">
                            {query.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {analyticsData.failedSearches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Failed Searches
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {analyticsData.failedSearches.slice(0, 6).map((search, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                      >
                        <span className="text-sm">{search}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          {isLoading && !biData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : biData ? (
            <>
              {biData.summary && biData.summary.insights.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Insights
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {biData.summary.insights.slice(0, 4).map((insight, index) => (
                      <Alert
                        key={index}
                        variant={insight.type === 'warning' ? 'destructive' : 'default'}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-1">{insight.metric}</div>
                          <div className="text-sm">{insight.message}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {biData.customerJourney && (
                <CustomerJourneyFlow data={biData.customerJourney} />
              )}

              {biData.conversionFunnel && (
                <ConversionFunnelChart data={biData.conversionFunnel} />
              )}

              {biData.peakUsage && (
                <PeakUsageChart data={biData.peakUsage} />
              )}

              {biData.contentGaps && biData.contentGaps.unansweredQueries.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Content Gaps</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="mb-3">
                      <span className="text-sm font-medium">Coverage Score: </span>
                      <span className="text-lg font-bold">
                        {biData.contentGaps.coverageScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {biData.contentGaps.unansweredQueries.slice(0, 5).map((query, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-background rounded"
                        >
                          <span className="text-sm">{query.query}</span>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{query.frequency} times</span>
                            <span>{(query.avgConfidence * 100).toFixed(0)}% confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
