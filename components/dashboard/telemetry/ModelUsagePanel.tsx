import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardTelemetryModelUsage } from "@/hooks/use-dashboard-telemetry";

interface ModelUsagePanelProps {
  modelUsage: DashboardTelemetryModelUsage[];
  liveSessions: Array<{
    id: string;
    uptime: number;
    model: string | null;
    cost: string;
  }>;
  loading: boolean;
}

export function ModelUsagePanel({ modelUsage, liveSessions, loading }: ModelUsagePanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Model Usage</CardTitle>
          <CardDescription>Distribution of requests, tokens, and spend by model</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
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
          {loading ? (
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
  );
}

function ModelUsageRow({ item }: { item: DashboardTelemetryModelUsage }) {
  const cost = formatCurrency((item as any).cost || 0);
  const tokenLabel = `${formatNumber((item as any).tokens || 0)} tokens`;
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
