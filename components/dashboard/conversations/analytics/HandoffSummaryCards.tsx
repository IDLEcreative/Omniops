/**
 * Handoff Summary Cards
 *
 * Displays key metrics for human handoff performance at a glance.
 * Shows total requests, average response time, and SLA performance.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface HandoffMetrics {
  totalRequests: number;
  avgResponseTime: number;
  slaPerformance: {
    within5min: number;
    within15min: number;
    within30min: number;
    over30min: number;
  };
}

interface HandoffSummaryCardsProps {
  data: HandoffMetrics;
}

export function HandoffSummaryCards({ data }: HandoffSummaryCardsProps) {
  const totalSLATracked =
    data.slaPerformance.within5min +
    data.slaPerformance.within15min +
    data.slaPerformance.within30min +
    data.slaPerformance.over30min;

  const slaSuccessRate = totalSLATracked > 0
    ? Math.round(((data.slaPerformance.within5min + data.slaPerformance.within15min) / totalSLATracked) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalRequests}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Human help requested
          </p>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.avgResponseTime} min</div>
          <p className="text-xs text-muted-foreground mt-1">
            Time to first agent response
          </p>
        </CardContent>
      </Card>

      {/* SLA Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Success Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{slaSuccessRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Responded within 15 minutes
          </p>
        </CardContent>
      </Card>

      {/* SLA Violations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">SLA Violations</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {data.slaPerformance.over30min}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Took over 30 minutes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
