import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { exportToPDF, generatePDFFilename, type PDFExportOptions } from '@/lib/analytics/export/pdf-exporter';
import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

// Mock jsPDF and jspdf-autotable
const mockAddPage = jest.fn();
const mockSetFontSize = jest.fn();
const mockText = jest.fn();
const mockSetPage = jest.fn();
const mockGetNumberOfPages = jest.fn(() => 1);
const mockOutput = jest.fn(() => new ArrayBuffer(100));

const mockAutoTable = jest.fn((doc, options) => {
  // Simulate lastAutoTable for positioning
  (doc as any).lastAutoTable = { finalY: 100 };
});

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addPage: mockAddPage,
    setFontSize: mockSetFontSize,
    text: mockText,
    setPage: mockSetPage,
    getNumberOfPages: mockGetNumberOfPages,
    output: mockOutput,
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
  })),
}));

jest.mock('jspdf-autotable', () => ({
  __esModule: true,
  default: mockAutoTable,
}));

// Mock data builders
const createMockMessageAnalytics = (overrides: Partial<MessageAnalytics> = {}): MessageAnalytics => ({
  totalMessages: 200,
  userMessages: 120,
  avgResponseTimeSeconds: 2.8,
  satisfactionScore: 90.5,
  resolutionRate: 0.85,
  positiveMessages: 140,
  negativeMessages: 30,
  avgMessagesPerDay: 28.6,
  topQueries: [
    { query: 'customer support', count: 30, percentage: 25.0 },
    { query: 'billing inquiry', count: 24, percentage: 20.0 },
    { query: 'product features', count: 18, percentage: 15.0 },
  ],
  languageDistribution: [
    { language: 'English', count: 160, percentage: 80.0 },
    { language: 'Spanish', count: 30, percentage: 15.0 },
    { language: 'French', count: 10, percentage: 5.0 },
  ],
  dailySentiment: [
    { date: '2024-01-01', positive: 20, negative: 5, neutral: 8, total: 33, satisfactionScore: 88 },
    { date: '2024-01-02', positive: 25, negative: 3, neutral: 10, total: 38, satisfactionScore: 92 },
  ],
  ...overrides,
});

const createMockUserAnalytics = (overrides: Partial<UserAnalyticsResult> = {}): UserAnalyticsResult => ({
  total_unique_users: 1000,
  avg_daily_users: 142.9,
  growth: {
    growth_rate: 0.25,
    growth_absolute: 200,
  },
  session_stats: {
    total_sessions: 2400,
    avg_duration_seconds: 300,
    median_duration_seconds: 250,
    bounce_rate: 0.25,
  },
  page_view_stats: {
    total_views: 10000,
    unique_pages: 100,
    avg_views_per_session: 5.2,
  },
  shopping_behavior: {
    product_page_views: 1600,
    unique_products_viewed: 240,
    cart_page_views: 400,
    checkout_page_views: 200,
    conversion_rate: 0.15,
    avg_products_per_session: 3.8,
  },
  daily_metrics: [
    {
      date: '2024-01-01',
      unique_users: 130,
      new_users: 40,
      returning_users: 90,
      total_sessions: 300,
      avg_session_duration: 295,
      total_page_views: 1250,
    },
    {
      date: '2024-01-02',
      unique_users: 155,
      new_users: 50,
      returning_users: 105,
      total_sessions: 350,
      avg_session_duration: 305,
      total_page_views: 1480,
    },
  ],
  ...overrides,
});

describe('PDF Exporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportToPDF', () => {
    it('should export full analytics data to PDF', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const buffer = await exportToPDF(messageAnalytics, userAnalytics);

      // Verify PDF document creation
      expect(mockSetFontSize).toHaveBeenCalledWith(24); // Title
      expect(mockSetFontSize).toHaveBeenCalledWith(16); // Subtitle
      expect(mockSetFontSize).toHaveBeenCalledWith(14); // Section headers
      expect(mockSetFontSize).toHaveBeenCalledWith(10); // Metadata
      expect(mockSetFontSize).toHaveBeenCalledWith(8);  // Footer

      // Verify text content
      expect(mockText).toHaveBeenCalledWith('Analytics Report', 20, expect.any(Number));
      expect(mockText).toHaveBeenCalledWith('Executive Summary', 20, expect.any(Number));

      // Verify tables were created
      expect(mockAutoTable).toHaveBeenCalled();

      // Verify buffer is returned
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should include organization name in title', async () => {
      const options: PDFExportOptions = {
        organizationName: 'Acme Corporation',
      };

      await exportToPDF(null, null, options);

      expect(mockText).toHaveBeenCalledWith('Acme Corporation', 20, expect.any(Number));
    });

    it('should include date range when provided', async () => {
      const options: PDFExportOptions = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-07',
        },
      };

      await exportToPDF(null, null, options);

      expect(mockText).toHaveBeenCalledWith(
        'Date Range: 2024-01-01 to 2024-01-07',
        20,
        expect.any(Number)
      );
    });

    it('should create Executive Summary table with key metrics', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      await exportToPDF(messageAnalytics, userAnalytics);

      // Find the Executive Summary table call
      const summaryTableCall = mockAutoTable.mock.calls.find(
        call => call[1].head?.[0]?.[0] === 'Metric'
      );

      expect(summaryTableCall).toBeDefined();
      expect(summaryTableCall[1].body).toEqual(expect.arrayContaining([
        ['Total Messages', '200'],
        ['Satisfaction Score', '90.5 / 100'],
        ['Resolution Rate', '85.0%'],
        ['Total Unique Users', '1000'],
        ['Growth Rate', '25.0%'],
        ['Conversion Rate', '15.0%'],
      ]));

      // Verify table styling
      expect(summaryTableCall[1].theme).toBe('grid');
      expect(summaryTableCall[1].headStyles).toEqual({ fillColor: [66, 139, 202] });
    });

    it('should handle null message analytics', async () => {
      const userAnalytics = createMockUserAnalytics();

      await exportToPDF(null, userAnalytics);

      // Should not call autoTable for message analytics
      const messageTableCall = mockAutoTable.mock.calls.find(
        call => call[1].body?.some((row: any[]) =>
          row[0] === 'Total Messages'
        )
      );

      // Message analytics should not be in summary when null
      expect(messageTableCall).toBeUndefined();
    });

    it('should handle null user analytics', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToPDF(messageAnalytics, null);

      // Should not have user analytics in summary
      const userTableCall = mockAutoTable.mock.calls.find(
        call => call[1].body?.some((row: any[]) =>
          row[0] === 'Total Unique Users'
        )
      );

      expect(userTableCall).toBeUndefined();
    });

    it('should handle both null analytics', async () => {
      const buffer = await exportToPDF(null, null);

      // Should still create a PDF with title and metadata
      expect(mockSetFontSize).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalledWith('Analytics Report', 20, expect.any(Number));
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should add new page when content exceeds page height', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      // Mock lastAutoTable to simulate content going beyond page
      mockAutoTable.mockImplementation((doc, options) => {
        (doc as any).lastAutoTable = { finalY: 250 }; // Near bottom of page
      });

      await exportToPDF(messageAnalytics, userAnalytics);

      // Should add new pages as needed
      expect(mockAddPage).toHaveBeenCalled();
    });

    it('should create Message Analytics section when included', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToPDF(messageAnalytics, null);

      // Verify Message Analytics section
      expect(mockText).toHaveBeenCalledWith('Message Analytics', 20, expect.any(Number));

      // Find message analytics table
      const messageTableCall = mockAutoTable.mock.calls.find(
        call => call[1].body?.some((row: any[]) =>
          row[0] === 'User Messages' && row[1] === '120'
        )
      );

      expect(messageTableCall).toBeDefined();
      expect(messageTableCall[1].theme).toBe('striped');
    });

    it('should create User Analytics section when included', async () => {
      const userAnalytics = createMockUserAnalytics();

      await exportToPDF(null, userAnalytics);

      // Verify User Analytics section
      expect(mockText).toHaveBeenCalledWith('User Analytics', 20, expect.any(Number));

      // Find user analytics table
      const userTableCall = mockAutoTable.mock.calls.find(
        call => call[1].body?.some((row: any[]) =>
          row[0] === 'Average Daily Users' && row[1] === '143'
        )
      );

      expect(userTableCall).toBeDefined();
      expect(userTableCall[1].theme).toBe('striped');
    });

    it('should create Top Queries section when queries exist', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToPDF(messageAnalytics, null);

      // Verify Top Queries section
      expect(mockText).toHaveBeenCalledWith('Top Queries', 20, expect.any(Number));

      // Find queries table
      const queriesTableCall = mockAutoTable.mock.calls.find(
        call => call[1].head?.[0]?.includes('Rank')
      );

      expect(queriesTableCall).toBeDefined();
      expect(queriesTableCall[1].body).toEqual(expect.arrayContaining([
        ['1', 'customer support', '30', '25.0%'],
        ['2', 'billing inquiry', '24', '20.0%'],
        ['3', 'product features', '18', '15.0%'],
      ]));

      // Verify column widths are set
      expect(queriesTableCall[1].columnStyles).toBeDefined();
    });

    it('should create Language Distribution section when languages exist', async () => {
      const messageAnalytics = createMockMessageAnalytics();

      await exportToPDF(messageAnalytics, null);

      // Verify Language Distribution section
      expect(mockText).toHaveBeenCalledWith('Language Distribution', 20, expect.any(Number));

      // Find languages table
      const langTableCall = mockAutoTable.mock.calls.find(
        call => call[1].head?.[0]?.includes('Language')
      );

      expect(langTableCall).toBeDefined();
      expect(langTableCall[1].body).toEqual(expect.arrayContaining([
        ['English', '160', '80.0%'],
        ['Spanish', '30', '15.0%'],
        ['French', '10', '5.0%'],
      ]));
    });

    it('should create Daily Metrics section on new page', async () => {
      const userAnalytics = createMockUserAnalytics();

      await exportToPDF(null, userAnalytics);

      // Daily Metrics should trigger new page
      expect(mockAddPage).toHaveBeenCalled();
      expect(mockText).toHaveBeenCalledWith('Daily User Metrics', 20, expect.any(Number));

      // Find daily metrics table
      const dailyTableCall = mockAutoTable.mock.calls.find(
        call => call[1].head?.[0]?.includes('Date')
      );

      expect(dailyTableCall).toBeDefined();
      expect(dailyTableCall[1].body).toEqual(expect.arrayContaining([
        ['2024-01-01', '130', '40', '90', '300', '295', '1250'],
        ['2024-01-02', '155', '50', '105', '350', '305', '1480'],
      ]));

      // Verify smaller font size for daily metrics
      expect(dailyTableCall[1].styles).toEqual({ fontSize: 8 });
    });

    it('should not create sections for empty data arrays', async () => {
      const messageAnalytics = createMockMessageAnalytics({
        topQueries: [],
        languageDistribution: [],
      });
      const userAnalytics = createMockUserAnalytics({
        daily_metrics: [],
      });

      await exportToPDF(messageAnalytics, userAnalytics);

      // Should not create sections for empty data
      expect(mockText).not.toHaveBeenCalledWith('Top Queries', 20, expect.any(Number));
      expect(mockText).not.toHaveBeenCalledWith('Language Distribution', 20, expect.any(Number));
      expect(mockText).not.toHaveBeenCalledWith('Daily User Metrics', 20, expect.any(Number));
    });

    it('should add page numbers to all pages', async () => {
      mockGetNumberOfPages.mockReturnValue(3);

      await exportToPDF(createMockMessageAnalytics(), createMockUserAnalytics());

      // Should set page for each page
      expect(mockSetPage).toHaveBeenCalledWith(1);
      expect(mockSetPage).toHaveBeenCalledWith(2);
      expect(mockSetPage).toHaveBeenCalledWith(3);

      // Should add page number text
      expect(mockText).toHaveBeenCalledWith(
        'Page 1 of 3',
        expect.any(Number),
        expect.any(Number),
        { align: 'center' }
      );
    });

    it('should respect export options for section inclusion', async () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const options: PDFExportOptions = {
        includeMessageAnalytics: false,
        includeUserAnalytics: false,
        includeDailyMetrics: false,
        includeTopQueries: false,
        includeLanguageDistribution: false,
      };

      await exportToPDF(messageAnalytics, userAnalytics, options);

      // Should not create any analytics sections
      expect(mockText).not.toHaveBeenCalledWith('Message Analytics', 20, expect.any(Number));
      expect(mockText).not.toHaveBeenCalledWith('User Analytics', 20, expect.any(Number));
      expect(mockText).not.toHaveBeenCalledWith('Top Queries', 20, expect.any(Number));
      expect(mockText).not.toHaveBeenCalledWith('Language Distribution', 20, expect.any(Number));
      expect(mockText).not.toHaveBeenCalledWith('Daily User Metrics', 20, expect.any(Number));
    });

    it('should return a valid buffer from PDF output', async () => {
      const buffer = await exportToPDF(null, null);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(mockOutput).toHaveBeenCalledWith('arraybuffer');
    });
  });

  describe('generatePDFFilename', () => {
    it('should generate filename with default prefix', () => {
      const filename = generatePDFFilename();
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`analytics_${today}.pdf`);
    });

    it('should generate filename with custom prefix', () => {
      const filename = generatePDFFilename('quarterly-report');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`quarterly-report_${today}.pdf`);
    });

    it('should always use YYYY-MM-DD format', () => {
      const filename = generatePDFFilename();
      const datePattern = /analytics_\d{4}-\d{2}-\d{2}\.pdf/;

      expect(filename).toMatch(datePattern);
    });
  });
});