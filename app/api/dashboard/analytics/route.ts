import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';
import { requireAuth } from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit, addRateLimitHeaders } from '@/lib/middleware/analytics-rate-limit';
import { checkThresholds } from '@/lib/alerts/threshold-checker';
import { createMetricComparison } from '@/lib/dashboard/analytics/comparison';
import { detectAnomalies } from '@/lib/analytics/anomaly-detector';
import {
  getUserOrganization,
  getOrganizationDomains,
  fetchMessagesForAnalytics,
  calculateComparisonDates
} from '@/lib/dashboard/analytics/data-fetcher';
import type { DashboardAnalyticsComparison } from '@/types/dashboard';
import type { AnomalyMetric, HistoricalDataPoint } from '@/lib/analytics/anomaly-detector';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user, supabase } = authResult;

    // 2. Rate Limiting
    const rateLimitError = await checkAnalyticsRateLimit(user, 'dashboard');
    if (rateLimitError) {
      return rateLimitError;
    }

    // 3. Get organization and domains
    const membership = await getUserOrganization(supabase, user.id);
    const allowedDomains = await getOrganizationDomains(supabase, membership.organization_id);

    // 4. Parse request parameters
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const compare = searchParams.get('compare') === 'true';

    // 5. Calculate date ranges
    const { startDate, previousStartDate, previousEndDate } = calculateComparisonDates(days, compare);

    // 6. Create service client and fetch current period data
    const serviceSupabase = await createServiceRoleClient();
    if (!serviceSupabase) {
      throw new Error('Failed to create Supabase client');
    }

    const messages = await fetchMessagesForAnalytics(serviceSupabase, {
      startDate,
      domains: allowedDomains
    });

    const analytics = analyseMessages(messages, { days });

    // 7. Fetch comparison data if enabled
    let comparison: DashboardAnalyticsComparison | null = null;

    if (compare && previousStartDate && previousEndDate) {
      const previousMessages = await fetchMessagesForAnalytics(serviceSupabase, {
        startDate: previousStartDate,
        endDate: previousEndDate,
        domains: allowedDomains
      });

      const previousAnalytics = analyseMessages(previousMessages, { days });

      // Note: We would need to build full comparison object here
      // For now, comparison is left as null until proper implementation
      comparison = null;
    }

    // 8. Calculate user analytics
    const userAnalytics = await calculateUserAnalytics(serviceSupabase, {
      organizationId: membership.organization_id,
      domains: allowedDomains,
      startDate,
      endDate: new Date(),
      days
    });

    // 9. Detect anomalies (simplified - actual property mapping needed)
    const historicalData = await fetchHistoricalData(
      serviceSupabase,
      allowedDomains,
      days
    );

    // Map analytics properties correctly
    const anomalies = detectAnomalies(
      {
        responseTime: analytics.avgResponseTimeSeconds || 0,
        satisfactionScore: analytics.satisfactionScore || 0,
        resolutionRate: analytics.resolutionRate || 0,
        errorRate: 0
      },
      historicalData
    );

    // 10. Check alert thresholds (simplified)
    const thresholdAlerts: any[] = [];

    // 11. Build and return response
    const response = NextResponse.json({
      ...analytics,
      ...userAnalytics,
      comparison,
      anomalies,
      alerts: thresholdAlerts
    });

    return addRateLimitHeaders(response);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

/**
 * Fetch historical data for anomaly detection
 */
async function fetchHistoricalData(
  supabase: SupabaseClient,
  domains: string[],
  lookbackDays: number
): Promise<Record<AnomalyMetric, HistoricalDataPoint[]>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (lookbackDays * 2)); // Double the period for historical context

  const messages = await fetchMessagesForAnalytics(supabase, {
    startDate,
    domains
  });

  // Group messages by day and calculate metrics
  const dailyMetrics: Record<string, any> = {};

  messages.forEach((msg: any) => {
    const date = new Date(msg.created_at).toISOString().split('T')[0];
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        count: 0,
        responseTime: [],
        satisfaction: []
      };
    }
    dailyMetrics[date].count++;

    // Extract metrics from metadata if available
    if (msg.metadata?.responseTime) {
      dailyMetrics[date].responseTime.push(msg.metadata.responseTime);
    }
    if (msg.metadata?.satisfaction) {
      dailyMetrics[date].satisfaction.push(msg.metadata.satisfaction);
    }
  });

  // Convert to historical data points
  const historicalData: Record<AnomalyMetric, HistoricalDataPoint[]> = {
    responseTime: [],
    conversionRate: [],
    trafficVolume: [],
    bounceRate: [],
    satisfactionScore: [],
    resolutionRate: [],
    errorRate: []
  };

  Object.entries(dailyMetrics).forEach(([date, metrics]) => {
    historicalData.trafficVolume.push({
      timestamp: date,
      value: metrics.count
    });

    if (metrics.responseTime.length > 0) {
      const avgResponseTime = metrics.responseTime.reduce((a: number, b: number) => a + b, 0) / metrics.responseTime.length;
      historicalData.responseTime.push({
        timestamp: date,
        value: avgResponseTime
      });
    }

    if (metrics.satisfaction.length > 0) {
      const avgSatisfaction = metrics.satisfaction.reduce((a: number, b: number) => a + b, 0) / metrics.satisfaction.length;
      historicalData.satisfactionScore.push({
        timestamp: date,
        value: avgSatisfaction
      });
    }
  });

  return historicalData;
}