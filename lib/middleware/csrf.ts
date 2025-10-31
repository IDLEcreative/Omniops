/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Prevents attackers from tricking authenticated users into performing
 * unauthorized state-changing actions by requiring a secret token that
 * can only be obtained from the legitimate application.
 *
 * How it works:
 * 1. GET /api/csrf generates a random token and sets it as HTTP-only cookie
 * 2. Client includes token in X-CSRF-Token header for state-changing requests
 * 3. Middleware validates that cookie token matches header token
 * 4. Uses timing-safe comparison to prevent timing attacks
 *
 * Attack Prevention:
 * - Blocks requests from malicious sites (evil.com cannot read our cookies)
 * - Requires attacker to have both cookie AND header token (impossible cross-origin)
 * - HTTP-only cookie prevents JavaScript theft (XSS mitigation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Configuration constants
 */
const CSRF_TOKEN_LENGTH = 32; // 256 bits of entropy
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

/**
 * Generates a cryptographically secure random CSRF token
 * @returns 64-character hex string (32 bytes)
 */
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validates CSRF token using timing-safe comparison
 *
 * Compares cookie token with header token to ensure:
 * 1. Both tokens exist
 * 2. Both tokens match exactly
 * 3. Comparison is constant-time (prevents timing attacks)
 *
 * @param request - Next.js request object
 * @returns true if token is valid, false otherwise
 */
export function validateCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Both tokens must exist
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Tokens must be same length for timing-safe comparison
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  try {
    // Use timing-safe comparison to prevent timing attacks
    // Convert strings to buffers for constant-time comparison
    const cookieBuffer = Buffer.from(cookieToken, 'utf8');
    const headerBuffer = Buffer.from(headerToken, 'utf8');

    return timingSafeEqual(cookieBuffer, headerBuffer);
  } catch (error) {
    // Buffer conversion or comparison failed
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Higher-order function that wraps API route handlers with CSRF protection
 *
 * Only validates CSRF tokens for state-changing HTTP methods (POST, PUT, PATCH, DELETE).
 * Safe methods (GET, HEAD, OPTIONS) are allowed without CSRF validation.
 *
 * Usage:
 * ```typescript
 * export const POST = withCSRF(async (request: NextRequest) => {
 *   // Your handler logic here
 * });
 * ```
 *
 * @param handler - The original API route handler
 * @returns Wrapped handler with CSRF protection
 */
export function withCSRF(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only check CSRF for state-changing methods
    const statefulMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

    if (statefulMethods.includes(request.method)) {
      const isValid = validateCSRFToken(request);

      if (!isValid) {
        console.warn('CSRF validation failed', {
          method: request.method,
          url: request.url,
          hasCookie: !!request.cookies.get(CSRF_COOKIE_NAME),
          hasHeader: !!request.headers.get(CSRF_HEADER_NAME),
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json(
          {
            error: 'Invalid or missing CSRF token',
            message: 'This request requires a valid CSRF token. Please refresh the page and try again.'
          },
          { status: 403 }
        );
      }
    }

    // CSRF validation passed (or not required for GET/HEAD/OPTIONS)
    return handler(request);
  };
}

/**
 * Sets CSRF token as HTTP-only cookie in response
 *
 * Cookie attributes:
 * - httpOnly: Prevents JavaScript access (XSS protection)
 * - secure: HTTPS-only in production
 * - sameSite: 'strict' prevents CSRF entirely on modern browsers
 * - path: '/' makes token available to all routes
 *
 * @param response - Next.js response object
 * @param token - CSRF token to set
 * @returns Modified response with cookie set
 */
export function setCSRFCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY_SECONDS,
    path: '/',
  });

  return response;
}

/**
 * Type guard to check if request needs CSRF validation
 * Useful for conditional middleware application
 */
export function requiresCSRF(request: NextRequest): boolean {
  const statefulMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return statefulMethods.includes(request.method);
}
