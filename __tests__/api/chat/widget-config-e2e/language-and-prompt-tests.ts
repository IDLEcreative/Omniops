/**
 * Widget config tests for language and custom system prompt settings
 */

import { test, expect, beforeEach, jest } from '@jest/globals';
import { setupMockDatabase, createMockRequest, createMockSupabase, createMockDeps } from './test-helpers';
import { createCompletionMock } from './mocks-setup';

beforeEach(() => {
  jest.clearAllMocks();
});

export function defineLanguageAndPromptTests(getPOST: () => typeof import('@/app/api/chat/route').POST) {
  test('should apply language setting to system prompt', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'professional',
          language: 'Spanish'
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
      message: 'Hello',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await getPOST()(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    const callArgs = createCompletionMock.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content).toContain('Respond in Spanish');
  });

  test('should use custom system prompt when provided', async () => {
    const customPrompt = 'You are a specialized hydraulic systems expert.';
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          customSystemPrompt: customPrompt
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

    await getPOST()(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    const callArgs = createCompletionMock.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content.startsWith(customPrompt)).toBe(true);
    expect(systemMessage.content).toContain('ORGANIZATION CONTEXT');
  });
}
