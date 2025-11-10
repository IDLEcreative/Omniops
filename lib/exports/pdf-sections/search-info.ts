import { jsPDF } from 'jspdf';

/**
 * Add search information section to PDF
 */
export function addSearchInfo(
  doc: jsPDF,
  query: string,
  filters: any,
  y: number,
  width: number
): number {
  const margin = 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Search Criteria', margin, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Query
  doc.text(`Query: "${query}"`, margin + 5, y);
  y += 6;

  // Date range
  if (filters?.dateFrom || filters?.dateTo) {
    const from = filters.dateFrom
      ? new Date(filters.dateFrom).toLocaleDateString()
      : 'Any';
    const to = filters.dateTo
      ? new Date(filters.dateTo).toLocaleDateString()
      : 'Any';
    doc.text(`Date Range: ${from} - ${to}`, margin + 5, y);
    y += 6;
  }

  // Sentiment filter
  if (filters?.sentiment) {
    doc.text(`Sentiment: ${filters.sentiment}`, margin + 5, y);
    y += 6;
  }

  // Domain filter
  if (filters?.domainName) {
    doc.text(`Domain: ${filters.domainName}`, margin + 5, y);
    y += 6;
  }

  y += 5;
  return y;
}
