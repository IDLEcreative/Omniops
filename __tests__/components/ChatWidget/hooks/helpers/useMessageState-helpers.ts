/**
 * Test Helpers for useMessageState Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMessageState } from '@/components/ChatWidget/hooks/useMessageState';
import type { StorageAdapter } from '@/components/ChatWidget/hooks/useSessionManagement';
import type { ChatWidgetConfig } from '@/components/ChatWidget/hooks/useChatState';

export interface UseMessageStateParams {
  conversationId: string;
  sessionId: string;
  storage: StorageAdapter;
  demoConfig?: ChatWidgetConfig | null;
}

export async function loadMessagesAndWait(
  result: any,
  conversationId: string,
  sessionId: string
) {
  await act(async () => {
    await result.current.loadPreviousMessages(conversationId, sessionId);
  });

  await waitFor(() => {
    expect(result.current.loadingMessages).toBe(false);
  });
}

export function createSlowResponse(messages: any[], delay: number) {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          ok: true,
          json: async () => ({ success: true, messages }),
        } as Response),
      delay
    )
  );
}
