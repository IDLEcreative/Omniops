import cron from 'node-cron';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { sendAnalyticsReport } from '@/lib/email/send-report';
import type { DashboardAnalyticsData } from '@/types/dashboard';

interface ReportSubscription {
  id: string;
  organization_id: string;
  user_email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  organization_name?: string;
}

/**
 * Fetch analytics data for a specific time period
 */
async function fetchAnalyticsForReport(
  organizationId: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<{ data: DashboardAnalyticsData; dateRange: { start: string; end: string } }> {
  const now = new Date();
  let startDate: Date;
  const endDate: Date = now;

  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }

  // Fetch analytics via API endpoint (simulating internal call)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // In production, you'd call your analytics API here
  // For now, we'll create a placeholder structure
  const data: DashboardAnalyticsData = {
    responseTime: 0,
    satisfactionScore: 0,
    resolutionRate: 0,
    topQueries: [],
    failedSearches: [],
    languageDistribution: [],
    dailySentiment: [],
    metrics: {
      totalMessages: 0,
      userMessages: 0,
      avgMessagesPerDay: 0,
      positiveMessages: 0,
      negativeMessages: 0,
    },
  };

  return {
    data,
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
  };
}

/**
 * Get subscribers for a specific frequency
 */
async function getReportSubscribers(
  frequency: 'daily' | 'weekly' | 'monthly'
): Promise<ReportSubscription[]> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('report_subscriptions')
    .select(`
      id,
      organization_id,
      user_email,
      frequency,
      enabled,
      organizations (
        name
      )
    `)
    .eq('frequency', frequency)
    .eq('enabled', true);

  if (error) {
    console.error(`Failed to fetch ${frequency} report subscribers:`, error);
    return [];
  }

  return (data || []).map((sub: any) => ({
    id: sub.id,
    organization_id: sub.organization_id,
    user_email: sub.user_email,
    frequency: sub.frequency,
    enabled: sub.enabled,
    organization_name: sub.organizations?.name,
  }));
}

/**
 * Process reports for a specific frequency
 */
async function processReports(frequency: 'daily' | 'weekly' | 'monthly') {

  const subscribers = await getReportSubscribers(frequency);

  let successCount = 0;
  let errorCount = 0;

  for (const subscriber of subscribers) {
    try {
      const { data, dateRange } = await fetchAnalyticsForReport(
        subscriber.organization_id,
        frequency
      );

      await sendAnalyticsReport({
        to: subscriber.user_email,
        data,
        dateRange,
        period: frequency,
        includeCSV: true,
        includePDF: false,
        organizationName: subscriber.organization_name,
      });

      successCount++;
    } catch (error) {
      errorCount++;
      console.error(
        `[Scheduled Reports] Failed to send ${frequency} report to ${subscriber.user_email}:`,
        error
      );
    }
  }

  console.log(
    `[Scheduled Reports] ${frequency} reports complete: ${successCount} sent, ${errorCount} failed`
  );
}

/**
 * Initialize scheduled report cron jobs
 */
export function initializeScheduledReports() {

  // Daily reports at 8 AM
  const dailyJob = cron.schedule('0 8 * * *', async () => {
    await processReports('daily');
  });

  // Weekly reports on Monday at 9 AM
  const weeklyJob = cron.schedule('0 9 * * 1', async () => {
    await processReports('weekly');
  });

  // Monthly reports on 1st of month at 10 AM
  const monthlyJob = cron.schedule('0 10 1 * *', async () => {
    await processReports('monthly');
  });


  return {
    dailyJob,
    weeklyJob,
    monthlyJob,
    stop: () => {
      dailyJob.stop();
      weeklyJob.stop();
      monthlyJob.stop();
    },
  };
}

/**
 * Manually trigger a report for testing
 */
export async function triggerReportManually(
  frequency: 'daily' | 'weekly' | 'monthly'
): Promise<void> {
  await processReports(frequency);
}
