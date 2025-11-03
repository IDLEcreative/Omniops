"use client";

import { useMemo, useState } from "react";
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
import { RefreshCw } from "lucide-react";
import { useDashboardTelemetry } from "@/hooks/use-dashboard-telemetry";
import { LiveMetrics } from "@/components/dashboard/telemetry/LiveMetrics";
import { PerformanceCharts } from "@/components/dashboard/telemetry/PerformanceCharts";
import { ModelUsagePanel } from "@/components/dashboard/telemetry/ModelUsagePanel";
import { TenantStats } from "@/components/dashboard/telemetry/TenantStats";

type RangeKey = "24h" | "7d" | "30d" | "90d";

const RANGE_TO_DAYS: Record<RangeKey, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
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

      <LiveMetrics
        overview={overview}
        cost={cost}
        performance={performance}
        loading={isInitialLoading}
      />

      <PerformanceCharts
        hourlyTrend={hourlyTrend}
        cost={cost}
        loading={isInitialLoading}
      />

      <ModelUsagePanel
        modelUsage={modelUsage}
        liveSessions={liveSessions}
        loading={isInitialLoading}
      />

      <TenantStats
        domainBreakdown={domainBreakdown}
        tokens={tokens}
        performance={performance}
        loading={isInitialLoading}
      />
    </div>
  );
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

function SkeletonLine({ widthClass }: { widthClass: string }) {
  return <div className={`h-4 rounded bg-muted animate-pulse ${widthClass}`} />;
}
