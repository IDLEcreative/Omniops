/**
 * Widget config tests for personality and tone settings
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { setupMockDatabase, createMockRequest, createMockSupabase, createMockDeps } from './test-helpers';
import { createCompletionMock } from './mocks-setup';

let POST: typeof import('@/app/api/chat/route').POST;

beforeEach(() => {
  jest.clearAllMocks();
});

export function defineFriendlyPersonalityTests() {
  test('should load and apply friendly personality config', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'friendly',
          responseLength: 'balanced'
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

    const response = await POST(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeDefined();

    expect(createCompletionMock).toHaveBeenCalled();
    const callArgs = createCompletionMock.mock.calls[0][0];

    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage.content).toContain('friendly and approachable');
  });
}

export function definePersonalityTests() {
  test('should apply professional personality', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'professional'
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
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMessage).toBeDefined();
  });
}
