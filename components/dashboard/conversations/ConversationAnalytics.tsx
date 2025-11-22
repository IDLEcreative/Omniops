'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResponseTimeChart } from './analytics/ResponseTimeChart';
import { VolumeByHourChart } from './analytics/VolumeByHourChart';
import { StatusOverTimeChart } from './analytics/StatusOverTimeChart';
import { MessageLengthChart } from './analytics/MessageLengthChart';
import { HandoffSummaryCards } from './analytics/HandoffSummaryCards';
import { HandoffVolumeChart } from './analytics/HandoffVolumeChart';
import { SLAPerformanceChart } from './analytics/SLAPerformanceChart';
import { generateCSVContent, downloadCSV } from '@/lib/analytics/conversation-analytics-helpers';

export interface ResponseTimeTrend {
  date: string;
  avgMinutes: number;
}

export interface VolumeByHour {
  hour: number;
  count: number;
}

export interface StatusOverTime {
  date: string;
  active: number;
  waiting: number;
  resolved: number;
}

export interface MessageLengthDist {
  range: string;
  count: number;
}

export interface HandoffMetrics {
  totalRequests: number;
  avgResponseTime: number;
  requestsOverTime: { date: string; count: number }[];
  slaPerformance: {
    within5min: number;
    within15min: number;
    within30min: number;
    over30min: number;
  };
}

export interface AnalyticsData {
  responseTimeTrend: ResponseTimeTrend[];
  volumeByHour: VolumeByHour[];
  statusOverTime: StatusOverTime[];
  messageLengthDist: MessageLengthDist[];
  handoffMetrics: HandoffMetrics;
}

interface ConversationAnalyticsProps {
  days: number;
}

export function ConversationAnalytics({ days }: ConversationAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/dashboard/conversations/analytics?days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch analytics');
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error('[Analytics] Fetch error:', err);
        setError('Unable to load analytics data');
      })
      .finally(() => setLoading(false));
  }, [days]);

  const handleExportChart = () => {
    if (!data) return;
    const csvContent = generateCSVContent(data);
    downloadCSV(csvContent);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Conversation Analytics</h2>
            <p className="text-muted-foreground">Visual insights into conversation patterns</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
              <div className="h-[350px] w-full bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'No analytics data available'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Conversation Analytics</h2>
          <p className="text-muted-foreground">Visual insights into conversation patterns</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportChart}>
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <Tabs defaultValue="response-time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
          <TabsTrigger value="status">Status Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="handoff">🚨 Human Handoff</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time">
          <ResponseTimeChart data={data.responseTimeTrend} />
        </TabsContent>

        <TabsContent value="volume">
          <VolumeByHourChart data={data.volumeByHour} />
        </TabsContent>

        <TabsContent value="status">
          <StatusOverTimeChart data={data.statusOverTime} />
        </TabsContent>

        <TabsContent value="distribution">
          <MessageLengthChart data={data.messageLengthDist} />
        </TabsContent>

        <TabsContent value="handoff" className="space-y-4">
          <HandoffSummaryCards data={data.handoffMetrics} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <HandoffVolumeChart data={data.handoffMetrics.requestsOverTime} />
            <SLAPerformanceChart data={data.handoffMetrics.slaPerformance} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="h-4 w-4" />
        <span>Analytics based on last {days} days of conversation data</span>
      </div>
    </div>
  );
}
