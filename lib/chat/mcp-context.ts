/**
 * MCP Context Operations
 *
 * Builds execution contexts and manages MCP configuration
 */

import { ExecutionContext } from '@/lib/mcp/types';

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
