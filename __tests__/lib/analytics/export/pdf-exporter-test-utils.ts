import { jest } from '@jest/globals';
import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

// Shared mocks for jsPDF and jspdf-autotable
export const mockAddPage = jest.fn();
export const mockSetFontSize = jest.fn();
export const mockText = jest.fn();
export const mockSetPage = jest.fn();
export const mockGetNumberOfPages = jest.fn(() => 1);
export const mockOutput = jest.fn(() => new ArrayBuffer(100));

export const mockAutoTable = jest.fn((doc: any) => {
  doc.lastAutoTable = { finalY: 100 };
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

export const createMockMessageAnalytics = (
  overrides: Partial<MessageAnalytics> = {}
): MessageAnalytics => ({
  totalMessages: 200,
  totalUserMessages: 120,
  avgResponseTimeSeconds: 2.8,
  satisfactionScore: 90.5,
  resolutionRate: 0.85,
  topQueries: [
    { query: 'customer support', count: 30, percentage: 25.0 },
    { query: 'billing inquiry', count: 24, percentage: 20.0 },
    { query: 'product features', count: 18, percentage: 15.0 },
  ],
  failedSearches: [],
  languageDistribution: [
    { language: 'English', count: 160, percentage: 80.0 },
    { language: 'Spanish', count: 30, percentage: 15.0 },
    { language: 'French', count: 10, percentage: 5.0 },
  ],
  avgMessagesPerDay: 28.6,
  positiveUserMessages: 140,
  negativeUserMessages: 30,
  dailySentiment: [
    { date: '2024-01-01', positive: 20, negative: 5, neutral: 8, total: 33, satisfactionScore: 88 },
    { date: '2024-01-02', positive: 25, negative: 3, neutral: 10, total: 38, satisfactionScore: 92 },
  ],
  ...overrides,
});

export const createMockUserAnalytics = (
  overrides: Partial<UserAnalyticsResult> = {}
): UserAnalyticsResult => ({
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
