/**
 * Test Fixtures - Common test data for session persistence tests
 *
 * Purpose: Centralize test data to reduce duplication and improve maintainability
 */

export const TEST_CONVERSATION_ID = 'conv-123';
export const TEST_SESSION_ID = 'sess-456';
export const WRONG_SESSION_ID = 'wrong-session';
export const EXPIRED_CONVERSATION_ID = 'expired-conv';
export const EXPIRED_SESSION_ID = 'expired-sess';
export const NEW_SESSION_ID = 'sess-new';
export const NON_EXISTENT_CONVERSATION_ID = 'non-existent';

export const mockMessages = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hi there!',
    created_at: '2025-01-01T00:01:00Z',
  },
];

export const emptyMessages: never[] = [];

export const successResponse = {
  success: true,
  messages: mockMessages,
  conversation: {
    id: TEST_CONVERSATION_ID,
    created_at: '2025-01-01T00:00:00Z',
  },
  count: mockMessages.length,
};

export const emptySuccessResponse = {
  success: true,
  messages: emptyMessages,
  conversation: {
    id: TEST_CONVERSATION_ID,
    created_at: '2025-01-01T00:00:00Z',
  },
  count: 0,
};

export const failureResponse = {
  success: false,
  messages: emptyMessages,
  conversation: null,
};

export const errorResponse = {
  success: false,
  messages: emptyMessages,
  error: 'Internal server error',
};

export const previousMessageResponse = {
  success: true,
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Previous message',
      created_at: '2025-01-01T00:00:00Z',
    },
  ],
  conversation: {
    id: TEST_CONVERSATION_ID,
    created_at: '2025-01-01T00:00:00Z',
  },
  count: 1,
};
