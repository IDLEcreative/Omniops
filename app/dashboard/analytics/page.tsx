"use client";

import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Download,
  MessageSquare,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";

type DateRangeValue = "24h" | "7d" | "30d" | "90d" | "custom";

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

const getLanguageColor = (color?: string, fallbackIndex = 0) => {
  if (color) return color;
  const palette = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-gray-500"];
  return palette[fallbackIndex % palette.length];
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRangeValue>("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const days = RANGE_TO_DAYS[dateRange] ?? 7;
  const { data: analytics, loading, error, refresh } = useDashboardAnalytics({ days });

  const metricsCards = useMemo(() => {
    return [
      {
        title: "Total Messages",
        icon: MessageSquare,
        value: formatNumber(analytics?.metrics.totalMessages),
        descriptor: `${formatNumber(analytics?.metrics.userMessages)} from customers`,
      },
      {
        title: "Avg Response Time",
        icon: ClockIcon,
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

  const dailySentiment = analytics?.dailySentiment ?? [];
  const topQueries = analytics?.topQueries ?? [];
  const languageDistribution = analytics?.languageDistribution ?? [];
  const failedSearches = analytics?.failedSearches ?? [];

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
        body: `Customers recently searched for “${analytics.failedSearches[0]}” without success. Add supporting content or train the model on this topic.`,
        tone: "caution",
      });
    }

    const topQuery = analytics.topQueries[0];
    if (topQuery) {
      items.push({
        title: "Trending topic",
        body: `“${topQuery.query}” accounts for ${topQuery.percentage}% of recent questions. Prepare snippets or macros to respond faster.`,
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
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeValue)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom (30 days)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>We couldn’t load analytics. Try refreshing or adjust the range.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricsCards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading && !analytics ? <span className="inline-block h-6 w-24 bg-muted animate-pulse rounded" /> : card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{card.descriptor}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sentiment & Satisfaction</CardTitle>
                <CardDescription>
                  Summaries of each day’s sentiment and satisfaction score.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && !analytics && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-12 w-full rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && dailySentiment.length === 0 && (
                  <EmptyState
                    icon={TrendingUp}
                    title="No sentiment data yet"
                    description="Sentiment analysis will appear as conversations are processed"
                    actionLabel="Start Conversations"
                    actionHref="/dashboard/settings"
                    variant="default"
                  />
                )}
                {dailySentiment.map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.total} messages · {formatScore(entry.satisfactionScore)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <Badge variant="secondary">{entry.positive} 👍</Badge>
                      <Badge variant="outline">{entry.neutral} 😐</Badge>
                      <Badge variant="destructive">{entry.negative} 👎</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customer Queries</CardTitle>
                <CardDescription>Most frequent queries during this period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && !analytics && (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="h-10 w-full rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && topQueries.length === 0 && (
                  <EmptyState
                    icon={MessageSquare}
                    title="No query patterns yet"
                    description="Popular customer queries will be identified as conversations accumulate"
                    actionLabel="View Integration Guide"
                    actionHref="/dashboard/settings"
                    variant="default"
                  />
                )}
                {topQueries.map((item) => (
                  <div key={item.query} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.query}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.count.toLocaleString()} · {item.percentage}%
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Failed Searches</CardTitle>
                <CardDescription>Topics that returned no results.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && !analytics && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-8 w-full rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && failedSearches.length === 0 && (
                  <EmptyState
                    icon={Search}
                    title="No failed searches"
                    description="When searches don't return results, they'll be listed here for review"
                    variant="compact"
                  />
                )}
                {failedSearches.map((query, index) => (
                  <div key={`${query}-${index}`} className="rounded-md border bg-card px-3 py-2 text-sm">
                    {query}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
                <CardDescription>Share of user messages by language.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && !analytics && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-6 w-full rounded-md bg-muted animate-pulse" />
                    ))}
                  </div>
                )}
                {!loading && languageDistribution.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title="No language data"
                    description="Language diversity will be tracked as international users engage"
                    variant="compact"
                  />
                )}
                {languageDistribution.map((lang, index) => (
                  <div key={lang.language} className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${getLanguageColor(lang.color, index)}`} />
                    <span className="text-sm flex-1">{lang.language}</span>
                    <span className="text-sm font-medium">{lang.percentage}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Breakdown</CardTitle>
                <CardDescription>Positive vs. negative interactions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Positive</span>
                  <span className="font-medium">
                    {formatNumber(sentimentSummary.positive)} ({sentimentSummary.positiveRate}%)
                  </span>
                </div>
                <Progress value={sentimentSummary.positiveRate} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span>Negative</span>
                  <span className="font-medium">
                    {formatNumber(sentimentSummary.negative)} ({sentimentSummary.negativeRate}%)
                  </span>
                </div>
                <Progress value={sentimentSummary.negativeRate} className="h-2 bg-red-100" />
                <p className="text-xs text-muted-foreground">
                  Based on {formatNumber(sentimentSummary.total)} user messages.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Metrics</CardTitle>
                <CardDescription>Speed and volume indicators.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Average response time</span>
                  <span className="font-medium">{formatSeconds(analytics?.responseTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Messages per day</span>
                  <span className="font-medium">{formatNumber(analytics?.metrics.avgMessagesPerDay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total messages</span>
                  <span className="font-medium">{formatNumber(analytics?.metrics.totalMessages)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction</CardTitle>
                <CardDescription>User feedback trends.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Score</span>
                  <span className="font-medium">{formatScore(analytics?.satisfactionScore)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Positive messages</span>
                  <span className="font-medium">{formatNumber(analytics?.metrics.positiveMessages)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Negative messages</span>
                  <span className="font-medium">{formatNumber(analytics?.metrics.negativeMessages)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
                <CardDescription>Completion and deflection rate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Resolution rate</span>
                  <span className="font-medium">{formatRate(analytics?.resolutionRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer messages handled</span>
                  <span className="font-medium">{formatNumber(analytics?.metrics.userMessages)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net sentiment</span>
                  <span className="font-medium">
                    {formatNumber(
                      (analytics?.metrics.positiveMessages ?? 0) -
                        (analytics?.metrics.negativeMessages ?? 0),
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Generated from current analytics snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    insight.tone === "positive"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : insight.tone === "caution"
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <h4 className="text-sm font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-2">{insight.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
