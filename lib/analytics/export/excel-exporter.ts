/**
 * Excel Exporter
 *
 * Exports analytics data to Excel format (.xlsx)
 * Features: Multiple sheets, formatting, formulas
 *
 * ⚠️ SECURITY WARNING:
 * The 'xlsx' package has known vulnerabilities (CVE-2024-45590, CVE-2023-30533):
 * - Prototype pollution attack
 * - ReDoS (Regular Expression Denial of Service)
 * - No fix available from SheetJS as of 2025-11-18
 *
 * Mitigation:
 * - This module only generates Excel files (write-only), not parsing untrusted input
 * - Risk is minimal for our use case (export only)
 * - TODO: Consider migrating to 'exceljs' for better security in future
 */

import * as XLSX from 'xlsx';
import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

export interface ExcelExportOptions {
  includeMessageAnalytics?: boolean;
  includeUserAnalytics?: boolean;
  includeDailyMetrics?: boolean;
  includeTopQueries?: boolean;
  includeLanguageDistribution?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  organizationName?: string;
}

/**
 * Export analytics data to Excel workbook (Buffer)
 */
export async function exportToExcel(
  messageAnalytics: MessageAnalytics | null,
  userAnalytics: UserAnalyticsResult | null,
  options: ExcelExportOptions = {}
): Promise<Buffer> {
  const {
    includeMessageAnalytics = true,
    includeUserAnalytics = true,
    includeDailyMetrics = true,
    includeTopQueries = true,
    includeLanguageDistribution = true,
  } = options;

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = createSummarySheet(messageAnalytics, userAnalytics, options);
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Message Analytics
  if (includeMessageAnalytics && messageAnalytics && messageAnalytics.totalMessages > 0) {
    const messageData = createMessageAnalyticsSheet(messageAnalytics);
    const messageSheet = XLSX.utils.aoa_to_sheet(messageData);
    XLSX.utils.book_append_sheet(workbook, messageSheet, 'Message Analytics');
  }

  // Sheet 3: User Analytics
  if (includeUserAnalytics && userAnalytics && userAnalytics.total_unique_users > 0) {
    const userData = createUserAnalyticsSheet(userAnalytics);
    const userSheet = XLSX.utils.aoa_to_sheet(userData);
    XLSX.utils.book_append_sheet(workbook, userSheet, 'User Analytics');
  }

  // Sheet 4: Daily Metrics
  if (includeDailyMetrics && userAnalytics) {
    const dailyData = createDailyMetricsSheet(userAnalytics.daily_metrics);
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Metrics');
  }

  // Sheet 5: Top Queries
  if (includeTopQueries && messageAnalytics && messageAnalytics.topQueries.length > 0) {
    const queriesData = createTopQueriesSheet(messageAnalytics.topQueries);
    const queriesSheet = XLSX.utils.aoa_to_sheet(queriesData);
    XLSX.utils.book_append_sheet(workbook, queriesSheet, 'Top Queries');
  }

  // Sheet 6: Languages
  if (includeLanguageDistribution && messageAnalytics && messageAnalytics.languageDistribution.length > 0) {
    const langData = createLanguageDistributionSheet(messageAnalytics.languageDistribution);
    const langSheet = XLSX.utils.aoa_to_sheet(langData);
    XLSX.utils.book_append_sheet(workbook, langSheet, 'Languages');
  }

  // Convert workbook to buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Create summary sheet with overview of all metrics
 */
function createSummarySheet(
  messageAnalytics: MessageAnalytics | null,
  userAnalytics: UserAnalyticsResult | null,
  options: ExcelExportOptions
): any[][] {
  const data: any[][] = [];

  // Header
  data.push(['Analytics Report Summary']);
  data.push(['Generated:', new Date().toISOString()]);
  if (options.organizationName) {
    data.push(['Organization:', options.organizationName]);
  }
  if (options.dateRange) {
    data.push(['Date Range:', `${options.dateRange.start} to ${options.dateRange.end}`]);
  }
  data.push([]); // Empty row

  // Message Metrics
  if (messageAnalytics && messageAnalytics.totalMessages > 0) {
    data.push(['Message Analytics']);
    data.push(['Metric', 'Value']);
    data.push(['Total Messages', messageAnalytics.totalMessages]);
    data.push(['User Messages', messageAnalytics.totalUserMessages]);
    data.push(['Avg Response Time (seconds)', messageAnalytics.avgResponseTimeSeconds.toFixed(2)]);
    data.push(['Satisfaction Score', messageAnalytics.satisfactionScore.toFixed(2)]);
    data.push(['Resolution Rate', `${(messageAnalytics.resolutionRate * 100).toFixed(1)}%`]);
    data.push(['Positive Messages', messageAnalytics.positiveUserMessages]);
    data.push(['Negative Messages', messageAnalytics.negativeUserMessages]);
    data.push([]); // Empty row
  }

  // User Metrics
  if (userAnalytics && userAnalytics.total_unique_users > 0) {
    data.push(['User Analytics']);
    data.push(['Metric', 'Value']);
    data.push(['Total Unique Users', userAnalytics.total_unique_users]);
    data.push(['Average Daily Users', userAnalytics.avg_daily_users.toFixed(0)]);
    data.push(['Growth Rate', `${(userAnalytics.growth.growth_rate * 100).toFixed(1)}%`]);
    data.push(['Avg Session Duration (seconds)', userAnalytics.session_stats.avg_duration_seconds.toFixed(0)]);
    data.push(['Bounce Rate', `${(userAnalytics.session_stats.bounce_rate * 100).toFixed(1)}%`]);
    data.push(['Total Page Views', userAnalytics.page_view_stats.total_views]);
    data.push(['Product Views', userAnalytics.shopping_behavior.product_page_views]);
    data.push(['Conversion Rate', `${(userAnalytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`]);
  }

  return data;
}

/**
 * Create message analytics sheet
 */
function createMessageAnalyticsSheet(analytics: MessageAnalytics): any[][] {
  const data: any[][] = [];

  data.push(['Message Analytics Details']);
  data.push([]);
  data.push(['Overall Metrics']);
  data.push(['Metric', 'Value']);
  data.push(['Total Messages', analytics.totalMessages]);
  data.push(['User Messages', analytics.totalUserMessages]);
  data.push(['AI Messages', analytics.totalMessages - analytics.totalUserMessages]);
  data.push(['Avg Messages Per Day', analytics.avgMessagesPerDay.toFixed(1)]);
  data.push([]);

  data.push(['Sentiment Analysis']);
  data.push(['Category', 'Count', 'Percentage']);
  data.push(['Positive', analytics.positiveUserMessages, `${((analytics.positiveUserMessages / analytics.totalMessages) * 100).toFixed(1)}%`]);
  data.push(['Negative', analytics.negativeUserMessages, `${((analytics.negativeUserMessages / analytics.totalMessages) * 100).toFixed(1)}%`]);
  data.push([
    'Neutral',
    analytics.totalMessages - analytics.positiveUserMessages - analytics.negativeUserMessages
  ]);
  data.push([]);

  data.push(['Performance Metrics']);
  data.push(['Metric', 'Value']);
  data.push(['Avg Response Time', `${analytics.avgResponseTimeSeconds.toFixed(2)} seconds`]);
  data.push(['Satisfaction Score', `${analytics.satisfactionScore.toFixed(2)} / 100`]);
  data.push(['Resolution Rate', `${(analytics.resolutionRate * 100).toFixed(1)}%`]);

  return data;
}

/**
 * Create user analytics sheet
 */
function createUserAnalyticsSheet(analytics: UserAnalyticsResult): any[][] {
  const data: any[][] = [];

  data.push(['User Analytics Details']);
  data.push([]);
  data.push(['User Growth']);
  data.push(['Metric', 'Value']);
  data.push(['Total Unique Users', analytics.total_unique_users]);
  data.push(['Average Daily Users', analytics.avg_daily_users.toFixed(0)]);
  data.push(['Growth Rate', `${(analytics.growth.growth_rate * 100).toFixed(1)}%`]);
  data.push(['Growth (Absolute)', analytics.growth.growth_absolute]);
  data.push([]);

  data.push(['Session Metrics']);
  data.push(['Metric', 'Value']);
  data.push(['Total Sessions', analytics.session_stats.total_sessions]);
  data.push(['Avg Session Duration', `${analytics.session_stats.avg_duration_seconds.toFixed(0)} seconds`]);
  data.push(['Median Session Duration', `${analytics.session_stats.median_duration_seconds.toFixed(0)} seconds`]);
  data.push(['Bounce Rate', `${(analytics.session_stats.bounce_rate * 100).toFixed(1)}%`]);
  data.push([]);

  data.push(['Page View Metrics']);
  data.push(['Metric', 'Value']);
  data.push(['Total Page Views', analytics.page_view_stats.total_views]);
  data.push(['Unique Pages', analytics.page_view_stats.unique_pages]);
  data.push(['Avg Views Per Session', analytics.page_view_stats.avg_views_per_session.toFixed(1)]);
  data.push([]);

  data.push(['Shopping Behavior']);
  data.push(['Metric', 'Value']);
  data.push(['Product Page Views', analytics.shopping_behavior.product_page_views]);
  data.push(['Unique Products Viewed', analytics.shopping_behavior.unique_products_viewed]);
  data.push(['Cart Page Views', analytics.shopping_behavior.cart_page_views]);
  data.push(['Checkout Page Views', analytics.shopping_behavior.checkout_page_views]);
  data.push(['Conversion Rate', `${(analytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`]);
  data.push(['Avg Products Per Session', analytics.shopping_behavior.avg_products_per_session.toFixed(1)]);

  return data;
}

/**
 * Create daily metrics sheet
 */
function createDailyMetricsSheet(metrics: any[]): any[][] {
  const data: any[][] = [];

  data.push(['Daily User Metrics']);
  data.push([]);
  data.push(['Date', 'Unique Users', 'New Users', 'Returning Users', 'Sessions', 'Avg Session Duration (s)', 'Page Views']);

  metrics.forEach(metric => {
    data.push([
      metric.date,
      metric.unique_users,
      metric.new_users,
      metric.returning_users,
      metric.total_sessions,
      metric.avg_session_duration.toFixed(0),
      metric.total_page_views,
    ]);
  });

  return data;
}

/**
 * Create top queries sheet
 */
function createTopQueriesSheet(queries: any[]): any[][] {
  const data: any[][] = [];

  data.push(['Top Queries']);
  data.push([]);
  data.push(['Rank', 'Query', 'Count', 'Percentage']);

  queries.forEach((query, index) => {
    data.push([index + 1, query.query, query.count, `${query.percentage.toFixed(1)}%`]);
  });

  return data;
}

/**
 * Create language distribution sheet
 */
function createLanguageDistributionSheet(languages: any[]): any[][] {
  const data: any[][] = [];

  data.push(['Language Distribution']);
  data.push([]);
  data.push(['Language', 'Count', 'Percentage']);

  languages.forEach(lang => {
    data.push([lang.language, lang.count, `${lang.percentage.toFixed(1)}%`]);
  });

  return data;
}

/**
 * Generate filename for Excel export
 */
export function generateExcelFilename(prefix: string = 'analytics'): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${timestamp}.xlsx`;
}
