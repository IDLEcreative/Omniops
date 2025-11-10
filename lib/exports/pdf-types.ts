/**
 * PDF Export Options
 */
export interface PDFExportOptions {
  title?: string;
  includeTimestamp?: boolean;
  includeFilters?: boolean;
  includeSummary?: boolean;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  fontSize?: number;
}

export const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  title: 'Conversation Search Results',
  includeTimestamp: true,
  includeFilters: true,
  includeSummary: true,
  pageSize: 'a4',
  orientation: 'portrait',
  fontSize: 10
};
