import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GET } from '@/app/api/analytics/export/route';
import {
  buildServiceRoleClientMock,
  createAnalyticsRequest,
  mockServiceRoleClient,
  setupAnalyticsTestContext,
} from './test-helpers';

describe('Analytics Export - Missing Data & Selective Options', () => {
  let context: ReturnType<typeof setupAnalyticsTestContext>;

  beforeEach(() => {
    context = setupAnalyticsTestContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles export when message analytics returns no rows', async () => {
    mockServiceRoleClient(
      buildServiceRoleClientMock(context, {
        messageResponse: { data: [], error: null },
      })
    );

    const response = await GET(createAnalyticsRequest({ format: 'csv' }));
    expect(response.status).toBe(200);

    const csvContent = await response.text();
    expect(csvContent).toContain('## User Analytics');
    expect(csvContent).not.toContain('## Message Analytics');
  });

  it('handles export when user analytics returns no rows', async () => {
    mockServiceRoleClient(
      buildServiceRoleClientMock(context, {
        conversationResponse: { data: [], error: null },
      })
    );

    const response = await GET(createAnalyticsRequest({ format: 'pdf' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('exports only message analytics section when requested', async () => {
    const response = await GET(
      createAnalyticsRequest({ format: 'csv', includeMessage: 'true', includeUser: 'false' })
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).toContain('## Message Analytics');
    expect(csv).not.toContain('## User Analytics');
  });

  it('exports only user analytics section when requested', async () => {
    const response = await GET(
      createAnalyticsRequest({ format: 'csv', includeMessage: 'false', includeUser: 'true' })
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).not.toContain('## Message Analytics');
    expect(csv).toContain('## User Analytics');
  });

  it('excludes optional subsections when toggled off', async () => {
    const response = await GET(
      createAnalyticsRequest({
        format: 'csv',
        includeDailyMetrics: 'false',
        includeTopQueries: 'false',
        includeLanguages: 'false',
      })
    );

    expect(response.status).toBe(200);
    const csv = await response.text();
    expect(csv).not.toContain('## Daily User Metrics');
    expect(csv).not.toContain('## Top Queries');
    expect(csv).not.toContain('## Language Distribution');
  });
});
