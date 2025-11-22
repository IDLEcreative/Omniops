/**
 * Sentry Client Provider
 *
 * Client-side React provider for Sentry error tracking integration.
 * Initializes Sentry on mount with proper configuration for Next.js.
 *
 * Features:
 * - Auto-initialization on client mount
 * - Graceful degradation (works without Sentry DSN)
 * - No-op in development if desired
 * - Wraps children without rendering extra DOM elements
 *
 * Usage:
 * ```tsx
 * import { SentryProvider } from '@/lib/monitoring/sentry-client-provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <SentryProvider>
 *           {children}
 *         </SentryProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * LOC: ~60 lines
 */

'use client';

import { useEffect } from 'react';
import { initSentry } from './sentry';

interface SentryProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that initializes Sentry error tracking
 *
 * This component:
 * 1. Runs only on client-side (useEffect)
 * 2. Initializes Sentry once on mount
 * 3. Gracefully degrades if NEXT_PUBLIC_SENTRY_DSN is not set
 * 4. Does not add extra DOM elements
 */
export function SentryProvider({ children }: SentryProviderProps) {
  useEffect(() => {
    // Only initialize if Sentry DSN is configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        initSentry();
        console.info('[Sentry] Error tracking initialized');
      } catch (error) {
        // Don't crash the app if Sentry initialization fails
        console.warn('[Sentry] Failed to initialize:', error);
      }
    } else {
      // Log in development to remind developers to configure Sentry
      if (process.env.NODE_ENV === 'development') {
        console.info('[Sentry] Skipping initialization - NEXT_PUBLIC_SENTRY_DSN not configured');
      }
    }
  }, []); // Run once on mount

  // Render children without wrapping in extra elements
  return <>{children}</>;
}
