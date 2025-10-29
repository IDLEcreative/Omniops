/**
 * Operation Analytics Card
 * Displays WooCommerce operation metrics and performance
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface OperationMetric {
  operation: string;
  count: number;
  avg_duration_ms: number;
  success_rate: number;
}

interface OperationAnalyticsCardProps {
  stats: {
    total_operations: number;
    success_rate: number;
    avg_duration_ms: number;
    operations_by_type: Record<string, number>;
    errors_by_type: Record<string, number>;
  };
  period: string;
}

export function OperationAnalyticsCard({ stats, period }: OperationAnalyticsCardProps) {
  // Get top 5 most used operations
  const topOperations = Object.entries(stats.operations_by_type)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([operation, count]) => ({
      operation,
      count,
      percentage: ((count / stats.total_operations) * 100).toFixed(1)
    }));

  // Get top 3 error types (if any)
  const topErrors = Object.entries(stats.errors_by_type)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const formatOperationName = (op: string) => {
    return op
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Operation Analytics
          <span className="text-sm font-normal text-muted-foreground">
            ({period})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Total Operations
            </div>
            <div className="text-2xl font-bold">{stats.total_operations.toLocaleString()}</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Success Rate
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.success_rate.toFixed(1)}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Avg Response
            </div>
            <div className="text-2xl font-bold">
              {stats.avg_duration_ms.toLocaleString()}ms
            </div>
          </div>
        </div>

        {/* Top Operations */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Most Used Operations</h4>
          <div className="space-y-2">
            {topOperations.length > 0 ? (
              topOperations.map(({ operation, count, percentage }) => (
                <div key={operation} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">
                        {formatOperationName(operation)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count} calls ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No operations recorded yet
              </p>
            )}
          </div>
        </div>

        {/* Error Summary (if any errors) */}
        {topErrors.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Recent Errors
            </h4>
            <div className="space-y-2">
              {topErrors.map(([errorType, count]) => (
                <div key={errorType} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-orange-600">{errorType}</span>
                  <span className="text-muted-foreground">{count} occurrences</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.total_operations === 0 && (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No operation data available yet.
              <br />
              Start using WooCommerce operations to see analytics here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
