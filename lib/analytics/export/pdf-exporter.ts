/**
 * PDF Exporter
 *
 * Exports analytics data to PDF format
 * Features: Professional layout, tables, charts, branding
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

export interface PDFExportOptions {
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
 * Export analytics data to PDF (Buffer)
 */
export async function exportToPDF(
  messageAnalytics: MessageAnalytics | null,
  userAnalytics: UserAnalyticsResult | null,
  options: PDFExportOptions = {}
): Promise<Buffer> {
  const {
    includeMessageAnalytics = true,
    includeUserAnalytics = true,
    includeDailyMetrics = true,
    includeTopQueries = true,
    includeLanguageDistribution = true,
    organizationName = 'Analytics Report',
  } = options;

  const doc = new jsPDF();
  let yPos = 20;

  // Title Page
  doc.setFontSize(24);
  doc.text(organizationName, 20, yPos);
  yPos += 10;

  doc.setFontSize(16);
  doc.text('Analytics Report', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, yPos);
  yPos += 5;

  if (options.dateRange) {
    doc.text(`Date Range: ${options.dateRange.start} to ${options.dateRange.end}`, 20, yPos);
    yPos += 5;
  }

  yPos += 10;

  // Summary Section
  doc.setFontSize(14);
  doc.text('Executive Summary', 20, yPos);
  yPos += 10;

  const summaryData: any[] = [];
  if (messageAnalytics) {
    summaryData.push(['Total Messages', messageAnalytics.totalMessages.toString()]);
    summaryData.push(['Satisfaction Score', `${messageAnalytics.satisfactionScore.toFixed(1)} / 100`]);
    summaryData.push(['Resolution Rate', `${(messageAnalytics.resolutionRate * 100).toFixed(1)}%`]);
  }
  if (userAnalytics) {
    summaryData.push(['Total Unique Users', userAnalytics.total_unique_users.toString()]);
    summaryData.push(['Growth Rate', `${(userAnalytics.growth.growth_rate * 100).toFixed(1)}%`]);
    summaryData.push(['Conversion Rate', `${(userAnalytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`]);
  }

  if (summaryData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] }, // Blue header
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Message Analytics Section
  if (includeMessageAnalytics && messageAnalytics) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Message Analytics', 20, yPos);
    yPos += 10;

    const messageData = [
      ['Total Messages', messageAnalytics.totalMessages.toString()],
      ['User Messages', messageAnalytics.totalUserMessages.toString()],
      ['Avg Response Time', `${messageAnalytics.avgResponseTimeSeconds.toFixed(2)}s`],
      ['Satisfaction Score', `${messageAnalytics.satisfactionScore.toFixed(2)}`],
      ['Resolution Rate', `${(messageAnalytics.resolutionRate * 100).toFixed(1)}%`],
      ['Positive Messages', messageAnalytics.positiveUserMessages.toString()],
      ['Negative Messages', messageAnalytics.negativeUserMessages.toString()],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: messageData,
      theme: 'striped',
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // User Analytics Section
  if (includeUserAnalytics && userAnalytics) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('User Analytics', 20, yPos);
    yPos += 10;

    const userData = [
      ['Total Unique Users', userAnalytics.total_unique_users.toString()],
      ['Average Daily Users', userAnalytics.avg_daily_users.toFixed(0)],
      ['Growth Rate', `${(userAnalytics.growth.growth_rate * 100).toFixed(1)}%`],
      ['Avg Session Duration', `${userAnalytics.session_stats.avg_duration_seconds.toFixed(0)}s`],
      ['Bounce Rate', `${(userAnalytics.session_stats.bounce_rate * 100).toFixed(1)}%`],
      ['Total Page Views', userAnalytics.page_view_stats.total_views.toString()],
      ['Product Views', userAnalytics.shopping_behavior.product_page_views.toString()],
      ['Conversion Rate', `${(userAnalytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: userData,
      theme: 'striped',
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Top Queries Section
  if (includeTopQueries && messageAnalytics && messageAnalytics.topQueries.length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Top Queries', 20, yPos);
    yPos += 10;

    const queriesData = messageAnalytics.topQueries.map((query, index) => [
      (index + 1).toString(),
      query.query,
      query.count.toString(),
      `${query.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Rank', 'Query', 'Count', 'Percentage']],
      body: queriesData,
      theme: 'striped',
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 100 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Language Distribution Section
  if (includeLanguageDistribution && messageAnalytics && messageAnalytics.languageDistribution.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.text('Language Distribution', 20, yPos);
    yPos += 10;

    const langData = messageAnalytics.languageDistribution.map(lang => [
      lang.language,
      lang.count.toString(),
      `${lang.percentage.toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Language', 'Count', 'Percentage']],
      body: langData,
      theme: 'striped',
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Daily Metrics Section
  if (includeDailyMetrics && userAnalytics && userAnalytics.daily_metrics.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.text('Daily User Metrics', 20, yPos);
    yPos += 10;

    const dailyData = userAnalytics.daily_metrics.map(metric => [
      metric.date,
      metric.unique_users.toString(),
      metric.new_users.toString(),
      metric.returning_users.toString(),
      metric.total_sessions.toString(),
      metric.avg_session_duration.toFixed(0),
      metric.total_page_views.toString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Users', 'New', 'Returning', 'Sessions', 'Avg Duration (s)', 'Page Views']],
      body: dailyData,
      theme: 'striped',
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 22 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 },
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

/**
 * Generate filename for PDF export
 */
export function generatePDFFilename(prefix: string = 'analytics'): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${timestamp}.pdf`;
}
