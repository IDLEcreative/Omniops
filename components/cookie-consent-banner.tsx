'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

type ConsentLevel = 'all' | 'essential' | null;

/**
 * GDPR-compliant cookie consent banner
 *
 * Features:
 * - Shows on first visit only
 * - Three options: Accept All, Reject All, Customize
 * - Stores preference in cookie + localStorage
 * - Blocks analytics until consent given
 * - Links to Cookie Policy
 * - Dismissible with preference saved
 * - Google Analytics (gtag) integration
 */
export function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Check if consent already given
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShow(true);
    } else {
      // Apply existing consent
      applyConsent(consent as ConsentLevel);
    }
  }, []);

  const applyConsent = (level: ConsentLevel) => {
    if (typeof window !== 'undefined' && window.gtag) {
      if (level === 'all') {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
          ad_storage: 'granted',
        });
      } else {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
        });
      }
    }
  };

  const saveConsent = (level: ConsentLevel) => {
    if (!level) return;

    // Save to localStorage
    localStorage.setItem('cookie_consent', level);
    localStorage.setItem('cookie_consent_date', new Date().toISOString());

    // Save to cookie (1 year expiry)
    const maxAge = 365 * 24 * 60 * 60; // 1 year in seconds
    document.cookie = `cookie_consent=${level}; max-age=${maxAge}; path=/; SameSite=Lax`;

    // Apply consent
    applyConsent(level);
  };

  const handleAcceptAll = () => {
    saveConsent('all');
    setShow(false);
  };

  const handleRejectAll = () => {
    saveConsent('essential');
    setShow(false);
  };

  const handleCustomize = () => {
    setShowCustomize(!showCustomize);
  };

  const handleSaveCustom = () => {
    const level = analyticsEnabled ? 'all' : 'essential';
    saveConsent(level);
    setShow(false);
  };

  const handleClose = () => {
    // Closing without choice defaults to essential only
    saveConsent('essential');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
      <div className="max-w-7xl mx-auto p-4">
        <Card className="border-0 shadow-none">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Cookie Consent</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We use cookies to enhance your experience, analyze site usage, and provide
                  personalized content. By clicking "Accept All", you consent to our use of
                  cookies.{' '}
                  <Link
                    href="/legal/cookies"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    target="_blank"
                  >
                    Learn more
                  </Link>
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close and use essential cookies only"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customize Options */}
            {showCustomize && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="essential-cookies"
                      checked
                      disabled
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="essential-cookies" className="font-medium text-sm">
                        Essential Cookies (Required)
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Required for the website to function. These cannot be disabled.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="analytics-cookies"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="analytics-cookies" className="font-medium text-sm">
                        Analytics Cookies
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Help us understand how you use our site to improve your experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-none"
              >
                Accept All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="flex-1 sm:flex-none"
              >
                Reject All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={showCustomize ? handleSaveCustom : handleCustomize}
                className="flex-1 sm:flex-none"
              >
                {showCustomize ? 'Save Preferences' : 'Customize'}
              </Button>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
              <Link href="/legal/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/legal/cookies" className="hover:underline">
                Cookie Policy
              </Link>
              <Link href="/dashboard/privacy" className="hover:underline">
                Your Privacy Rights
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: Record<string, string>
    ) => void;
  }
}
