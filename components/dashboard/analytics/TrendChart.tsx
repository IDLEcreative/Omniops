/**
 * Trend Chart Component
 *
 * Simple horizontal bar chart visualization for daily metrics.
 * Shows trends for conversations, response time, or engagement.
 */

import { useMemo } from 'react';
import { DailyMetric } from '@/types/analytics';

interface TrendChartProps {
  data: DailyMetric[];
  metric: 'conversations' | 'response_time' | 'engagement';
}

export function TrendChart({ data, metric }: TrendChartProps) {
  const chartData = useMemo(() => {
    return data.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value:
        metric === 'conversations'
          ? day.conversations
          : metric === 'response_time'
          ? day.avg_response_time_ms / 1000 // Convert to seconds
          : day.completion_rate * 100, // Convert to percentage
    }));
  }, [data, metric]);

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-2">
      {chartData.map((day, index) => {
        const barWidth = maxValue > 0 ? (day.value / maxValue) * 100 : 0;

        return (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16 text-right">
              {day.date}
            </span>
            <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <span className="text-sm font-medium w-16">
              {day.value.toFixed(metric === 'conversations' ? 0 : 1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
