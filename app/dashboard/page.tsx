"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
  Zap,
  Calendar,
  Download,
  RefreshCw,
  Bot,
  Sparkles,
  TrendingDown,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { useDashboardOverview, type DashboardOverview } from "@/hooks/use-dashboard-overview";

const PERIOD_OPTIONS = [
  { value: "24h", label: "Last 24 hours", days: 1 },
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
] as const;

const PERIOD_TO_DAYS = PERIOD_OPTIONS.reduce<Record<string, number>>((acc, option) => {
  acc[option.value] = option.days;
  return acc;
}, {});

const isValidPeriod = (value: string): value is (typeof PERIOD_OPTIONS)[number]["value"] =>
  Object.prototype.hasOwnProperty.call(PERIOD_TO_DAYS, value);

const LANGUAGE_COLORS: Record<string, string> = {
  english: "bg-blue-500",
  spanish: "bg-green-500",
  french: "bg-yellow-500",
  german: "bg-purple-500",
  other: "bg-gray-500",
};

const INSIGHT_TONE_STYLES: Record<
  "positive" | "caution" | "info" | "neutral",
  string
> = {
  positive: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800",
  caution: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
  info: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800",
  neutral: "bg-muted/40 border border-muted",
};

const EMPTY_OVERVIEW: DashboardOverview = {
  summary: {
    totalConversations: 0,
    conversationChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    avgResponseTime: 0,
    avgResponseTimeChange: 0,
    resolutionRate: 0,
    resolutionRateChange: 0,
    satisfactionScore: 3,
  },
  trend: [],
  recentConversations: [],
  languageDistribution: [],
  quickStats: {
    satisfaction: 3,
    avgResponseTime: 0,
    conversationsToday: 0,
    successRate: 100,
    totalTokens: 0,
    totalCostUSD: 0,
    avgSearchesPerRequest: 0,
  },
  telemetry: {
    totalRequests: 0,
    successfulRequests: 0,
    successRate: 100,
    avgSearchesPerRequest: 0,
    totalTokens: 0,
    totalCostUSD: 0,
  },
  botStatus: {
    online: false,
    uptimePercent: 0,
    primaryModel: "gpt-5-mini",
    lastTrainingAt: null,
  },
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const percentageFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1,
});

const costFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const formatNumber = (value: number) => numberFormatter.format(value ?? 0);

const formatPercentage = (value: number) => {
  if (!Number.isFinite(value)) return "0%";
  const formatted = percentageFormatter.format(value);
  return `${value >= 0 ? "+" : ""}${formatted}%`;
};

const formatSeconds = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0.0s";
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${percentageFormatter.format(remainingSeconds)}s`;
  }
  return `${percentageFormatter.format(seconds)}s`;
};

const formatRelativeTime = (isoDate: string | null) => {
  if (!isoDate) return "N/A";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
};

const getLanguageColor = (language: string) => {
  const key = language.toLowerCase();
  return LANGUAGE_COLORS[key] || LANGUAGE_COLORS.other;
};

const getStatusBadgeVariant = (status: "active" | "waiting" | "resolved") => {
  switch (status) {
    case "resolved":
      return "default";
    case "active":
      return "secondary";
    default:
      return "outline";
  }
};

const getInitials = (name: string | null) => {
  if (!name) return "??";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] ?? "" : "";
  if (!first) return "??";
  if (!last) return first.slice(0, 2).toUpperCase();
  return `${first[0]?.toUpperCase() ?? ""}${last[0]?.toUpperCase() ?? ""}` || "??";
};

const formatShortDay = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString(undefined, { weekday: "short" });

interface SummaryCardConfig {
  id: string;
  name: string;
  value: string;
  change: number;
  icon: ComponentType<{ className?: string }>;
  accentClass: string;
  invertChange?: boolean;
}

interface InsightConfig {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: "positive" | "caution" | "info" | "neutral";
}

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<(typeof PERIOD_OPTIONS)[number]["value"]>("7d");
  const days = PERIOD_TO_DAYS[selectedPeriod] ?? 7;

  const { data, loading, error, refresh } = useDashboardOverview({ days });
  const overview = data ?? EMPTY_OVERVIEW;

  const summaryCards: SummaryCardConfig[] = useMemo(() => {
    return [
      {
        id: "conversations",
        name: "Total Conversations",
        value: formatNumber(overview.summary.totalConversations),
        change: overview.summary.conversationChange,
        icon: MessageSquare,
        accentClass: "bg-blue-100 dark:bg-blue-900/20",
      },
      {
        id: "active-users",
        name: "Active Users",
        value: formatNumber(overview.summary.activeUsers),
        change: overview.summary.activeUsersChange,
        icon: Users,
        accentClass: "bg-green-100 dark:bg-green-900/20",
      },
      {
        id: "response-time",
        name: "Avg Response Time",
        value: formatSeconds(overview.summary.avgResponseTime),
        change: overview.summary.avgResponseTimeChange,
        icon: Clock,
        accentClass: "bg-purple-100 dark:bg-purple-900/20",
        invertChange: true,
      },
      {
        id: "resolution-rate",
        name: "Resolution Rate",
        value: `${percentageFormatter.format(overview.summary.resolutionRate)}%`,
        change: overview.summary.resolutionRateChange,
        icon: CheckCircle,
        accentClass: "bg-orange-100 dark:bg-orange-900/20",
      },
    ];
  }, [overview.summary]);

  const maxTrendConversations = useMemo(() => {
    if (!overview.trend.length) return 1;
    return Math.max(...overview.trend.map((point) => point.conversations), 1);
  }, [overview.trend]);

  const insights: InsightConfig[] = useMemo(() => {
    const conversationChange = overview.summary.conversationChange;
    const responseChange = overview.summary.avgResponseTimeChange;
    const successRate = overview.quickStats.successRate;

    return [
      {
        id: "conversation-trend",
        title:
          conversationChange >= 0
            ? "Conversation volume increasing"
            : "Conversation volume declining",
        description: `Conversations ${
          conversationChange >= 0 ? "up" : "down"
        } ${percentageFormatter.format(Math.abs(conversationChange))}% vs previous period.`,
        icon: conversationChange >= 0 ? TrendingUp : TrendingDown,
        tone: conversationChange >= 0 ? "positive" : "caution",
      },
      {
        id: "response-performance",
        title:
          responseChange <= 0 ? "Response time improving" : "Response time slower this period",
        description: `Average response time ${responseChange <= 0 ? "improved by" : "increased by"} ${percentageFormatter.format(Math.abs(responseChange))}% compared with the previous window.`,
        icon: responseChange <= 0 ? Zap : Clock,
        tone: responseChange <= 0 ? "positive" : "caution",
      },
      {
        id: "success-rate",
        title: "Automation success",
        description: `AI handled ${percentageFormatter.format(successRate)}% of requests successfully in the selected period.`,
        icon: successRate >= 95 ? Target : AlertCircle,
        tone: successRate >= 95 ? "info" : "caution",
      },
    ];
  }, [overview.summary, overview.quickStats.successRate]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            End-to-end visibility into your AI agent performance and customer operations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedPeriod}
            onValueChange={(value) => {
              if (isValidPeriod(value)) {
                setSelectedPeriod(value);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="default" asChild>
            <a href="/dashboard/analytics">
              <Download className="mr-2 h-4 w-4" />
              Export
            </a>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            We couldn&apos;t refresh dashboard data. Showing the most recent cached snapshot.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const improved = card.invertChange ? card.change <= 0 : card.change >= 0;
          const ChangeIcon = improved ? ArrowUpRight : ArrowDownRight;
          const changeLabel = formatPercentage(card.change);

          return (
            <Card key={card.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.name}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.accentClass}`}>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center pt-1">
                  <ChangeIcon className={`h-4 w-4 ${improved ? "text-green-500" : "text-red-500"}`} />
                  <span className={`text-xs ${improved ? "text-green-500" : "text-red-500"} ml-1`}>
                    {changeLabel}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">vs previous period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        {/* Left Column */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Overview</CardTitle>
                  <CardDescription>
                    Daily conversation volume alongside satisfaction score trends
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
                    <BarChart3 className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/dashboard/analytics">
                      <Activity className="h-4 w-4 mr-2" />
                      View analytics
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {overview.trend.length === 0 ? (
                  <EmptyState
                    icon={BarChart3}
                    title="No conversations yet"
                    description={`Start by adding the chat widget to your website. Conversations from the last ${days} day${days === 1 ? '' : 's'} will appear here.`}
                    actionLabel="View Setup Guide"
                    actionHref="/dashboard/settings"
                    variant="card"
                    className="h-full"
                  />
                ) : (
                  <div className="flex items-end justify-between h-full gap-3">
                    {overview.trend.map((point) => {
                      const barHeight = Math.round(
                        (point.conversations / maxTrendConversations) * 100
                      );
                      return (
                        <div key={point.date} className="flex flex-col items-center w-full">
                          <div className="w-full bg-muted/40 rounded-t-lg flex-1 flex items-end">
                            <div
                              className="w-full rounded-t-lg bg-primary/30 border border-primary/60 transition-all"
                              style={{ height: `${barHeight}%` }}
                            />
                          </div>
                          <div className="text-xs font-semibold mt-2">
                            {formatNumber(point.conversations)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatShortDay(point.date)}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {percentageFormatter.format(point.satisfactionScore)} / 5
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Insights */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Conversations</span>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overview.recentConversations.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No conversations yet"
                      description="Once customers start chatting, their conversations will appear here"
                      variant="compact"
                    />
                  ) : (
                    overview.recentConversations.map((conversation) => (
                      <div key={conversation.id} className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(conversation.customerName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {conversation.customerName ?? "Anonymous visitor"}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {conversation.lastMessagePreview}
                          </p>
                          <Badge
                            variant={getStatusBadgeVariant(conversation.status)}
                            className="text-xs capitalize"
                          >
                            {conversation.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                  <a href="/dashboard/conversations">View All Conversations</a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>AI Insights</span>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-3 rounded-lg ${INSIGHT_TONE_STYLES[insight.tone]}`}
                    >
                      <div className="flex items-start space-x-2">
                        <insight.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{insight.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" asChild>
                  <a href="/dashboard/analytics">View All Insights</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Bot Status</span>
                <div
                  className={`h-2 w-2 rounded-full ${
                    overview.botStatus.online ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                  }`}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={overview.botStatus.online ? "default" : "outline"} className={overview.botStatus.online ? "bg-green-600" : ""}>
                    {overview.botStatus.online ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Uptime</span>
                  <span className="text-sm font-medium">
                    {percentageFormatter.format(overview.botStatus.uptimePercent)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Primary model</span>
                  <span className="text-sm font-medium">{overview.botStatus.primaryModel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last trained</span>
                  <span className="text-sm font-medium">
                    {formatRelativeTime(overview.botStatus.lastTrainingAt)}
                  </span>
                </div>
              </div>
              <Button className="w-full mt-4" size="sm" asChild>
                <a href="/dashboard/training">
                  <Bot className="mr-2 h-4 w-4" />
                  Train Bot
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Language Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.languageDistribution.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No language data yet"
                    description="Language distribution will appear as conversations come in"
                    variant="compact"
                  />
                ) : (
                  overview.languageDistribution.map((item, index) => (
                    <div key={item.language + index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {item.language}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({formatNumber(item.count)})
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {percentageFormatter.format(item.percentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getLanguageColor(item.language)}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Period Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">
                    {percentageFormatter.format(overview.quickStats.satisfaction)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Satisfaction</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Zap className="h-8 w-8 text-purple-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">
                    {formatSeconds(overview.quickStats.avgResponseTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">
                    {formatNumber(overview.summary.totalConversations)}
                  </div>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold">
                    {costFormatter.format(overview.quickStats.totalCostUSD)}
                  </div>
                  <p className="text-xs text-muted-foreground">AI Spend</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
