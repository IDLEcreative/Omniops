/**
 * MCP Tool: Search by Category
 *
 * Purpose: Semantic search for products filtered by category name or slug
 * Category: search
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * This tool provides category-based product search using:
 * 1. Semantic embeddings search with category filter
 * 2. Domain normalization and validation
 * 3. Configurable similarity threshold (0.15 default)
 */

import { z } from 'zod';
import { SearchResult } from '@/types';
import { ExecutionContext, ToolResult, ToolMetadata } from '../shared/types';
import { validateInput } from '../shared/validation';
import { logToolExecution, PerformanceTimer } from '../shared/utils/logger';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// =====================================================
// SECTION 1: Type Definitions
// =====================================================

export const searchByCategoryInputSchema = z.object({
  category: z.string().min(1).max(200).describe('Category name or slug to search within'),
  limit: z.number().int().min(1).max(1000).default(100).describe('Maximum number of results to return'),
  threshold: z.number().min(0).max(1).default(0.15).optional().describe('Minimum similarity threshold for semantic search')
});

export type SearchByCategoryInput = z.infer<typeof searchByCategoryInputSchema>;

export interface SearchByCategoryOutput {
  results: SearchResult[];
  totalMatches: number;
  executionTime: number;
  category: string;
  source: 'semantic' | 'error' | 'invalid-domain';
  threshold: number;
}

// =====================================================
// SECTION 2: MCP Metadata
// =====================================================

export const metadata: ToolMetadata = {
  name: 'searchByCategory',
  description: 'Search for products within a specific category using semantic embeddings',
  category: 'search',
  version: '1.0.0',
  author: 'Omniops Engineering',

  inputSchema: searchByCategoryInputSchema,

  capabilities: {
    requiresAuth: true,
    requiresContext: ['customerId', 'domain'],
    rateLimit: { requests: 100, window: '1m' },
    caching: { enabled: true, ttl: 300 }
  },

  examples: [
    {
      description: 'Search within featured equipment category',
      input: { category: 'featured-equipment', limit: 20 },
      expectedOutput: 'Up to 20 inventory items in the featured-equipment category with relevance scores'
    },
    {
      description: 'Search category with custom threshold',
      input: { category: 'spare parts', limit: 50, threshold: 0.2 },
      expectedOutput: 'Products in spare parts category with minimum 0.2 similarity'
    },
    {
      description: 'Broad category search',
      input: { category: 'accessories', limit: 100 },
      expectedOutput: 'All products in accessories category using default 0.15 threshold'
    }
  ],

  performance: {
    avgLatency: '250ms',
    maxLatency: '2s',
    tokenUsage: {
      input: 10, // Minimal token usage for category query
      output: 50 // Estimated tokens for results
    }
  }
};

// =====================================================
// SECTION 3: Tool Implementation
// =====================================================

/**
 * Search for products within a specific category using semantic search
 *
 * Strategy:
 * 1. Validate input and normalize domain
 * 2. Use category name as semantic search query
 * 3. Apply similarity threshold for filtering
 * 4. Return formatted results with metadata
 */
export async function searchByCategory(
  input: SearchByCategoryInput,
  context: ExecutionContext
): Promise<ToolResult<SearchByCategoryOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = validateInput(searchByCategoryInputSchema, input);

    // Check required context
    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    console.log(
      `[MCP searchByCategory] Category: "${validatedInput.category}" | ` +
      `Limit: ${validatedInput.limit} | ` +
      `Threshold: ${validatedInput.threshold} | ` +
      `Domain: ${context.domain}`
    );

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      const executionTime = timer.elapsed();

      await logToolExecution({
        tool: 'searchByCategory',
        category: 'search',
        customerId: context.customerId || 'unknown',
        status: 'error',
        error: 'Invalid or localhost domain',
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        data: {
          results: [],
          totalMatches: 0,
          executionTime,
          category: validatedInput.category,
          source: 'invalid-domain',
          threshold: validatedInput.threshold !== undefined ? validatedInput.threshold : 0.15
        },
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid or localhost domain - cannot search without valid domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    // Perform semantic search using category as query
    const threshold = validatedInput.threshold !== undefined ? validatedInput.threshold : 0.15;
    const semanticResults = await searchSimilarContent(
      validatedInput.category,
      normalizedDomain,
      validatedInput.limit,
      threshold
    );

    const executionTime = timer.elapsed();

    console.log(
      `[MCP searchByCategory] Category search returned ${semanticResults.length} results ` +
      `for "${validatedInput.category}" in ${executionTime}ms`
    );

    await logToolExecution({
      tool: 'searchByCategory',
      category: 'search',
      customerId: context.customerId || 'unknown',
      status: 'success',
      resultCount: semanticResults.length,
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        results: semanticResults,
        totalMatches: semanticResults.length,
        executionTime,
        category: validatedInput.category,
        source: 'semantic',
        threshold
      },
      metadata: {
        executionTime,
        cached: false,
        source: 'semantic'
      }
    };

  } catch (error) {
    const executionTime = timer.elapsed();

    console.error('[MCP searchByCategory] Error:', error);

    await logToolExecution({
      tool: 'searchByCategory',
      category: 'search',
      customerId: context.customerId || 'unknown',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: {
        results: [],
        totalMatches: 0,
        executionTime,
        category: input.category,
        source: 'error',
        threshold: input.threshold !== undefined ? input.threshold : 0.15
      },
      error: {
        code: 'SEARCH_BY_CATEGORY_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred during category search',
        details: error
      },
      metadata: {
        executionTime
      }
    };
  }
}

export default searchByCategory;
