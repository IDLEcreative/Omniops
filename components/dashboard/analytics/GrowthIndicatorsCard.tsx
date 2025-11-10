/**
 * Growth Indicators Card Component
 *
 * Displays growth metrics and trends:
 * - Conversation growth rate
 * - Engagement trend direction
 * - Response time improvement/degradation
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface GrowthIndicatorsCardProps {
  indicators: {
    conversation_growth_rate: number;
    engagement_trend: 'up' | 'down' | 'stable';
    response_time_trend: 'improving' | 'degrading' | 'stable';
  };
}

export function GrowthIndicatorsCard({ indicators }: GrowthIndicatorsCardProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | 'improving' | 'degrading') => {
    if (trend === 'up' || trend === 'improving') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'down' || trend === 'degrading') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Growth & Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Conversation Growth</p>
              <p className="text-lg font-semibold">
                {indicators.conversation_growth_rate > 0 ? '+' : ''}
                {indicators.conversation_growth_rate.toFixed(1)}%
              </p>
            </div>
            {getTrendIcon(
              indicators.conversation_growth_rate > 0
                ? 'up'
                : indicators.conversation_growth_rate < 0
                ? 'down'
                : 'stable'
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Engagement</p>
              <p className="text-lg font-semibold capitalize">{indicators.engagement_trend}</p>
            </div>
            {getTrendIcon(indicators.engagement_trend)}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Response Time</p>
              <p className="text-lg font-semibold capitalize">{indicators.response_time_trend}</p>
            </div>
            {getTrendIcon(indicators.response_time_trend)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
