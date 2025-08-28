'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ChatWidget component to avoid SSR issues
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { 
  ssr: false,
  loading: () => null 
});

export default function TestWidgetPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const testConfig = {
    brandName: 'Test Company',
    brandColor: '#4F46E5',
    headerTitle: 'Test Support',
    welcomeMessage: 'Welcome to our test chat!',
    url: 'https://example.com'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Chat Widget Test Page</h1>
        <p className="text-gray-600 mb-8">
          This page demonstrates the chat widget. It should appear in the bottom-right corner.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Widget Features:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Fixed position in bottom-right corner</li>
            <li>Responsive width on mobile devices</li>
            <li>Maximum height constraint to fit viewport</li>
            <li>Smooth animations when opening/closing</li>
            <li>Direct rendering (no iframe)</li>
          </ul>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Look for the chat bubble in the bottom-right corner</li>
            <li>Click it to open the chat widget</li>
            <li>The widget should be fully visible without scrolling</li>
            <li>Try resizing your browser window to test responsiveness</li>
          </ol>
        </div>
      </div>

      {/* Render the chat widget */}
      {mounted && (
        <ChatWidget 
          demoId="test"
          demoConfig={testConfig}
          initialOpen={false}
        />
      )}
    </div>
  );
}