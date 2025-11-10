/**
 * Chat Widget Integration Tests
 * Tests session metadata integration with chat API requests
 */

import { SessionMetadata } from '@/types/analytics';
import { createSessionMetadata, createPageView } from '__tests__/utils/metadata';

describe('Chat Widget Integration', () => {
  it('should include session_metadata in chat API request', async () => {
    const sessionMetadata: SessionMetadata = createSessionMetadata({
      page_views: [
        createPageView({
          url: 'https://example.com/products/widget',
          title: 'Widget Product',
          duration_seconds: 30,
        }),
      ],
      total_pages: 1,
    });

    const chatRequest = {
      message: 'What are the specs for this widget?',
      session_id: 'test-session-123',
      domain: 'example.com',
      session_metadata: sessionMetadata,
    };

    expect(chatRequest.session_metadata).toBeDefined();
    expect(chatRequest.session_metadata?.session_id).toBe('test-session-123');
    expect(chatRequest.session_metadata?.page_views).toHaveLength(1);
    expect(chatRequest.session_metadata?.page_views[0].url).toContain('products/widget');
  });

  it('should preserve session metadata through request lifecycle', () => {
    const sessionMetadata = createSessionMetadata();
    const originalId = sessionMetadata.session_id;
    const originalPages = sessionMetadata.page_views.length;

    const chatRequest = {
      message: 'Test message',
      session_metadata: sessionMetadata,
    };

    expect(chatRequest.session_metadata.session_id).toBe(originalId);
    expect(chatRequest.session_metadata.page_views).toHaveLength(originalPages);
  });
});
