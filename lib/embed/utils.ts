/**
 * Widget Embed - Utility Functions
 */

import type { WidgetConfig } from './embed-types';

export function logDebug(message: string, payload?: unknown) {
  if (window.ChatWidgetDebug) {
    console.debug('[Chat Widget]', message, payload || '');
  }
}

export function logError(message: string, error?: unknown) {
  if (window.ChatWidgetDebug) {
    console.error('[Chat Widget]', message, error || '');
  }
}

export function isMobileViewport(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

export function resolveDomain(config: WidgetConfig, userConfig: Partial<WidgetConfig>): string | null {
  // Try 1: window.location.hostname (best source)
  const fromLocation = window.location.hostname;
  if (fromLocation && fromLocation !== '' && fromLocation !== 'localhost') {
    logDebug('Domain resolved from window.location.hostname', fromLocation);
    return fromLocation;
  }

  // Try 2: Explicitly provided domain in userConfig (supports both 'domain' and 'storeDomain')
  if (userConfig.domain) {
    logDebug('Domain resolved from userConfig.domain', userConfig.domain);
    return userConfig.domain;
  }

  if (userConfig.storeDomain) {
    logDebug('Domain resolved from userConfig.storeDomain', userConfig.storeDomain);
    return userConfig.storeDomain;
  }

  if (config.domain) {
    logDebug('Domain resolved from config.domain', config.domain);
    return config.domain;
  }

  if (config.storeDomain) {
    logDebug('Domain resolved from config.storeDomain', config.storeDomain);
    return config.storeDomain;
  }

  // Try 3: document.referrer (fallback for iframes)
  try {
    if (document.referrer) {
      const refHost = new URL(document.referrer).hostname;
      if (refHost && refHost !== '' && refHost !== 'localhost') {
        logDebug('Domain resolved from document.referrer', refHost);
        return refHost;
      }
    }
  } catch (error) {
    logError('Unable to parse referrer for domain resolution', error);
  }

  // Try 4: Check if we're in an iframe and get parent hostname
  try {
    if (window.parent && window.parent !== window) {
      const parentHost = window.parent.location.hostname;
      if (parentHost && parentHost !== '' && parentHost !== 'localhost') {
        logDebug('Domain resolved from parent window', parentHost);
        return parentHost;
      }
    }
  } catch (error) {
    // Cross-origin iframe, can't access parent location
    logDebug('Unable to access parent window (likely cross-origin)', error);
  }

  logError('Unable to resolve domain from any source', {
    location: window.location.hostname,
    referrer: document.referrer,
    configDomain: config.domain || config.storeDomain,
    userConfigDomain: userConfig.domain || userConfig.storeDomain,
  });

  return null;
}

export function scheduleConversationCleanup(config: WidgetConfig, iframe: HTMLIFrameElement, cleanupKey: string) {
  if (!config.privacy.retentionDays) return;

  const lastCleanupRaw = localStorage.getItem(cleanupKey);
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const lastCleanup = lastCleanupRaw ? Number(lastCleanupRaw) : 0;

  if (!lastCleanup || now - lastCleanup > dayInMs) {
    // SECURITY: Use exact origin instead of wildcard
    iframe.contentWindow?.postMessage(
      { type: 'cleanup', retentionDays: config.privacy.retentionDays },
      config.serverUrl || window.location.origin
    );
    localStorage.setItem(cleanupKey, String(now));
  }
}
