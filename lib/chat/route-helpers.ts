/**
 * Chat Route Helper Functions
 * Extracted from app/api/chat/route.ts for better organization
 */

import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@/types/supabase';

// Allowed origins for CORS (security: restrict to known domains)
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  'https://omniops.co.uk',
  'https://www.omniops.co.uk',
].filter(Boolean); // Remove undefined values

export function getCorsHeaders(origin: string | null, isPublicWidgetEndpoint: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Only allow specific origins for authenticated endpoints
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  } else if (isPublicWidgetEndpoint) {
    // Widget endpoints can use * (no credentials) for embedding
    headers['Access-Control-Allow-Origin'] = '*';
    // Don't set credentials for wildcard origin
  }
  // If origin not in allowlist and not public endpoint, don't set CORS headers (blocked)

  return headers;
}

export async function checkRateLimit(
  domain: string | null,
  host: string | null,
  rateLimitFn: (domain: string) => Promise<{ allowed: boolean; resetTime: number }>,
  corsHeaders: Record<string, string>
): Promise<NextResponse | null> {
  const rateLimitDomain = domain || host || 'unknown';
  const { allowed, resetTime } = await rateLimitFn(rateLimitDomain);

  if (!allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': retryAfterSeconds.toString(),
        }
      }
    );
  }

  return null;
}

export async function initializeDatabase(
  createSupabaseClient: () => Promise<SupabaseClient | null>,
  corsHeaders: Record<string, string>
): Promise<{ client: SupabaseClient | null; error: NextResponse | null }> {
  const adminSupabase = await createSupabaseClient();

  if (!adminSupabase) {
    return {
      client: null,
      error: NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503, headers: corsHeaders }
      )
    };
  }

  return { client: adminSupabase, error: null };
}
