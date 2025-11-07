import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { DashboardAnalyticsData } from '@/types/dashboard';

interface PDFExportOptions {
  filename?: string;
  includeCharts?: boolean;
}

/**
 * Export analytics to PDF with tables and optional charts
 */
export async function exportAnalyticsToPDF(
  data: DashboardAnalyticsData,
  dateRange: { start: string; end: string },
  chartElements: HTMLElement[] = [],
  options: PDFExportOptions = {}
) {
  const { filename = 'analytics-report', includeCharts = true } = options;
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yOffset = 10;

  // Add title
  pdf.setFontSize(20);
  pdf.text('Analytics Report', 10, yOffset);
  yOffset += 10;

  // Add date range
  pdf.setFontSize(12);
  pdf.text(`Period: ${dateRange.start} to ${dateRange.end}`, 10, yOffset);
  yOffset += 10;

  // Add summary metrics table
  pdf.setFontSize(14);
  pdf.text('Summary Metrics', 10, yOffset);
  yOffset += 5;

  autoTable(pdf, {
    startY: yOffset,
    head: [['Metric', 'Value']],
    body: [
      ['Response Time', `${data.responseTime.toFixed(2)}s`],
      ['Satisfaction Score', `${data.satisfactionScore.toFixed(2)}/5`],
      ['Resolution Rate', `${data.resolutionRate.toFixed(1)}%`],
      ['Total Messages', data.metrics.totalMessages.toString()],
      ['User Messages', data.metrics.userMessages.toString()],
      ['Positive Messages', data.metrics.positiveMessages.toString()],
      ['Negative Messages', data.metrics.negativeMessages.toString()],
      ['Avg Messages/Day', data.metrics.avgMessagesPerDay.toFixed(1)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  yOffset = (pdf as any).lastAutoTable.finalY + 10;

  // Add top queries table
  if (data.topQueries.length > 0) {
    if (yOffset > 240) {
      pdf.addPage();
      yOffset = 10;
    }

    pdf.setFontSize(14);
    pdf.text('Top Queries', 10, yOffset);
    yOffset += 5;

    autoTable(pdf, {
      startY: yOffset,
      head: [['Rank', 'Query', 'Count', 'Percentage']],
      body: data.topQueries.slice(0, 10).map((query, idx) => [
        (idx + 1).toString(),
        query.query,
        query.count.toString(),
        `${query.percentage.toFixed(1)}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
    });

    yOffset = (pdf as any).lastAutoTable.finalY + 10;
  }

  // Add language distribution table
  if (data.languageDistribution.length > 0) {
    if (yOffset > 240) {
      pdf.addPage();
      yOffset = 10;
    }

    pdf.setFontSize(14);
    pdf.text('Language Distribution', 10, yOffset);
    yOffset += 5;

    autoTable(pdf, {
      startY: yOffset,
      head: [['Language', 'Count', 'Percentage']],
      body: data.languageDistribution.map(lang => [
        lang.language,
        lang.count.toString(),
        `${lang.percentage.toFixed(1)}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
    });

    yOffset = (pdf as any).lastAutoTable.finalY + 10;
  }

  // Add failed searches table
  if (data.failedSearches.length > 0) {
    if (yOffset > 240) {
      pdf.addPage();
      yOffset = 10;
    }

    pdf.setFontSize(14);
    pdf.text('Failed Searches', 10, yOffset);
    yOffset += 5;

    autoTable(pdf, {
      startY: yOffset,
      head: [['Query']],
      body: data.failedSearches.slice(0, 10).map(search => [search]),
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
    });

    yOffset = (pdf as any).lastAutoTable.finalY + 10;
  }

  // Add charts as images if requested
  if (includeCharts && chartElements.length > 0) {
    pdf.addPage();
    yOffset = 10;

    pdf.setFontSize(14);
    pdf.text('Charts', 10, yOffset);
    yOffset += 10;

    for (const chartElement of chartElements) {
      if (yOffset > 240) {
        pdf.addPage();
        yOffset = 10;
      }

      try {
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, Math.min(imgHeight, 100));
        yOffset += Math.min(imgHeight, 100) + 10;
      } catch (error) {
        console.error('Failed to add chart to PDF:', error);
      }
    }
  }

  // Save PDF
  pdf.save(`${filename}-${Date.now()}.pdf`);
}

/**
 * Generate PDF as blob (for server-side usage or email attachments)
 */
export async function generatePDFBlob(
  data: DashboardAnalyticsData,
  dateRange: { start: string; end: string }
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  let yOffset = 10;

  // Add title
  pdf.setFontSize(20);
  pdf.text('Analytics Report', 10, yOffset);
  yOffset += 10;

  // Add date range
  pdf.setFontSize(12);
  pdf.text(`Period: ${dateRange.start} to ${dateRange.end}`, 10, yOffset);
  yOffset += 10;

  // Add summary metrics table
  pdf.setFontSize(14);
  pdf.text('Summary Metrics', 10, yOffset);
  yOffset += 5;

  autoTable(pdf, {
    startY: yOffset,
    head: [['Metric', 'Value']],
    body: [
      ['Response Time', `${data.responseTime.toFixed(2)}s`],
      ['Satisfaction Score', `${data.satisfactionScore.toFixed(2)}/5`],
      ['Resolution Rate', `${data.resolutionRate.toFixed(1)}%`],
      ['Total Messages', data.metrics.totalMessages.toString()],
      ['User Messages', data.metrics.userMessages.toString()],
      ['Positive Messages', data.metrics.positiveMessages.toString()],
      ['Negative Messages', data.metrics.negativeMessages.toString()],
      ['Avg Messages/Day', data.metrics.avgMessagesPerDay.toFixed(1)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
  });

  return pdf.output('blob');
}
