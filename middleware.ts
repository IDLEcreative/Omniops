import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getCorsHeaders } from '@/lib/security/cors-config'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin');

  // ========================================
  // CRITICAL: Handle ALL OPTIONS requests immediately (CORS preflight)
  // Must be first - no redirects allowed during preflight
  // ========================================
  if (request.method === 'OPTIONS') {
    console.log('[Middleware] OPTIONS request for:', pathname);
    const corsHeaders = getCorsHeaders(pathname, origin);
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // ========================================
  // PUBLIC API ROUTES: Skip ALL auth/session checks for public endpoints
  // These routes must not trigger ANY redirects
  // ========================================
  const publicApiRoutes = ['/api/chat', '/api/widget', '/api/scrape'];
  const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route));

  if (isPublicApi) {
    console.log('[Middleware] Public API request for:', pathname);
    // Skip ALL processing - return immediately with CORS headers
    const response = NextResponse.next();
    const corsHeaders = getCorsHeaders(pathname, origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

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

  // Owner routes - Platform owner only access
  const isOwnerPath = pathname.startsWith('/owner')

  // Check if user is platform owner (via email in env var)
  const isPlatformOwner = user && process.env.PLATFORM_OWNER_EMAIL &&
    user.email === process.env.PLATFORM_OWNER_EMAIL

  // Redirect non-owners away from owner routes
  if (isOwnerPath && !isPlatformOwner) {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to login if accessing owner path without auth
  if (isOwnerPath && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

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
  const scriptSources = [
    "'self'",
    // Removed 'unsafe-eval' and 'unsafe-inline' for security
    'https://cdn.jsdelivr.net',
    // CRITICAL: Always allow Vercel tooling (it detects environment automatically)
    'https://vercel.live',
    'https://*.vercel.live',
    // Cloudflare Turnstile (CAPTCHA)
    'https://challenges.cloudflare.com',
  ];

  const connectSources = [
    "'self'",
    'https://*.supabase.co',
    'https://api.openai.com',
    // CRITICAL: Allow WebSocket connections to application domain
    'wss://omniops.co.uk',
    'wss://*.omniops.co.uk',
    'ws://localhost:*', // Development WebSocket support
    // CRITICAL: Always allow Vercel tooling
    'https://vercel.live',
    'https://*.vercel.live',
    'wss://vercel.live',
    'wss://*.vercel.live',
  ];

  const frameSources = [
    "'self'",
    // CRITICAL: Allow Vercel feedback widget iframes
    'https://vercel.live',
    'https://*.vercel.live',
  ];

  const securityHeaders = {
    // HSTS - Force HTTPS for 1 year (including subdomains)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

    // X-Frame-Options - Prevent clickjacking attacks
    // SAMEORIGIN allows framing only by same domain (required for embed widget)
    'X-Frame-Options': 'SAMEORIGIN',

    // Content Security Policy - Mitigate XSS attacks
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src ${scriptSources.join(' ')}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      `connect-src ${connectSources.join(' ')}`,
      `frame-src ${frameSources.join(' ')}`,
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

  // Add CORS headers for API routes (using security-based allowlist)
  if (pathname.startsWith('/api/')) {
    const corsHeaders = getCorsHeaders(pathname, origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

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
