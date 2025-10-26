'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileSearch,
  Activity,
  Target
} from 'lucide-react';
import { InsightCard, Insight } from './business-intelligence/InsightCard';
import { MetricsList } from './business-intelligence/MetricsList';
import { ChartArea } from './business-intelligence/ChartArea';

interface BusinessIntelligenceCardProps {
  domain?: string;
  timeRange?: { start: Date; end: Date };
}

export function BusinessIntelligenceCard({ domain, timeRange }: BusinessIntelligenceCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [domain, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metric: 'all',
        ...(domain && { domain }),
        ...(timeRange && {
          startDate: timeRange.start.toISOString(),
          endDate: timeRange.end.toISOString(),
        }),
      });

      const response = await fetch(`/api/analytics/intelligence?${params}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const overviewMetrics = [
    {
      title: 'Conversion Rate',
      value: `${((data.customerJourney?.conversionRate || 0) * 100).toFixed(1)}%`,
      trend: data.customerJourney?.conversionRate > 0.2 ? 'up' as const : 'down' as const,
      icon: <Target className="h-4 w-4" />
    },
    {
      title: 'Avg Sessions',
      value: data.customerJourney?.avgSessionsBeforeConversion?.toFixed(1) || '0',
      trend: data.customerJourney?.avgSessionsBeforeConversion < 4 ? 'up' as const : 'down' as const,
      icon: <Users className="h-4 w-4" />
    },
    {
      title: 'Content Gaps',
      value: data.contentGaps?.length || 0,
      trend: data.contentGaps?.length < 5 ? 'up' as const : 'down' as const,
      icon: <FileSearch className="h-4 w-4" />
    },
    {
      title: 'Peak Hour Load',
      value: `${Math.max(...(data.peakUsage?.hourlyDistribution?.map((h: any) => h.avgRequests) || [0])).toFixed(0)}`,
      subtitle: 'req/hour',
      icon: <Activity className="h-4 w-4" />
    }
  ];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Business Intelligence Analytics</CardTitle>
            <CardDescription>
              Deep insights into customer behavior and system performance
            </CardDescription>
          </div>
          {data.summary && (
            <div className="flex gap-2">
              <Badge variant="destructive">
                {data.summary.criticalCount} Critical
              </Badge>
              <Badge variant="outline" className="border-orange-500 text-orange-500">
                {data.summary.highCount} High Priority
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journey">Journey</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <MetricsList metrics={overviewMetrics} />

            {data.summary?.insights && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Key Insights</h3>
                {data.summary.insights.slice(0, 3).map((insight: Insight, idx: number) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="journey" className="space-y-4">
            <ChartArea selectedMetric="journey" data={data} />
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <ChartArea selectedMetric="content" data={data} />
          </TabsContent>

          <TabsContent value="usage" className="space-y-4">
            <ChartArea selectedMetric="usage" data={data} />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <ChartArea selectedMetric="funnel" data={data} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
