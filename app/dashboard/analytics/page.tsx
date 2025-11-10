'use client';

import { useState } from 'react';
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
import { useAnalyticsRefresh } from './hooks/useAnalyticsRefresh';

import { OverviewTab } from './components/OverviewTab';
import { IntelligenceTab } from './components/IntelligenceTab';
import { ExportButtons } from './components/ExportButtons';

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

  useAnalyticsRefresh({
    autoRefresh,
    activeTab,
    latestUpdate,
    refreshAnalytics,
    refreshBI,
  });

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
          <ExportButtons days={timeRange} />

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
          <OverviewTab loading={isLoading} data={analyticsData} />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <IntelligenceTab loading={isLoading} data={biData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
