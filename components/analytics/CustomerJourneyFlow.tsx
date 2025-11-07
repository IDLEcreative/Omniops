import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingDown } from 'lucide-react';
import type { CustomerJourneyMetrics } from '@/lib/analytics/business-intelligence-types';

interface CustomerJourneyFlowProps {
  data: CustomerJourneyMetrics;
}

export function CustomerJourneyFlow({ data }: CustomerJourneyFlowProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Journey Analysis</CardTitle>
        <CardDescription>
          Common user paths and conversion metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
            <div className="text-2xl font-bold">{data.conversionRate.toFixed(1)}%</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Avg Sessions to Convert</div>
            <div className="text-2xl font-bold">{data.avgSessionsBeforeConversion.toFixed(1)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Time to Conversion</div>
            <div className="text-2xl font-bold">{Math.round(data.timeToConversion)} min</div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Common User Paths</h4>
          {data.commonPaths.slice(0, 5).map((path, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                {path.path.map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center gap-2 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs">
                      {step}
                    </Badge>
                    {stepIndex < path.path.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">
                  {path.frequency} users
                </span>
                <span className="text-xs font-medium text-green-600">
                  {(path.conversionRate * 100).toFixed(0)}% convert
                </span>
              </div>
            </div>
          ))}
        </div>

        {data.dropOffPoints.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Drop-off Points
            </h4>
            {data.dropOffPoints.slice(0, 3).map((point, index) => (
              <div key={index} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{point.stage}</span>
                  <Badge variant="destructive" className="text-xs">
                    {(point.dropOffRate * 100).toFixed(1)}% drop-off
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg time spent: {Math.round(point.avgTimeSpent)} min
                </div>
                {point.commonQueries.length > 0 && (
                  <div className="mt-2 text-xs">
                    <span className="font-medium">Common queries: </span>
                    {point.commonQueries.slice(0, 2).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
