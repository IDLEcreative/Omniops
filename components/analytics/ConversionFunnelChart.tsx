import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { ConversionFunnel } from '@/lib/analytics/business-intelligence-types';

interface ConversionFunnelChartProps {
  data: ConversionFunnel;
}

export function ConversionFunnelChart({ data }: ConversionFunnelChartProps) {
  if (!data?.stages) {
    return null;
  }

  const maxCount = Math.max(...data.stages.map(s => s.enteredCount), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>
          Stage-by-stage conversion rates and bottlenecks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Overall Conversion Rate</div>
            <div className="text-2xl font-bold">{(data.overallConversionRate * 100).toFixed(1)}%</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Avg Time in Funnel</div>
            <div className="text-2xl font-bold">{Math.round(data.avgTimeInFunnel)} min</div>
          </div>
        </div>

        <div className="space-y-2">
          {data.stages.map((stage, index) => {
            const width = (stage.enteredCount / maxCount) * 100;
            const isBottleneck = data.bottlenecks.some(b => b.stage === stage.name);

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stage.name}</span>
                    {isBottleneck && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{stage.enteredCount} entered</span>
                    <span>{stage.completedCount} completed</span>
                    <span className="font-medium text-foreground">
                      {(stage.conversionRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-8 bg-muted rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isBottleneck ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${width}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                    {stage.avgDuration > 0 && `${Math.round(stage.avgDuration)} min avg`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {data.bottlenecks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Identified Bottlenecks
            </h4>
            {data.bottlenecks.map((bottleneck, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{bottleneck.stage}</span>
                  <Badge
                    variant={
                      bottleneck.severity === 'high'
                        ? 'destructive'
                        : bottleneck.severity === 'medium'
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-xs"
                  >
                    {bottleneck.severity} severity
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Potential impact: +{(bottleneck.impact * 100).toFixed(1)}% conversion
                </div>
                <div className="text-xs">{bottleneck.recommendation}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
