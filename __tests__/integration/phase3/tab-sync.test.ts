/**
 * Tab Synchronization Tests
 *
 * Tests for cross-tab communication and state synchronization
 * using BroadcastChannel API.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TabSyncManager } from '@/lib/chat-widget/tab-sync';

describe('TabSyncManager', () => {
  let tabSync: TabSyncManager;

  beforeEach(() => {
    // Mock BroadcastChannel if not available in test environment
    if (typeof BroadcastChannel === 'undefined') {
      (global as any).BroadcastChannel = class {
        onmessage: ((event: MessageEvent) => void) | null = null;
        postMessage = jest.fn();
        close = jest.fn();
      };
    }

    tabSync = new TabSyncManager('test-channel');
  });

  afterEach(() => {
    tabSync.destroy();
  });

  it('should generate unique tab ID', () => {
    const tabId = tabSync.getTabId();
    expect(tabId).toMatch(/^tab-\d+-[a-z0-9]+$/);
  });

  it('should send sync messages', () => {
    const payload = {
      conversation_id: 'conv-1',
      message: {
        id: 'msg-1',
        role: 'user' as const,
        content: 'Test message',
        created_at: new Date().toISOString(),
      },
    };

    expect(() => {
      tabSync.send('NEW_MESSAGE', payload);
    }).not.toThrow();
  });

  it('should allow subscribing to messages', () => {
    const listener = jest.fn();
    const unsubscribe = tabSync.subscribe(listener);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('should return current tab state', () => {
    const state = tabSync.getTabState();

    expect(state).toHaveProperty('tab_id');
    expect(state).toHaveProperty('is_active');
    expect(state).toHaveProperty('has_focus');
    expect(state).toHaveProperty('conversation_open');
    expect(state).toHaveProperty('last_activity');
  });

  it('should handle BroadcastChannel support check', () => {
    const hasSupport = tabSync.hasBroadcastChannelSupport();
    expect(typeof hasSupport).toBe('boolean');
  });
});
