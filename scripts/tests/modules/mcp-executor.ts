/**
 * Execution Engine for MCP Comparison Tests
 *
 * Executes queries through both traditional and MCP systems,
 * handles API communication, and extracts results.
 */

import { ComparisonTestCase, ExecutionResult } from './mcp-types';

/**
 * Execute query through traditional tool calling system
 */
export async function executeTraditionalChat(
  testCase: ComparisonTestCase,
  customerId: string,
  domain: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.userQuery,
        domain,
        session_id: `test-session-traditional-${testCase.id}`,
        config: {
          mcpEnabled: false // Force traditional mode
        }
      })
    });

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Extract products from response
    const products = extractProductsFromResponse(result);

    return {
      system: 'traditional',
      testCaseId: testCase.id,
      success: response.ok,
      response: result.message || result.error || '',
      products,
      executionTime,
      tokensUsed: {
        prompt: result.usage?.prompt_tokens || 0,
        completion: result.usage?.completion_tokens || 0,
        total: result.usage?.total_tokens || 0
      },
      toolCalls: result.toolCalls,
      error: response.ok ? undefined : (result.error || 'Unknown error')
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      system: 'traditional',
      testCaseId: testCase.id,
      success: false,
      response: '',
      executionTime,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute query through MCP code execution system
 */
export async function executeMCPChat(
  testCase: ComparisonTestCase,
  customerId: string,
  domain: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.userQuery,
        domain,
        session_id: `test-session-mcp-${testCase.id}`,
        config: {
          mcpEnabled: true // Force MCP mode
        }
      })
    });

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Extract products from response
    const products = extractProductsFromResponse(result);

    return {
      system: 'mcp',
      testCaseId: testCase.id,
      success: response.ok,
      response: result.message || result.error || '',
      products,
      executionTime,
      tokensUsed: {
        prompt: result.usage?.prompt_tokens || 0,
        completion: result.usage?.completion_tokens || 0,
        total: result.usage?.total_tokens || 0
      },
      codeExecuted: result.mcpMetadata?.codeExecuted,
      error: response.ok ? undefined : (result.error || 'Unknown error')
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      system: 'mcp',
      testCaseId: testCase.id,
      success: false,
      response: '',
      executionTime,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract product information from API response
 */
function extractProductsFromResponse(result: any): any[] | undefined {
  // Check if response has sources (product results)
  if (result.sources && Array.isArray(result.sources)) {
    return result.sources;
  }

  // Check if response has products array
  if (result.products && Array.isArray(result.products)) {
    return result.products;
  }

  // Try to extract from message text (markdown links)
  if (result.message && typeof result.message === 'string') {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...result.message.matchAll(linkRegex)];

    if (matches.length > 0) {
      return matches.map(match => ({
        title: match[1],
        url: match[2]
      }));
    }
  }

  return undefined;
}
