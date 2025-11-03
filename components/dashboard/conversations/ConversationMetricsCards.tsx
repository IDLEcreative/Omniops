import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs uppercase tracking-wider font-medium">
            Total Conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-4xl font-bold tracking-tight">
            {loading && !data ? <SkeletonBar /> : data?.total.toLocaleString() ?? "—"}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">vs previous period:</span>
            <span className={`font-semibold ${
              (data?.change ?? 0) > 0 ? 'text-green-600 dark:text-green-400' :
              (data?.change ?? 0) < 0 ? 'text-red-600 dark:text-red-400' :
              'text-muted-foreground'
            }`}>
              {loading && !data ? "—" : `${(data?.change ?? 0) > 0 ? '+' : ''}${(data?.change ?? 0).toFixed(1)}%`}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs uppercase tracking-wider font-medium">
            Status Breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["active", "waiting", "resolved"] as const).map((status) => {
            const count = data?.statusCounts[status] ?? 0;
            const percentage = totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0;
            return (
              <div key={status} className="flex items-center justify-between group">
                <div className="flex items-center space-x-2.5">
                  <Badge variant={statusBadgeVariant(status)} className="min-w-[80px] justify-center">
                    {STATUS_LABELS[status]}
                  </Badge>
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  {loading && !data ? "—" : (
                    <>
                      <span className="text-foreground">{count.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1.5">·</span>
                      <span className="text-muted-foreground ml-1.5">{percentage}%</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardDescription className="text-xs uppercase tracking-wider font-medium">
            Peak Hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && !data ? (
            <SkeletonList count={3} />
          ) : data && data.peakHours.length > 0 ? (
            data.peakHours.map((entry, index) => (
              <div key={entry.hour} className="flex items-center justify-between text-sm group">
                <div className="flex items-center gap-2">
                  <div className={`w-1 h-8 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-blue-400' :
                    'bg-blue-300'
                  }`} />
                  <span className="text-foreground font-medium">{entry.label}</span>
                </div>
                <Badge variant={levelVariant[entry.level] ?? "outline"} className="min-w-[50px] justify-center font-semibold">
                  {entry.count}
                </Badge>
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
