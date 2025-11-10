import { jsPDF } from 'jspdf';
import { PDFExportOptions } from '../pdf-types';

/**
 * Add document header to PDF
 */
export function addHeader(
  doc: jsPDF,
  title: string,
  y: number,
  width: number,
  options: PDFExportOptions
): number {
  const margin = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  y += 10;

  // Timestamp
  if (options.includeTimestamp) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 8;
  }

  // Separator line
  doc.setDrawColor(200);
  doc.line(margin, y, margin + width, y);
  y += 10;

  doc.setTextColor(0);
  return y;
}
