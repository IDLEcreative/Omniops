/**
 * MCP Tool: Get Complete Page Details
 *
 * Purpose: Retrieve complete details and all content chunks for a specific page
 * Category: content
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * This tool provides full page retrieval by:
 * 1. Searching for the best matching page using semantic embeddings
 * 2. Retrieving ALL chunks from that specific page
 * 3. Returning complete context in a focused, token-efficient manner
 *
 * Use Cases:
 * - Getting full product details after finding it in search results
 * - Reading complete documentation pages
 * - Getting all FAQ content from a specific page
 * - Any scenario requiring complete page context rather than scattered chunks
 */

import { z } from 'zod';
import { SearchResult } from '@/types';
import { ExecutionContext, ToolResult, ToolMetadata } from '../shared/types';
import { validateInput } from '../shared/validation';
import { logToolExecution, PerformanceTimer } from '../shared/utils/logger';
import { searchAndReturnFullPage } from '@/lib/full-page-retrieval';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// =====================================================
// SECTION 1: Type Definitions
// =====================================================

export const getCompletePageDetailsInputSchema = z.object({
  pageQuery: z.string().min(1).max(500).describe('Search query to find the page (URL, title, or keywords)'),
  fallbackChunkLimit: z.number().int().min(1).max(50).default(15).optional().describe('Maximum chunks to return if full page retrieval fails'),
  similarityThreshold: z.number().min(0).max(1).default(0.3).optional().describe('Minimum similarity threshold for page matching'),
  includeMetadata: z.boolean().default(true).optional().describe('Include metadata about the page retrieval')
});

export type GetCompletePageDetailsInput = z.infer<typeof getCompletePageDetailsInputSchema>;

export interface GetCompletePageDetailsOutput {
  results: SearchResult[];
  totalChunks: number;
  executionTime: number;
  source: 'full-page' | 'failed' | 'invalid-domain';
  pageInfo?: {
    url: string;
    title: string;
    totalChunks: number;
  };
  metadata?: {
    retrievalStrategy: string;
    queryUsed: string;
    similarityThreshold: number;
  };
}

// =====================================================
// SECTION 2: MCP Metadata
// =====================================================

export const metadata: ToolMetadata = {
  name: 'getCompletePageDetails',
  description: 'Retrieve complete details and all content chunks from a specific page using semantic search to identify the best match',
  category: 'content',
  version: '1.0.0',
  author: 'Omniops Engineering',

  inputSchema: getCompletePageDetailsInputSchema,

  capabilities: {
    requiresAuth: true,
    requiresContext: ['customerId', 'domain'],
    rateLimit: { requests: 100, window: '1m' },
    caching: { enabled: true, ttl: 600 }
  },

  examples: [
    {
      description: 'Get complete product page details',
      input: { pageQuery: 'modular drive unit AX-90', fallbackChunkLimit: 15, similarityThreshold: 0.3 },
      expectedOutput: 'All chunks from the best matching product page with complete information'
    },
    {
      description: 'Get documentation page',
      input: { pageQuery: 'installation guide for premium equipment', fallbackChunkLimit: 20, similarityThreshold: 0.25 },
      expectedOutput: 'Complete installation guide page with all sections'
    },
    {
      description: 'Get FAQ page details',
      input: { pageQuery: 'frequently asked questions about delivery', fallbackChunkLimit: 15 },
      expectedOutput: 'Full FAQ page with all questions and answers'
    }
  ],

  performance: {
    avgLatency: '200ms',
    maxLatency: '2s',
    tokenUsage: {
      input: 20, // Semantic search query embedding
      output: 100 // Multiple chunks from complete page
    }
  }
};

// =====================================================
// SECTION 3: Tool Implementation
// =====================================================

/**
 * Get complete page details using full page retrieval strategy
 *
 * Strategy:
 * 1. Normalize and validate domain
 * 2. Search for best matching page using semantic embeddings
 * 3. Retrieve ALL chunks from that specific page
 * 4. Return complete context with page metadata
 */
export async function getCompletePageDetails(
  input: GetCompletePageDetailsInput,
  context: ExecutionContext
): Promise<ToolResult<GetCompletePageDetailsOutput>> {
  const timer = new PerformanceTimer();

  try {
    // Validate input
    const validatedInput = validateInput(getCompletePageDetailsInputSchema, input);

    // Check required context
    if (!context.domain) {
      throw new Error('Missing required context: domain');
    }

    console.log(
      `[MCP getCompletePageDetails] Query: "${validatedInput.pageQuery}" | ` +
      `FallbackLimit: ${validatedInput.fallbackChunkLimit} | ` +
      `Threshold: ${validatedInput.similarityThreshold} | ` +
      `Domain: ${context.domain}`
    );

    // Normalize domain
    const normalizedDomain = normalizeDomain(context.domain);
    if (!normalizedDomain) {
      const executionTime = timer.elapsed();

      await logToolExecution({
        tool: 'getCompletePageDetails',
        category: 'content',
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
          totalChunks: 0,
          executionTime,
          source: 'invalid-domain'
        },
        error: {
          code: 'INVALID_DOMAIN',
          message: 'Invalid or localhost domain - cannot retrieve page details without valid domain'
        },
        metadata: {
          executionTime
        }
      };
    }

    // Use full page retrieval to get ALL chunks from best-matching page
    const fullPageResult = await searchAndReturnFullPage(
      validatedInput.pageQuery,
      normalizedDomain,
      validatedInput.fallbackChunkLimit || 15,
      validatedInput.similarityThreshold || 0.3
    );

    const executionTime = timer.elapsed();

    if (fullPageResult.success && fullPageResult.source === 'full_page') {
      console.log(
        `[MCP getCompletePageDetails] Success! Retrieved ${fullPageResult.results.length} chunks ` +
        `from: ${fullPageResult.pageInfo?.title}`
      );

      await logToolExecution({
        tool: 'getCompletePageDetails',
        category: 'content',
        customerId: context.customerId || 'unknown',
        status: 'success',
        resultCount: fullPageResult.results.length,
        executionTime,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        data: {
          results: fullPageResult.results,
          totalChunks: fullPageResult.results.length,
          executionTime,
          source: 'full-page',
          pageInfo: fullPageResult.pageInfo,
          metadata: validatedInput.includeMetadata ? {
            retrievalStrategy: 'full_page',
            queryUsed: validatedInput.pageQuery,
            similarityThreshold: validatedInput.similarityThreshold || 0.3
          } : undefined
        },
        metadata: {
          executionTime,
          cached: false,
          source: 'full-page'
        }
      };
    }

    // If full page retrieval fails, return error
    console.log('[MCP getCompletePageDetails] Could not retrieve complete page details');

    await logToolExecution({
      tool: 'getCompletePageDetails',
      category: 'content',
      customerId: context.customerId || 'unknown',
      status: 'error',
      error: 'Full page retrieval failed - no matching page found',
      executionTime,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      data: {
        results: [],
        totalChunks: 0,
        executionTime,
        source: 'failed'
      },
      error: {
        code: 'PAGE_NOT_FOUND',
        message: 'Could not retrieve complete page details - no matching page found',
        details: {
          query: validatedInput.pageQuery,
          threshold: validatedInput.similarityThreshold || 0.3
        }
      },
      metadata: {
        executionTime
      }
    };

  } catch (error) {
    const executionTime = timer.elapsed();

    console.error('[MCP getCompletePageDetails] Error:', error);

    await logToolExecution({
      tool: 'getCompletePageDetails',
      category: 'content',
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
        totalChunks: 0,
        executionTime,
        source: 'failed'
      },
      error: {
        code: 'GET_PAGE_DETAILS_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred while retrieving page details',
        details: error
      },
      metadata: {
        executionTime
      }
    };
  }
}

export default getCompletePageDetails;
