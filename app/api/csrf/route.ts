/**
 * CSRF Token Generation Endpoint
 *
 * GET /api/csrf
 *
 * Generates and returns a CSRF token for client-side use.
 * Sets token as HTTP-only cookie and returns token value in response body.
 *
 * Client workflow:
 * 1. Call GET /api/csrf on app initialization
 * 2. Store returned token in memory (window.__CSRF_TOKEN)
 * 3. Include token in X-CSRF-Token header for all state-changing requests
 * 4. Browser automatically sends cookie with requests
 * 5. Server validates cookie matches header
 *
 * Security properties:
 * - Token is cryptographically random (256 bits)
 * - Cookie is HTTP-only (prevents XSS theft)
 * - SameSite=strict (prevents CSRF on modern browsers)
 * - Token expires after 24 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie } from '@/lib/middleware/csrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf
 * Generate and return a new CSRF token
 */
export async function GET(request: NextRequest) {
  try {
    // Generate cryptographically secure random token
    const token = generateCSRFToken();

    // Create response with token in body
    const response = NextResponse.json({
      csrfToken: token,
      expiresIn: 86400, // 24 hours in seconds
      message: 'CSRF token generated successfully'
    });

    // Set token as HTTP-only cookie
    return setCSRFCookie(response, token);
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
        message: 'An unexpected error occurred. Please try again.'
      },
      { status: 500 }
    );
  }
}
