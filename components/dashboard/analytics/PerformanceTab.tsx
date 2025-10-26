"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsMetrics {
  responseTime?: number;
  satisfactionScore?: number;
  resolutionRate?: number;
  totalMessages?: number;
  userMessages?: number;
  positiveMessages?: number;
  negativeMessages?: number;
  avgMessagesPerDay?: number;
}

interface PerformanceTabProps {
  metrics?: AnalyticsMetrics;
}

const formatNumber = (value: number | undefined) =>
  value !== undefined ? value.toLocaleString() : "—";

const formatSeconds = (seconds: number | undefined) => {
  if (seconds === undefined) return "—";
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
  return `${seconds.toFixed(1)}s`;
};

const formatScore = (score: number | undefined) =>
  score !== undefined ? `${score.toFixed(2)}/5` : "—";

const formatRate = (rate: number | undefined) =>
  rate !== undefined ? `${rate.toFixed(1)}%` : "—";

export function PerformanceTab({ metrics }: PerformanceTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Response Metrics</CardTitle>
          <CardDescription>Speed and volume indicators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Average response time</span>
            <span className="font-medium">{formatSeconds(metrics?.responseTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Messages per day</span>
            <span className="font-medium">{formatNumber(metrics?.avgMessagesPerDay)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total messages</span>
            <span className="font-medium">{formatNumber(metrics?.totalMessages)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Satisfaction</CardTitle>
          <CardDescription>User feedback trends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Score</span>
            <span className="font-medium">{formatScore(metrics?.satisfactionScore)}</span>
          </div>
          <div className="flex justify-between">
            <span>Positive messages</span>
            <span className="font-medium">{formatNumber(metrics?.positiveMessages)}</span>
          </div>
          <div className="flex justify-between">
            <span>Negative messages</span>
            <span className="font-medium">{formatNumber(metrics?.negativeMessages)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolution</CardTitle>
          <CardDescription>Completion and deflection rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Resolution rate</span>
            <span className="font-medium">{formatRate(metrics?.resolutionRate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer messages handled</span>
            <span className="font-medium">{formatNumber(metrics?.userMessages)}</span>
          </div>
          <div className="flex justify-between">
            <span>Net sentiment</span>
            <span className="font-medium">
              {formatNumber(
                (metrics?.positiveMessages ?? 0) - (metrics?.negativeMessages ?? 0)
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
