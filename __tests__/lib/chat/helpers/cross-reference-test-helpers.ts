/**
 * Cross-Reference Test Helpers
 *
 * Shared utilities for testing cross-reference functionality
 */

import type { ToolExecutionResult } from '@/lib/chat/ai-processor-types';

/**
 * Creates a basic tool execution result for testing
 */
export const createToolExecutionResult = (
  overrides: Partial<ToolExecutionResult> = {}
): ToolExecutionResult => ({
  toolCall: { id: 'test-call-id', function: { name: 'test', arguments: '{}' } } as any,
  toolName: 'search_website_content',
  toolArgs: { query: 'test query' },
  result: {
    success: true,
    results: [],
    source: 'website-search',
  },
  executionTime: 100,
  ...overrides,
});

/**
 * Creates a WooCommerce tool result with enrichment metadata
 */
export const createWooCommerceToolResult = (options: {
  title: string;
  url: string;
  content: string;
  similarity: number;
  matchedPageUrl?: string;
  sources?: {
    liveData: boolean;
    scrapedContent: boolean;
    relatedContent: boolean;
  };
  relatedPages?: Array<{
    title: string;
    url: string;
    similarity: number;
  }>;
}): ToolExecutionResult => {
  const metadata: any = {};

  if (options.matchedPageUrl) {
    metadata.matchedPageUrl = options.matchedPageUrl;
  }

  if (options.sources) {
    metadata.sources = options.sources;
  }

  if (options.relatedPages) {
    metadata.relatedPages = options.relatedPages;
  }

  return createToolExecutionResult({
    toolName: 'woocommerce_operations',
    toolArgs: { operation: 'searchProducts' },
    result: {
      success: true,
      results: [
        {
          url: options.url,
          title: options.title,
          content: options.content,
          similarity: options.similarity,
          ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
        },
      ],
      source: 'woocommerce-api',
    },
  });
};

/**
 * Validates that formatted output contains expected enrichment elements
 */
export const validateEnrichedOutput = (
  content: string,
  expectations: {
    hasLearnMore?: boolean;
    learnMoreUrl?: string;
    hasSources?: boolean;
    sources?: string[];
    hasRelatedPages?: boolean;
    relatedPages?: Array<{ title: string; similarity: number }>;
  }
) => {
  const checks: { [key: string]: boolean } = {};

  if (expectations.hasLearnMore !== undefined) {
    checks.hasLearnMore = content.includes('Learn more:') === expectations.hasLearnMore;
  }

  if (expectations.learnMoreUrl) {
    checks.learnMoreUrl = content.includes(expectations.learnMoreUrl);
  }

  if (expectations.hasSources !== undefined) {
    checks.hasSources = content.includes('Sources:') === expectations.hasSources;
  }

  if (expectations.sources) {
    checks.sources = expectations.sources.every(source => content.includes(source));
  }

  if (expectations.hasRelatedPages !== undefined) {
    checks.hasRelatedPages = content.includes('Related pages:') === expectations.hasRelatedPages;
  }

  if (expectations.relatedPages) {
    checks.relatedPages = expectations.relatedPages.every(page => {
      const similarityPercent = Math.round(page.similarity * 100);
      return content.includes(page.title) && content.includes(`${similarityPercent}% relevant`);
    });
  }

  return checks;
};
