/**
 * StatsCards - Dashboard summary metric cards
 * Displays key metrics with trend indicators
 */

"use client";

import { useMemo } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { DashboardOverview } from "@/hooks/use-dashboard-overview";
import {
  formatNumber,
  formatPercentage,
  formatSeconds,
  formatPercentageNoSign,
} from "@/lib/dashboard/overview-utils";

interface SummaryCardConfig {
  id: string;
  name: string;
  value: string;
  change: number;
  icon: ComponentType<{ className?: string }>;
  accentClass: string;
  invertChange?: boolean;
}

interface StatsCardsProps {
  overview: DashboardOverview;
}

export function StatsCards({ overview }: StatsCardsProps) {
  const summaryCards: SummaryCardConfig[] = useMemo(() => {
    return [
      {
        id: "conversations",
        name: "Total Conversations",
        value: formatNumber(overview.summary.totalConversations),
        change: overview.summary.conversationChange,
        icon: MessageSquare,
        accentClass: "bg-blue-100 dark:bg-blue-900/20",
      },
      {
        id: "active-users",
        name: "Active Users",
        value: formatNumber(overview.summary.activeUsers),
        change: overview.summary.activeUsersChange,
        icon: Users,
        accentClass: "bg-green-100 dark:bg-green-900/20",
      },
      {
        id: "response-time",
        name: "Avg Response Time",
        value: formatSeconds(overview.summary.avgResponseTime),
        change: overview.summary.avgResponseTimeChange,
        icon: Clock,
        accentClass: "bg-purple-100 dark:bg-purple-900/20",
        invertChange: true,
      },
      {
        id: "resolution-rate",
        name: "Resolution Rate",
        value: `${formatPercentageNoSign(overview.summary.resolutionRate)}`,
        change: overview.summary.resolutionRateChange,
        icon: CheckCircle,
        accentClass: "bg-orange-100 dark:bg-orange-900/20",
      },
    ];
  }, [overview.summary]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => {
        const improved = card.invertChange ? card.change <= 0 : card.change >= 0;
        const ChangeIcon = improved ? ArrowUpRight : ArrowDownRight;
        const changeLabel = formatPercentage(card.change);

        return (
          <Card key={card.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.name}</CardTitle>
              <div className={`p-2 rounded-full ${card.accentClass}`}>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center pt-1">
                <ChangeIcon
                  className={`h-4 w-4 ${improved ? "text-green-500" : "text-red-500"}`}
                />
                <span className={`text-xs ${improved ? "text-green-500" : "text-red-500"} ml-1`}>
                  {changeLabel}
                </span>
                <span className="text-xs text-muted-foreground ml-2">vs previous period</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
