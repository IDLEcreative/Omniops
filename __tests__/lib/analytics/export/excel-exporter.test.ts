import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { exportToExcel, generateExcelFilename, type ExcelExportOptions } from '@/lib/analytics/export/excel-exporter';
import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

// Mock XLSX module
const mockBookNew = jest.fn(() => ({ SheetNames: [], Sheets: {} }));
const mockAoaToSheet = jest.fn((data) => ({ data, type: 'sheet' }));
const mockBookAppendSheet = jest.fn();
const mockWrite = jest.fn(() => Buffer.from('mock-excel-data'));

jest.mock('xlsx', () => ({
  utils: {
    book_new: mockBookNew,
    aoa_to_sheet: mockAoaToSheet,
    book_append_sheet: mockBookAppendSheet,
  },
  write: mockWrite,
}));

// Mock data builders
const createMockMessageAnalytics = (overrides: Partial<MessageAnalytics> = {}): MessageAnalytics => ({
  totalMessages: 150,
  userMessages: 90,
  avgResponseTimeSeconds: 3.2,
  satisfactionScore: 88.5,
  resolutionRate: 0.82,
  positiveMessages: 100,
  negativeMessages: 20,
  avgMessagesPerDay: 21.4,
  topQueries: [
    { query: 'product pricing', count: 25, percentage: 27.8 },
    { query: 'order status', count: 18, percentage: 20.0 },
    { query: 'technical support', count: 12, percentage: 13.3 },
  ],
  languageDistribution: [
    { language: 'English', count: 120, percentage: 80.0 },
    { language: 'Spanish', count: 20, percentage: 13.3 },
    { language: 'French', count: 10, percentage: 6.7 },
  ],
  dailySentiment: [
    { date: '2024-01-01', positive: 15, negative: 3, neutral: 5, total: 23, satisfactionScore: 87 },
    { date: '2024-01-02', positive: 18, negative: 2, neutral: 7, total: 27, satisfactionScore: 91 },
  ],
  ...overrides,
});

const createMockUserAnalytics = (overrides: Partial<UserAnalyticsResult> = {}): UserAnalyticsResult => ({
  total_unique_users: 750,
  avg_daily_users: 107.1,
  growth: {
    growth_rate: 0.22,
    growth_absolute: 135,
  },
  session_stats: {
    total_sessions: 1800,
    avg_duration_seconds: 240,
    median_duration_seconds: 200,
    bounce_rate: 0.28,
  },
  page_view_stats: {
    total_views: 7500,
    unique_pages: 75,
    avg_views_per_session: 4.8,
  },
  shopping_behavior: {
    product_page_views: 1200,
    unique_products_viewed: 180,
    cart_page_views: 300,
    checkout_page_views: 150,
    conversion_rate: 0.12,
    avg_products_per_session: 3.2,
  },
  daily_metrics: [
    {
      date: '2024-01-01',
      unique_users: 95,
      new_users: 30,
      returning_users: 65,
      total_sessions: 220,
      avg_session_duration: 235,
      total_page_views: 920,
    },
    {
      date: '2024-01-02',
      unique_users: 115,
      new_users: 38,
      returning_users: 77,
      total_sessions: 265,
      avg_session_duration: 245,
      total_page_views: 1120,
    },
  ],
  ...overrides,
});

describe('Excel Exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToExcel', () => {
    it('should export full analytics data with all sheets', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const buffer = await exportToExcel(messageAnalytics, userAnalytics);

      // Verify workbook creation
      expect(mockBookNew).toHaveBeenCalled();

      // Verify sheets were created
      expect(mockAoaToSheet).toHaveBeenCalled();
      expect(mockBookAppendSheet).toHaveBeenCalled();

      // Verify buffer is returned
      expect(buffer).toBeInstanceOf(Buffer);
      expect(mockWrite).toHaveBeenCalledWith(
        expect.anything(),
        { type: 'buffer', bookType: 'xlsx' }
      );
    });

    it('should create Summary sheet with overview metrics', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      await exportToExcel(messageAnalytics, userAnalytics);

      // Get the first call to aoa_to_sheet (Summary sheet)
      const summarySheetCall = mockAoaToSheet.mock.calls[0];
      const summaryData = summarySheetCall[0];

      // Check Summary sheet structure
      expect(summaryData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['Analytics Report Summary']),
        expect.arrayContaining(['Generated:', expect.any(String)]),
        expect.arrayContaining(['Message Analytics']),
        expect.arrayContaining(['Metric', 'Value']),
        expect.arrayContaining(['Total Messages', 150]),
        expect.arrayContaining(['User Messages', 90]),
        expect.arrayContaining(['Avg Response Time (seconds)', '3.20']),
        expect.arrayContaining(['Satisfaction Score', '88.50']),
        expect.arrayContaining(['Resolution Rate', '82.0%']),
        expect.arrayContaining(['User Analytics']),
        expect.arrayContaining(['Total Unique Users', 750]),
        expect.arrayContaining(['Average Daily Users', '107']),
        expect.arrayContaining(['Growth Rate', '22.0%']),
      ]));

      // Verify Summary sheet was added to workbook
      expect(mockBookAppendSheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Summary'
      );
    });

    it('should handle null message analytics', async () => {
      const userAnalytics = createMockUserAnalytics();

      await exportToExcel(null, userAnalytics);

      // Verify Message Analytics sheet was not created
      const sheetNames = mockBookAppendSheet.mock.calls
        .map(call => call[2]);

      expect(sheetNames).toContain('Summary');
      expect(sheetNames).toContain('User Analytics');
      expect(sheetNames).not.toContain('Message Analytics');
    });

    it('should handle null user analytics', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToExcel(messageAnalytics, null);

      // Verify User Analytics sheet was not created
      const sheetNames = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .map(call => call[2]);

      expect(sheetNames).toContain('Summary');
      expect(sheetNames).toContain('Message Analytics');
      expect(sheetNames).not.toContain('User Analytics');
    });

    it('should handle both null analytics', async () => {
      await exportToExcel(null, null);

      // Only Summary sheet should be created
      const sheetNames = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .map(call => call[2]);

      expect(sheetNames).toHaveLength(1);
      expect(sheetNames).toContain('Summary');
    });

    it('should include date range in Summary sheet when provided', async () => {
      const options: ExcelExportOptions = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-07',
        },
      };

      await exportToExcel(null, null, options);

      const summarySheetCall = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[0];
      const summaryData = summarySheetCall[0];

      expect(summaryData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['Date Range:', '2024-01-01 to 2024-01-07']),
      ]));
    });

    it('should respect export options for sheet inclusion', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const options: ExcelExportOptions = {
        includeMessageAnalytics: false,
        includeUserAnalytics: false,
        includeDailyMetrics: false,
        includeTopQueries: false,
        includeLanguageDistribution: false,
      };

      await exportToExcel(messageAnalytics, userAnalytics, options);

      const sheetNames = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .map(call => call[2]);

      expect(sheetNames).toEqual(['Summary']);
    });

    it('should create Message Analytics sheet with detailed data', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToExcel(messageAnalytics, null);

      // Find the Message Analytics sheet call
      const messageSheetIndex = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .findIndex(call => call[2] === 'Message Analytics');

      expect(messageSheetIndex).toBeGreaterThan(-1);

      // Verify the sheet data structure
      const messageSheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[messageSheetIndex][0];

      expect(messageSheetData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['Message Analytics Details']),
        expect.arrayContaining(['Overall Metrics']),
        expect.arrayContaining(['Total Messages', 150]),
        expect.arrayContaining(['User Messages', 90]),
        expect.arrayContaining(['AI Messages', 60]),
        expect.arrayContaining(['Sentiment Analysis']),
        expect.arrayContaining(['Positive', 100, expect.stringContaining('%')]),
        expect.arrayContaining(['Performance Metrics']),
        expect.arrayContaining(['Avg Response Time', '3.20 seconds']),
      ]));
    });

    it('should create User Analytics sheet with detailed data', async () => {
      const userAnalytics = createMockUserAnalytics();

      await exportToExcel(null, userAnalytics);

      // Find the User Analytics sheet call
      const userSheetIndex = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .findIndex(call => call[2] === 'User Analytics');

      expect(userSheetIndex).toBeGreaterThan(-1);

      // Verify the sheet data structure
      const userSheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[userSheetIndex][0];

      expect(userSheetData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['User Analytics Details']),
        expect.arrayContaining(['User Growth']),
        expect.arrayContaining(['Total Unique Users', 750]),
        expect.arrayContaining(['Growth Rate', '22.0%']),
        expect.arrayContaining(['Session Metrics']),
        expect.arrayContaining(['Total Sessions', 1800]),
        expect.arrayContaining(['Shopping Behavior']),
        expect.arrayContaining(['Product Page Views', 1200]),
        expect.arrayContaining(['Conversion Rate', '12.0%']),
      ]));
    });

    it('should create Daily Metrics sheet when data exists', async () => {
      const userAnalytics = createMockUserAnalytics();

      await exportToExcel(null, userAnalytics);

      // Find the Daily Metrics sheet call
      const dailySheetIndex = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .findIndex(call => call[2] === 'Daily Metrics');

      expect(dailySheetIndex).toBeGreaterThan(-1);

      // Verify the sheet data structure
      const dailySheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[dailySheetIndex][0];

      expect(dailySheetData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['Daily User Metrics']),
        expect.arrayContaining(['Date', 'Unique Users', 'New Users', 'Returning Users', 'Sessions', 'Avg Session Duration (s)', 'Page Views']),
        expect.arrayContaining(['2024-01-01', 95, 30, 65, 220, '235', 920]),
        expect.arrayContaining(['2024-01-02', 115, 38, 77, 265, '245', 1120]),
      ]));
    });

    it('should create Top Queries sheet when queries exist', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToExcel(messageAnalytics, null);

      // Find the Top Queries sheet call
      const queriesSheetIndex = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .findIndex(call => call[2] === 'Top Queries');

      expect(queriesSheetIndex).toBeGreaterThan(-1);

      // Verify the sheet data structure
      const queriesSheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[queriesSheetIndex][0];

      expect(queriesSheetData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['Top Queries']),
        expect.arrayContaining(['Rank', 'Query', 'Count', 'Percentage']),
        expect.arrayContaining([1, 'product pricing', 25, '27.8%']),
        expect.arrayContaining([2, 'order status', 18, '20.0%']),
        expect.arrayContaining([3, 'technical support', 12, '13.3%']),
      ]));
    });

    it('should create Language Distribution sheet when languages exist', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToExcel(messageAnalytics, null);

      // Find the Languages sheet call
      const langSheetIndex = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .findIndex(call => call[2] === 'Languages');

      expect(langSheetIndex).toBeGreaterThan(-1);

      // Verify the sheet data structure
      const langSheetData = (XLSX.utils.aoa_to_sheet as jest.Mock).mock.calls[langSheetIndex][0];

      expect(langSheetData).toEqual(expect.arrayContaining([
        expect.arrayContaining(['Language Distribution']),
        expect.arrayContaining(['Language', 'Count', 'Percentage']),
        expect.arrayContaining(['English', 120, '80.0%']),
        expect.arrayContaining(['Spanish', 20, '13.3%']),
        expect.arrayContaining(['French', 10, '6.7%']),
      ]));
    });

    it('should not create sheets for empty data arrays', async () => {
      const messageAnalytics = createMockMessageAnalytics({
        topQueries: [],
        languageDistribution: [],
      });
      const userAnalytics = createMockUserAnalytics({
        daily_metrics: [],
      });

      await exportToExcel(messageAnalytics, userAnalytics);

      const sheetNames = (XLSX.utils.book_append_sheet as jest.Mock).mock.calls
        .map(call => call[2]);

      expect(sheetNames).not.toContain('Top Queries');
      expect(sheetNames).not.toContain('Languages');
      // Daily Metrics sheet might still be created but will be empty
    });

    it('should return a valid buffer', async () => {
      const buffer = await exportToExcel(null, null);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateExcelFilename', () => {
    it('should generate filename with default prefix', () => {
      const filename = generateExcelFilename();
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`analytics_${today}.xlsx`);
    });

    it('should generate filename with custom prefix', () => {
      const filename = generateExcelFilename('monthly-report');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`monthly-report_${today}.xlsx`);
    });

    it('should always use YYYY-MM-DD format', () => {
      const filename = generateExcelFilename();
      const datePattern = /analytics_\d{4}-\d{2}-\d{2}\.xlsx/;

      expect(filename).toMatch(datePattern);
    });
  });
});