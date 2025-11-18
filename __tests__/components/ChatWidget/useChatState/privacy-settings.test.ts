/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import {
  setupGlobalMocks,
  cleanupMocks,
  MockStorage,
  mockPostMessage,
} from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState privacy settings
 *
 * Covers:
 * - Default privacy settings initialization
 * - Custom privacy settings
 * - Consent handling
 */
describe('useChatState Hook - Privacy Settings', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should initialize with default privacy settings', () => {
    const { result } = renderHook(() => useChatState({}));

    expect(result.current.privacySettings).toEqual({
      allowOptOut: false,
      showPrivacyNotice: false,
      requireConsent: false,
      consentGiven: false,
      retentionDays: 30,
    });
  });

  it('should accept custom privacy settings', async () => {
    const customSettings = {
      requireConsent: true,
      consentGiven: true,
      retentionDays: 90,
    };

    const { result } = renderHook(() =>
      useChatState({
        privacySettings: customSettings,
      })
    );

    await waitFor(() => {
      expect(result.current.privacySettings.requireConsent).toBe(true);
      expect(result.current.privacySettings.consentGiven).toBe(true);
      expect(result.current.privacySettings.retentionDays).toBe(90);
    });
  });

  it('should handle consent given', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.handleConsent();
    });

    expect(result.current.privacySettings.consentGiven).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledWith(
      { type: 'privacy', action: 'giveConsent' },
      '*'
    );
  });
});
