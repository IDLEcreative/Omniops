import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const STATUS_LABELS: Record<"active" | "waiting" | "resolved", string> = {
  active: "Active",
  waiting: "Waiting",
  resolved: "Resolved",
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
    languages?: Array<{
      language: string;
      percentage: number;
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
  // Get top 2 languages for compact display
  const topLanguages = data?.languages?.slice(0, 2) ?? [];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total Conversations
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold">
              {loading && !data ? "—" : data?.total.toLocaleString() ?? "—"}
            </span>
            <span className={`text-[11px] font-semibold ${
              (data?.change ?? 0) > 0 ? 'text-green-600 dark:text-green-400' :
              (data?.change ?? 0) < 0 ? 'text-red-600 dark:text-red-400' :
              'text-muted-foreground'
            }`}>
              {loading && !data ? "" : `${(data?.change ?? 0) > 0 ? '+' : ''}${(data?.change ?? 0).toFixed(1)}%`}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Status Distribution
          </div>
          <div className="flex items-center gap-2 mt-1">
            {(["active", "waiting", "resolved"] as const).map((status) => {
              const count = data?.statusCounts[status] ?? 0;
              return (
                <div key={status} className="flex items-center gap-1">
                  <Badge variant={statusBadgeVariant(status)} className="h-4 px-1 text-[9px]">
                    {status.charAt(0).toUpperCase()}
                  </Badge>
                  <span className="text-xs font-semibold">
                    {loading && !data ? "—" : count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Peak Activity
          </div>
          <div className="flex items-center gap-2 mt-1">
            {loading && !data ? (
              <span className="text-xs">—</span>
            ) : data && data.peakHours.length > 0 ? (
              <>
                <span className="text-[11px] text-muted-foreground">{data.peakHours[0].label}:</span>
                <span className="text-xs font-semibold">{data.peakHours[0].count}</span>
                {data.peakHours[1] && (
                  <>
                    <span className="text-[11px] text-muted-foreground ml-1">{data.peakHours[1].label}:</span>
                    <span className="text-xs font-semibold">{data.peakHours[1].count}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground">No data</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Languages
          </div>
          <div className="flex items-center gap-2 mt-1">
            {loading && !data ? (
              <span className="text-xs">—</span>
            ) : topLanguages.length > 0 ? (
              topLanguages.map((lang, idx) => (
                <div key={lang.language} className="flex items-center gap-1">
                  <div className={`w-1 h-3 rounded-full ${idx === 0 ? 'bg-purple-500' : 'bg-purple-400'}`} />
                  <span className="text-[11px]">{lang.language}:</span>
                  <span className="text-xs font-semibold">{lang.percentage}%</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-muted-foreground">No data</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
