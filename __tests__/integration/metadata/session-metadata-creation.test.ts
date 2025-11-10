/**
 * Session Metadata Creation Tests
 * Tests basic session metadata structure and page view creation
 */

import { SessionMetadata } from '@/types/analytics';
import { createSessionMetadata, createPageViews } from '__tests__/utils/metadata';

describe('Session Metadata Creation', () => {
  it('should create session metadata with page views', () => {
    const pageViews = createPageViews(3);
    const sessionMetadata: SessionMetadata = {
      session_id: 'test-session-123',
      domain: 'example.com',
      start_time: new Date().toISOString(),
      page_views: pageViews,
      total_pages: pageViews.length,
      conversation_ids: [],
      user_agent: 'Mozilla/5.0 (Test Browser)',
      browser_info: {
        browser: 'Chrome',
        version: '120.0',
        os: 'macOS',
        device: 'desktop',
      },
    };

    expect(sessionMetadata.page_views).toHaveLength(3);
    expect(sessionMetadata.total_pages).toBe(3);
    expect(sessionMetadata.page_views[0].url).toContain('example.com');
    expect(sessionMetadata.page_views[1].url).toContain('products');
    expect(sessionMetadata.page_views[2].url).toContain('cart');
  });

  it('should create metadata using builder helper', () => {
    const sessionMetadata = createSessionMetadata();

    expect(sessionMetadata.session_id).toBe('test-session-123');
    expect(sessionMetadata.domain).toBe('example.com');
    expect(sessionMetadata.page_views).toHaveLength(3);
    expect(sessionMetadata.total_pages).toBe(3);
  });

  it('should allow overriding session metadata fields', () => {
    const customMetadata = createSessionMetadata({
      session_id: 'custom-session',
      domain: 'custom.com',
      total_pages: 5,
    });

    expect(customMetadata.session_id).toBe('custom-session');
    expect(customMetadata.domain).toBe('custom.com');
  });
});
