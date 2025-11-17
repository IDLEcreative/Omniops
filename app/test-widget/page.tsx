'use client';
/**
 * Test Widget Page
 *
 * Simple page for testing the chat widget in different configurations.
 * Used by E2E tests for translation and other widget functionality.
 */

import { useEffect, useState, useRef } from 'react';
import Script from 'next/script';

// Stable cache buster - only set once on mount
const CACHE_VERSION = Date.now();

export default function TestWidgetPage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');

  useEffect(() => {
    // Detect and apply language preference
    const storedLang = localStorage.getItem('omniops_ui_language');
    const browserLang = navigator.language.substring(0, 2).toLowerCase();
    const language = storedLang || browserLang || 'en';

    setCurrentLanguage(language);

    // Apply RTL for Arabic
    const rtl = language === 'ar';
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);

    // Configure widget
    (window as any).ChatWidgetConfig = {
      serverUrl: process.env.NEXT_PUBLIC_APP_URL || window.location.origin,
      domain: 'www.example-store.com',
      skipRemoteConfig: true,
      appearance: {
        position: 'bottom-right',
        startMinimized: false,
      },
      behavior: {
        autoOpen: false,
        showOnLoad: true,
      },
      i18n: {
        enabled: true,
        defaultLanguage: language,
        supportedLanguages: ['en', 'es', 'ar'],
      },
      debug: true,
    };

    console.log('[Test Page] Widget configured with language:', language);
  }, []);

  const handleLanguageChange = (lang: string) => {
    localStorage.setItem('omniops_ui_language', lang);
    const rtl = lang === 'ar';
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    window.location.reload();
  };

  return (
    <div style={{
      margin: 0,
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '600px',
        width: '100%',
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>
          Chat Widget Test Page
        </h1>
        <p style={{ color: '#666', lineHeight: '1.6' }}>
          This is a test page for the chat widget with multi-language support. The widget should appear in the bottom-right corner.
        </p>

        <div style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
          <button
            onClick={() => handleLanguageChange('en')}
            style={{
              padding: '8px 16px',
              border: '2px solid #667eea',
              background: currentLanguage === 'en' ? '#667eea' : 'white',
              color: currentLanguage === 'en' ? 'white' : '#667eea',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('es')}
            style={{
              padding: '8px 16px',
              border: '2px solid #667eea',
              background: currentLanguage === 'es' ? '#667eea' : 'white',
              color: currentLanguage === 'es' ? 'white' : '#667eea',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            Español
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            style={{
              padding: '8px 16px',
              border: '2px solid #667eea',
              background: currentLanguage === 'ar' ? '#667eea' : 'white',
              color: currentLanguage === 'ar' ? 'white' : '#667eea',
              cursor: 'pointer',
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            العربية
          </button>
        </div>

        <p style={{ color: '#666', lineHeight: '1.6' }}>
          Use the buttons above to switch languages. The widget will reload with the selected language.
        </p>
      </div>

      <Script
        src={`/widget-bundle.js?v=${CACHE_VERSION}`}
        strategy="afterInteractive"
        onLoad={() => console.log('[Test Page] widget-bundle.js loaded')}
      />
      <Script
        src={`/embed.js?v=${CACHE_VERSION}`}
        strategy="afterInteractive"
        onLoad={() => console.log('[Test Page] embed.js loaded')}
      />
    </div>
  );
}
