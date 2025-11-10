'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function TestWidgetPage() {
  useEffect(() => {
    // Set widget configuration in browser
    if (typeof window !== 'undefined') {
      (window as any).ChatWidgetConfig = {
        serverUrl: window.location.origin,
        domain: 'www.thompsonseparts.co.uk',
        appearance: {
          position: 'bottom-right',
          startMinimized: false,
        },
        behavior: {
          autoOpen: false,
          showOnLoad: true,
        },
        debug: true,
      };

      // Enable debug mode globally
      (window as any).ChatWidgetDebug = true;
    }
  }, []);

  return (
    <>
      {/* Load widget bundle and embed script */}
      <Script src="/widget-bundle.js" strategy="beforeInteractive" />
      <Script src="/embed.js" strategy="afterInteractive" />

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Embedded Chat Widget Test Page</h1>
          <p className="text-gray-600 mb-8">
            This page demonstrates the embedded chat widget loaded via iframe.
          </p>

          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Widget Features:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Loaded via iframe for isolation</li>
              <li>Fixed position in bottom-right corner</li>
              <li>Auto-opens on page load (for testing)</li>
              <li>Session tracking enabled</li>
              <li>Programmatic API available via window.ChatWidget</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Features:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Widget should auto-open on page load</li>
              <li>Session metadata should be tracked in localStorage</li>
              <li>Chat messages include session_metadata in API requests</li>
              <li>Use window.ChatWidget API to control the widget</li>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}