/**
 * Widget config tests for response length and token limits
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { setupMockDatabase, createMockRequest, createMockSupabase, createMockDeps } from './test-helpers';
import { createCompletionMock } from './mocks-setup';

let POST: typeof import('@/app/api/chat/route').POST;

beforeEach(() => {
  jest.clearAllMocks();
});

export function defineResponseLengthTests() {
  test('should apply short response length (1000 tokens)', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'concise',
          responseLength: 'short'
        }
      }
    });

    createCompletionMock.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test response',
          tool_calls: null
        }
      }]
    });

    process.env.OPENAI_API_KEY = 'test-key';
    process.env.USE_GPT5_MINI = 'true';

    const request = createMockRequest({
      message: 'Tell me about your products',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(1000);
  });

  test('should apply detailed response length (4000 tokens)', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'helpful',
          responseLength: 'detailed'
        }
      }
    });

    createCompletionMock.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test response',
          tool_calls: null
        }
      }]
    });

    process.env.OPENAI_API_KEY = 'test-key';
    process.env.USE_GPT5_MINI = 'true';

    const request = createMockRequest({
      message: 'Explain how your shipping works',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(4000);
  });

  test('should apply balanced response length by default (2500 tokens)', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'helpful'
        }
      }
    });

    createCompletionMock.mockResolvedValue({
      choices: [{
        message: {
          role: 'assistant',
          content: 'Test response',
          tool_calls: null
        }
      }]
    });

    process.env.OPENAI_API_KEY = 'test-key';
    process.env.USE_GPT5_MINI = 'true';

    const request = createMockRequest({
      message: 'Question',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await POST(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(2500);
  });
}
