import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TelemetryResponse } from "@/app/api/dashboard/telemetry/types";
import type { DashboardTelemetryDomainBreakdown } from "@/hooks/use-dashboard-telemetry";

interface TenantStatsProps {
  domainBreakdown: DashboardTelemetryDomainBreakdown[];
  tokens: TelemetryResponse["tokens"] | undefined;
  performance: TelemetryResponse["performance"] | undefined;
  loading: boolean;
}

export function TenantStats({ domainBreakdown, tokens, performance, loading }: TenantStatsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Tenant Breakdown</CardTitle>
          <CardDescription>Requests and spend split by customer domain</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
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
          {loading ? (
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
