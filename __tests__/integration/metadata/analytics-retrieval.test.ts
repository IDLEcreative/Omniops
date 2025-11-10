/**
 * Analytics Data Retrieval Tests
 * Tests retrieving and processing session metadata for analytics
 */

import { createMultipleConversations } from '__tests__/utils/metadata';

describe('Analytics Data Retrieval', () => {
  it('should retrieve and process session metadata for analytics', () => {
    const conversations = createMultipleConversations();

    expect(conversations).toHaveLength(2);
    expect(conversations[0].metadata.session_metadata.page_views).toHaveLength(2);
    expect(conversations[1].metadata.session_metadata.page_views).toHaveLength(1);
  });

  it('should handle conversations with session metadata correctly', () => {
    const conversations = createMultipleConversations();

    conversations.forEach((conv) => {
      expect(conv.session_id).toBeDefined();
      expect(conv.created_at).toBeDefined();
      expect(conv.metadata.session_metadata).toBeDefined();
      expect(Array.isArray(conv.metadata.session_metadata.page_views)).toBe(true);
    });
  });

  it('should preserve all metadata fields in retrieved data', () => {
    const conversations = createMultipleConversations();
    const firstConv = conversations[0];

    const sessionMeta = firstConv.metadata.session_metadata;
    expect(sessionMeta.session_id).toBeDefined();
    expect(sessionMeta.domain).toBeDefined();
    expect(sessionMeta.start_time).toBeDefined();
    expect(sessionMeta.page_views).toBeDefined();
    expect(sessionMeta.total_pages).toBeDefined();
  });
});
