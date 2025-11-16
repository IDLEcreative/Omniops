import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GET } from '@/app/api/analytics/export/route';
import { createAnalyticsRequest, setupAnalyticsTestContext } from './test-helpers';

describe('Analytics Export - Complete Flow', () => {
  beforeEach(() => {
    setupAnalyticsTestContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exports CSV with complete analytics sections', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'csv' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/csv');

    const csvContent = await response.text();
    expect(csvContent).toContain('# Analytics Report');
    expect(csvContent).toContain('## Message Analytics');
    expect(csvContent).toContain('## User Analytics');
    expect(csvContent.split('\n').length).toBeGreaterThan(20);
  });

  it('exports Excel workbook with generated dataset', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'excel' }));

    console.log('[TEST DEBUG] Excel response status:', response.status);
    console.log('[TEST DEBUG] Excel response headers:', Object.fromEntries(response.headers.entries()));

    if (response.status !== 200) {
      const errorText = await response.text();
      console.log('[TEST DEBUG] Error response:', errorText);
    }

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    const buffer = await response.arrayBuffer();
    console.log('[TEST DEBUG] Excel buffer byteLength:', buffer.byteLength);
    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(Buffer.from(buffer)).toBeInstanceOf(Buffer);
  });

  it('exports PDF summary with tables', async () => {
    const response = await GET(createAnalyticsRequest({ format: 'pdf' }));

    console.log('[TEST DEBUG] PDF response status:', response.status);
    console.log('[TEST DEBUG] PDF response headers:', Object.fromEntries(response.headers.entries()));

    if (response.status !== 200) {
      const errorText = await response.text();
      console.log('[TEST DEBUG] Error response:', errorText);
    }

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');

    const buffer = await response.arrayBuffer();
    console.log('[TEST DEBUG] PDF buffer byteLength:', buffer.byteLength);
    expect(buffer.byteLength).toBeGreaterThan(0);
    expect(Buffer.from(buffer)).toBeInstanceOf(Buffer);
  });
});
