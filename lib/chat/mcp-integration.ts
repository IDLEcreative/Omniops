/**
 * MCP Integration Module
 *
 * Purpose: Integrates MCP code execution into the chat API route
 * - Detects TypeScript code blocks in AI responses
 * - Executes validated code in Deno sandbox
 * - Formats results for user presentation
 * - Provides backward compatibility with traditional tool calling
 */

import { executeCode } from '@/lib/mcp/executor';
import { ExecutionContext, ExecutionResult } from '@/lib/mcp/types';
import { SearchResult } from '@/types';

// =====================================================
// SECTION 1: Environment Configuration
// =====================================================

/**
 * Check if MCP execution is enabled
 */
export function isMCPExecutionEnabled(): boolean {
  return process.env.MCP_EXECUTION_ENABLED === 'true';
}

/**
 * Check if progressive disclosure is enabled
 */
export function isMCPProgressiveDisclosureEnabled(): boolean {
  return process.env.MCP_PROGRESSIVE_DISCLOSURE === 'true';
}

// =====================================================
// SECTION 2: Code Detection
// =====================================================

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
  return match ? match[1] : null;
}

// =====================================================
// SECTION 3: Context Building
// =====================================================

/**
 * Build execution context from chat API data
 */
export function buildMCPExecutionContext(
  domain: string,
  customerId: string | undefined,
  conversationId: string | null,
  userId?: string,
  platform?: 'woocommerce' | 'shopify' | 'generic'
): ExecutionContext {
  return {
    customerId: customerId || 'unknown',
    domain: domain || 'unknown',
    conversationId: conversationId ?? undefined,
    userId,
    platform: platform || 'generic',
    traceId: crypto.randomUUID(),
    metadata: {
      timestamp: new Date().toISOString(),
      source: 'chat-api',
      mcpEnabled: true
    }
  };
}

// =====================================================
// SECTION 4: Code Execution
// =====================================================

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

// =====================================================
// SECTION 5: Result Formatting
// =====================================================

/**
 * Format successful MCP execution result for user
 */
function formatMCPExecutionResult(result: ExecutionResult): string {
  if (!result.data) {
    return "I found the information but couldn't format it properly. Please try rephrasing your question.";
  }

  // If data contains SearchResult[], format as product list
  if (result.data.results && Array.isArray(result.data.results)) {
    return formatSearchResultsForUser(result.data.results, result.data.totalMatches, result.data.source);
  }

  // If data is a simple object with output property
  if (result.data.output) {
    return result.data.output;
  }

  // Otherwise return JSON stringified
  try {
    return JSON.stringify(result.data, null, 2);
  } catch {
    return "I found the information but had trouble formatting it.";
  }
}

/**
 * Format search results for user presentation
 */
function formatSearchResultsForUser(
  results: SearchResult[],
  totalMatches?: number,
  source?: string
): string {
  if (!results || results.length === 0) {
    return "I couldn't find any products matching your search. Could you provide more details or try different keywords?";
  }

  // Build response header
  let response = totalMatches
    ? `I found ${totalMatches} ${totalMatches === 1 ? 'product' : 'products'}:\n\n`
    : `Here's what I found:\n\n`;

  // Format each result
  results.slice(0, 10).forEach((result, index) => {
    const title = result.title || 'Product';
    const url = result.url;
    const similarity = result.similarity ? ` (${Math.round(result.similarity * 100)}% match)` : '';

    // Format as markdown link if URL available
    if (url) {
      response += `${index + 1}. [${title}](${url})${similarity}\n`;
    } else {
      response += `${index + 1}. ${title}${similarity}\n`;
    }

    // Add content preview if available
    if (result.content && result.content.length > 100) {
      const preview = result.content.substring(0, 100).trim() + '...';
      response += `   ${preview}\n`;
    }

    response += '\n';
  });

  // Add footer note if there are more results
  if (totalMatches && totalMatches > 10) {
    response += `\n_Showing 10 of ${totalMatches} results. Would you like to see more or refine your search?_`;
  }

  // Add source attribution
  if (source && source !== 'error') {
    const sourceLabel = {
      'exact-match': 'exact SKU match',
      'woocommerce': 'WooCommerce',
      'shopify': 'Shopify',
      'semantic': 'semantic search'
    }[source] || source;

    response += `\n\n_Source: ${sourceLabel}_`;
  }

  return response;
}

/**
 * Format MCP execution error for user
 */
function formatMCPExecutionError(result: ExecutionResult): string {
  const error = result.error;

  if (!error) {
    return "I encountered an unknown error. Please try again.";
  }

  // Validation errors (security-related)
  if (error.code === 'VALIDATION_FAILED') {
    console.warn('[MCP Integration] Validation failed:', error.details);
    return "I tried to search for that but encountered a security issue with my search method. Let me try a different approach.";
  }

  // Execution errors (runtime failures)
  if (error.code === 'EXECUTION_ERROR') {
    console.error('[MCP Integration] Execution error:', error.message);

    // Check for specific error types
    if (error.message.includes('timeout')) {
      return "The search is taking longer than expected. Please try a more specific query.";
    }

    if (error.message.includes('not found') || error.message.includes('INVALID_DOMAIN')) {
      return "I couldn't access the product catalog. Please make sure you're on the correct website.";
    }

    return `I encountered an error while searching: ${error.message}. Please try rephrasing your question.`;
  }

  // Generic error
  return `I encountered an unexpected error (${error.code}). Please try again or rephrase your question.`;
}

// =====================================================
// SECTION 6: Progressive Disclosure System Prompt
// =====================================================

/**
 * Get MCP system prompt with progressive disclosure
 * This replaces the 5,200 token traditional prompt with ~200 tokens
 * Optimized: 272 → 198 tokens (27% reduction)
 */
export function getMCPSystemPrompt(): string {
  return `You can write TypeScript to call MCP server tools:

**Tools (import from ./servers/<category>):**
- **search**: searchProducts(query, limit), searchByCategory(category, subcategory)
- **commerce**: lookupOrder(orderId/email), getProductDetails(sku/url), woocommerceOperations(operation, params)
- **content**: getCompletePageDetails(url)

**Usage Pattern:**
\`\`\`ts
import { searchProducts } from './servers/search';
const data = await searchProducts({ query: "pumps", limit: 10 }, getContext());
console.log(JSON.stringify(data));
\`\`\`

**Key Rules:**
• \`getContext()\` is auto-available (provides domain, customerId, platform)
• All tools are async, require \`await\`
• Return data via \`console.log(JSON.stringify())\`
• Search first before asking clarifying questions
• Use exact SKU when available (faster)
• Handle errors gracefully, suggest alternatives

**Multi-tool:** Chain multiple imports/calls in one code block when needed.`;
}

/**
 * Calculate token savings from progressive disclosure
 * Traditional prompt: ~5,200 tokens
 * MCP prompt: ~200 tokens
 * Savings: ~5,000 tokens per message
 */
export function calculateTokenSavings(
  traditionalPromptTokens = 5200,
  mcpPromptTokens = 200
): number {
  return traditionalPromptTokens - mcpPromptTokens;
}
