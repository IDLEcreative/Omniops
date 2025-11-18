import { describe, it, expect, beforeEach } from '@jest/globals';
// IMPORTANT: Import mocks BEFORE implementation to ensure jest.mock() is called first
import {
  mockSetFontSize,
  mockText,
  mockAutoTable,
  createMockMessageAnalytics,
  createMockUserAnalytics,
} from './pdf-exporter-test-utils';
import { exportToPDF, generatePDFFilename, type PDFExportOptions } from '@/lib/analytics/export/pdf-exporter';

describe('PDF Exporter — Core Behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('exports full analytics data to PDF', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const buffer = await exportToPDF(messageAnalytics, userAnalytics);

      expect(mockSetFontSize).toHaveBeenCalledWith(24);
      expect(mockSetFontSize).toHaveBeenCalledWith(16);
      expect(mockSetFontSize).toHaveBeenCalledWith(14);
      expect(mockAutoTable).toHaveBeenCalled();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.byteLength || buffer.length).toBeGreaterThan(0);
    });

    it('includes organization name in title', async () => {
      const options: PDFExportOptions = { organizationName: 'Acme Corporation' };
      await exportToPDF(null, null, options);

      expect(mockText).toHaveBeenCalledWith('Acme Corporation', 20, expect.any(Number));
    });

    it('includes date range metadata when provided', async () => {
      const options: PDFExportOptions = {
        dateRange: { start: '2024-01-01', end: '2024-01-07' },
      };
      await exportToPDF(null, null, options);

      expect(mockText).toHaveBeenCalledWith(
        'Date Range: 2024-01-01 to 2024-01-07',
        20,
        expect.any(Number)
      );
    });
  });

  describe('generatePDFFilename', () => {
    it('generates filename with default prefix', () => {
      const filename = generatePDFFilename();
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`analytics_${today}.pdf`);
    });

    it('respects custom prefix', () => {
      const filename = generatePDFFilename('quarterly-report');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`quarterly-report_${today}.pdf`);
    });

    it('always uses YYYY-MM-DD format', () => {
      const filename = generatePDFFilename();
      const datePattern = /analytics_\d{4}-\d{2}-\d{2}\.pdf/;

      expect(filename).toMatch(datePattern);
    });
  });
});
