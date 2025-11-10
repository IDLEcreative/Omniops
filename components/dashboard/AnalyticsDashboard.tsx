/**
 * Analytics Dashboard Component
 *
 * Comprehensive analytics view showing:
 * - Overview metrics (conversations, response times, engagement)
 * - Trend charts (daily/hourly patterns)
 * - Performance alerts
 * - Export functionality
 */

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalyticsDashboardData } from '@/types/analytics';
import { Clock, CheckCircle, Download, Activity } from 'lucide-react';

// Extracted components
import { OverviewCards } from './analytics/OverviewCards';
import { TrendChart } from './analytics/TrendChart';
import { TopPerformersCard } from './analytics/TopPerformersCard';
import { GrowthIndicatorsCard } from './analytics/GrowthIndicatorsCard';
import { AnalyticsAlertBanner } from './analytics/AnalyticsAlertBanner';

interface AnalyticsDashboardProps {
  data: AnalyticsDashboardData;
  loading?: boolean;
  onExport?: () => void;
}

export function AnalyticsDashboard({ data, loading = false, onExport }: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'conversations' | 'response_time' | 'engagement'>('conversations');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <AnalyticsAlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Overview Metrics */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Overview</h2>
        {onExport && (
          <Button onClick={onExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        )}
      </div>

      <OverviewCards overview={data.overview} />

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Daily metrics for the past {data.overview.time_period.days} days
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === 'conversations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('conversations')}
              >
                Conversations
              </Button>
              <Button
                variant={selectedMetric === 'response_time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('response_time')}
              >
                Response Time
              </Button>
              <Button
                variant={selectedMetric === 'engagement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric('engagement')}
              >
                Engagement
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TrendChart
            data={data.trends.daily_metrics}
            metric={selectedMetric}
          />
        </CardContent>
      </Card>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopPerformersCard
          title="Fastest Responses"
          icon={<Clock className="h-4 w-4" />}
          items={data.top_performers.fastest_responses}
          metricLabel="ms"
        />
        <TopPerformersCard
          title="Highest Engagement"
          icon={<Activity className="h-4 w-4" />}
          items={data.top_performers.highest_engagement}
          metricLabel="score"
        />
        <TopPerformersCard
          title="Most Completed"
          icon={<CheckCircle className="h-4 w-4" />}
          items={data.top_performers.most_completed}
          metricLabel="rate"
        />
      </div>

      {/* Growth Indicators */}
      <GrowthIndicatorsCard indicators={data.trends.growth_indicators} />
    </div>
  );
}
