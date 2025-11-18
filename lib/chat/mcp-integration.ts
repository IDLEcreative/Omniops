/**
 * MCP Integration Module
 *
 * Purpose: Integrates MCP code execution into the chat API route
 * - Detects TypeScript code blocks in AI responses
 * - Executes validated code in Deno sandbox
 * - Formats results for user presentation
 */

import { executeCode } from '@/lib/mcp/executor';
import { ExecutionContext } from '@/lib/mcp/types';
import {
  formatMCPExecutionResult,
  formatMCPExecutionError
} from './mcp-formatters';

// Re-export context operations
export {
  isMCPExecutionEnabled,
  isMCPProgressiveDisclosureEnabled,
  buildMCPExecutionContext,
  getMCPSystemPrompt,
  calculateTokenSavings
} from './mcp-context';

/**
 * Detect if AI response contains executable TypeScript code
 */
export function detectMCPCodeExecution(content: string): boolean {
  const codeBlockRegex = /```typescript\n([\s\S]+?)\n```/;
  return codeBlockRegex.test(content);
}

/**
 * Extract TypeScript code from markdown code block
 */
export function extractMCPCode(content: string): string | null {
  const match = content.match(/```typescript\n([\s\S]+?)\n```/);
  return match && match[1] ? match[1] : null;
}

/**
 * Execute MCP code and return formatted result
 */
export async function executeMCPCode(
  code: string,
  context: ExecutionContext,
  options: {
    timeout?: number;
    allowedCategories?: string[];
  } = {}
): Promise<{
  success: boolean;
  response: string;
  metadata?: {
    executionTime: number;
    tokensSaved?: number;
  };
}> {
  try {
    // Execute code in Deno sandbox
    const result = await executeCode(code, context, {
      timeout: options.timeout || 30000,
      allowedPermissions: {
        read: ['./servers'],
        write: [],
        net: []
      }
    });

    if (result.success) {
      // Format result for user
      const response = formatMCPExecutionResult(result);

      return {
        success: true,
        response,
        metadata: {
          executionTime: result.metadata.executionTime,
          tokensSaved: result.metadata.tokensSaved
        }
      };
    } else {
      // Format error for user
      const response = formatMCPExecutionError(result);

      return {
        success: false,
        response,
        metadata: {
          executionTime: result.metadata.executionTime
        }
      };
    }
  } catch (error) {
    console.error('[MCP Integration] Execution error:', error);

    return {
      success: false,
      response: "I encountered an unexpected error while processing your request. Please try again.",
      metadata: {
        executionTime: 0
      }
    };
  }
}

