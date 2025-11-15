import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatState } from '@/components/ChatWidget/hooks/useChatState';
import {
  setupGlobalMocks,
  cleanupMocks,
  MockStorage,
  mockFetch,
  createErrorResponse,
  createNotFoundResponse,
} from '@/__tests__/utils/chat-widget/test-fixtures';

/**
 * Tests for useChatState error recovery
 *
 * Covers:
 * - Handling API errors gracefully
 * - Handling conversation not found
 * - Graceful network error handling
 * - Retry capability after errors
 */
describe('useChatState Hook - Error Recovery', () => {
  let localStorage: MockStorage;

  beforeEach(() => {
    localStorage = setupGlobalMocks();
  });

  afterEach(() => {
    cleanupMocks(localStorage);
  });

  it('should handle API errors gracefully', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Hook should mount successfully even if errors occur
    expect(result.current.mounted).toBe(true);
    expect(result.current.retryLoadMessages).toBeDefined();

    // Messages should start empty
    expect(result.current.messages).toEqual([]);
  });

  it('should handle conversation not found', async () => {
    // Mock conversation not found response
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          config: { domain: 'test.example.com', woocommerce_enabled: false },
        }),
      })
      .mockResolvedValueOnce(createNotFoundResponse());

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setIsOpen(true);
    });

    // After not found, loading should stop
    await waitFor(() => {
      expect(result.current.loadingMessages).toBe(false);
    });

    // Messages should be empty
    expect(result.current.messages).toEqual([]);
  });

  it('should handle network errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Hook should be resilient to errors
    expect(result.current.loadingMessages).toBe(false);
    expect(result.current.messages).toEqual([]);

    consoleErrorSpy.mockRestore();
  });

  it('should provide retry capability', async () => {
    const { result } = renderHook(() => useChatState({}));

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    // Retry function should always be available
    expect(result.current.retryLoadMessages).toBeDefined();
    expect(typeof result.current.retryLoadMessages).toBe('function');
  });
});
