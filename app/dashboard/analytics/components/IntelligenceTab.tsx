/**
 * Intelligence Tab Component
 *
 * Displays business intelligence metrics and insights
 */

import { RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomerJourneyFlow } from '@/components/analytics/CustomerJourneyFlow';
import { ConversionFunnelChart } from '@/components/analytics/ConversionFunnelChart';
import { PeakUsageChart } from '@/components/analytics/PeakUsageChart';
import type { MetricGoal } from '@/types/dashboard';

interface IntelligenceTabProps {
  loading: boolean;
  data: any;
  goals?: MetricGoal[];
}

export function IntelligenceTab({ loading, data, goals = [] }: IntelligenceTabProps) {
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      {data.summary && data.summary.insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Insights
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {data.summary.insights.slice(0, 4).map((insight: any, index: number) => (
              <Alert
                key={index}
                variant={insight.type === 'warning' ? 'destructive' : 'default'}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">{insight.metric}</div>
                  <div className="text-sm">{insight.message}</div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {data.customerJourney && (
        <CustomerJourneyFlow data={data.customerJourney} />
      )}

      {data.conversionFunnel && (
        <ConversionFunnelChart data={data.conversionFunnel} />
      )}

      {data.peakUsage && (
        <PeakUsageChart data={data.peakUsage} />
      )}

      {data.contentGaps && data.contentGaps.unansweredQueries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Content Gaps</h3>
          <div className="p-4 bg-muted rounded-lg">
            <div className="mb-3">
              <span className="text-sm font-medium">Coverage Score: </span>
              <span className="text-lg font-bold">
                {data.contentGaps.coverageScore.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-2">
              {data.contentGaps.unansweredQueries.slice(0, 5).map((query: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-background rounded"
                >
                  <span className="text-sm">{query.query}</span>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>{query.frequency} times</span>
                    <span>{(query.avgConfidence * 100).toFixed(0)}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
