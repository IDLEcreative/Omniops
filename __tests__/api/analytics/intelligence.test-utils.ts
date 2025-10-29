/**
 * Shared test utilities for analytics intelligence tests
 */

export function createMockBusinessIntelligence() {
  return {
    analyzeCustomerJourney: jest.fn(),
    analyzeContentGaps: jest.fn(),
    analyzePeakUsage: jest.fn(),
    analyzeConversionFunnel: jest.fn(),
  };
}

export const mockJourneyData = {
  conversionRate: 0.25,
  avgSessionsBeforeConversion: 3,
  commonPaths: [],
  dropOffPoints: []
};

export const mockContentGaps = {
  unansweredQueries: [
    { query: 'return policy', frequency: 10, avgConfidence: 0.3 }
  ]
};

export const mockPeakUsage = {
  hourlyDistribution: Array(24).fill(null).map((_, i) => ({
    hour: i,
    avgMessages: (i * 4.167) % 100 // Deterministic: 0-100 range
  })),
  busiestDays: [],
  peakHours: [14, 15]
};

export const mockConversionFunnel = {
  stages: [
    { name: 'initial_contact', completedCount: 100 },
    { name: 'product_inquiry', completedCount: 80 },
    { name: 'price_check', completedCount: 30 },
    { name: 'order_lookup', completedCount: 25 },
    { name: 'purchase', completedCount: 10 }
  ],
  overallConversionRate: 0.1
};

export function calculateDaysDiff(start: Date, end: Date): number {
  return Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}
