import Papa from 'papaparse';
import type { DashboardAnalyticsData } from '@/types/dashboard';

/**
 * Transform analytics data to CSV format
 */
function transformAnalyticsToRows(data: DashboardAnalyticsData, dateRange: { start: string; end: string }) {
  const rows = [];

  // Add summary row
  rows.push({
    Type: 'Summary',
    Date: `${dateRange.start} to ${dateRange.end}`,
    'Response Time (s)': data.responseTime.toFixed(2),
    'Satisfaction Score': data.satisfactionScore.toFixed(2),
    'Resolution Rate (%)': data.resolutionRate.toFixed(1),
    'Total Messages': data.metrics.totalMessages,
    'User Messages': data.metrics.userMessages,
    'Positive Messages': data.metrics.positiveMessages,
    'Negative Messages': data.metrics.negativeMessages,
    'Avg Messages/Day': data.metrics.avgMessagesPerDay.toFixed(1),
  });

  // Add daily sentiment data
  data.dailySentiment.forEach((day: any) => {
    rows.push({
      Type: 'Daily Sentiment',
      Date: day.date,
      Positive: day.positive,
      Negative: day.negative,
      Neutral: day.neutral,
      Total: day.total,
      'Satisfaction Score': day.satisfactionScore.toFixed(2),
    });
  });

  // Add top queries
  data.topQueries.forEach((query: any, idx: number) => {
    rows.push({
      Type: 'Top Query',
      Rank: idx + 1,
      Query: query.query,
      Count: query.count,
      'Percentage (%)': query.percentage.toFixed(1),
    });
  });

  // Add language distribution
  data.languageDistribution.forEach((lang: any) => {
    rows.push({
      Type: 'Language',
      Language: lang.language,
      Count: lang.count,
      'Percentage (%)': lang.percentage.toFixed(1),
    });
  });

  // Add failed searches
  data.failedSearches.forEach((search: any, idx: number) => {
    rows.push({
      Type: 'Failed Search',
      Rank: idx + 1,
      Query: search,
    });
  });

  return rows;
}

/**
 * Export analytics data to CSV (browser download)
 */
export function exportAnalyticsToCSV(
  data: DashboardAnalyticsData,
  dateRange: { start: string; end: string },
  filename: string = 'analytics-report'
) {
  const rows = transformAnalyticsToRows(data, dateRange);

  // Define all columns to ensure Papa.unparse includes them all
  const columns = [
    'Type', 'Date', 'Response Time (s)', 'Satisfaction Score', 'Resolution Rate (%)',
    'Total Messages', 'User Messages', 'Positive Messages', 'Negative Messages',
    'Avg Messages/Day', 'Positive', 'Negative', 'Neutral', 'Total',
    'Rank', 'Query', 'Count', 'Percentage (%)', 'Language'
  ];

  const csv = Papa.unparse(rows, { columns });

  // Trigger download in browser
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${Date.now()}.csv`;
  link.click();

  // Clean up
  URL.revokeObjectURL(link.href);
}

/**
 * Generate CSV content as string (for server-side usage)
 */
export function generateCSVContent(
  data: DashboardAnalyticsData,
  dateRange: { start: string; end: string }
): string {
  const rows = transformAnalyticsToRows(data, dateRange);

  // Define all columns to ensure Papa.unparse includes them all
  const columns = [
    'Type', 'Date', 'Response Time (s)', 'Satisfaction Score', 'Resolution Rate (%)',
    'Total Messages', 'User Messages', 'Positive Messages', 'Negative Messages',
    'Avg Messages/Day', 'Positive', 'Negative', 'Neutral', 'Total',
    'Rank', 'Query', 'Count', 'Percentage (%)', 'Language'
  ];

  return Papa.unparse(rows, { columns });
}
