/**
 * Database Storage Tests
 * Tests session metadata persistence to database
 */

import { createSessionMetadata, createPageView, createConversationWithMetadata } from '__tests__/utils/metadata';

describe('Database Storage', () => {
  it('should save session_metadata to conversations table', async () => {
    const sessionMetadata = createSessionMetadata({
      session_id: 'test-session-456',
      page_views: [
        createPageView({
          url: 'https://example.com/',
          title: 'Home',
          duration_seconds: 15,
        }),
        createPageView({
          url: 'https://example.com/checkout',
          title: 'Checkout',
          duration_seconds: 60,
        }),
      ],
      total_pages: 2,
    });

    const conversationData = createConversationWithMetadata(sessionMetadata);

    expect(conversationData.metadata.session_metadata).toBeDefined();
    expect(conversationData.metadata.session_metadata.page_views).toHaveLength(2);
    expect(conversationData.metadata.session_metadata.total_pages).toBe(2);
  });

  it('should handle conversation metadata structure correctly', () => {
    const sessionMetadata = createSessionMetadata();
    const conversationData = createConversationWithMetadata(sessionMetadata);

    expect(conversationData.session_id).toBeDefined();
    expect(conversationData.domain_id).toBeDefined();
    expect(conversationData.created_at).toBeDefined();
    expect(conversationData.metadata.session_metadata).toBe(sessionMetadata);
  });
});
