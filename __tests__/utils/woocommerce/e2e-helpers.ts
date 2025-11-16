/**
 * WooCommerce E2E Test Helpers
 *
 * Shared utilities for WooCommerce integration tests.
 * Extracted from chat-woocommerce-e2e.test.ts to maintain <300 LOC per file.
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';

/**
 * Create a NextRequest for chat API testing
 */
export function createChatRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Create a mock OpenAI response for product search tool call
 * Uses woocommerce_operations tool with search_products operation
 */
export function createProductSearchToolCall(query: string, limit: number = 100) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_search_products',
              type: 'function',
              function: {
                name: 'woocommerce_operations',
                arguments: JSON.stringify({ operation: 'search_products', query, limit }),
              },
            },
          ],
        },
      },
    ],
  } as any;
}

/**
 * Create a mock OpenAI response with text content
 */
export function createTextResponse(content: string) {
  return {
    choices: [
      {
        message: {
          content,
        },
      },
    ],
  } as any;
}

/**
 * Create a mock OpenAI response for get_product_details tool call
 */
export function createProductDetailsToolCall(productQuery: string, includeSpecs: boolean = true) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_product_details',
              type: 'function',
              function: {
                name: 'get_product_details',
                arguments: JSON.stringify({ productQuery, includeSpecs }),
              },
            },
          ],
        },
      },
    ],
  } as any;
}

/**
 * Create a mock OpenAI response for lookup_order tool call
 */
export function createOrderLookupToolCall(orderId: string) {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_order_lookup',
              type: 'function',
              function: {
                name: 'lookup_order',
                arguments: JSON.stringify({ orderId }),
              },
            },
          ],
        },
      },
    ],
  } as any;
}

/**
 * Setup two-call AI mock (tool call, then response)
 */
export function setupTwoCallAIMock(
  mockOpenAI: any,
  firstCall: any,
  secondCall: any
): void {
  let callCount = 0;
  mockOpenAI.chat.completions.create.mockImplementation(async () => {
    callCount++;
    return callCount === 1 ? firstCall : secondCall;
  });
}

/**
 * Create standard test environment variables
 */
export function getTestEnvVars() {
  return {
    OPENAI_API_KEY: 'test-openai-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    USE_GPT5_MINI: 'true',
    NODE_ENV: 'test',
  };
}

/**
 * Create route context with commerce provider dependency injection
 */
export function createRouteContext(getCommerceProvider: any, additionalDeps?: any) {
  return {
    params: Promise.resolve({}),
    deps: {
      getCommerceProvider,
      ...additionalDeps,
    },
  } as any;
}
