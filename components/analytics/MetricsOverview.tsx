import { MetricCard } from './MetricCard';
import { ComparisonIndicator } from '@/components/dashboard/analytics/ComparisonIndicator';
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

  // Optional comparison data - may not be present
  const comparison = (data as any).comparison as DashboardAnalyticsData['comparison'];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Messages"
        value={data.metrics.totalMessages}
        icon={MessageCircle}
        description={`${data.metrics.userMessages} from users`}
        rightSlot={
          comparison?.totalMessages && (
            <ComparisonIndicator
              current={comparison.totalMessages.current}
              previous={comparison.totalMessages.previous}
              comparison={comparison.totalMessages.comparison}
              format="number"
            />
          )
        }
      />

      <MetricCard
        title="Avg Response Time"
        value={`${data.responseTime.toFixed(2)}s`}
        icon={Clock}
        description="Time to first response"
        rightSlot={
          comparison?.responseTime && (
            <ComparisonIndicator
              current={comparison.responseTime.current}
              previous={comparison.responseTime.previous}
              comparison={comparison.responseTime.comparison}
              format="duration"
              increaseIsGood={false}
            />
          )
        }
      />

      <MetricCard
        title="Satisfaction Score"
        value={`${data.satisfactionScore.toFixed(1)}/5.0`}
        icon={TrendingUp}
        description="Average customer satisfaction"
        rightSlot={
          comparison?.satisfactionScore && (
            <ComparisonIndicator
              current={comparison.satisfactionScore.current}
              previous={comparison.satisfactionScore.previous}
              comparison={comparison.satisfactionScore.comparison}
              format="number"
            />
          )
        }
      />

      <MetricCard
        title="Resolution Rate"
        value={`${data.resolutionRate}%`}
        icon={Target}
        description="Successfully resolved queries"
        rightSlot={
          comparison?.resolutionRate && (
            <ComparisonIndicator
              current={comparison.resolutionRate.current}
              previous={comparison.resolutionRate.previous}
              comparison={comparison.resolutionRate.comparison}
              format="percentage"
            />
          )
        }
      />

      <MetricCard
        title="Positive Sentiment"
        value={`${positivePercentage.toFixed(1)}%`}
        icon={Users}
        description={`${data.metrics.positiveMessages} positive messages`}
        rightSlot={
          comparison?.positiveMessages && (
            <ComparisonIndicator
              current={comparison.positiveMessages.current}
              previous={comparison.positiveMessages.previous}
              comparison={comparison.positiveMessages.comparison}
              format="number"
            />
          )
        }
      />

      <MetricCard
        title="Negative Sentiment"
        value={`${negativePercentage.toFixed(1)}%`}
        icon={AlertCircle}
        description={`${data.metrics.negativeMessages} negative messages`}
        rightSlot={
          comparison?.negativeMessages && (
            <ComparisonIndicator
              current={comparison.negativeMessages.current}
              previous={comparison.negativeMessages.previous}
              comparison={comparison.negativeMessages.comparison}
              format="number"
              increaseIsGood={false}
            />
          )
        }
      />
    </div>
  );
}
