"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, RefreshCw, Server, TrendingUp, Zap } from "lucide-react";
import {
  DashboardTelemetryData,
  DashboardTelemetryHourlyPoint,
  DashboardTelemetryModelUsage,
  useDashboardTelemetry,
} from "@/hooks/use-dashboard-telemetry";

type RangeKey = "24h" | "7d" | "30d" | "90d";

const RANGE_TO_DAYS: Record<RangeKey, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const TREND_LABELS: Record<DashboardTelemetryData["cost"]["trend"], string> = {
  increasing: "Rising spend",
  decreasing: "Lower spend",
  stable: "Stable spend",
};

const TREND_BADGES: Record<DashboardTelemetryData["cost"]["trend"], "default" | "outline" | "secondary"> = {
  increasing: "default",
  decreasing: "secondary",
  stable: "outline",
};

export default function TelemetryPage() {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("7d");
  const [domainFilter, setDomainFilter] = useState("");
  const days = RANGE_TO_DAYS[selectedRange] ?? 7;

  const { data, loading, error, refresh } = useDashboardTelemetry({
    days,
    domain: domainFilter || undefined,
  });

  const hourlyTrend = useMemo(() => data?.hourlyTrend ?? [], [data]);
  const modelUsage = useMemo(() => data?.modelUsage ?? [], [data]);
  const domainBreakdown = useMemo(() => data?.domainBreakdown ?? [], [data]);
  const liveSessions = useMemo(() => data?.live.sessionsData ?? [], [data]);

  const maxRequests = useMemo(() => {
    if (hourlyTrend.length === 0) return 0;
    return Math.max(...hourlyTrend.map((point) => point.requests));
  }, [hourlyTrend]);

  const maxCost = useMemo(() => {
    if (hourlyTrend.length === 0) return 0;
    return Math.max(...hourlyTrend.map((point) => point.cost));
  }, [hourlyTrend]);

  const trendPoints = useMemo(() => {
    return hourlyTrend.map((point) => ({
      ...point,
      hourLabel: formatHour(point.hour),
    }));
  }, [hourlyTrend]);

  const overview = data?.overview;
  const cost = data?.cost;
  const tokens = data?.tokens;
  const performance = data?.performance;
  const health = data?.health;

  const isInitialLoading = loading && !data;
  const healthBadgeClass = health?.stale
    ? "border border-destructive/40 bg-destructive/10 text-destructive"
    : "border border-emerald-400/40 bg-emerald-100 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200";
  const healthStatusLabel = health?.stale ? "Rollups stale" : "Rollups fresh";
  const healthSubtitle =
    health?.rollupSource === "rollup"
      ? `Last rollup ${formatFreshness(health.rollupFreshnessMinutes)}`
      : "Using raw telemetry (rollups unavailable)";

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Telemetry & Cost Control</h1>
          <p className="text-muted-foreground">
            Monitor model usage, cost trends, live sessions, and request performance across tenants.
          </p>
          {isInitialLoading ? (
            <div className="mt-2">
              <SkeletonLine widthClass="w-32" />
            </div>
          ) : health ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className={healthBadgeClass}>
                {healthStatusLabel}
              </Badge>
              <span>{healthSubtitle}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as RangeKey)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refresh()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Unable to load telemetry metrics. Refresh the page or adjust the selected range.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Drill into telemetry for a specific tenant domain</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Filter by domain (e.g. acme.com)"
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={() => setDomainFilter("")} disabled={!domainFilter}>
            Clear filter
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Requests"
          icon={Zap}
          value={overview ? formatNumber(overview.totalRequests) : undefined}
          hint={overview ? `${overview.successRate}% success` : undefined}
          loading={isInitialLoading}
        />
        <MetricCard
          title="Active Sessions"
          icon={Server}
          value={overview ? formatNumber(overview.activeSessions) : undefined}
          hint={overview ? overview.timeRange : undefined}
          loading={isInitialLoading}
        />
        <MetricCard
          title="Average Response Time"
          icon={Clock}
          value={performance ? formatDuration(performance.avgResponseTime) : undefined}
          hint={performance ? `${formatNumber(performance.totalSearches)} searches` : undefined}
          loading={isInitialLoading}
        />
        <MetricCard
          title="Cost Trend"
          icon={TrendingUp}
          value={cost ? formatCurrency(cost.total) : undefined}
          hint={
            cost ? (
              <Badge variant={TREND_BADGES[cost.trend]}>
                {TREND_LABELS[cost.trend]}
              </Badge>
            ) : undefined
          }
          loading={isInitialLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Hourly Trend</CardTitle>
            <CardDescription>Request volume with cost intensity for the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <SkeletonPlaceholder heightClass="h-40" />
            ) : trendPoints.length === 0 ? (
              <EmptyState message="No telemetry records for the selected range." />
            ) : (
              <TelemetrySparkline points={trendPoints} maxRequests={maxRequests} maxCost={maxCost} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Spend projections based on historical usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInitialLoading ? (
              <SkeletonList count={4} />
            ) : cost ? (
              <>
                <BreakdownRow label="Total Cost" value={formatCurrency(cost.total)} />
                <BreakdownRow label="Average per Request" value={formatCurrency(cost.average)} />
                <BreakdownRow label="Estimated Daily" value={formatCurrency(cost.projectedDaily)} />
                <BreakdownRow label="Estimated Monthly" value={formatCurrency(cost.projectedMonthly)} />
                <BreakdownRow label="Spend per Hour" value={formatCurrency(cost.perHour)} />
              </>
            ) : (
              <EmptyState message="No cost data available." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Model Usage</CardTitle>
            <CardDescription>Distribution of requests, tokens, and spend by model</CardDescription>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <SkeletonList count={5} />
            ) : modelUsage.length === 0 ? (
              <EmptyState message="No model usage data captured yet." />
            ) : (
              <div className="space-y-3">
                {modelUsage.map((item) => (
                  <ModelUsageRow key={item.model} item={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Live Sessions</CardTitle>
            <CardDescription>Longest-running conversations and their estimated cost</CardDescription>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <SkeletonList count={4} />
            ) : liveSessions.length === 0 ? (
              <EmptyState message="No active sessions right now." />
            ) : (
              <div className="space-y-3">
                {liveSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">Session {session.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(session.uptime * 1000)} · {session.model || "Unknown model"}
                      </p>
                    </div>
                    <Badge variant="outline">${session.cost}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tenant Breakdown</CardTitle>
            <CardDescription>Requests and spend split by customer domain</CardDescription>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <SkeletonList count={4} />
            ) : domainBreakdown.length === 0 ? (
              <EmptyState message="No tenant data recorded for this range." />
            ) : (
              <div className="space-y-3">
                {domainBreakdown.map((entry) => (
                  <div key={entry.domain} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{entry.domain}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(entry.requests)} requests
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(entry.cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Token & Search Stats</CardTitle>
            <CardDescription>Aggregate usage across the selected period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isInitialLoading ? (
              <SkeletonList count={4} />
            ) : tokens && performance ? (
              <>
                <BreakdownRow label="Total Tokens" value={formatNumber(tokens.total)} />
                <BreakdownRow label="Input Tokens" value={formatNumber(tokens.totalInput)} />
                <BreakdownRow label="Output Tokens" value={formatNumber(tokens.totalOutput)} />
                <BreakdownRow label="Average Tokens per Request" value={formatNumber(tokens.avgPerRequest)} />
                <BreakdownRow label="Average Searches per Request" value={performance.avgSearchesPerRequest} />
                <BreakdownRow label="Average Iterations" value={performance.avgIterations} />
              </>
            ) : (
              <EmptyState message="Token metrics unavailable for this selection." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatHour(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString() : "0";
}

function toCurrencyNumber(value: string | number) {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatCurrency(value: string | number) {
  const numeric = toCurrencyNumber(value);
  return `$${numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatFreshness(minutes: number | null): string {
  if (minutes === null) return "unknown";
  if (minutes < 1) return "<1 min ago";
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hr ago`;
  const days = hours / 24;
  const roundedDays = Math.round(days);
  return `${roundedDays} day${roundedDays === 1 ? "" : "s"} ago`;
}

function formatDuration(milliseconds: number) {
  if (!Number.isFinite(milliseconds)) return "—";
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)} ms`;
  }
  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`;
  }
  const minutes = seconds / 60;
  return `${minutes.toFixed(1)} min`;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  hint,
  loading,
}: {
  title: string;
  value?: string;
  icon: typeof Zap;
  hint?: ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="rounded-full bg-muted/50 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <SkeletonLine widthClass="w-24" /> : value ?? "—"}
        </div>
        <div className="pt-1 text-xs text-muted-foreground">
          {loading ? <SkeletonLine widthClass="w-16" /> : hint ?? "\u00A0"}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ModelUsageRow({ item }: { item: DashboardTelemetryModelUsage }) {
  const cost = formatCurrency(item.cost);
  const tokenLabel = `${formatNumber(item.tokens)} tokens`;
  const requestLabel = `${formatNumber(item.count)} requests`;
  return (
    <div className="flex items-start justify-between rounded-md border px-3 py-2">
      <div>
        <p className="text-sm font-semibold">{item.model}</p>
        <p className="text-xs text-muted-foreground">
          {requestLabel} · {tokenLabel}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{cost}</p>
        <p className="text-xs text-muted-foreground">{item.percentage}% share</p>
      </div>
    </div>
  );
}

function TelemetrySparkline({
  points,
  maxRequests,
  maxCost,
}: {
  points: (DashboardTelemetryHourlyPoint & { hourLabel: string })[];
  maxRequests: number;
  maxCost: number;
}) {
  return (
    <div className="flex h-48 items-end gap-2">
      {points.map((point) => {
        const requestHeight = maxRequests > 0 ? Math.round((point.requests / maxRequests) * 100) : 0;
        const costRatio = maxCost > 0 ? point.cost / maxCost : 0;
        const background = `rgba(59,130,246,${0.3 + costRatio * 0.4})`;
        return (
          <div key={point.hour} className="flex w-full flex-col items-center gap-2">
            <div className="flex h-full w-full items-end rounded-t-lg bg-muted/30">
              <div
                className="w-full rounded-t-lg border border-primary/40"
                style={{ height: `${requestHeight}%`, backgroundColor: background }}
              />
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground">
              {formatNumber(point.requests)} req
            </div>
            <div className="text-[11px] text-muted-foreground">{point.hourLabel}</div>
            <div className="text-[11px] text-muted-foreground">{formatCurrency(point.cost)}</div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function SkeletonLine({ widthClass }: { widthClass: string }) {
  return <div className={`h-4 rounded bg-muted animate-pulse ${widthClass}`} />;
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-10 w-full rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonPlaceholder({ heightClass }: { heightClass: string }) {
  return <div className={`w-full rounded-lg bg-muted animate-pulse ${heightClass}`} />;
}
