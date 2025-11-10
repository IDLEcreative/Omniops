/**
 * Session Tracking Tests
 *
 * Tests for user session management, including page views,
 * conversation linking, and session metrics calculation.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SessionTracker } from '@/lib/analytics/session-tracker';

describe('SessionTracker', () => {
  let sessionTracker: SessionTracker;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    sessionTracker = new SessionTracker('example.com');
  });

  afterEach(() => {
    sessionTracker.endSession();
  });

  it('should generate session ID', () => {
    const sessionId = sessionTracker.getSessionId();
    expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
  });

  it('should track page views', () => {
    sessionTracker.trackPageView('https://example.com/page1', 'Page 1');
    const metadata = sessionTracker.getMetadata();

    expect(metadata.page_views.length).toBe(2); // Initial + tracked
    expect(metadata.total_pages).toBe(2);
  });

  it('should link conversations', () => {
    sessionTracker.linkConversation('conv-1');
    sessionTracker.linkConversation('conv-2');

    const metadata = sessionTracker.getMetadata();
    expect(metadata.conversation_ids).toContain('conv-1');
    expect(metadata.conversation_ids).toContain('conv-2');
  });

  it('should calculate session metrics', () => {
    sessionTracker.trackInteraction();
    sessionTracker.trackScrollDepth(50);

    const metrics = sessionTracker.calculateMetrics();
    expect(metrics).toHaveProperty('duration_seconds');
    expect(metrics).toHaveProperty('page_views');
    expect(metrics).toHaveProperty('total_interactions');
  });

  it('should export session data', () => {
    const data = sessionTracker.exportData();

    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('domain');
    expect(data).toHaveProperty('start_time');
    expect(data).toHaveProperty('page_views');
    expect(data).toHaveProperty('browser_info');
  });
});
