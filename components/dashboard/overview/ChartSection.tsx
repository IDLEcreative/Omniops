/**
 * ChartSection - Performance overview chart
 * Displays conversation volume and satisfaction trends
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardOverview } from "@/hooks/use-dashboard-overview";
import { formatNumber, formatShortDay, formatPercentageNoSign } from "@/lib/dashboard/overview-utils";

interface ChartSectionProps {
  overview: DashboardOverview;
  days: number;
  loading: boolean;
  onRefresh: () => void;
}

export function ChartSection({ overview, days, loading, onRefresh }: ChartSectionProps) {
  const maxTrendConversations = useMemo(() => {
    if (!overview.trend.length) return 1;
    return Math.max(...overview.trend.map((point) => point.conversations), 1);
  }, [overview.trend]);

  return (
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
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
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
              description={`Start by adding the chat widget to your website. Conversations from the last ${days} day${days === 1 ? "" : "s"} will appear here.`}
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
                      {formatPercentageNoSign(point.satisfactionScore)} / 5
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
