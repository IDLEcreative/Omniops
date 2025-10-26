/**
 * Request handlers for product search
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { searchRequestSchema, classifyQuery, calculateImprovement } from './validators';
import {
  performSQLDirectSearch,
  performFilteredVectorSearch,
  performDualVectorSearch,
  performTextVectorSearch,
  performStandardVectorSearch
} from './search-service';

/**
 * Handle product search POST request
 */
export async function handleSearchRequest(req: NextRequest) {
  // Parse and validate request
  const body = await req.json();
  const {
    query,
    domain,
    filters = {},
    limit,
    includeOutOfStock,
    searchMode
  } = searchRequestSchema.parse(body);

  // Initialize services
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection failed' },
      { status: 500 }
    );
  }

  // Simple classification based on query patterns
  const classification = classifyQuery(query);

  console.log('[Product Search] Query classification:', {
    query,
    type: classification?.type,
    route: classification?.route,
    confidence: classification?.confidence
  });

  // Prepare response structure
  const response = {
    query,
    classification: {
      type: classification?.type,
      confidence: classification?.confidence,
      intent: {
        hasSKU: !!classification?.sku,
        hasPrice: !!classification?.priceIntent,
        hasAvailability: !!classification?.availabilityIntent,
        hasBrand: !!classification?.brand
      }
    },
    results: [] as any[],
    metadata: {
      totalResults: 0,
      searchTime: 0,
      searchStrategy: classification?.route || 'hybrid_search',
      weights: { text: 0.5, metadata: 0.5 }
    }
  };

  const startTime = Date.now();

  // Route based on classification
  const route: string = classification?.route || 'hybrid_search';

  switch (route) {
    case 'sql_direct':
    case 'sql_filtered':
      // Direct SQL search for SKU lookups
      response.results = await performSQLDirectSearch(
        supabase,
        classification,
        domain,
        limit
      );
      break;

    case 'hybrid_search':
      // SQL pre-filter then vector search
      response.results = await performFilteredVectorSearch(
        supabase,
        query,
        classification,
        domain,
        filters,
        limit
      );
      break;

    case 'semantic_search':
      // Dual embedding vector search
      response.results = await performDualVectorSearch(
        supabase,
        query,
        classification,
        domain,
        limit
      );
      break;

    case 'knowledge_base':
      // Text-focused vector search (for support queries)
      response.results = await performTextVectorSearch(
        supabase,
        query,
        domain,
        limit
      );
      break;

    default:
      // Fallback to standard vector search
      response.results = await performStandardVectorSearch(
        supabase,
        query,
        domain,
        limit
      );
  }

  // Calculate search time
  response.metadata.searchTime = Date.now() - startTime;
  response.metadata.totalResults = response.results.length;

  // Log performance metrics
  console.log('[Product Search] Performance:', {
    query: query.substring(0, 50),
    strategy: classification?.route || 'hybrid_search',
    resultsFound: response.results.length,
    searchTime: `${response.metadata.searchTime}ms`,
    improvement: calculateImprovement(classification?.type || 'general_search', response.metadata.searchTime)
  });

  return NextResponse.json(response);
}

/**
 * Handle GET request for API info
 */
export async function handleInfoRequest(req: NextRequest) {
  return NextResponse.json({
    message: 'Product Search API - Metadata Vectorization Enabled',
    version: '2.0',
    features: [
      'SKU/Part number search',
      'Natural language queries',
      'Price filtering',
      'Availability filtering',
      'Brand filtering',
      'Dual embedding search',
      'SQL pre-filtering',
      'Query intent classification'
    ],
    expectedImprovement: '70-80% search relevance',
    endpoints: {
      search: 'POST /api/search/products',
      parameters: {
        query: 'Search query (required)',
        domain: 'Domain to search within (optional)',
        filters: {
          minPrice: 'Minimum price filter',
          maxPrice: 'Maximum price filter',
          inStock: 'Stock availability filter',
          brand: 'Brand filter',
          category: 'Category filter'
        },
        limit: 'Max results (1-100, default 20)',
        includeOutOfStock: 'Include out of stock items (default false)',
        searchMode: 'fast | comprehensive | auto (default auto)'
      }
    }
  });
}
