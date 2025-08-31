'use client';

import { useState, useEffect } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function EmbedPage() {
  const [demoId, setDemoId] = useState<string>('');
  const [demoConfig, setDemoConfig] = useState<any>(null);
  const [initialOpen, setInitialOpen] = useState(false);
  const [forceClose, setForceClose] = useState(false);
  const [showHints, setShowHints] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    allowOptOut: true,
    showPrivacyNotice: true,
    requireConsent: false,
    consentGiven: false,
    retentionDays: 30,
  });

  // Prevent outer (iframe/page) scrolling to avoid double scrollbars
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check if this is a demo
    const demo = params.get('demo');
    if (demo) {
      setDemoId(demo);
      // Try to load demo config from localStorage
      const storedConfig = localStorage.getItem(`demo_${demo}_config`);
      if (storedConfig) {
        setDemoConfig(JSON.parse(storedConfig));
      }
    }
    
    // Parse privacy settings
    setPrivacySettings({
      allowOptOut: params.get('optOut') === 'true',
      showPrivacyNotice: params.get('privacyNotice') === 'true',
      requireConsent: params.get('requireConsent') === 'true',
      consentGiven: params.get('consentGiven') === 'true',
      retentionDays: parseInt(params.get('retentionDays') || '30'),
    });

    // Check for force close parameter
    if (params.get('forceClose') === 'true') {
      setForceClose(true);
    } else if (params.get('open') === 'true') {
      setInitialOpen(true);
    }
    
    // Hide hints on production domains
    const hostname = window.location.hostname;
    if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') && !hostname.includes('vercel')) {
      setShowHints(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {showHints && (
        <div className="flex items-center justify-center min-h-screen bg-black p-3 sm:p-4 md:p-6 overflow-y-auto">
          <div className="max-w-4xl w-full my-auto">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2">
                Chat Widget Demo
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-400">
                Thompson's E Parts - RAG & WooCommerce Test
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 md:p-6">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">
                  Product Queries (RAG)
                </h2>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "What products do you sell?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Tell me about V Ring Seal Pack4"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Show me Palfinger Epsilon crane parts"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Do you have Kinshofer bucket spares?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "What Edbro tipper parts are available?"
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 md:p-6">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">Order Management</h2>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Check order #12345"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Where is my delivery?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "I need to change my address"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Can I cancel my order?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Show my recent orders"
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 md:p-6">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">
                  Stock & Availability
                </h2>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Is 2EVRA48 in stock?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Check availability of PK-EK 291"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "What's the stock level for hydraulic cylinders?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Show me available safety valve parts"
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-4 md:p-6">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 md:mb-4">General Information</h2>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "What are your contact details?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Where are you located?"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "Tell me about Thompson's E Parts"
                  </p>
                  <p className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors py-1 sm:py-0">
                    → "How can I become a supplier?"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 md:mt-8 bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">Ready to Test?</h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    The chat widget is in the bottom-right corner. Click to start chatting!
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-gray-500 mb-1">Current Mode</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-200">Thompson's E Parts Demo</p>
                  <div className="flex gap-2 mt-2">
                    <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">RAG ✓</span>
                    <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">WooCommerce ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ChatWidget
        demoId={demoId}
        demoConfig={demoConfig}
        initialOpen={initialOpen}
        forceClose={forceClose}
        privacySettings={privacySettings}
      />
    </div>
  );
}
