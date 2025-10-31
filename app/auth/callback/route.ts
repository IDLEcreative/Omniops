import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Whitelist of allowed redirect paths to prevent open redirect attacks
const ALLOWED_REDIRECTS = [
  '/',
  '/admin',
  '/dashboard',
  '/settings',
  '/embed',
  '/onboarding',
  '/update-password'
];

/**
 * Validates redirect URL to prevent open redirect attacks
 * Only allows whitelisted relative paths, not external URLs
 */
function validateRedirect(redirectTo: string | null, fallback: string = '/admin'): string {
  if (!redirectTo) return fallback;

  // Remove any query parameters or fragments for validation
  const pathParts = redirectTo.split('?')[0]?.split('#');
  const path = pathParts?.[0];

  if (!path) return fallback;

  // Only allow paths that start with / and are in whitelist
  if (path.startsWith('/') && !path.startsWith('//')) {
    // Check if path is in whitelist or starts with allowed prefix
    if (ALLOWED_REDIRECTS.includes(path) ||
        ALLOWED_REDIRECTS.some(allowed => path.startsWith(allowed + '/'))) {
      return redirectTo; // Return with query params/fragments intact
    }
  }

  // Invalid redirect - use fallback
  return fallback;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = validateRedirect(requestUrl.searchParams.get('next'), '/admin')

  if (code) {
    const supabase = await createClient()

    if (!supabase) {
      console.error('Failed to create Supabase client')
      return NextResponse.redirect(new URL('/login?error=Service unavailable', requestUrl.origin))
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/login?error=Invalid or expired link', requestUrl.origin))
    }

    // Handle password recovery specifically
    if (type === 'recovery') {
      return NextResponse.redirect(new URL('/update-password', requestUrl.origin))
    }

    // Check if user has an organization
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      // If no organization membership, redirect to onboarding
      if (!membership) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}