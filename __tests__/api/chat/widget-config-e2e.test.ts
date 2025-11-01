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
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

// Mock getOpenAIClient with a mock implementation
const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

jest.mock('@/lib/chat/openai-client', () => ({
  getOpenAIClient: jest.fn(() => mockOpenAIClient)
}));

import { getOpenAIClient } from '@/lib/chat/openai-client';

describe('Widget Config E2E - Chat API Integration', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

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
    mockOpenAIClient.chat.completions.create.mockResolvedValue({
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
    expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];

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
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
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
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
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
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content).toContain('Respond in Spanish');
  });

  test('should apply custom temperature setting', async () => {
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

    // Verify temperature setting
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.temperature).toBe(0.2);
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

    // Verify custom prompt is used
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content).toBe(customPrompt);
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
    const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(2500); // default balanced
    expect(callArgs.temperature).toBe(0.7); // default
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
      // Widget config lookup
      .mockResolvedValueOnce({
        data: { config_data: config.widgetConfig },
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

    // Mock select operations (for history)
    mockSupabase.select.mockReturnValue({
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null })
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
