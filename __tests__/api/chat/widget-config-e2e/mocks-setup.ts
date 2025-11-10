/**
 * Shared mocks and setup for widget config E2E tests
 */

import { jest } from '@jest/globals';

// Mock OpenAI
jest.mock('openai');

// Mock Supabase client used by analytics events
jest.mock('@/lib/supabase/server', () => {
  const mockRealtimeChannel = {
    send: jest.fn().mockResolvedValue({ status: 'ok' }),
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockResolvedValue({ status: 'ok' })
  };

  const mockAnalyticsClient = {
    channel: jest.fn().mockReturnValue(mockRealtimeChannel),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  };

  return {
    __esModule: true,
    createClient: jest.fn().mockResolvedValue(mockAnalyticsClient),
    createServerClient: jest.fn(),
    createServiceClient: jest.fn(),
    createServiceRoleClient: jest.fn(),
    createServiceRoleClientSync: jest.fn(),
    requireClient: jest.fn(),
    requireServiceRoleClient: jest.fn(),
    validateSupabaseEnv: jest.fn(() => true)
  };
});

// Mock Supabase server helpers used by the chat route
jest.mock('@/lib/supabase-server', () => {
  const mockRouteSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  };
  return {
    __esModule: true,
    createClient: jest.fn().mockResolvedValue(mockRouteSupabase),
    createServiceRoleClient: jest.fn().mockResolvedValue(mockRouteSupabase),
    requireClient: jest.fn().mockResolvedValue(mockRouteSupabase),
    requireServiceRoleClient: jest.fn().mockResolvedValue(mockRouteSupabase),
    validateSupabaseEnv: jest.fn(() => true)
  };
});

const emitMessageEventMock = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/analytics/supabase-events', () => ({
  __esModule: true,
  emitMessageEvent: emitMessageEventMock
}));

// Mock getOpenAIClient with a mock implementation
const createCompletionMock = jest.fn();
const mockOpenAIClient = {
  chat: {
    completions: {
      create: createCompletionMock
    }
  }
};

jest.mock('@/lib/chat/openai-client', () => ({
  __esModule: true,
  getOpenAIClient: jest.fn()
}));

const { getOpenAIClient } = jest.requireMock('@/lib/chat/openai-client') as {
  getOpenAIClient: jest.Mock;
};
getOpenAIClient.mockImplementation(() => mockOpenAIClient);

export { emitMessageEventMock, createCompletionMock, mockOpenAIClient };
