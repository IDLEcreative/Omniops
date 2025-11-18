import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Server, TrendingUp, Zap } from "lucide-react";
import type { TelemetryResponse } from "@/app/api/dashboard/telemetry/types";

interface LiveMetricsProps {
  overview: TelemetryResponse["overview"] | undefined;
  cost: TelemetryResponse["cost"] | undefined;
  performance: TelemetryResponse["performance"] | undefined;
  loading: boolean;
}

const TREND_LABELS: Record<string, string> = {
  increasing: "Rising spend",
  decreasing: "Lower spend",
  stable: "Stable spend",
};

const TREND_BADGES: Record<string, "default" | "outline" | "secondary"> = {
  increasing: "default",
  decreasing: "secondary",
  stable: "outline",
};

export function LiveMetrics({ overview, cost, performance, loading }: LiveMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Total Requests"
        icon={Zap}
        value={overview ? formatNumber(overview.totalRequests) : undefined}
        hint={overview ? `${overview.successRate}% success` : undefined}
        loading={loading}
      />
      <MetricCard
        title="Active Sessions"
        icon={Server}
        value={overview ? formatNumber(overview.activeSessions) : undefined}
        hint={overview ? overview.timeRange : undefined}
        loading={loading}
      />
      <MetricCard
        title="Average Response Time"
        icon={Clock}
        value={performance ? formatDuration(performance.avgResponseTime) : undefined}
        hint={performance ? `${formatNumber(performance.totalSearches)} searches` : undefined}
        loading={loading}
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
        loading={loading}
      />
    </div>
  );
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

function SkeletonLine({ widthClass }: { widthClass: string }) {
  return <div className={`h-4 rounded bg-muted animate-pulse ${widthClass}`} />;
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
