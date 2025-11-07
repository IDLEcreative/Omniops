/**
 * Tests for Analytics Export and Email Reports
 */

import { generateCSVContent } from '@/lib/analytics/export-csv';
import { generatePDFBlob } from '@/lib/analytics/export-pdf';
import type { DashboardAnalyticsData } from '@/types/dashboard';

// Mock analytics data
const mockAnalyticsData: DashboardAnalyticsData = {
  responseTime: 2.5,
  satisfactionScore: 4.2,
  resolutionRate: 85.5,
  topQueries: [
    { query: 'How do I track my order?', count: 45, percentage: 25.0 },
    { query: 'What is your return policy?', count: 30, percentage: 16.7 },
    { query: 'Do you ship internationally?', count: 20, percentage: 11.1 },
  ],
  failedSearches: ['obscure product', 'old discontinued item'],
  languageDistribution: [
    { language: 'en', percentage: 80.0, count: 144, color: '#3b82f6' },
    { language: 'es', percentage: 15.0, count: 27, color: '#10b981' },
    { language: 'fr', percentage: 5.0, count: 9, color: '#f59e0b' },
  ],
  dailySentiment: [
    {
      date: '2025-11-01',
      positive: 20,
      negative: 5,
      neutral: 10,
      total: 35,
      satisfactionScore: 4.0,
    },
    {
      date: '2025-11-02',
      positive: 25,
      negative: 3,
      neutral: 12,
      total: 40,
      satisfactionScore: 4.3,
    },
  ],
  metrics: {
    totalMessages: 180,
    userMessages: 90,
    avgMessagesPerDay: 25.7,
    positiveMessages: 70,
    negativeMessages: 10,
  },
};

const mockDateRange = {
  start: '2025-11-01',
  end: '2025-11-07',
};

describe('CSV Export', () => {
  it('should generate valid CSV content', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toBeTruthy();
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
  });

  it('should include summary data in CSV', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toContain('Summary');
    expect(csv).toContain('2.50'); // response time
    expect(csv).toContain('4.20'); // satisfaction score
    expect(csv).toContain('85.5'); // resolution rate
  });

  it('should include daily sentiment data', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toContain('Daily Sentiment');
    expect(csv).toContain('2025-11-01');
    expect(csv).toContain('2025-11-02');
  });

  it('should include top queries', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toContain('Top Query');
    expect(csv).toContain('How do I track my order?');
    expect(csv).toContain('What is your return policy?');
  });

  it('should include language distribution', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toContain('Language');
    expect(csv).toContain('en');
    expect(csv).toContain('80.0');
  });

  it('should include failed searches', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toContain('Failed Search');
    expect(csv).toContain('obscure product');
  });
});

describe('PDF Export', () => {
  it('should generate valid PDF blob', async () => {
    const blob = await generatePDFBlob(mockAnalyticsData, mockDateRange);

    expect(blob).toBeTruthy();
    expect(blob instanceof Blob).toBe(true);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should create PDF with correct size', async () => {
    const blob = await generatePDFBlob(mockAnalyticsData, mockDateRange);

    // PDF should be at least 5KB (basic report with tables)
    expect(blob.size).toBeGreaterThan(5000);
  });
});

describe('Date Range Formatting', () => {
  it('should handle date range correctly in CSV', () => {
    const csv = generateCSVContent(mockAnalyticsData, mockDateRange);

    expect(csv).toContain('2025-11-01 to 2025-11-07');
  });

  it('should handle different date formats', () => {
    const customRange = {
      start: '2025-01-01',
      end: '2025-12-31',
    };

    const csv = generateCSVContent(mockAnalyticsData, customRange);

    expect(csv).toContain('2025-01-01 to 2025-12-31');
  });
});

describe('Edge Cases', () => {
  it('should handle empty top queries', () => {
    const dataWithoutQueries = {
      ...mockAnalyticsData,
      topQueries: [],
    };

    const csv = generateCSVContent(dataWithoutQueries, mockDateRange);

    expect(csv).toBeTruthy();
    expect(csv).not.toContain('Top Query');
  });

  it('should handle empty failed searches', () => {
    const dataWithoutFailures = {
      ...mockAnalyticsData,
      failedSearches: [],
    };

    const csv = generateCSVContent(dataWithoutFailures, mockDateRange);

    expect(csv).toBeTruthy();
    expect(csv).not.toContain('Failed Search');
  });

  it('should handle zero metrics', () => {
    const dataWithZeros = {
      ...mockAnalyticsData,
      responseTime: 0,
      satisfactionScore: 0,
      resolutionRate: 0,
      metrics: {
        totalMessages: 0,
        userMessages: 0,
        avgMessagesPerDay: 0,
        positiveMessages: 0,
        negativeMessages: 0,
      },
    };

    const csv = generateCSVContent(dataWithZeros, mockDateRange);

    expect(csv).toBeTruthy();
    expect(csv).toContain('0.00');
  });
});
