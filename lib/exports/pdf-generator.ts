import { jsPDF } from 'jspdf';
import { SearchResult } from '@/lib/search/conversation-search';
import { PDFExportOptions, DEFAULT_PDF_OPTIONS } from './pdf-types';
import { addHeader } from './pdf-sections/header';
import { addSearchInfo } from './pdf-sections/search-info';
import { addSummary } from './pdf-sections/summary';
import { addResults } from './pdf-sections/results';
import { addPageNumbers } from './pdf-sections/page-numbers';

// Re-export types for backward compatibility
export type { PDFExportOptions };

/**
 * Export search results to PDF
 */
export function exportToPDF(
  results: SearchResult[],
  searchQuery: string,
  filters?: any,
  options: PDFExportOptions = {}
): Uint8Array {
  const opts = { ...DEFAULT_PDF_OPTIONS, ...options };
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format: opts.pageSize
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Add header
  yPosition = addHeader(doc, opts.title || '', yPosition, contentWidth, opts);

  // Add search information
  if (opts.includeFilters) {
    yPosition = addSearchInfo(doc, searchQuery, filters, yPosition, contentWidth);
  }

  // Add summary statistics
  if (opts.includeSummary) {
    yPosition = addSummary(doc, results, yPosition, contentWidth);
  }

  // Add results
  yPosition = addResults(doc, results, yPosition, contentWidth, pageHeight, margin);

  // Add page numbers
  addPageNumbers(doc);

  // Return as Uint8Array
  return new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
}

// Re-export conversation report generator
export { generateConversationReport } from './conversation-report';
