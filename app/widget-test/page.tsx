'use client';

import { useEffect } from 'react';

/**
 * Widget Test Page
 *
 * Purpose: Test environment for E2E tests
 * - Loads widget via embed.js (creates iframe)
 * - Widget starts CLOSED - E2E tests control when it opens
 * - No hints or demo UI (clean test environment)
 * - Mimics production embed environment
 */
export default function WidgetTestPage() {
  useEffect(() => {
    // Prevent outer scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Configure widget to START CLOSED for E2E test control
    (window as any).ChatWidgetConfig = {
      serverUrl: window.location.origin,
      domain: 'www.thompsonseparts.co.uk', // Test domain with real products
      initialOpen: false, // E2E test controls when widget opens
      appearance: {
        position: 'bottom-right',
        theme: 'light'
      },
      features: {
        websiteScraping: { enabled: true },
        woocommerce: { enabled: true }
      },
      privacy: {
        allowOptOut: true,
        showPrivacyNotice: false,
        requireConsent: false,
        consentGiven: true,
        retentionDays: 30
      }
    };

    // Load embed script
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-50">
      {/* Test indicator */}
      <div
        className="absolute top-4 left-4 z-50 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg px-3 py-2 text-sm font-mono shadow-lg"
        data-testid="test-indicator"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
          <span className="text-yellow-900 dark:text-yellow-100">Test Mode</span>
        </div>
      </div>

      {/* Widget will be injected here by embed.js */}
    </div>
  );
}
