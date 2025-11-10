import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { createHookHarness } from './helpers/test-harness';

describe('useParentCommunication – message events', () => {
  let harness: ReturnType<typeof createHookHarness>;

  beforeEach(() => {
    harness = createHookHarness();
  });

  afterEach(() => {
    harness.restore();
  });

  it('handles init message', () => {
    harness.renderHookWithProps();

    harness.dispatchMessage({
      type: 'init',
      privacyPrefs: { consentGiven: true },
      woocommerceEnabled: true,
      storeDomain: 'shop.example.com',
    });

    expect(harness.mocks.setPrivacySettings).toHaveBeenCalled();
    expect(harness.mocks.setWoocommerceEnabled).toHaveBeenCalledWith(true);
    expect(harness.mocks.setStoreDomain).toHaveBeenCalledWith('shop.example.com');
  });

  it('handles open message', () => {
    harness.renderHookWithProps({ sessionId: 'session_123' });
    harness.dispatchMessage({ type: 'open' });
    expect(harness.mocks.setIsOpen).toHaveBeenCalledWith(true);
  });

  it('handles close message', () => {
    harness.renderHookWithProps({ isOpen: true, sessionId: 'session_123' });
    harness.dispatchMessage({ type: 'close' });
    expect(harness.mocks.setIsOpen).toHaveBeenCalledWith(false);
  });

  it('handles text message', () => {
    harness.renderHookWithProps({ sessionId: 'session_123' });
    harness.dispatchMessage({ type: 'message', message: 'Hello from parent' });
    expect(harness.mocks.setInput).toHaveBeenCalledWith('Hello from parent');
  });

  it('handles cleanup message', () => {
    harness.renderHookWithProps({ sessionId: 'session_123' });
    harness.dispatchMessage({ type: 'cleanup', retentionDays: 30 });
    expect(harness.mocks.cleanupOldMessages).toHaveBeenCalledWith(30);
  });

  it('logs unknown message types in development', () => {
    harness.setEnv('NODE_ENV', 'development');
    harness.renderHookWithProps();

    harness.dispatchMessage({ type: 'unknown-type' });
    expect(harness.spies.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown message type'),
      'unknown-type',
    );
  });
});
