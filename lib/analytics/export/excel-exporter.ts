/**
 * Excel Exporter
 *
 * Exports analytics data to Excel format (.xlsx)
 * Features: Multiple sheets, formatting, formulas
 *
 * ✅ SECURE: Now using exceljs (actively maintained, no known CVEs)
 * - Migrated from vulnerable 'xlsx' package (CVE-2024-45590, CVE-2023-30533)
 * - ExcelJS is actively maintained with no prototype pollution issues
 */

import ExcelJS from 'exceljs';
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

  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Omniops Analytics';
  workbook.created = new Date();

  // Sheet 1: Summary
  createSummarySheetExcelJS(workbook, messageAnalytics, userAnalytics, options);

  // Sheet 2: Message Analytics
  if (includeMessageAnalytics && messageAnalytics && messageAnalytics.totalMessages > 0) {
    createMessageAnalyticsSheetExcelJS(workbook, messageAnalytics);
  }

  // Sheet 3: User Analytics
  if (includeUserAnalytics && userAnalytics && userAnalytics.total_unique_users > 0) {
    createUserAnalyticsSheetExcelJS(workbook, userAnalytics);
  }

  // Sheet 4: Daily Metrics
  if (includeDailyMetrics && userAnalytics) {
    createDailyMetricsSheetExcelJS(workbook, userAnalytics.daily_metrics);
  }

  // Sheet 5: Top Queries
  if (includeTopQueries && messageAnalytics && messageAnalytics.topQueries.length > 0) {
    createTopQueriesSheetExcelJS(workbook, messageAnalytics.topQueries);
  }

  // Sheet 6: Languages
  if (includeLanguageDistribution && messageAnalytics && messageAnalytics.languageDistribution.length > 0) {
    createLanguageDistributionSheetExcelJS(workbook, messageAnalytics.languageDistribution);
  }

  // Convert workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create summary sheet with overview of all metrics (ExcelJS version)
 */
function createSummarySheetExcelJS(
  workbook: ExcelJS.Workbook,
  messageAnalytics: MessageAnalytics | null,
  userAnalytics: UserAnalyticsResult | null,
  options: ExcelExportOptions
): void {
  const sheet = workbook.addWorksheet('Summary');

  // Header
  sheet.addRow(['Analytics Report Summary']).font = { bold: true, size: 14 };
  sheet.addRow(['Generated:', new Date().toISOString()]);
  if (options.organizationName) {
    sheet.addRow(['Organization:', options.organizationName]);
  }
  if (options.dateRange) {
    sheet.addRow(['Date Range:', `${options.dateRange.start} to ${options.dateRange.end}`]);
  }
  sheet.addRow([]); // Empty row

  // Message Metrics
  if (messageAnalytics && messageAnalytics.totalMessages > 0) {
    sheet.addRow(['Message Analytics']).font = { bold: true };
    const headerRow = sheet.addRow(['Metric', 'Value']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    sheet.addRow(['Total Messages', messageAnalytics.totalMessages]);
    sheet.addRow(['User Messages', messageAnalytics.totalUserMessages]);
    sheet.addRow(['Avg Response Time (seconds)', messageAnalytics.avgResponseTimeSeconds.toFixed(2)]);
    sheet.addRow(['Satisfaction Score', messageAnalytics.satisfactionScore.toFixed(2)]);
    sheet.addRow(['Resolution Rate', `${(messageAnalytics.resolutionRate * 100).toFixed(1)}%`]);
    sheet.addRow(['Positive Messages', messageAnalytics.positiveUserMessages]);
    sheet.addRow(['Negative Messages', messageAnalytics.negativeUserMessages]);
    sheet.addRow([]); // Empty row
  }

  // User Metrics
  if (userAnalytics && userAnalytics.total_unique_users > 0) {
    sheet.addRow(['User Analytics']).font = { bold: true };
    const headerRow = sheet.addRow(['Metric', 'Value']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    sheet.addRow(['Total Unique Users', userAnalytics.total_unique_users]);
    sheet.addRow(['Average Daily Users', userAnalytics.avg_daily_users.toFixed(0)]);
    sheet.addRow(['Growth Rate', `${(userAnalytics.growth.growth_rate * 100).toFixed(1)}%`]);
    sheet.addRow(['Avg Session Duration (seconds)', userAnalytics.session_stats.avg_duration_seconds.toFixed(0)]);
    sheet.addRow(['Bounce Rate', `${(userAnalytics.session_stats.bounce_rate * 100).toFixed(1)}%`]);
    sheet.addRow(['Total Page Views', userAnalytics.page_view_stats.total_views]);
    sheet.addRow(['Product Views', userAnalytics.shopping_behavior.product_page_views]);
    sheet.addRow(['Conversion Rate', `${(userAnalytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`]);
  }

  // Auto-size columns
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 20;
}

/**
 * Create message analytics sheet (ExcelJS version)
 */
function createMessageAnalyticsSheetExcelJS(
  workbook: ExcelJS.Workbook,
  analytics: MessageAnalytics
): void {
  const sheet = workbook.addWorksheet('Message Analytics');

  sheet.addRow(['Message Analytics Details']).font = { bold: true, size: 14 };
  sheet.addRow([]);
  sheet.addRow(['Overall Metrics']).font = { bold: true };
  const headerRow1 = sheet.addRow(['Metric', 'Value']);
  headerRow1.font = { bold: true };
  headerRow1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Total Messages', analytics.totalMessages]);
  sheet.addRow(['User Messages', analytics.totalUserMessages]);
  sheet.addRow(['AI Messages', analytics.totalMessages - analytics.totalUserMessages]);
  sheet.addRow(['Avg Messages Per Day', analytics.avgMessagesPerDay.toFixed(1)]);
  sheet.addRow([]);

  sheet.addRow(['Sentiment Analysis']).font = { bold: true };
  const headerRow2 = sheet.addRow(['Category', 'Count', 'Percentage']);
  headerRow2.font = { bold: true };
  headerRow2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Positive', analytics.positiveUserMessages, `${((analytics.positiveUserMessages / analytics.totalMessages) * 100).toFixed(1)}%`]);
  sheet.addRow(['Negative', analytics.negativeUserMessages, `${((analytics.negativeUserMessages / analytics.totalMessages) * 100).toFixed(1)}%`]);
  sheet.addRow([
    'Neutral',
    analytics.totalMessages - analytics.positiveUserMessages - analytics.negativeUserMessages
  ]);
  sheet.addRow([]);

  sheet.addRow(['Performance Metrics']).font = { bold: true };
  const headerRow3 = sheet.addRow(['Metric', 'Value']);
  headerRow3.font = { bold: true };
  headerRow3.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Avg Response Time', `${analytics.avgResponseTimeSeconds.toFixed(2)} seconds`]);
  sheet.addRow(['Satisfaction Score', `${analytics.satisfactionScore.toFixed(2)} / 100`]);
  sheet.addRow(['Resolution Rate', `${(analytics.resolutionRate * 100).toFixed(1)}%`]);

  // Auto-size columns
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 15;
}

/**
 * Create user analytics sheet (ExcelJS version)
 */
function createUserAnalyticsSheetExcelJS(
  workbook: ExcelJS.Workbook,
  analytics: UserAnalyticsResult
): void {
  const sheet = workbook.addWorksheet('User Analytics');

  sheet.addRow(['User Analytics Details']).font = { bold: true, size: 14 };
  sheet.addRow([]);
  sheet.addRow(['User Growth']).font = { bold: true };
  let headerRow = sheet.addRow(['Metric', 'Value']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Total Unique Users', analytics.total_unique_users]);
  sheet.addRow(['Average Daily Users', analytics.avg_daily_users.toFixed(0)]);
  sheet.addRow(['Growth Rate', `${(analytics.growth.growth_rate * 100).toFixed(1)}%`]);
  sheet.addRow(['Growth (Absolute)', analytics.growth.growth_absolute]);
  sheet.addRow([]);

  sheet.addRow(['Session Metrics']).font = { bold: true };
  headerRow = sheet.addRow(['Metric', 'Value']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Total Sessions', analytics.session_stats.total_sessions]);
  sheet.addRow(['Avg Session Duration', `${analytics.session_stats.avg_duration_seconds.toFixed(0)} seconds`]);
  sheet.addRow(['Median Session Duration', `${analytics.session_stats.median_duration_seconds.toFixed(0)} seconds`]);
  sheet.addRow(['Bounce Rate', `${(analytics.session_stats.bounce_rate * 100).toFixed(1)}%`]);
  sheet.addRow([]);

  sheet.addRow(['Page View Metrics']).font = { bold: true };
  headerRow = sheet.addRow(['Metric', 'Value']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Total Page Views', analytics.page_view_stats.total_views]);
  sheet.addRow(['Unique Pages', analytics.page_view_stats.unique_pages]);
  sheet.addRow(['Avg Views Per Session', analytics.page_view_stats.avg_views_per_session.toFixed(1)]);
  sheet.addRow([]);

  sheet.addRow(['Shopping Behavior']).font = { bold: true };
  headerRow = sheet.addRow(['Metric', 'Value']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  sheet.addRow(['Product Page Views', analytics.shopping_behavior.product_page_views]);
  sheet.addRow(['Unique Products Viewed', analytics.shopping_behavior.unique_products_viewed]);
  sheet.addRow(['Cart Page Views', analytics.shopping_behavior.cart_page_views]);
  sheet.addRow(['Checkout Page Views', analytics.shopping_behavior.checkout_page_views]);
  sheet.addRow(['Conversion Rate', `${(analytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`]);
  sheet.addRow(['Avg Products Per Session', analytics.shopping_behavior.avg_products_per_session.toFixed(1)]);

  // Auto-size columns
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 25;
}

/**
 * Create daily metrics sheet (ExcelJS version)
 */
function createDailyMetricsSheetExcelJS(
  workbook: ExcelJS.Workbook,
  metrics: any[]
): void {
  const sheet = workbook.addWorksheet('Daily Metrics');

  sheet.addRow(['Daily User Metrics']).font = { bold: true, size: 14 };
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Date', 'Unique Users', 'New Users', 'Returning Users', 'Sessions', 'Avg Session Duration (s)', 'Page Views']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  metrics.forEach(metric => {
    sheet.addRow([
      metric.date,
      metric.unique_users,
      metric.new_users,
      metric.returning_users,
      metric.total_sessions,
      metric.avg_session_duration.toFixed(0),
      metric.total_page_views,
    ]);
  });

  // Auto-size columns
  sheet.getColumn(1).width = 12;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 25;
  sheet.getColumn(7).width = 15;
}

/**
 * Create top queries sheet (ExcelJS version)
 */
function createTopQueriesSheetExcelJS(
  workbook: ExcelJS.Workbook,
  queries: any[]
): void {
  const sheet = workbook.addWorksheet('Top Queries');

  sheet.addRow(['Top Queries']).font = { bold: true, size: 14 };
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Rank', 'Query', 'Count', 'Percentage']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  queries.forEach((query, index) => {
    sheet.addRow([index + 1, query.query, query.count, `${query.percentage.toFixed(1)}%`]);
  });

  // Auto-size columns
  sheet.getColumn(1).width = 8;
  sheet.getColumn(2).width = 50;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 15;
}

/**
 * Create language distribution sheet (ExcelJS version)
 */
function createLanguageDistributionSheetExcelJS(
  workbook: ExcelJS.Workbook,
  languages: any[]
): void {
  const sheet = workbook.addWorksheet('Languages');

  sheet.addRow(['Language Distribution']).font = { bold: true, size: 14 };
  sheet.addRow([]);
  const headerRow = sheet.addRow(['Language', 'Count', 'Percentage']);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  languages.forEach(lang => {
    sheet.addRow([lang.language, lang.count, `${lang.percentage.toFixed(1)}%`]);
  });

  // Auto-size columns
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 15;
}

/**
 * Generate filename for Excel export
 */
export function generateExcelFilename(prefix: string = 'analytics'): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${timestamp}.xlsx`;
}
