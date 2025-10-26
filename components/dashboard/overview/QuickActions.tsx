/**
 * QuickActions - Dashboard sidebar with bot status, language distribution, and summary
 * Right column quick action cards
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Users,
  UserCheck,
  Zap,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardOverview } from "@/hooks/use-dashboard-overview";
import {
  formatNumber,
  formatRelativeTime,
  formatPercentageNoSign,
  formatSeconds,
  formatCost,
  getLanguageColor,
} from "@/lib/dashboard/overview-utils";

interface QuickActionsProps {
  overview: DashboardOverview;
}

export function QuickActions({ overview }: QuickActionsProps) {
  return (
    <div className="col-span-1 lg:col-span-2 space-y-4">
      {/* Bot Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Bot Status</span>
            <div
              className={`h-2 w-2 rounded-full ${
                overview.botStatus.online
                  ? "bg-green-500 animate-pulse"
                  : "bg-muted-foreground"
              }`}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={overview.botStatus.online ? "default" : "outline"}
                className={overview.botStatus.online ? "bg-green-600" : ""}
              >
                {overview.botStatus.online ? "Online" : "Offline"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Uptime</span>
              <span className="text-sm font-medium">
                {formatPercentageNoSign(overview.botStatus.uptimePercent)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Primary model</span>
              <span className="text-sm font-medium">{overview.botStatus.primaryModel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last trained</span>
              <span className="text-sm font-medium">
                {formatRelativeTime(overview.botStatus.lastTrainingAt)}
              </span>
            </div>
          </div>
          <Button className="w-full mt-4" size="sm" asChild>
            <a href="/dashboard/training">
              <Bot className="mr-2 h-4 w-4" />
              Train Bot
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Language Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Language Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overview.languageDistribution.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No language data yet"
                description="Language distribution will appear as conversations come in"
                variant="compact"
              />
            ) : (
              overview.languageDistribution.map((item, index) => (
                <div key={item.language + index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {item.language}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({formatNumber(item.count)})
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatPercentageNoSign(item.percentage)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getLanguageColor(item.language)}`}
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Period Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Period Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <UserCheck className="h-8 w-8 text-green-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {formatPercentageNoSign(overview.quickStats.satisfaction)}
              </div>
              <p className="text-xs text-muted-foreground">Satisfaction</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Zap className="h-8 w-8 text-purple-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {formatSeconds(overview.quickStats.avgResponseTime)}
              </div>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {formatNumber(overview.summary.totalConversations)}
              </div>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-1" />
              <div className="text-2xl font-bold">
                {formatCost(overview.quickStats.totalCostUSD)}
              </div>
              <p className="text-xs text-muted-foreground">AI Spend</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
