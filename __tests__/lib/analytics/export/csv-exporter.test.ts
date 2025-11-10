import { describe, it, expect, beforeEach } from '@jest/globals';
import { exportToCSV, generateCSVFilename, type CSVExportOptions } from '@/lib/analytics/export/csv-exporter';
import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

// Mock data builders
const createMockMessageAnalytics = (overrides: Partial<MessageAnalytics> = {}): MessageAnalytics => ({
  totalMessages: 100,
  userMessages: 60,
  avgResponseTimeSeconds: 2.5,
  satisfactionScore: 85.5,
  resolutionRate: 0.75,
  positiveMessages: 70,
  negativeMessages: 10,
  avgMessagesPerDay: 14.3,
  topQueries: [
    { query: 'product availability', count: 20, percentage: 33.3 },
    { query: 'shipping info', count: 15, percentage: 25.0 },
    { query: 'return policy', count: 10, percentage: 16.7 },
  ],
  languageDistribution: [
    { language: 'en', count: 80, percentage: 80.0 },
    { language: 'es', count: 15, percentage: 15.0 },
    { language: 'fr', count: 5, percentage: 5.0 },
  ],
  dailySentiment: [
    { date: '2024-01-01', positive: 10, negative: 2, neutral: 3, total: 15, satisfactionScore: 85 },
    { date: '2024-01-02', positive: 12, negative: 1, neutral: 5, total: 18, satisfactionScore: 90 },
  ],
  ...overrides,
});

const createMockUserAnalytics = (overrides: Partial<UserAnalyticsResult> = {}): UserAnalyticsResult => ({
  total_unique_users: 500,
  avg_daily_users: 71.4,
  growth: {
    growth_rate: 0.15,
    growth_absolute: 65,
  },
  session_stats: {
    total_sessions: 1200,
    avg_duration_seconds: 180,
    median_duration_seconds: 150,
    bounce_rate: 0.35,
  },
  page_view_stats: {
    total_views: 5000,
    unique_pages: 50,
    avg_views_per_session: 4.2,
  },
  shopping_behavior: {
    product_page_views: 800,
    unique_products_viewed: 120,
    cart_page_views: 200,
    checkout_page_views: 100,
    conversion_rate: 0.08,
    avg_products_per_session: 2.5,
  },
  daily_metrics: [
    {
      date: '2024-01-01',
      unique_users: 65,
      new_users: 20,
      returning_users: 45,
      total_sessions: 150,
      avg_session_duration: 175,
      total_page_views: 620,
    },
    {
      date: '2024-01-02',
      unique_users: 78,
      new_users: 25,
      returning_users: 53,
      total_sessions: 180,
      avg_session_duration: 185,
      total_page_views: 750,
    },
  ],
  ...overrides,
});

describe('CSV Exporter', () => {
  describe('exportToCSV', () => {
    it('should export full analytics data with all sections', () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const csv = exportToCSV(messageAnalytics, userAnalytics);

      // Check header
      expect(csv).toContain('# Analytics Report');
      expect(csv).toContain('# Generated:');

      // Check message analytics section
      expect(csv).toContain('## Message Analytics');
      expect(csv).toContain('Total Messages,100');
      expect(csv).toContain('User Messages,60');
      expect(csv).toContain('Response Time (seconds),2.50');
      expect(csv).toContain('Satisfaction Score,85.50');
      expect(csv).toContain('Resolution Rate,75.0%');
      expect(csv).toContain('Positive Messages,70');
      expect(csv).toContain('Negative Messages,10');

      // Check user analytics section
      expect(csv).toContain('## User Analytics');
      expect(csv).toContain('Total Unique Users,500');
      expect(csv).toContain('Average Daily Users,71');
      expect(csv).toContain('Growth Rate,15.0%');
      expect(csv).toContain('Average Session Duration (seconds),180');
      expect(csv).toContain('Bounce Rate,35.0%');
      expect(csv).toContain('Total Page Views,5000');
      expect(csv).toContain('Product Views,800');
      expect(csv).toContain('Conversion Rate,8.0%');

      // Check top queries section
      expect(csv).toContain('## Top Queries');
      expect(csv).toContain('Query,Count,Percentage');
      expect(csv).toContain('"product availability",20,33.3%');
      expect(csv).toContain('"shipping info",15,25.0%');

      // Check language distribution
      expect(csv).toContain('## Language Distribution');
      expect(csv).toContain('Language,Count,Percentage');
      expect(csv).toContain('en,80,80.0%');
      expect(csv).toContain('es,15,15.0%');

      // Check daily metrics
      expect(csv).toContain('## Daily User Metrics');
      expect(csv).toContain('Date,Unique Users,New Users,Returning Users,Sessions,Avg Session Duration (seconds),Page Views');
      expect(csv).toContain('2024-01-01,65,20,45,150,175,620');

      // Check daily sentiment
      expect(csv).toContain('## Daily Sentiment');
      expect(csv).toContain('Date,Positive,Negative,Neutral,Total,Satisfaction Score');
      expect(csv).toContain('2024-01-01,10,2,3,15,85.00');
    });

    it('should handle null message analytics', () => {
      const userAnalytics = createMockUserAnalytics();

      const csv = exportToCSV(null, userAnalytics);

      expect(csv).toContain('# Analytics Report');
      expect(csv).not.toContain('## Message Analytics');
      expect(csv).toContain('## User Analytics');
      expect(csv).toContain('Total Unique Users,500');
    });

    it('should handle null user analytics', () => {
      const messageAnalytics = createMockMessageAnalytics();

      const csv = exportToCSV(messageAnalytics, null);

      expect(csv).toContain('# Analytics Report');
      expect(csv).toContain('## Message Analytics');
      expect(csv).not.toContain('## User Analytics');
      expect(csv).toContain('Total Messages,100');
    });

    it('should handle both null analytics', () => {
      const csv = exportToCSV(null, null);

      expect(csv).toContain('# Analytics Report');
      expect(csv).toContain('# Generated:');
      expect(csv).not.toContain('## Message Analytics');
      expect(csv).not.toContain('## User Analytics');
    });

    it('should handle empty data arrays', () => {
      const messageAnalytics = createMockMessageAnalytics({
        topQueries: [],
        languageDistribution: [],
        dailySentiment: [],
      });
      const userAnalytics = createMockUserAnalytics({
        daily_metrics: [],
      });

      const csv = exportToCSV(messageAnalytics, userAnalytics);

      expect(csv).not.toContain('## Top Queries');
      expect(csv).not.toContain('## Language Distribution');
      expect(csv).not.toContain('## Daily User Metrics');
      expect(csv).not.toContain('## Daily Sentiment');
    });

    it('should escape CSV special characters in queries', () => {
      const messageAnalytics = createMockMessageAnalytics({
        topQueries: [
          { query: 'query with "quotes"', count: 5, percentage: 10 },
          { query: 'query, with, commas', count: 3, percentage: 6 },
        ],
      });

      const csv = exportToCSV(messageAnalytics, null);

      // Quotes should be escaped as double quotes
      expect(csv).toContain('"query with ""quotes""",5,10.0%');
      expect(csv).toContain('"query, with, commas",3,6.0%');
    });

    it('should include date range when provided', () => {
      const options: CSVExportOptions = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-07',
        },
      };

      const csv = exportToCSV(null, null, options);

      expect(csv).toContain('# Date Range: 2024-01-01 to 2024-01-07');
    });

    it('should respect export options for sections', () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const options: CSVExportOptions = {
        includeMessageAnalytics: false,
        includeUserAnalytics: false,
        includeDailyMetrics: false,
        includeTopQueries: false,
        includeLanguageDistribution: false,
      };

      const csv = exportToCSV(messageAnalytics, userAnalytics, options);

      expect(csv).not.toContain('## Message Analytics');
      expect(csv).not.toContain('## User Analytics');
      expect(csv).not.toContain('## Daily User Metrics');
      expect(csv).not.toContain('## Top Queries');
      expect(csv).not.toContain('## Language Distribution');
    });

    it('should include only specified sections', () => {
      const messageAnalytics = createMockMessageAnalytics();
      const userAnalytics = createMockUserAnalytics();

      const options: CSVExportOptions = {
        includeMessageAnalytics: true,
        includeUserAnalytics: false,
        includeDailyMetrics: false,
        includeTopQueries: true,
        includeLanguageDistribution: false,
      };

      const csv = exportToCSV(messageAnalytics, userAnalytics, options);

      expect(csv).toContain('## Message Analytics');
      expect(csv).not.toContain('## User Analytics');
      expect(csv).not.toContain('## Daily User Metrics');
      expect(csv).toContain('## Top Queries');
      expect(csv).not.toContain('## Language Distribution');
    });

    it('should format numbers correctly', () => {
      const messageAnalytics = createMockMessageAnalytics({
        avgResponseTimeSeconds: 3.456789,
        satisfactionScore: 92.3456,
        resolutionRate: 0.6789,
      });

      const csv = exportToCSV(messageAnalytics, null);

      expect(csv).toContain('Response Time (seconds),3.46');
      expect(csv).toContain('Satisfaction Score,92.35');
      expect(csv).toContain('Resolution Rate,67.9%');
    });

    it('should handle missing optional fields gracefully', () => {
      const messageAnalytics: any = {
        totalMessages: 50,
        userMessages: 30,
        avgResponseTimeSeconds: 2.0,
        satisfactionScore: 80,
        resolutionRate: 0.7,
        positiveMessages: 35,
        negativeMessages: 5,
        avgMessagesPerDay: 7,
        topQueries: [],
        languageDistribution: [],
        // dailySentiment is undefined
      };

      const csv = exportToCSV(messageAnalytics, null);

      expect(csv).toContain('Total Messages,50');
      expect(csv).not.toContain('## Daily Sentiment');
      expect(() => exportToCSV(messageAnalytics, null)).not.toThrow();
    });
  });

  describe('generateCSVFilename', () => {
    it('should generate filename with default prefix', () => {
      const filename = generateCSVFilename();
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`analytics_${today}.csv`);
    });

    it('should generate filename with custom prefix', () => {
      const filename = generateCSVFilename('custom-report');
      const today = new Date().toISOString().split('T')[0];

      expect(filename).toBe(`custom-report_${today}.csv`);
    });

    it('should always use YYYY-MM-DD format', () => {
      const filename = generateCSVFilename();
      const datePattern = /analytics_\d{4}-\d{2}-\d{2}\.csv/;

      expect(filename).toMatch(datePattern);
    });
  });
});