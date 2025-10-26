"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, TrendingUp, Users, Clock } from "lucide-react";
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";
import { DateRangePicker, DateRangeValue } from "@/components/dashboard/analytics/DateRangePicker";
import { MetricsOverview, MetricCard } from "@/components/dashboard/analytics/MetricsOverview";
import { ChartGrid } from "@/components/dashboard/analytics/ChartGrid";
import { ExportButton } from "@/components/dashboard/analytics/ExportButton";

const RANGE_TO_DAYS: Record<DateRangeValue, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  custom: 30,
};

const formatNumber = (value: number | undefined) =>
  value !== undefined ? value.toLocaleString() : "—";

const formatSeconds = (seconds: number | undefined) => {
  if (seconds === undefined) return "—";
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  return `${seconds.toFixed(1)}s`;
};

const formatScore = (score: number | undefined) =>
  score !== undefined ? `${score.toFixed(2)}/5` : "—";

const formatRate = (rate: number | undefined) =>
  rate !== undefined ? `${rate.toFixed(1)}%` : "—";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const days = RANGE_TO_DAYS[dateRange] ?? 7;
  const { data: analytics, loading, error, refresh } = useDashboardAnalytics({ days });

  const metricsCards: MetricCard[] = useMemo(() => {
    return [
      {
        title: "Total Messages",
        icon: MessageSquare,
        value: formatNumber(analytics?.metrics.totalMessages),
        descriptor: `${formatNumber(analytics?.metrics.userMessages)} from customers`,
      },
      {
        title: "Avg Response Time",
        icon: Clock,
        value: formatSeconds(analytics?.responseTime),
        descriptor: "Median turnaround per message",
      },
      {
        title: "Satisfaction Score",
        icon: Users,
        value: formatScore(analytics?.satisfactionScore),
        descriptor: `${formatNumber(analytics?.metrics.positiveMessages)} positive interactions`,
      },
      {
        title: "Resolution Rate",
        icon: TrendingUp,
        value: formatRate(analytics?.resolutionRate),
        descriptor: `${formatNumber(analytics?.metrics.avgMessagesPerDay)} msgs/day on average`,
      },
    ];
  }, [analytics]);

  const sentimentSummary = useMemo(() => {
    const positive = analytics?.metrics.positiveMessages ?? 0;
    const negative = analytics?.metrics.negativeMessages ?? 0;
    const total = analytics?.metrics.userMessages ?? 0;
    const positiveRate = total > 0 ? Math.round((positive / total) * 100) : 0;
    const negativeRate = total > 0 ? Math.round((negative / total) * 100) : 0;
    return { positive, negative, total, positiveRate, negativeRate };
  }, [analytics]);

  const insights = useMemo(() => {
    if (!analytics) return [];
    const items: Array<{ title: string; body: string; tone: "positive" | "neutral" | "caution" }> = [];

    if (analytics.responseTime > 5) {
      items.push({
        title: "Response time opportunity",
        body: `Average response time is ${formatSeconds(analytics.responseTime)}. Consider reviewing escalation rules for your busiest period.`,
        tone: "caution",
      });
    } else if (analytics.responseTime) {
      items.push({
        title: "Fast responses",
        body: `Agents respond in ${formatSeconds(analytics.responseTime)} on average—keep the current shift coverage.`,
        tone: "positive",
      });
    }

    if (analytics.failedSearches.length > 0) {
      items.push({
        title: "Knowledge gaps detected",
        body: `Customers recently searched for "${analytics.failedSearches[0]}" without success. Add supporting content or train the model on this topic.`,
        tone: "caution",
      });
    }

    const topQuery = analytics.topQueries[0];
    if (topQuery) {
      items.push({
        title: "Trending topic",
        body: `"${topQuery.query}" accounts for ${topQuery.percentage}% of recent questions. Prepare snippets or macros to respond faster.`,
        tone: "neutral",
      });
    }

    if (!items.length) {
      items.push({
        title: "Stable performance",
        body: "Analytics show consistent behaviour across all monitored metrics. Continue monitoring for emerging trends.",
        tone: "positive",
      });
    }

    return items;
  }, [analytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track agent throughput, satisfaction, and trending topics across the selected period.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            isLoading={loading}
          />
          <ExportButton />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>We couldn't load analytics. Try refreshing or adjust the range.</AlertDescription>
        </Alert>
      )}

      <MetricsOverview metrics={metricsCards} isLoading={loading && !analytics} />

      <ChartGrid
        dailySentiment={analytics?.dailySentiment ?? []}
        topQueries={analytics?.topQueries ?? []}
        languageDistribution={analytics?.languageDistribution ?? []}
        failedSearches={analytics?.failedSearches ?? []}
        sentimentSummary={sentimentSummary}
        insights={insights}
        metrics={analytics ? {
          responseTime: analytics.responseTime,
          satisfactionScore: analytics.satisfactionScore,
          resolutionRate: analytics.resolutionRate,
          totalMessages: analytics.metrics.totalMessages,
          userMessages: analytics.metrics.userMessages,
          positiveMessages: analytics.metrics.positiveMessages,
          negativeMessages: analytics.metrics.negativeMessages,
          avgMessagesPerDay: analytics.metrics.avgMessagesPerDay,
        } : undefined}
        isLoading={loading && !analytics}
      />
    </div>
  );
}
