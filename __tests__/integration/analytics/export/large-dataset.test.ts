import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GET } from '@/app/api/analytics/export/route';
import {
  createAnalyticsRequest,
  createRealisticConversations,
  createRealisticMessages,
  setupAnalyticsTestContext,
} from './test-helpers';

describe('Analytics Export - Large Dataset Handling', () => {
  let context: ReturnType<typeof setupAnalyticsTestContext>;

  beforeEach(() => {
    context = setupAnalyticsTestContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles exports with 1000+ messages', async () => {
    context.messages = createRealisticMessages(1000);

    const start = Date.now();
    const response = await GET(createAnalyticsRequest({ format: 'csv' }));
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(5000);

    const csvContent = await response.text();
    expect(csvContent.length).toBeGreaterThan(10_000);
  });

  it('handles exports with 500+ conversations', async () => {
    context.conversations = createRealisticConversations(500);

    const response = await GET(createAnalyticsRequest({ format: 'excel' }));
    expect(response.status).toBe(200);

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(5000);
    expect(buffer.byteLength).toBeLessThan(10 * 1024 * 1024);
  });
});
