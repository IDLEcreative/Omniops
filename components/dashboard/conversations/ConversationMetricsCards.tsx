import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const STATUS_LABELS: Record<"active" | "waiting" | "resolved", string> = {
  active: "Active",
  waiting: "Waiting",
  resolved: "Resolved",
};

const levelVariant: Record<string, BadgeVariant> = {
  high: "secondary",
  medium: "outline",
  low: "outline",
};

function statusBadgeVariant(status: "active" | "waiting" | "resolved"): BadgeVariant {
  switch (status) {
    case "resolved":
      return "outline";
    case "waiting":
      return "secondary";
    default:
      return "default";
  }
}

function SkeletonBar() {
  return <span className="inline-block h-6 w-24 rounded bg-muted animate-pulse" />;
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-8 w-full rounded bg-muted animate-pulse" />
      ))}
    </div>
  );
}

interface ConversationMetricsCardsProps {
  data: {
    total: number;
    change: number;
    statusCounts: {
      active: number;
      waiting: number;
      resolved: number;
    };
    peakHours: Array<{
      hour: number;
      label: string;
      count: number;
      level: string;
    }>;
  } | null;
  loading: boolean;
  totalStatus: number;
}

export function ConversationMetricsCards({
  data,
  loading,
  totalStatus,
}: ConversationMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Conversations</CardTitle>
          <CardDescription>Count and change vs previous period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold">
            {loading && !data ? <SkeletonBar /> : data?.total.toLocaleString() ?? "—"}
          </div>
          <div className="text-sm text-muted-foreground">
            Change: {loading && !data ? "—" : `${(data?.change ?? 0).toFixed(1)}%`}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
          <CardDescription>Active vs waiting vs resolved conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(["active", "waiting", "resolved"] as const).map((status) => {
            const count = data?.statusCounts[status] ?? 0;
            const percentage = totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0;
            return (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant={statusBadgeVariant(status)}>{STATUS_LABELS[status]}</Badge>
                </div>
                <div className="text-sm font-medium">
                  {loading && !data ? "—" : `${count.toLocaleString()} · ${percentage}%`}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peak Hours</CardTitle>
          <CardDescription>Highest-volume times in this range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && !data ? (
            <SkeletonList count={3} />
          ) : data && data.peakHours.length > 0 ? (
            data.peakHours.map((entry) => (
              <div key={entry.hour} className="flex items-center justify-between text-sm">
                <span>{entry.label}</span>
                <Badge variant={levelVariant[entry.level] ?? "outline"}>{entry.count}</Badge>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Clock}
              title="No peak hours data"
              description="Peak hour patterns will emerge as more conversations are recorded"
              variant="compact"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
