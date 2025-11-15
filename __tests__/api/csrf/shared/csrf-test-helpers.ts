import { NextRequest } from 'next/server';

/**
 * Helper to create mock request with optional CSRF token
 */
export function createMockRequest(
  url: string,
  method: string,
  body?: any,
  includeCSRF: boolean = false,
  csrfToken?: string
): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  if (includeCSRF && csrfToken) {
    headers.set('x-csrf-token', csrfToken);
    headers.set('cookie', `csrf_token=${csrfToken}`);
  }

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create request with only cookie (no header)
 */
export function createRequestWithCookieOnly(
  url: string,
  method: string,
  body: any,
  csrfToken: string
): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('cookie', `csrf_token=${csrfToken}`);

  return new NextRequest(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Create request with only header (no cookie)
 */
export function createRequestWithHeaderOnly(
  url: string,
  method: string,
  body: any,
  csrfToken: string
): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('x-csrf-token', csrfToken);

  return new NextRequest(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Create request with mismatched tokens
 */
export function createRequestWithMismatchedTokens(
  url: string,
  method: string,
  body: any,
  csrfToken: string
): NextRequest {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('x-csrf-token', 'wrong-token-123');
  headers.set('cookie', `csrf_token=${csrfToken}`);

  return new NextRequest(url, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}
