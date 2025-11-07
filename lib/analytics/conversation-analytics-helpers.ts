/**
 * Conversation Analytics Helper Functions
 *
 * CSV export and data transformation utilities for conversation analytics.
 */

import type { AnalyticsData } from '@/components/dashboard/conversations/ConversationAnalytics';

/**
 * Generate CSV content from analytics data
 *
 * Exports all analytics datasets into a single CSV file with sections:
 * - Response Time Trend
 * - Volume by Hour
 * - Status Over Time
 * - Message Length Distribution
 */
export function generateCSVContent(data: AnalyticsData): string {
  const lines: string[] = [];

  // Response Time Trend
  lines.push('Response Time Trend');
  lines.push('Date,Average Minutes');
  data.responseTimeTrend.forEach((item) => {
    lines.push(`${item.date},${item.avgMinutes}`);
  });
  lines.push('');

  // Volume by Hour
  lines.push('Volume by Hour');
  lines.push('Hour,Count');
  data.volumeByHour.forEach((item) => {
    lines.push(`${item.hour}:00,${item.count}`);
  });
  lines.push('');

  // Status Over Time
  lines.push('Status Over Time');
  lines.push('Date,Active,Waiting,Resolved');
  data.statusOverTime.forEach((item) => {
    lines.push(`${item.date},${item.active},${item.waiting},${item.resolved}`);
  });
  lines.push('');

  // Message Length Distribution
  lines.push('Message Length Distribution');
  lines.push('Range,Count');
  data.messageLengthDist.forEach((item) => {
    lines.push(`${item.range},${item.count}`);
  });

  return lines.join('\n');
}

/**
 * Download CSV file
 *
 * Creates a downloadable CSV blob and triggers browser download
 */
export function downloadCSV(csvContent: string, filename?: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename || `conversation-analytics-${new Date().toISOString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
