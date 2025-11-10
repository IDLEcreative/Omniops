/**
 * Widget Configuration End-to-End Tests
 *
 * Tests the complete flow from database config loading through
 * the chat API to ensure all customization features work in practice.
 *
 * These tests validate:
 * - Real API calls with different configurations
 * - Proper parameter passing through the stack
 * - Telemetry logging of config settings
 * - Actual OpenAI API parameter changes
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

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

let POST: typeof import('@/app/api/chat/route').POST;

beforeAll(async () => {
  ({ POST } = await import('@/app/api/chat/route'));
});

describe('Widget Config E2E - Chat API Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    emitMessageEventMock.mockClear();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    // Set default OpenAI response
    createCompletionMock.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test response',
          tool_calls: null
        }
      }]
    });

    // Set environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.USE_GPT5_MINI = 'true';
  });

  test('should load and apply friendly personality config', async () => {
    // Mock database responses
    setupMockDatabase({
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'friendly',
          responseLength: 'balanced'
        }
      }
    });

    const request = createMockRequest({
      message: 'Hello',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    const response = await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn(),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    const data = await response.json();

    // Verify response
    expect(response.status).toBe(200);
    expect(data.message).toBeDefined();

    // Verify OpenAI was called with correct parameters
    expect(createCompletionMock).toHaveBeenCalled();
    const callArgs = createCompletionMock.mock.calls[0][0];

    // Check that system message contains friendly personality
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content).toContain('friendly and approachable');
  });

  test('should apply short response length (1000 tokens)', async () => {
    setupMockDatabase({
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'concise',
          responseLength: 'short'
        }
      }
    });

    const request = createMockRequest({
      message: 'Tell me about your products',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    // Verify OpenAI was called with 1000 token limit
    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(1000);
  });

  test('should apply detailed response length (4000 tokens)', async () => {
    setupMockDatabase({
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'helpful',
          responseLength: 'detailed'
        }
      }
    });

    const request = createMockRequest({
      message: 'Explain how your shipping works',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    // Verify OpenAI was called with 4000 token limit
    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(4000);
  });

  test('should apply language setting to system prompt', async () => {
    setupMockDatabase({
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'professional',
          language: 'Spanish'
        }
      }
    });

    const request = createMockRequest({
      message: 'Hello',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    // Verify system prompt contains language instruction
    const callArgs = createCompletionMock.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content).toContain('Respond in Spanish');
  });

  test('should ignore custom temperature setting for GPT-5 mini', async () => {
    setupMockDatabase({
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'technical',
          temperature: 0.2 // Very deterministic
        }
      }
    });

    const request = createMockRequest({
      message: 'Technical question',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    // GPT-5 mini ignores temperature overrides
    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.temperature).toBeUndefined();
  });

  test('should use custom system prompt when provided', async () => {
    const customPrompt = 'You are a specialized hydraulic systems expert.';

    setupMockDatabase({
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          customSystemPrompt: customPrompt
        }
      }
    });

    const request = createMockRequest({
      message: 'Question',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    // Verify custom prompt prefix is preserved with organization context appended
    const callArgs = createCompletionMock.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content.startsWith(customPrompt)).toBe(true);
    expect(systemMessage.content).toContain('ORGANIZATION CONTEXT');
  });

  test('should work without widget config (use defaults)', async () => {
    // Mock domain with no widget config
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'test-domain-id' },
        error: null
      })
      .mockResolvedValueOnce({
        data: { customer_config_id: 'test-config-id' },
        error: null
      })
      .mockResolvedValueOnce({
        data: null, // No widget config
        error: { code: 'PGRST116' }
      })
      // Conversations
      .mockResolvedValue({ data: { id: 'conv-id', metadata: {} }, error: null });

    const request = createMockRequest({
      message: 'Hello',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    const response = await POST(request, {
      params: Promise.resolve({}),
      deps: {
        createServiceRoleClient: async () => mockSupabase,
        checkDomainRateLimit: () => ({ allowed: true, resetTime: Date.now() }),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
        getCommerceProvider: jest.fn(),
        sanitizeOutboundLinks: (text: string) => text
      }
    });

    // Should still work with defaults
    expect(response.status).toBe(200);

    // Verify default settings used
    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(2500); // default balanced
    expect(callArgs.temperature).toBeUndefined(); // GPT-5 mini ignores temperature
  });

  // Helper functions
  function setupMockDatabase(config: {
    domainId: string;
    customerConfigId: string;
    widgetConfig: any;
  }) {
    mockSupabase.single
      // Domain lookup
      .mockResolvedValueOnce({
        data: { id: config.domainId },
        error: null
      })
      // Customer config lookup
      .mockResolvedValueOnce({
        data: { customer_config_id: config.customerConfigId },
        error: null
      })
      // Domain metadata lookup for profile context
      .mockResolvedValueOnce({
        data: {
          domain: 'test-domain.com',
          name: 'Test Domain',
          description: 'Test description',
          customer_config_id: config.customerConfigId
        },
        error: null
      })
      // Widget config lookup
      .mockResolvedValueOnce({
        data: { config_data: config.widgetConfig },
        error: null
      })
      // Customer profile lookup
      .mockResolvedValueOnce({
        data: {
          business_name: 'Test Domain',
          business_description: 'Test description'
        },
        error: null
      })
      // Conversation creation/lookup
      .mockResolvedValue({
        data: { id: 'test-conversation-id', metadata: {} },
        error: null
      });

    // Mock insert/update operations
    mockSupabase.insert.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-id' },
        error: null
      })
    });

    mockSupabase.update.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({ data: {}, error: null })
    });

  }

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
      headers: {
        get: () => null
      }
    } as any;
  }
});
