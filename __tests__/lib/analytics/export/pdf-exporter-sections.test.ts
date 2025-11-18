import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  mockAddPage,
  mockSetFontSize,
  mockText,
  mockSetPage,
  mockGetNumberOfPages,
  mockAutoTable,
  createMockMessageAnalytics,
  createMockUserAnalytics,
} from './pdf-exporter-test-utils';
import { exportToPDF } from '@/lib/analytics/export/pdf-exporter';

describe('PDF Exporter — Section Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNumberOfPages.mockReturnValue(1);
  });

  it('creates Executive Summary table with key metrics', async () => {
    const messageAnalytics = createMockMessageAnalytics();
    const userAnalytics = createMockUserAnalytics();

    await exportToPDF(messageAnalytics, userAnalytics);

    const summaryTableCall = mockAutoTable.mock.calls.find(
      call => call[1].head?.[0]?.[0] === 'Metric'
    );

    expect(summaryTableCall).toBeDefined();
    expect(summaryTableCall![1].body).toEqual(
      expect.arrayContaining([
        ['Total Messages', '200'],
        ['Satisfaction Score', '90.5 / 100'],
        ['Resolution Rate', '85.0%'],
        ['Total Unique Users', '1000'],
        ['Growth Rate', '25.0%'],
        ['Conversion Rate', '15.0%'],
      ])
    );
  });

  it('handles null user analytics gracefully', async () => {
    const messageAnalytics = createMockMessageAnalytics();

    await exportToPDF(messageAnalytics, null);

    const tables = mockAutoTable.mock.calls.map(call => call[1].head?.[0]?.[0]);
    expect(tables).toContain('Metric');
    expect(tables).not.toContain('User Metric');
  });

  it('adds new page for long content', async () => {
    const messageAnalytics = createMockMessageAnalytics({
      topQueries: Array.from({ length: 25 }).map((_, idx) => ({
        query: `query-${idx}`,
        count: idx + 1,
        percentage: 2,
      })),
    });
    const userAnalytics = createMockUserAnalytics();

    // Include both analytics to fill the page and trigger page addition
    await exportToPDF(messageAnalytics, userAnalytics);

    expect(mockAddPage).toHaveBeenCalled();
  });

  it('renders Message Analytics section when included', async () => {
    const messageAnalytics = createMockMessageAnalytics();

    await exportToPDF(messageAnalytics, null, { includeMessageAnalytics: true });

    expect(mockText).toHaveBeenCalledWith('Message Analytics', 20, expect.any(Number));
    const messageTable = mockAutoTable.mock.calls.find(
      call => call[1].head?.[0]?.includes('Metric') && call[1].body?.some?.((row: string[]) => row.includes('Avg Response Time'))
    );
    expect(messageTable).toBeDefined();
  });

  it('renders User Analytics section when included', async () => {
    const userAnalytics = createMockUserAnalytics();

    await exportToPDF(null, userAnalytics, { includeUserAnalytics: true });

    expect(mockText).toHaveBeenCalledWith('User Analytics', 20, expect.any(Number));
  });

  it('renders Top Queries section when data exists', async () => {
    const messageAnalytics = createMockMessageAnalytics();

    await exportToPDF(messageAnalytics, null, { includeTopQueries: true });

    expect(mockText).toHaveBeenCalledWith('Top Queries', 20, expect.any(Number));
  });

  it('renders Language Distribution section when data exists', async () => {
    const messageAnalytics = createMockMessageAnalytics();

    await exportToPDF(messageAnalytics, null, { includeLanguageDistribution: true });

    expect(mockText).toHaveBeenCalledWith('Language Distribution', 20, expect.any(Number));
  });

  it('renders Daily Metrics section on a new page', async () => {
    const userAnalytics = createMockUserAnalytics();

    await exportToPDF(null, userAnalytics, { includeDailyMetrics: true });

    expect(mockAddPage).toHaveBeenCalled();
    expect(mockText).toHaveBeenCalledWith('Daily User Metrics', 20, expect.any(Number));
  });

  it('omits optional sections when data arrays are empty', async () => {
    const messageAnalytics = createMockMessageAnalytics({
      topQueries: [],
      languageDistribution: [],
    });
    const userAnalytics = createMockUserAnalytics({ daily_metrics: [] });

    await exportToPDF(messageAnalytics, userAnalytics, {
      includeTopQueries: true,
      includeLanguageDistribution: true,
      includeDailyMetrics: true,
    });

    expect(mockText).not.toHaveBeenCalledWith('Top Queries', 20, expect.any(Number));
    expect(mockText).not.toHaveBeenCalledWith('Language Distribution', 20, expect.any(Number));
    expect(mockText).not.toHaveBeenCalledWith('Daily User Metrics', 20, expect.any(Number));
  });

  it('adds page numbers across all pages', async () => {
    mockGetNumberOfPages.mockReturnValue(2);
    await exportToPDF(createMockMessageAnalytics(), createMockUserAnalytics());

    expect(mockSetPage).toHaveBeenCalledWith(1);
    expect(mockSetPage).toHaveBeenCalledWith(2);
    expect(mockText).toHaveBeenCalledWith(
      'Page 1 of 2',
      expect.any(Number),
      expect.any(Number),
      { align: 'center' }
    );
  });
});
