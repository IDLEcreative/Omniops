/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * Manages allowed origins for different endpoint types:
 * - Public endpoints (widget, embed): Wildcard for embedding on customer sites
 * - Admin endpoints: Strict allowlist for dashboard access
 * - Webhook endpoints: Strict allowlist for webhook providers
 *
 * Security: Prevents unauthorized cross-origin requests to sensitive endpoints
 */

/**
 * Get allowed origins from environment or use defaults
 */
function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;

  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }

  // Default allowed origins for development
  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://omniops.co.uk',
    'https://www.omniops.co.uk',
  ];
}

const ALLOWED_ORIGINS = getAllowedOrigins();

/**
 * Check if origin is in allowlist
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  // Check exact match
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check wildcard patterns (e.g., *.omniops.co.uk)
  return ALLOWED_ORIGINS.some(allowed => {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2); // Remove *. prefix
      return origin.endsWith(`.${domain}`) || origin === `https://${domain}`;
    }
    return false;
  });
}

/**
 * Get CORS headers for public endpoints (widget, embed, chat)
 * Uses wildcard to allow embedding on any customer website
 */
export function getPublicCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Get CORS headers for admin/sensitive endpoints
 * Restricts to allowlist only
 */
export function getRestrictedCorsHeaders(origin: string | null): Record<string, string> {
  // Only allow origins in allowlist
  const allowedOrigin = origin && isOriginAllowed(origin) ? origin : null;

  if (!allowedOrigin) {
    // No CORS headers if origin not allowed
    return {};
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Check if current endpoint is a public endpoint
 */
export function isPublicEndpoint(pathname: string): boolean {
  const publicEndpoints = [
    '/api/chat',
    '/api/widget',
    '/api/scrape',
    '/embed.js',
    '/widget-bundle.js',
  ];

  return publicEndpoints.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Check if current endpoint is a webhook endpoint
 */
export function isWebhookEndpoint(pathname: string): boolean {
  return pathname.startsWith('/api/webhooks/') ||
         pathname.startsWith('/api/stripe/webhook');
}

/**
 * Get appropriate CORS headers based on endpoint type
 */
export function getCorsHeaders(pathname: string, origin: string | null): Record<string, string> {
  if (isPublicEndpoint(pathname)) {
    return getPublicCorsHeaders(origin);
  }

  if (isWebhookEndpoint(pathname)) {
    // Webhooks are validated by signature, CORS is less critical
    // But still restrict to prevent browser-based attacks
    return getRestrictedCorsHeaders(origin);
  }

  // Admin and sensitive endpoints use restricted CORS
  return getRestrictedCorsHeaders(origin);
}
