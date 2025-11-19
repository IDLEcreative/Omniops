/**
 * Sentry Error Tracking Integration
 *
 * Provides centralized error tracking, performance monitoring, and user context
 * for production applications. Integrates with Next.js for both client and server.
 *
 * Features:
 * - Automatic error capture
 * - Performance monitoring (transactions, spans)
 * - User context tracking
 * - Custom tags and metadata
 * - Breadcrumb tracking
 * - Source map support
 *
 * Usage:
 * ```ts
 * import { captureError, captureMessage, setUserContext } from '@/lib/monitoring/sentry';
 *
 * // Capture error
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, { operation: 'riskyOperation', userId: '123' });
 * }
 *
 * // Track user context
 * setUserContext({ id: '123', email: 'user@example.com', domain: 'example.com' });
 *
 * // Add breadcrumb
 * addBreadcrumb('User clicked checkout', { cartTotal: 99.99 });
 * ```
 *
 * LOC: ~280 lines
 */

import * as Sentry from '@sentry/nextjs';

// Check if Sentry is configured
const isSentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for Next.js
 * Called automatically by Sentry's instrumentation files
 */
export function initSentry() {
  if (!isSentryEnabled) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',

    // Error filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // Ignore AbortError
      'AbortError',
    ],

    // Limit breadcrumbs
    maxBreadcrumbs: 50,

    // Custom integrations
    integrations: [
      // Browser integrations (client-side only)
      ...(typeof window !== 'undefined'
        ? [
            Sentry.browserTracingIntegration({
              tracePropagationTargets: [
                'localhost',
                /^\//,
                new RegExp(process.env.NEXT_PUBLIC_APP_URL || ''),
              ],
            }),
          ]
        : []
      ),
    ],

    // Before send hook for data scrubbing
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
        // Scrub authorization headers
        if (event.request.headers) {
          delete event.request.headers.Authorization;
          delete event.request.headers.authorization;
        }
      }

      return event;
    },
  });
}

/**
 * Capture an error with context
 */
export function captureError(
  error: Error | unknown,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = 'error'
): string | undefined {
  if (!isSentryEnabled) {
    console.error('Error (Sentry disabled):', error, context);
    return undefined;
  }

  return Sentry.captureException(error, {
    level,
    extra: context,
  });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string | undefined {
  if (!isSentryEnabled) {
    console.log(`Message (Sentry disabled) [${level}]:`, message, context);
    return undefined;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  domain?: string;
  [key: string]: any;
}): void {
  if (!isSentryEnabled) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.domain,
    ...user,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext(): void {
  if (!isSentryEnabled) return;
  Sentry.setUser(null);
}

/**
 * Add custom tags to error reports
 */
export function setTags(tags: Record<string, string | number | boolean>): void {
  if (!isSentryEnabled) return;

  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, String(value));
  });
}

/**
 * Add breadcrumb (user action trail)
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  category: string = 'custom'
): void {
  if (!isSentryEnabled) return;

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string,
  tags?: Record<string, string>
): Sentry.Transaction | undefined {
  if (!isSentryEnabled) return undefined;

  const transaction = Sentry.startTransaction({
    name,
    op,
    tags,
  });

  return transaction;
}

// Re-export helper functions from separate file (keeps this file under 300 LOC)
export {
  withSentry,
  trackDatabaseQuery,
  trackApiCall,
  flush,
} from './sentry-helpers';

// Export Sentry for direct access if needed
export { Sentry };

// Auto-initialize on import
if (isSentryEnabled) {
  initSentry();
}
