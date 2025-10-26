/**
 * ActivityFeed - Recent conversations and AI insights
 * Shows recent activity and automated insights
 */

"use client";

import { useMemo } from "react";
import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
  Clock,
  Target,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardOverview } from "@/hooks/use-dashboard-overview";
import {
  getStatusBadgeVariant,
  getInitials,
  formatRelativeTime,
  formatPercentageNoSign,
  INSIGHT_TONE_STYLES,
} from "@/lib/dashboard/overview-utils";

interface InsightConfig {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone: "positive" | "caution" | "info" | "neutral";
}

interface ActivityFeedProps {
  overview: DashboardOverview;
}

export function ActivityFeed({ overview }: ActivityFeedProps) {
  const insights: InsightConfig[] = useMemo(() => {
    const conversationChange = overview.summary.conversationChange;
    const responseChange = overview.summary.avgResponseTimeChange;
    const successRate = overview.quickStats.successRate;

    return [
      {
        id: "conversation-trend",
        title:
          conversationChange >= 0
            ? "Conversation volume increasing"
            : "Conversation volume declining",
        description: `Conversations ${
          conversationChange >= 0 ? "up" : "down"
        } ${formatPercentageNoSign(Math.abs(conversationChange))} vs previous period.`,
        icon: conversationChange >= 0 ? TrendingUp : TrendingDown,
        tone: conversationChange >= 0 ? "positive" : "caution",
      },
      {
        id: "response-performance",
        title:
          responseChange <= 0 ? "Response time improving" : "Response time slower this period",
        description: `Average response time ${
          responseChange <= 0 ? "improved by" : "increased by"
        } ${formatPercentageNoSign(Math.abs(responseChange))} compared with the previous window.`,
        icon: responseChange <= 0 ? Zap : Clock,
        tone: responseChange <= 0 ? "positive" : "caution",
      },
      {
        id: "success-rate",
        title: "Automation success",
        description: `AI handled ${formatPercentageNoSign(successRate)} of requests successfully in the selected period.`,
        icon: successRate >= 95 ? Target : AlertCircle,
        tone: successRate >= 95 ? "info" : "caution",
      },
    ];
  }, [overview.summary, overview.quickStats.successRate]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Conversations</span>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview.recentConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                description="Once customers start chatting, their conversations will appear here"
                variant="compact"
              />
            ) : (
              overview.recentConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(conversation.customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {conversation.customerName ?? "Anonymous visitor"}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {conversation.lastMessagePreview}
                    </p>
                    <Badge
                      variant={getStatusBadgeVariant(conversation.status)}
                      className="text-xs capitalize"
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          <Button variant="outline" className="w-full mt-4" size="sm" asChild>
            <a href="/dashboard/conversations">View All Conversations</a>
          </Button>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Insights</span>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-3 rounded-lg ${INSIGHT_TONE_STYLES[insight.tone]}`}
              >
                <div className="flex items-start space-x-2">
                  <insight.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" size="sm" asChild>
            <a href="/dashboard/analytics">View All Insights</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
