'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function TestWidgetPage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isRTL, setIsRTL] = useState(false);

  // CRITICAL: Load scripts on mount AND when language changes
  // This useEffect runs on initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Guard: Check if iframe already exists (widget already initialized)
    const existingIframe = document.getElementById('chat-widget-iframe');
    if (existingIframe) {
      console.log('[Test Page] Widget already initialized, skipping script load');
      return;
    }

    // Remove any old script tags from previous load
    const oldScripts = document.querySelectorAll('script[src*="widget-bundle.js"], script[src*="embed.js"]');
    oldScripts.forEach(s => s.remove());

    // Step 1: Load language preference from localStorage (on mount)
    const storedLang = localStorage.getItem('omniops_ui_language') || 'en';
    if (currentLanguage !== storedLang) {
      setCurrentLanguage(storedLang);
    }

    // Apply RTL for Arabic
    const rtl = storedLang === 'ar';
    setIsRTL(rtl);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', storedLang);

    console.log('[Test Page] Setting ChatWidgetConfig with language:', storedLang);

    // Step 2: Set ChatWidgetConfig FIRST
    (window as any).ChatWidgetConfig = {
      serverUrl: window.location.origin,
      domain: 'www.thompsonseparts.co.uk',
      skipRemoteConfig: true, // Skip API lookup for E2E tests
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
        defaultLanguage: storedLang,
        supportedLanguages: ['en', 'es', 'ar'],
      },
      debug: true,
    };

    // Enable debug mode globally
    (window as any).ChatWidgetDebug = true;

    console.log('[Test Page] ChatWidgetConfig set, now loading scripts...');

    // Step 3: THEN load widget-bundle.js
    const widgetScript = document.createElement('script');
    widgetScript.src = '/widget-bundle.js';
    widgetScript.async = false;
    document.head.appendChild(widgetScript);

    // Step 4: THEN load embed.js (after widget bundle loads)
    widgetScript.onload = () => {
      console.log('[Test Page] widget-bundle.js loaded, now loading embed.js...');
      const embedScript = document.createElement('script');
      embedScript.src = '/embed.js';
      embedScript.defer = true;
      document.head.appendChild(embedScript);

      embedScript.onload = () => {
        console.log('[Test Page] embed.js loaded and should initialize now');
      };
    };
  }, []); // Run once on mount (language changes trigger page reload anyway)

  const handleLanguageChange = (lang: string) => {
    localStorage.setItem('omniops_ui_language', lang);
    setCurrentLanguage(lang);

    // Apply RTL for Arabic
    const rtl = lang === 'ar';
    setIsRTL(rtl);
    document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    // Reload to apply language changes
    window.location.reload();
  };

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      en: 'English',
      es: 'Español',
      ar: 'العربية',
    };
    return names[code] || code;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Chat Widget Test Environment
            </h1>
            <p className="text-gray-600">
              Multi-language support with English, Spanish, and Arabic
            </p>
          </div>

          {/* Language Selector */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Language Settings
            </h2>
            <div className="flex gap-3 mb-4">
              {['en', 'es', 'ar'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentLanguage === lang
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {getLanguageName(lang)}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Current language: <span className="font-semibold">{getLanguageName(currentLanguage)}</span>
            </p>
            {isRTL && (
              <p className="mt-2 text-sm text-gray-600">
                RTL (Right-to-Left) mode is active
              </p>
            )}
          </div>

          {/* Widget Features */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Widget Features:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Loaded via iframe for isolation (ID: chat-widget-iframe)</li>
              <li>Fixed position in bottom-right corner</li>
              <li>Multi-language support (English, Spanish, Arabic)</li>
              <li>RTL support for Arabic</li>
              <li>Session tracking enabled</li>
              <li>Programmatic API available via window.ChatWidget</li>
            </ul>
          </div>

          {/* Example Queries */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Example Queries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">English</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>→ "What products do you have?"</li>
                  <li>→ "Show me your catalog"</li>
                  <li>→ "Check order status"</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Español</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>→ "¿Qué productos tienes?"</li>
                  <li>→ "Muéstrame tu catálogo"</li>
                  <li>→ "Verificar estado del pedido"</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">العربية</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>→ "ما هي المنتجات المتوفرة؟"</li>
                  <li>→ "أرني الكتالوج"</li>
                  <li>→ "تحقق من حالة الطلب"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Test Instructions */}
          <div className="bg-blue-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Instructions:</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Select a language above to change the widget UI language</li>
              <li>Click the chat widget icon in the bottom-right corner</li>
              <li>Verify that UI elements (placeholder, buttons) are in the selected language</li>
              <li>For Arabic, verify that text alignment is right-to-left</li>
              <li>Send a message in the selected language and verify AI responds appropriately</li>
            </ol>
          </div>

          {/* Technical Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Technical Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-semibold mb-1">Widget Iframe ID:</p>
                <code className="bg-gray-100 px-2 py-1 rounded">chat-widget-iframe</code>
              </div>
              <div>
                <p className="font-semibold mb-1">Language Storage:</p>
                <code className="bg-gray-100 px-2 py-1 rounded">localStorage.omniops_ui_language</code>
              </div>
              <div>
                <p className="font-semibold mb-1">Supported Languages:</p>
                <code className="bg-gray-100 px-2 py-1 rounded">en, es, ar</code>
              </div>
              <div>
                <p className="font-semibold mb-1">RTL Support:</p>
                <code className="bg-gray-100 px-2 py-1 rounded">document.dir = "rtl" (for Arabic)</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}