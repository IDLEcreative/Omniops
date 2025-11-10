/**
 * Test Data Builders for Metadata E2E Tests
 * Provides factory functions for creating consistent test data
 */

import { SessionMetadata, PageView } from '@/types/analytics';

export function createPageView(overrides?: Partial<PageView>): PageView {
  return {
    url: 'https://example.com/',
    title: 'Home Page',
    timestamp: new Date().toISOString(),
    duration_seconds: 30,
    ...overrides,
  };
}

export function createPageViews(count: number, baseUrl = 'https://example.com'): PageView[] {
  const views: PageView[] = [
    createPageView({ url: `${baseUrl}/`, title: 'Home Page' }),
    createPageView({ url: `${baseUrl}/products/widget`, title: 'Widget Product', duration_seconds: 45 }),
    createPageView({ url: `${baseUrl}/cart`, title: 'Shopping Cart', duration_seconds: 20 }),
  ];
  return views.slice(0, count);
}

export function createSessionMetadata(overrides?: Partial<SessionMetadata>): SessionMetadata {
  const pageViews = overrides?.page_views || createPageViews(3);
  return {
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
    ...overrides,
  };
}

export function createConversationWithMetadata(sessionMetadata: SessionMetadata) {
  return {
    session_id: sessionMetadata.session_id,
    domain_id: 'domain-123',
    created_at: new Date().toISOString(),
    metadata: {
      session_metadata: sessionMetadata,
    },
  };
}

export function createMultipleConversations() {
  const sessionStart1 = new Date(Date.now() - 3600000);
  const sessionStart2 = new Date(Date.now() - 1800000);

  return [
    createConversationWithMetadata(
      createSessionMetadata({
        session_id: 'session-1',
        start_time: sessionStart1.toISOString(),
        page_views: createPageViews(2),
      })
    ),
    createConversationWithMetadata(
      createSessionMetadata({
        session_id: 'session-2',
        start_time: sessionStart2.toISOString(),
        page_views: createPageViews(1),
      })
    ),
  ];
}

export function createE2ETestSessionMetadata(): SessionMetadata {
  const startTime = new Date(Date.now() - 180000);
  return createSessionMetadata({
    session_id: 'e2e-test-session',
    domain: 'test.example.com',
    start_time: startTime.toISOString(),
    page_views: [
      createPageView({
        url: 'https://test.example.com/',
        title: 'Home',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        duration_seconds: 30,
      }),
      createPageView({
        url: 'https://test.example.com/products/test-widget',
        title: 'Test Widget',
        timestamp: new Date(Date.now() - 150000).toISOString(),
        duration_seconds: 60,
      }),
      createPageView({
        url: 'https://test.example.com/cart',
        title: 'Shopping Cart',
        timestamp: new Date(Date.now() - 90000).toISOString(),
        duration_seconds: 45,
      }),
      createPageView({
        url: 'https://test.example.com/checkout',
        title: 'Checkout',
        timestamp: new Date(Date.now() - 45000).toISOString(),
        duration_seconds: 45,
      }),
    ],
    total_pages: 4,
  });
}
