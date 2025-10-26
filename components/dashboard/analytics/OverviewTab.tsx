"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, TrendingUp } from "lucide-react";

interface DailySentimentEntry {
  date: string;
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  satisfactionScore: number;
}

interface TopQueryEntry {
  query: string;
  count: number;
  percentage: number;
}

interface OverviewTabProps {
  dailySentiment: DailySentimentEntry[];
  topQueries: TopQueryEntry[];
  isLoading: boolean;
}

const formatScore = (score: number | undefined) =>
  score !== undefined ? `${score.toFixed(2)}/5` : "—";

export function OverviewTab({ dailySentiment, topQueries, isLoading }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Sentiment & Satisfaction</CardTitle>
          <CardDescription>
            Summaries of each day's sentiment and satisfaction score.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-12 w-full rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && dailySentiment.length === 0 && (
            <EmptyState
              icon={TrendingUp}
              title="No sentiment data yet"
              description="Sentiment analysis will appear as conversations are processed"
              actionLabel="Start Conversations"
              actionHref="/dashboard/settings"
              variant="default"
            />
          )}
          {dailySentiment.map((entry) => (
            <div
              key={entry.date}
              className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">
                  {new Date(entry.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.total} messages · {formatScore(entry.satisfactionScore)}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Badge variant="secondary">{entry.positive} 👍</Badge>
                <Badge variant="outline">{entry.neutral} 😐</Badge>
                <Badge variant="destructive">{entry.negative} 👎</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Customer Queries</CardTitle>
          <CardDescription>Most frequent queries during this period.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-10 w-full rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && topQueries.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No query patterns yet"
              description="Popular customer queries will be identified as conversations accumulate"
              actionLabel="View Integration Guide"
              actionHref="/dashboard/settings"
              variant="default"
            />
          )}
          {topQueries.map((item) => (
            <div key={item.query} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.query}</span>
                <span className="text-xs text-muted-foreground">
                  {item.count.toLocaleString()} · {item.percentage}%
                </span>
              </div>
              <Progress value={item.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
