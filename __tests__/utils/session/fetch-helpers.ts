/**
 * Fetch Helpers - Utilities for mocking and testing fetch operations
 *
 * Purpose: Provide reusable fetch setup and response factories
 */

export interface FetchRequestOptions {
  method?: string;
  headers?: Record<string, string>;
}

export const DEFAULT_FETCH_OPTIONS: FetchRequestOptions = {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
};

export function buildConversationUrl(
  conversationId: string,
  sessionId: string
): string {
  return `/api/conversations/${conversationId}/messages?session_id=${sessionId}`;
}

export function mockSuccessResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

export function mockErrorResponse(
  status: number,
  data: unknown
): Record<string, unknown> {
  return {
    ok: false,
    status,
    json: async () => data,
  };
}

export function mockNetworkError(message: string): Error {
  return new Error(message);
}
