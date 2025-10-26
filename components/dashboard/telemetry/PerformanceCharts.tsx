import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTelemetryData, DashboardTelemetryHourlyPoint } from "@/hooks/use-dashboard-telemetry";

interface PerformanceChartsProps {
  hourlyTrend: DashboardTelemetryHourlyPoint[];
  cost: DashboardTelemetryData["cost"] | undefined;
  loading: boolean;
}

export function PerformanceCharts({ hourlyTrend, cost, loading }: PerformanceChartsProps) {
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

  return (
    <div className="grid gap-4 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Hourly Trend</CardTitle>
          <CardDescription>Request volume with cost intensity for the selected range</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
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
          {loading ? (
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

function BreakdownRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
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
