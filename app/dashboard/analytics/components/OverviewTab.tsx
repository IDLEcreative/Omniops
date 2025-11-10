/**
 * Overview Tab Component
 *
 * Displays user analytics and message metrics
 */

import { RefreshCw } from 'lucide-react';
import { MetricsOverview } from '@/components/analytics/MetricsOverview';
import { ResponseTimeChart } from '@/components/analytics/ResponseTimeChart';
import { MessageVolumeChart } from '@/components/analytics/MessageVolumeChart';
import { SentimentChart } from '@/components/analytics/SentimentChart';
import { UserMetricsOverview } from '@/components/analytics/UserMetricsOverview';
import { DailyUsersChart } from '@/components/analytics/DailyUsersChart';
import { ShoppingFunnelVisualization } from '@/components/analytics/ShoppingFunnelVisualization';
import { TopPagesView } from '@/components/analytics/TopPagesView';
import { FailedSearches } from './FailedSearches';
import { TopQueries } from './TopQueries';

interface OverviewTabProps {
  loading: boolean;
  data: any;
}

export function OverviewTab({ loading, data }: OverviewTabProps) {
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
      <MetricsOverview data={data} />

      {/* User Analytics Section */}
      {data.userMetrics && data.sessionMetrics && data.shoppingBehavior && (
        <UserMetricsOverview
          userMetrics={data.userMetrics}
          sessionMetrics={data.sessionMetrics}
          shoppingBehavior={data.shoppingBehavior}
        />
      )}

      {/* Daily Users Chart */}
      {data.dailyUsers && data.dailyUsers.length > 0 && (
        <DailyUsersChart data={data.dailyUsers} showNewVsReturning={true} />
      )}

      {/* Message Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <ResponseTimeChart data={data} />
        <MessageVolumeChart data={data} />
      </div>

      {/* Shopping Funnel and Top Pages */}
      {data.shoppingBehavior && data.pageViews && (
        <div className="grid gap-6 md:grid-cols-2">
          <ShoppingFunnelVisualization
            shoppingBehavior={data.shoppingBehavior}
            pageViews={data.pageViews}
          />
          <TopPagesView pageViews={data.pageViews} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <SentimentChart data={data} />
        <TopQueries queries={data.topQueries} />
      </div>

      {data.failedSearches.length > 0 && (
        <FailedSearches searches={data.failedSearches} />
      )}
    </>
  );
}
