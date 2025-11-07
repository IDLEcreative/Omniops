import { MetricCard } from './MetricCard';
import { MessageCircle, Clock, TrendingUp, Users, AlertCircle, Target } from 'lucide-react';
import type { DashboardAnalyticsData } from '@/types/dashboard';

interface MetricsOverviewProps {
  data: DashboardAnalyticsData;
}

export function MetricsOverview({ data }: MetricsOverviewProps) {
  const positivePercentage = data.metrics.totalMessages > 0
    ? (data.metrics.positiveMessages / data.metrics.totalMessages) * 100
    : 0;

  const negativePercentage = data.metrics.totalMessages > 0
    ? (data.metrics.negativeMessages / data.metrics.totalMessages) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Messages"
        value={data.metrics.totalMessages}
        icon={MessageCircle}
        description={`${data.metrics.userMessages} from users`}
      />

      <MetricCard
        title="Avg Response Time"
        value={`${data.responseTime.toFixed(2)}s`}
        icon={Clock}
        description="Time to first response"
      />

      <MetricCard
        title="Satisfaction Score"
        value={`${data.satisfactionScore.toFixed(1)}/5.0`}
        icon={TrendingUp}
        description="Average customer satisfaction"
      />

      <MetricCard
        title="Resolution Rate"
        value={`${data.resolutionRate}%`}
        icon={Target}
        description="Successfully resolved queries"
      />

      <MetricCard
        title="Positive Sentiment"
        value={`${positivePercentage.toFixed(1)}%`}
        icon={Users}
        description={`${data.metrics.positiveMessages} positive messages`}
      />

      <MetricCard
        title="Negative Sentiment"
        value={`${negativePercentage.toFixed(1)}%`}
        icon={AlertCircle}
        description={`${data.metrics.negativeMessages} negative messages`}
      />
    </div>
  );
}
