/**
 * Hallucination Prevention Tests: Installation & Recommendations
 *
 * CRITICAL: Validates anti-hallucination safeguards for guidance queries
 *
 * Tests ensure the AI:
 * - Refers to documentation for installation steps
 * - Properly qualifies alternative product suggestions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { processAIConversation } from '@/lib/chat/ai-processor';
import type { AIProcessorParams } from '@/lib/chat/ai-processor-types';
import {
  createMockOpenAIClient,
  createMockTelemetry,
  createMockDependencies
} from './ai-processor-setup';

describe('AI Processor - Hallucination Prevention - Recommendations', () => {
  let mockOpenAIClient: ReturnType<typeof createMockOpenAIClient>;
  let mockTelemetry: ReturnType<typeof createMockTelemetry>;
  let mockDependencies: ReturnType<typeof createMockDependencies>;
  let baseParams: AIProcessorParams;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOpenAIClient = createMockOpenAIClient();
    mockTelemetry = createMockTelemetry();
    mockDependencies = createMockDependencies();

    baseParams = {
      conversationMessages: [
        { role: 'system', content: 'You are a helpful assistant. Never speculate or make up information.' },
        { role: 'user', content: '' }
      ],
      domain: 'example.com',
      config: {
        ai: {
          maxSearchIterations: 3,
          searchTimeout: 10000
        }
      },
      widgetConfig: null,
      telemetry: mockTelemetry,
      openaiClient: mockOpenAIClient,
      useGPT5Mini: true,
      dependencies: mockDependencies,
      isMobile: false
    };
  });

  describe('Installation and Usage - Refer to Documentation', () => {
    it('should not provide detailed installation steps without documentation', async () => {
      baseParams.conversationMessages[1].content = 'How do I install the chute pump on my mixer?';

      mockDependencies.getAvailableTools.mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } }
      ]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'search_website_content',
                  arguments: JSON.stringify({ query: 'chute pump installation instructions' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: "For proper installation of the chute pump, I recommend consulting the installation manual that comes with the product or contacting a qualified technician. Installation procedures can vary based on your specific mixer model.",
              tool_calls: null
            }
          }]
        });

      mockDependencies.executeToolCallsParallel.mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'chute pump installation instructions' },
          result: {
            success: true,
            results: [],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      mockDependencies.formatToolResultsForAI.mockReturnValue([
        { tool_call_id: 'call_1', content: 'No installation instructions found' }
      ]);

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should NOT provide detailed steps
      const hasDetailedSteps =
        (lower.includes('step 1') || lower.includes('first,')) &&
        (lower.includes('then') || lower.includes('next'));

      // Should refer to documentation
      const refersToDocumentation =
        lower.includes('manual') ||
        lower.includes('documentation') ||
        lower.includes('technician') ||
        lower.includes('consult');

      expect(hasDetailedSteps && !refersToDocumentation).toBe(false);
      expect(refersToDocumentation).toBe(true);
    });
  });

  describe('Alternative Products - Qualified Recommendations', () => {
    it('should qualify alternative product suggestions', async () => {
      baseParams.conversationMessages[1].content = 'What can I use instead of the A4VTG90 pump?';

      mockDependencies.getAvailableTools.mockResolvedValue([
        { type: 'function', function: { name: 'search_website_content', description: '', parameters: {} } }
      ]);

      (mockOpenAIClient.chat.completions.create as jest.Mock)
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'search_website_content',
                  arguments: JSON.stringify({ query: 'A4VTG90 alternative pumps' })
                }
              }]
            }
          }]
        })
        .mockResolvedValueOnce({
          choices: [{
            message: {
              role: 'assistant',
              content: "Alternative pumps may be available depending on your specific application requirements. I recommend consulting with our technical team to ensure you get a compatible replacement that meets your needs.",
              tool_calls: null
            }
          }]
        });

      mockDependencies.executeToolCallsParallel.mockResolvedValue([
        {
          toolCall: { id: 'call_1' },
          toolName: 'search_website_content',
          toolArgs: { query: 'A4VTG90 alternative pumps' },
          result: {
            success: true,
            results: [],
            source: 'embeddings'
          },
          executionTime: 100
        }
      ]);

      mockDependencies.formatToolResultsForAI.mockReturnValue([
        { tool_call_id: 'call_1', content: 'No alternative pump information found' }
      ]);

      const result = await processAIConversation(baseParams);

      const lower = result.finalResponse.toLowerCase();

      // Should properly qualify suggestions
      const properlyQualified =
        lower.includes('may') ||
        lower.includes('might') ||
        lower.includes('depend') ||
        lower.includes('consult') ||
        lower.includes('recommend');

      expect(properlyQualified).toBe(true);
    });
  });
});
