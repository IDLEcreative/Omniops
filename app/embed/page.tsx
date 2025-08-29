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
    <>
      {showHints && (
        <div className="flex items-center justify-center min-h-screen bg-black p-4">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                Chat Widget Demo
              </h1>
              <p className="text-gray-400">
                Thompson's E Parts - RAG & WooCommerce Test
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Product Queries (RAG)</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "What products do you sell?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Do you have hydraulic pumps?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Tell me about Palfinger crane parts"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "What safety equipment is available?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Show me tipper hinge bars"
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Order Management</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Check order #12345"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Where is my delivery?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "I need to change my address"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Can I cancel my order?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Show my recent orders"
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Stock & Availability</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Is hydraulic tank HT-500 in stock?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Check availability of crane pads"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "What's in stock for Edbro rams?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Show me available safety equipment"
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">General Information</h2>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "What are your contact details?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Where are you located?"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "Tell me about Thompson's E Parts"
                  </p>
                  <p className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer transition-colors">
                    → "How can I become a supplier?"
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Ready to Test?</h3>
                  <p className="text-sm text-gray-400">
                    The chat widget is in the bottom-right corner. Click to start chatting!
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Current Mode</p>
                  <p className="text-sm font-semibold text-gray-200">Thompson's E Parts Demo</p>
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
    </>
  );
}