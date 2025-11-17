/**
 * Overview Tab Component
 *
 * Displays user analytics and message metrics
 */

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { MetricsOverview } from '@/components/analytics/MetricsOverview';
import { ResponseTimeChart } from '@/components/analytics/ResponseTimeChart';
import { MessageVolumeChart } from '@/components/analytics/MessageVolumeChart';
import { SentimentChart } from '@/components/analytics/SentimentChart';
import { UserMetricsOverview } from '@/components/analytics/UserMetricsOverview';
import { DailyUsersChart } from '@/components/analytics/DailyUsersChart';
import { ShoppingFunnelVisualization } from '@/components/analytics/ShoppingFunnelVisualization';
import { TopPagesView } from '@/components/analytics/TopPagesView';
import { AddAnnotation } from '@/components/dashboard/analytics/AddAnnotation';
import { useAnnotations } from '@/hooks/use-annotations';
import { FailedSearches } from './FailedSearches';
import { TopQueries } from './TopQueries';
import type { ChartAnnotation, MetricGoal } from '@/types/dashboard';

interface OverviewTabProps {
  loading: boolean;
  data: any;
  organizationId?: string;
  dateRange?: { start: string; end: string };
  goals?: MetricGoal[];
}

export function OverviewTab({ loading, data, organizationId = '1', dateRange, goals = [] }: OverviewTabProps) {
  const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | null>(null);

  const {
    annotations,
    loading: annotationsLoading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useAnnotations({
    organizationId,
    startDate: dateRange?.start,
    endDate: dateRange?.end,
    enabled: !!organizationId,
  });

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

  const handleAnnotationClick = (annotation: ChartAnnotation) => {
    setSelectedAnnotation(annotation);
    // TODO: Open edit dialog
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div />
        <AddAnnotation
          onAdd={createAnnotation}
          minDate={dateRange?.start}
          maxDate={dateRange?.end}
        />
      </div>

      <MetricsOverview data={data} />

      {/* User Analytics Section */}
      {data.userMetrics && data.sessionMetrics && data.shoppingBehavior && (
        <UserMetricsOverview
          userMetrics={data.userMetrics}
          sessionMetrics={data.sessionMetrics}
          shoppingBehavior={data.shoppingBehavior}
          goals={goals}
        />
      )}

      {/* Daily Users Chart */}
      {data.dailyUsers && data.dailyUsers.length > 0 && (
        <DailyUsersChart
          data={data.dailyUsers}
          showNewVsReturning={true}
          annotations={annotations}
          onAnnotationClick={handleAnnotationClick}
        />
      )}

      {/* Message Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <ResponseTimeChart
          data={data}
          annotations={annotations}
          onAnnotationClick={handleAnnotationClick}
        />
        <MessageVolumeChart
          data={data}
          annotations={annotations}
          onAnnotationClick={handleAnnotationClick}
        />
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
