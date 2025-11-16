/**
 * Widget config tests for temperature settings and default behavior
 */

import { test, expect, beforeEach, jest } from '@jest/globals';
import { setupMockDatabase, createMockRequest, createMockSupabase, createMockDeps } from './test-helpers';
import { createCompletionMock } from './mocks-setup';

beforeEach(() => {
  jest.clearAllMocks();
});

export function defineTemperatureAndDefaultsTests(getPOST: () => typeof import('@/app/api/chat/route').POST) {
  test('should ignore custom temperature setting for GPT-5 mini', async () => {
    const mockSupabase = createMockSupabase();

    setupMockDatabase(mockSupabase, {
      domainId: 'test-domain-id',
      customerConfigId: 'test-config-id',
      widgetConfig: {
        ai_settings: {
          personality: 'technical',
          temperature: 0.2 // Very deterministic
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
      message: 'Technical question',
      domain: 'test-domain.com',
      session_id: 'test-session'
    });

    await getPOST()(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    // GPT-5 mini ignores temperature overrides
    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.temperature).toBeUndefined();
  });

  test('should work without widget config (use defaults)', async () => {
    const mockSupabase = createMockSupabase();

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

    const response = await getPOST()(request, {
      params: Promise.resolve({}),
      deps: createMockDeps(mockSupabase)
    });

    // Should still work with defaults
    expect(response.status).toBe(200);

    // Verify default settings used
    const callArgs = createCompletionMock.mock.calls[0][0];
    expect(callArgs.max_completion_tokens).toBe(2500); // default balanced
    expect(callArgs.temperature).toBeUndefined(); // GPT-5 mini ignores temperature
  });
}
