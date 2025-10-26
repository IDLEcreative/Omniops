/**
 * WooCommerce Proxy Utilities
 *
 * Shared utility functions for WooCommerce API proxy routing
 */

import { NextRequest } from 'next/server';

/**
 * Parse path from params into string and parts
 */
export function parsePath(resolvedParams: { path: string[] }) {
  const path = resolvedParams.path.join('/');
  const pathParts = path.split('/');
  return { path, pathParts };
}

/**
 * Extract search parameters from request
 */
export function getSearchParams(request: NextRequest): Record<string, string> {
  return Object.fromEntries(request.nextUrl.searchParams);
}

/**
 * Parse integer from path part with fallback
 */
export function parsePathInt(value: string | undefined, fallback: number = 0): number {
  return parseInt(value || String(fallback));
}

/**
 * Match path against regex pattern and return input if match found
 */
export function matchPath(path: string, pattern: RegExp): string | undefined {
  return path.match(pattern)?.input;
}
