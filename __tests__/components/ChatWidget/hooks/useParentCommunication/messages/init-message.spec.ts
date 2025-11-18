/**
 * @jest-environment jsdom
 */
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { applyPrivacyUpdate, createHookHarness } from './helpers/test-harness';

describe('useParentCommunication – init message', () => {
  let harness: ReturnType<typeof createHookHarness>;

  beforeEach(() => {
    harness = createHookHarness();
  });

  afterEach(() => {
    harness.restore();
  });

  it('updates privacy settings from message', () => {
    harness.renderHookWithProps();
    harness.dispatchMessage({ type: 'init', privacyPrefs: { consentGiven: true } });

    const updater = harness.mocks.setPrivacySettings.mock.calls[0][0];
    const updated = applyPrivacyUpdate(updater);
    expect(updated.consentGiven).toBe(true);
  });

  it('restores session ID', () => {
    harness.setEnv('NODE_ENV', 'development');
    harness.renderHookWithProps({ sessionId: '' });
    harness.dispatchMessage({ type: 'init', storedData: { sessionId: 'session_from_parent' } });

    expect(harness.mocks.setSessionId).toHaveBeenCalledWith('session_from_parent');
    expect(harness.spies.log).toHaveBeenCalledWith(
      expect.stringContaining('Restored session ID from parent'),
      'session_from_parent',
    );
  });

  it('restores conversation ID', () => {
    harness.setEnv('NODE_ENV', 'development');
    harness.renderHookWithProps();

    harness.dispatchMessage({ type: 'init', storedData: { conversationId: 'conv_from_parent' } });
    expect(harness.mocks.setConversationId).toHaveBeenCalledWith('conv_from_parent');
  });

  it('restores widget open state', () => {
    harness.setEnv('NODE_ENV', 'development');
    harness.renderHookWithProps({ isOpen: false });

    harness.dispatchMessage({ type: 'init', storedData: { widgetOpen: true } });
    expect(harness.mocks.setIsOpen).toHaveBeenCalledWith(true);
  });
});
