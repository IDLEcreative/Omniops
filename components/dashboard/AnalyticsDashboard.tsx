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

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AnalyticsDashboardData,
  AnalyticsOverview,
  DailyMetric,
  AnalyticsAlert,
} from '@/types/analytics';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Download,
  BarChart3,
  Activity,
} from 'lucide-react';

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

/**
 * Overview Metrics Cards
 */
function OverviewCards({ overview }: { overview: AnalyticsOverview }) {
  const metrics = [
    {
      title: 'Total Conversations',
      value: overview.totals.conversations.toLocaleString(),
      icon: <MessageSquare className="h-4 w-4" />,
      subtitle: `${overview.totals.messages.toLocaleString()} messages`,
    },
    {
      title: 'Avg Response Time',
      value: `${(overview.averages.response_time_ms / 1000).toFixed(1)}s`,
      icon: <Clock className="h-4 w-4" />,
      subtitle: `${overview.averages.messages_per_conversation.toFixed(1)} msgs/conv`,
    },
    {
      title: 'Engagement Score',
      value: overview.averages.engagement_score.toString(),
      icon: <Activity className="h-4 w-4" />,
      subtitle: 'Out of 100',
      badge: overview.averages.engagement_score >= 70 ? 'success' : 'warning',
    },
    {
      title: 'Completion Rate',
      value: `${(overview.rates.completion_rate * 100).toFixed(0)}%`,
      icon: <CheckCircle className="h-4 w-4" />,
      subtitle: `${(overview.rates.resolution_rate * 100).toFixed(0)}% resolved`,
      badge: overview.rates.completion_rate >= 0.7 ? 'success' : 'warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="text-muted-foreground">{metric.icon}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.badge && (
                <Badge variant={metric.badge === 'success' ? 'default' : 'secondary'}>
                  {metric.badge === 'success' ? 'Good' : 'Fair'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Simple Trend Chart (ASCII-style visualization)
 */
function TrendChart({
  data,
  metric,
}: {
  data: DailyMetric[];
  metric: 'conversations' | 'response_time' | 'engagement';
}) {
  const chartData = useMemo(() => {
    return data.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value:
        metric === 'conversations'
          ? day.conversations
          : metric === 'response_time'
          ? day.avg_response_time_ms / 1000 // Convert to seconds
          : day.completion_rate * 100, // Convert to percentage
    }));
  }, [data, metric]);

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-2">
      {chartData.map((day, index) => {
        const barWidth = maxValue > 0 ? (day.value / maxValue) * 100 : 0;

        return (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16 text-right">
              {day.date}
            </span>
            <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm font-medium w-16">
              {day.value.toFixed(metric === 'conversations' ? 0 : 1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Top Performers Card
 */
function TopPerformersCard({
  title,
  icon,
  items,
  metricLabel,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{ conversation_id: string; metric_value: number }>;
  metricLabel: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                  {item.conversation_id.slice(-8)}
                </span>
              </div>
              <span className="text-sm font-medium">
                {item.metric_value.toFixed(metricLabel === 'ms' ? 0 : 1)} {metricLabel}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Growth Indicators Card
 */
function GrowthIndicatorsCard({
  indicators,
}: {
  indicators: {
    conversation_growth_rate: number;
    engagement_trend: 'up' | 'down' | 'stable';
    response_time_trend: 'improving' | 'degrading' | 'stable';
  };
}) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'improving' | 'degrading') => {
    if (trend === 'up' || trend === 'improving') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'down' || trend === 'degrading') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Growth & Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Conversation Growth</p>
              <p className="text-lg font-semibold">
                {indicators.conversation_growth_rate > 0 ? '+' : ''}
                {indicators.conversation_growth_rate.toFixed(1)}%
              </p>
            </div>
            {getTrendIcon(indicators.conversation_growth_rate > 0 ? 'up' : indicators.conversation_growth_rate < 0 ? 'down' : 'stable')}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="text-lg font-semibold capitalize">{indicators.engagement_trend}</p>
            </div>
            {getTrendIcon(indicators.engagement_trend)}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Response Time</p>
              <p className="text-lg font-semibold capitalize">{indicators.response_time_trend}</p>
            </div>
            {getTrendIcon(indicators.response_time_trend)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Analytics Alert Banner
 */
function AnalyticsAlertBanner({ alert }: { alert: AnalyticsAlert }) {
  const variant = alert.type === 'critical' ? 'destructive' : 'default';

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <span className="font-medium">{alert.category}:</span> {alert.message}
        {alert.value && alert.threshold && (
          <span className="ml-2 text-xs">
            (Current: {alert.value}, Threshold: {alert.threshold})
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}
