'use client';

import { useEffect } from 'react';

export default function WidgetTestPage() {
  useEffect(() => {
    // Load the embed script
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.async = true;
    document.body.appendChild(script);

    // Configure the widget
    (window as any).ChatWidgetConfig = {
      appearance: {
        position: 'bottom-right',
      },
      behavior: {
        showOnLoad: false,
      }
    };

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Remove the widget iframe if it exists
      const iframe = document.getElementById('chat-widget-iframe');
      if (iframe) {
        iframe.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">Chat Widget Test</h1>
          <p className="text-gray-600 mb-6">
            The chat widget should appear in the bottom-right corner. Click it to test the RAG system.
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="font-semibold text-blue-700">Test Information:</p>
            <ul className="mt-2 text-sm text-blue-600">
              <li>• Domain: localhost (mapped to configured test domain)</li>
              <li>• RAG Status: Enabled with customer content</li>
              <li>• Expected: Product information from scraped website</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Try these test questions:</h2>
            <div className="grid gap-2">
              {[
                "What products do you sell?",
                "Do you have items available?",
                "Tell me about featured products",
                "What items are in stock?",
                "How can I contact you?"
              ].map((question, i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(question)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-700">{question}</span>
                  <span className="text-xs text-gray-500 ml-2">(click to copy)</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}