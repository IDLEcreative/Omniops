'use client';

import { useEffect } from 'react';
import { getSessionTracker } from '@/lib/analytics/session-tracker';

/**
 * SessionTrackerProvider
 *
 * Initializes global session tracking for all page visits.
 * Tracks user navigation across the site and stores session metadata
 * in localStorage for analytics and chat widget integration.
 *
 * Features:
 * - Auto-initializes on app mount
 * - Tracks page views on route changes
 * - Integrates seamlessly with ChatWidget
 * - Privacy-friendly (localStorage only, no cookies)
 */
export function SessionTrackerProvider() {
  useEffect(() => {
    // ✅ FIX: Only run in browser environment
    if (typeof window === 'undefined') {
      console.log('[SessionTracker] Skipping initialization (server environment)');
      return;
    }

    try {
      // Get domain from window location
      const domain = window.location.hostname;

      // Initialize session tracker
      const tracker = getSessionTracker(domain);

      // Track initial page view
      tracker.trackPageView(window.location.pathname, document.title);


      // Track page views on navigation (for client-side routing)
      const handleRouteChange = () => {
        tracker.trackPageView(window.location.pathname, document.title);
      };

      // Listen for popstate (back/forward navigation)
      window.addEventListener('popstate', handleRouteChange);

      // Listen for Next.js route changes (if using Next.js app router)
      if (typeof window !== 'undefined' && 'navigation' in window) {
        const navigation = (window as any).navigation;
        if (navigation && navigation.addEventListener) {
          navigation.addEventListener('navigate', handleRouteChange);
        }
      }

      // Cleanup on unmount
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
        if (typeof window !== 'undefined' && 'navigation' in window) {
          const navigation = (window as any).navigation;
          if (navigation && navigation.removeEventListener) {
            navigation.removeEventListener('navigate', handleRouteChange);
          }
        }
      };
    } catch (error) {
      console.error('[SessionTracker] Initialization error:', error);
      // Don't throw - tracking is non-critical
    }
  }, []);

  // This component doesn't render anything
  return null;
}
