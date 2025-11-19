/**
 * Shared Test Setup: AI Processor Tests
 *
 * Provides common mocks, fixtures, and utilities for ai-processor test files.
 * Imported by:
 * - ai-processor-core.test.ts
 * - ai-processor-fallback.test.ts
 * - ai-processor-shopping.test.ts
 * - ai-processor-telemetry.test.ts
 */

import { jest } from '@jest/globals';
import OpenAI from 'openai';
import type { AIProcessorParams } from '@/lib/chat/ai-processor-types';
import { ChatTelemetry } from '@/lib/chat-telemetry';

export function createMockOpenAIClient(): jest.Mocked<OpenAI> {
  return {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  } as any;
}

export function createMockTelemetry(): jest.Mocked<ChatTelemetry> {
  return {
    log: jest.fn(),
    trackIteration: jest.fn(),
    trackSearch: jest.fn()
  } as any;
}

export function createMockDependencies() {
  return {
    getCommerceProvider: jest.fn(),
    searchSimilarContent: jest.fn(),
    sanitizeOutboundLinks: jest.fn((text: string) => text)
  };
}

export function createBaseParams(
  openaiClient: jest.Mocked<OpenAI>,
  telemetry: jest.Mocked<ChatTelemetry>,
  dependencies: any
): AIProcessorParams {
  return {
    conversationMessages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello' }
    ],
    domain: 'example.com',
    config: {
      ai: {
        maxSearchIterations: 3,
        searchTimeout: 10000
      }
    },
    widgetConfig: null,
    telemetry,
    openaiClient,
    useGPT5Mini: true,
    dependencies,
    isMobile: false
  };
}

export const mockSearchTool = {
  type: 'function',
  function: {
    name: 'search_website_content',
    description: 'Search website',
    parameters: {}
  }
};

export const mockCategorySearchTool = {
  type: 'function',
  function: {
    name: 'search_by_category',
    description: 'Search by category',
    parameters: {}
  }
};

export function createToolCallResponse(toolName: string, args: any) {
  return {
    id: `call_${Math.random()}`,
    type: 'function' as const,
    function: {
      name: toolName,
      arguments: JSON.stringify(args)
    }
  };
}

export function createTextResponse(content: string) {
  return {
    role: 'assistant' as const,
    content,
    tool_calls: null
  };
}
