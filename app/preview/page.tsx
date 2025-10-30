'use client';

import { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function PreviewPage() {
  const [widgetOpen, setWidgetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mock Website Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">Your Website</h1>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Home
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Products
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                About
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Live Preview Banner */}
      <div className="bg-blue-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm font-medium">Live Preview Mode</span>
            </div>
            <span className="text-xs bg-blue-700 px-3 py-1 rounded-full">
              Real-time widget demo
            </span>
          </div>
        </div>
      </div>

      {/* Mock Website Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Demo Store
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            This is a preview of how the chat widget appears on your website.
            Notice the chat button in the bottom-right corner.
          </p>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </button>
            <button className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow p-6">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Feature {i}
              </h3>
              <p className="text-gray-600">
                This is a sample feature card to demonstrate your website content.
              </p>
            </div>
          ))}
        </div>

        {/* Instructions Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Try the Chat Widget
              </h3>
              <p className="text-gray-700 mb-4">
                Click the chat button in the bottom-right corner to start a conversation.
                The widget is fully functional and responds to your questions!
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Ask about products and services</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Check order status and tracking</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Get instant customer support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Additional Content to Show Scrolling */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Sample Content Section
            </h3>
            <p className="text-gray-600 mb-4">
              This preview demonstrates how the chat widget integrates seamlessly with your
              existing website content. The widget stays fixed in the bottom-right corner
              as users scroll through your pages.
            </p>
            <p className="text-gray-600">
              Try scrolling down to see how the widget maintains its position, ensuring
              it's always accessible to your visitors.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Responsive Design
            </h3>
            <p className="text-gray-600 mb-4">
              The widget automatically adapts to different screen sizes. On mobile devices,
              it expands to full screen for a better user experience. On desktop, it appears
              as an elegant overlay in the corner.
            </p>
            <p className="text-gray-600">
              This ensures your customers have the best experience regardless of their device.
            </p>
          </div>
        </div>

        {/* Footer Spacer */}
        <div className="h-96"></div>
      </main>

      {/* Embed the actual chat widget */}
      <ChatWidget
        initialOpen={false}
        privacySettings={{
          allowOptOut: true,
          showPrivacyNotice: false,
          requireConsent: false,
          consentGiven: true,
          retentionDays: 30,
        }}
      />
    </div>
  );
}
