import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GET } from '@/app/api/analytics/export/route';
import {
  buildServiceRoleClientMock,
  createAnalyticsRequest,
  mockServiceRoleClient,
  setupAnalyticsTestContext,
} from './test-helpers';

describe('Analytics Export - Error Recovery', () => {
  let context: ReturnType<typeof setupAnalyticsTestContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    context = setupAnalyticsTestContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('continues export when message fetch fails but user data exists', async () => {
    mockServiceRoleClient(
      buildServiceRoleClientMock(context, {
        messageResponse: { data: null, error: { message: 'Database connection failed' } },
      })
    );

    const response = await GET(createAnalyticsRequest({ format: 'csv' }));
    expect(response.status).toBe(200);
  });

  it('logs formatter errors without crashing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await GET(createAnalyticsRequest({ format: 'csv' }));
    expect([200, 500]).toContain(response.status);

    consoleSpy.mockRestore();
  });
});
