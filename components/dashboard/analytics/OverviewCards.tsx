/**
 * Overview Metrics Cards Component
 *
 * Displays 4 key metric cards:
 * - Total Conversations
 * - Average Response Time
 * - Engagement Score
 * - Completion Rate
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnalyticsOverview } from '@/types/analytics';
import {
  MessageSquare,
  Clock,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface OverviewCardsProps {
  overview: AnalyticsOverview;
}

export function OverviewCards({ overview }: OverviewCardsProps) {
  const metrics = [
    {
      title: 'Total Conversations',
      value: overview.totals.conversations.toLocaleString(),
      icon: <MessageSquare className="h-4 w-4" />,
      subtitle: `${overview.totals.messages.toLocaleString()} messages`,
    },
    {
      title: 'Avg Response Time',
      value: `${(overview.averages.response_time_ms / 1000).toFixed(1)}s`,
      icon: <Clock className="h-4 w-4" />,
      subtitle: `${overview.averages.messages_per_conversation.toFixed(1)} msgs/conv`,
    },
    {
      title: 'Engagement Score',
      value: overview.averages.engagement_score.toString(),
      icon: <Activity className="h-4 w-4" />,
      subtitle: 'Out of 100',
      badge: overview.averages.engagement_score >= 70 ? 'success' : 'warning',
    },
    {
      title: 'Completion Rate',
      value: `${(overview.rates.completion_rate * 100).toFixed(0)}%`,
      icon: <CheckCircle className="h-4 w-4" />,
      subtitle: `${(overview.rates.resolution_rate * 100).toFixed(0)}% resolved`,
      badge: overview.rates.completion_rate >= 0.7 ? 'success' : 'warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className="text-muted-foreground">{metric.icon}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.badge && (
                <Badge variant={metric.badge === 'success' ? 'default' : 'secondary'}>
                  {metric.badge === 'success' ? 'Good' : 'Fair'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
