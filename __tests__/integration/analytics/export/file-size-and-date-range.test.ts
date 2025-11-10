import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GET } from '@/app/api/analytics/export/route';
import { createAnalyticsRequest, setupAnalyticsTestContext } from './test-helpers';

describe('Analytics Export - File Size & Date Range', () => {
  beforeEach(() => {
    setupAnalyticsTestContext();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('generates compact CSV files', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'csv' }));
    expect(response.status).toBe(200);

    const csvContent = await response.text();
    const sizeInBytes = new TextEncoder().encode(csvContent).length;

    expect(sizeInBytes).toBeGreaterThan(1000);
    expect(sizeInBytes).toBeLessThan(1024 * 1024);
  });

  it('generates bounded Excel files', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'excel' }));
    expect(response.status).toBe(200);

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(5000);
    expect(buffer.byteLength).toBeLessThan(5 * 1024 * 1024);
  });

  it('generates bounded PDF files', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'pdf' }));
    expect(response.status).toBe(200);

    const buffer = await response.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(10_000);
    expect(buffer.byteLength).toBeLessThan(2 * 1024 * 1024);
  });

  it('includes date range metadata for custom window', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'csv', days: '30' }));
    expect(response.status).toBe(200);

    const csvContent = await response.text();
    expect(csvContent).toMatch(/# Date Range: \d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}/);
  });

  it('supports 1-day exports', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'excel', days: '1' }));
    expect(response.status).toBe(200);
  });

  it('supports 365-day exports', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'pdf', days: '365' }));
    expect(response.status).toBe(200);
  });
});
