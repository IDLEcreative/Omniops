/**
 * Analytics Export Module
 *
 * Provides export functionality for analytics data in multiple formats:
 * - CSV: Simple, universal format
 * - Excel: Rich formatting with multiple sheets
 * - PDF: Professional reports with tables and charts
 */

export {
  exportToCSV,
  generateCSVFilename,
  type CSVExportOptions,
} from './csv-exporter';

export {
  exportToExcel,
  generateExcelFilename,
  type ExcelExportOptions,
} from './excel-exporter';

export {
  exportToPDF,
  generatePDFFilename,
  type PDFExportOptions,
} from './pdf-exporter';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

export interface ExportRequest {
  format: ExportFormat;
  dateRange?: {
    start: string;
    end: string;
  };
  includeMessageAnalytics?: boolean;
  includeUserAnalytics?: boolean;
  includeDailyMetrics?: boolean;
  includeTopQueries?: boolean;
  includeLanguageDistribution?: boolean;
  organizationName?: string;
}
