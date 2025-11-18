/**
 * Product Result Builders
 * Extracted from getProductDetails.ts for modularity
 */

import { ToolResult } from '../../shared/types';
import { GetProductDetailsOutput } from '../getProductDetails';
import { logToolExecution } from '../../shared/utils/logger';
import { StrategyResult, getQueryType } from './product-strategies';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';

export interface ResultContext {
  customerId?: string;
  executionTime: number;
}

/**
 * Build success response
 */
export async function buildSuccessResult(
  strategyResult: StrategyResult,
  context: ResultContext,
  sourceOverride?: string
): Promise<ToolResult<GetProductDetailsOutput>> {
  await logToolExecution({
    tool: 'getProductDetails',
    category: 'commerce',
    customerId: context.customerId || 'unknown',
    status: 'success',
    resultCount: strategyResult.results.length,
    executionTime: context.executionTime,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    data: {
      success: true,
      results: strategyResult.results,
      source: (sourceOverride || strategyResult.source) as any,
      executionTime: context.executionTime
    },
    metadata: {
      executionTime: context.executionTime,
      cached: false,
      source: strategyResult.platform || strategyResult.source
    }
  };
}

/**
 * Build not found response
 */
export async function buildNotFoundResult(
  strategyResult: StrategyResult,
  context: ResultContext,
  query?: string
): Promise<ToolResult<GetProductDetailsOutput>> {
  // Track lookup failure for analytics
  if (query) {
    await trackLookupFailure({
      query,
      queryType: getQueryType(query),
      errorType: 'not_found',
      platform: strategyResult.platform || 'unknown',
      suggestions: strategyResult.suggestions,
      timestamp: new Date(),
    });
  }

  return {
    success: false,
    data: {
      success: false,
      results: [],
      source: strategyResult.source as any,
      executionTime: context.executionTime,
      errorMessage: strategyResult.errorMessage,
      suggestions: strategyResult.suggestions
    },
    error: {
      code: 'PRODUCT_NOT_FOUND',
      message: strategyResult.errorMessage || 'Product not found',
      details: strategyResult.suggestions ? { suggestions: strategyResult.suggestions } : undefined
    },
    metadata: {
      executionTime: context.executionTime,
      source: strategyResult.platform
    }
  };
}

/**
 * Build error response
 */
export async function buildErrorResult(
  error: Error | unknown,
  context: ResultContext,
  source: string = 'error'
): Promise<ToolResult<GetProductDetailsOutput>> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

  await logToolExecution({
    tool: 'getProductDetails',
    category: 'commerce',
    customerId: context.customerId || 'unknown',
    status: 'error',
    error: errorMessage,
    executionTime: context.executionTime,
    timestamp: new Date().toISOString()
  });

  return {
    success: false,
    data: {
      success: false,
      results: [],
      source: source as any,
      executionTime: context.executionTime,
      errorMessage
    },
    error: {
      code: 'PROVIDER_ERROR',
      message: errorMessage,
      details: error
    },
    metadata: {
      executionTime: context.executionTime
    }
  };
}

/**
 * Build invalid domain response
 */
export async function buildInvalidDomainResult(
  context: ResultContext
): Promise<ToolResult<GetProductDetailsOutput>> {
  await logToolExecution({
    tool: 'getProductDetails',
    category: 'commerce',
    customerId: context.customerId || 'unknown',
    status: 'error',
    error: 'Invalid or localhost domain',
    executionTime: context.executionTime,
    timestamp: new Date().toISOString()
  });

  return {
    success: false,
    data: {
      success: false,
      results: [],
      source: 'invalid-domain',
      executionTime: context.executionTime
    },
    error: {
      code: 'INVALID_DOMAIN',
      message: 'Invalid or localhost domain - cannot retrieve product details without valid domain'
    },
    metadata: {
      executionTime: context.executionTime
    }
  };
}
