/**
 * API Response Caching Utilities
 * Provides caching headers and ETag generation for API routes
 */

import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export interface CacheOptions {
  maxAge?: number; // Max age in seconds
  staleWhileRevalidate?: number; // Stale-while-revalidate in seconds
  private?: boolean; // Private vs public cache
  immutable?: boolean; // Immutable content
  mustRevalidate?: boolean; // Must revalidate
}

/**
 * Generate ETag from content
 */
export function generateETag(content: any): string {
  const stringified = typeof content === 'string' ? content : JSON.stringify(content);
  return createHash('md5').update(stringified).digest('hex');
}

/**
 * Create cache control header string
 */
export function createCacheControl(options: CacheOptions = {}): string {
  const {
    maxAge = 0,
    staleWhileRevalidate = 0,
    private: isPrivate = false,
    immutable = false,
    mustRevalidate = false,
  } = options;

  const parts = [];

  // Cache type
  parts.push(isPrivate ? 'private' : 'public');

  // Max age
  if (maxAge > 0) {
    parts.push(`max-age=${maxAge}`);
  }

  // Stale while revalidate
  if (staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  // Must revalidate
  if (mustRevalidate) {
    parts.push('must-revalidate');
  }

  // Immutable
  if (immutable) {
    parts.push('immutable');
  }

  return parts.join(', ');
}

/**
 * Create cached JSON response with ETag support
 */
export function cachedJsonResponse(
  data: any,
  request: Request,
  options: CacheOptions & { status?: number } = {}
): NextResponse {
  const { status = 200, ...cacheOptions } = options;
  
  // Generate ETag
  const etag = `"${generateETag(data)}"`;
  
  // Check if client has cached version
  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': createCacheControl(cacheOptions),
      },
    });
  }

  // Return full response with caching headers
  return NextResponse.json(data, {
    status,
    headers: {
      'ETag': etag,
      'Cache-Control': createCacheControl(cacheOptions),
      'Vary': 'Accept-Encoding',
    },
  });
}

/**
 * Cache configurations for different content types
 */
export const CACHE_CONFIGS = {
  // Static content that rarely changes
  STATIC: {
    maxAge: 86400, // 1 day
    staleWhileRevalidate: 604800, // 1 week
    immutable: false,
  } as CacheOptions,

  // Product data
  PRODUCTS: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
  } as CacheOptions,

  // User-specific data
  USER: {
    maxAge: 0,
    private: true,
    mustRevalidate: true,
  } as CacheOptions,

  // Frequently updated data
  DYNAMIC: {
    maxAge: 30, // 30 seconds
    staleWhileRevalidate: 60, // 1 minute
  } as CacheOptions,

  // Real-time data
  REALTIME: {
    maxAge: 0,
    mustRevalidate: true,
  } as CacheOptions,

  // Immutable content (with version in URL)
  IMMUTABLE: {
    maxAge: 31536000, // 1 year
    immutable: true,
  } as CacheOptions,
};

/**
 * Add performance timing headers
 */
export function addPerformanceHeaders(
  response: Response,
  startTime: number
): Response {
  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);
  
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Served-By', 'customer-service-api');
  
  return response;
}

/**
 * Middleware to add caching headers to GET requests
 */
export function withCaching(
  handler: (request: Request, ...args: any[]) => Promise<Response>,
  cacheOptions: CacheOptions = CACHE_CONFIGS.DYNAMIC
) {
  return async (request: Request, ...args: any[]) => {
    const startTime = performance.now();
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      const response = await handler(request, ...args);
      return addPerformanceHeaders(response as Response, startTime);
    }

    try {
      const response = await handler(request, ...args);
      
      // If handler returns data directly, wrap it
      if (!(response instanceof Response)) {
        return cachedJsonResponse(response, request, cacheOptions);
      }

      // Add caching headers to existing response
      response.headers.set('Cache-Control', createCacheControl(cacheOptions));
      
      return addPerformanceHeaders(response, startTime);
    } catch (error) {
      console.error('Error in cached handler:', error);
      throw error;
    }
  };
}