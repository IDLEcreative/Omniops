import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ========================================
  // SECURITY: Block debug/test endpoints in production
  // ========================================
  const isProduction = process.env.NODE_ENV === 'production'
  const debugEnabled = process.env.ENABLE_DEBUG_ENDPOINTS === 'true'

  if (isProduction && !debugEnabled) {
    const debugPatterns = [
      '/api/debug',
      '/api/test-',
      '/api/check-',
      '/api/fix-',
      '/api/setup-',
      '/api/simple-rag-test',
      '/api/rag-health',
      '/api/verify-customer',
      '/api/query-indexes',
      '/api/woocommerce/test',
      '/api/woocommerce/cart/test',
      '/api/woocommerce/customers/test',
      '/api/woocommerce/customer-test',
      '/api/shopify/test',
      '/api/dashboard/test-connection',
    ]

    const isDebugEndpoint = debugPatterns.some(pattern => pathname.startsWith(pattern))

    if (isDebugEndpoint) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      )
    }
  }

  // Update session and get Supabase client
  const { supabase, response } = await updateSession(request)

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes that require organization membership
  const protectedPaths = ['/dashboard', '/admin']
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  // Allow onboarding page without organization
  if (request.nextUrl.pathname.startsWith('/onboarding')) {
    return response
  }

  // Check organization membership for protected paths
  if (isProtectedPath && user) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    // Redirect to onboarding if no organization
    if (!membership) {
      const redirectUrl = new URL('/onboarding', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect to login if accessing protected path without auth
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ========================================
  // SECURITY: Add security headers to all responses
  // ========================================
  const securityHeaders = {
    // HSTS - Force HTTPS for 1 year (including subdomains)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // X-Frame-Options - Prevent clickjacking attacks
    // SAMEORIGIN allows framing only by same domain (required for embed widget)
    'X-Frame-Options': 'SAMEORIGIN',

    // Content Security Policy - Mitigate XSS attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.openai.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),

    // Referrer Policy - Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // X-Content-Type-Options - Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Permissions Policy - Control browser features
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', '),

    // X-XSS-Protection - Legacy XSS filter (for older browsers)
    'X-XSS-Protection': '1; mode=block'
  }

  // Apply all security headers to the response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
