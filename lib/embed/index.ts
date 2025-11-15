/**
 * Widget Embed - Main Initialization
 */

import { createConfig, applyRemoteConfig } from './config';
import { getPrivacyPreferences } from './privacy';
import {
  createIframe,
  buildIframeHtml,
  registerMessageHandlers,
  registerApi,
} from './dom';
import { WIDGET_VERSION, CLEANUP_KEY } from './embed-types';
import { logDebug, logError, isMobileViewport, resolveDomain, scheduleConversationCleanup } from './utils';
import { loadRemoteConfig, loadWidgetBundle, loadConfigByAppId } from './config-loader';
import { getStorageCookie } from './storage-helpers';

function getPersistedState(key: string): string | null {
  const storageKey = `chat_widget_${key}`;

  try {
    const value = localStorage.getItem(storageKey);
    if (value) {
      return value;
    }
  } catch (error) {
    console.warn('[Chat Widget] Failed to read localStorage during init:', error);
  }

  const cookieValue = getStorageCookie(key);
  if (cookieValue) {
    try {
      localStorage.setItem(storageKey, cookieValue);
    } catch (error) {
      console.warn('[Chat Widget] Failed to hydrate localStorage from cookie:', error);
    }
    return cookieValue;
  }

  return null;
}

async function initialize() {
  console.log('[Chat Widget] Initialize function called');

  // Prevent concurrent initialization attempts using DOM-based lock
  const existingInitFlag = document.querySelector('[data-widget-init-lock="true"]');
  if (existingInitFlag) {
    logDebug('Widget initialization already in progress (DOM lock detected), skipping');
    return;
  }

  // Also check JavaScript flag as fallback
  if ((window as any)._widgetInitializing) {
    logDebug('Widget initialization already in progress (JS flag), skipping');
    return;
  }

  try {
    const userConfig = window.ChatWidgetConfig || {};
    console.log('[Chat Widget] User config:', userConfig);
    let config = createConfig(userConfig);
    console.log('[Chat Widget] Created config:', config);

    if (!config.serverUrl) {
      console.error('[Chat Widget] serverUrl not configured. Please ensure window.ChatWidgetConfig includes a serverUrl.');
      return;
    }
    console.log('[Chat Widget] serverUrl configured:', config.serverUrl);

    // Check if widget exists - allow re-initialization only if config changed
    const existingIframe = document.getElementById('chat-widget-iframe');
    if (existingIframe) {
      // Check if page was reloaded (data-ready cleared by beforeunload at line 204)
      const pageReloaded = !existingIframe.hasAttribute('data-ready');
      const storedLanguage = localStorage.getItem('omniops_ui_language');
      const currentConfigStr = JSON.stringify({
        domain: config.domain,
        serverUrl: config.serverUrl,
        language: storedLanguage,
      });
      const lastConfigStr = (window as any)._lastWidgetConfig;

      // ALWAYS reinitialize if page was reloaded OR config changed
      if (pageReloaded || currentConfigStr !== lastConfigStr) {
        console.log('[Widget] Reinitializing - page reload or config change detected');
        existingIframe.remove();
        delete (window as any)._lastWidgetConfig;
        delete (window as any)._widgetInitializing;
        // Continue with initialization below
      } else {
        logDebug('Widget already loaded with identical config, skipping initialization');
        return;
      }
    }

    // Mark initialization as in progress using both DOM and JS flags
    const initLock = document.createElement('meta');
    initLock.setAttribute('data-widget-init-lock', 'true');
    initLock.setAttribute('id', 'widget-init-lock');
    document.head.appendChild(initLock);
    (window as any)._widgetInitializing = true;

    // Get stored language preference (used for config comparison and auto-detection)
    let storedLanguage = localStorage.getItem('omniops_ui_language');

    // Auto-detect language from browser if user hasn't explicitly set a preference
    if (!storedLanguage) {
      const browserLocale = navigator.language || navigator.languages?.[0] || 'en';
      const detectedLanguage = browserLocale.substring(0, 2).toLowerCase();
      console.log(`[Chat Widget] Detected browser locale: ${browserLocale}, using language: ${detectedLanguage}`);
      localStorage.setItem('omniops_ui_language', detectedLanguage);
      storedLanguage = detectedLanguage; // Update variable after setting
    }

    // Store config signature for future comparison
    (window as any)._lastWidgetConfig = JSON.stringify({
      domain: config.domain,
      serverUrl: config.serverUrl,
      language: storedLanguage,
    });

    const privacyPrefs = getPrivacyPreferences();
    if (privacyPrefs.optedOut && config.privacy.allowOptOut) {
      logDebug('User has opted out of the widget');
      return;
    }

    const resolvedDomain = resolveDomain(config, userConfig);
    if (resolvedDomain && !config.storeDomain) {
      config.storeDomain = resolvedDomain;
    }

    const scriptTag = document.currentScript || document.querySelector('script[src*="embed.js"]');
    const demoId = scriptTag?.getAttribute('data-demo');

    // Load remote config by app_id (preferred) or domain (fallback)
    if (!userConfig.skipRemoteConfig) {
      const appId = (userConfig as any).appId || scriptTag?.getAttribute('data-app-id');

      if (appId) {
        // Use app_id lookup (new method)
        logDebug('[Initialize] Loading config by app_id:', appId);
        const loadedConfig = await loadConfigByAppId(config, appId);
        if (loadedConfig) {
          config = applyRemoteConfig(config, loadedConfig, userConfig);
        }
      } else if (resolvedDomain) {
        // Fallback to domain-based lookup (legacy method)
        config = await loadRemoteConfig(config, resolvedDomain, userConfig);
      } else {
        logDebug('Skipping remote config fetch; neither app_id nor domain available');
      }
    }

    const effectiveDomain = config.storeDomain || resolvedDomain || '';
    if (!config.storeDomain && effectiveDomain) {
      config.storeDomain = effectiveDomain;
    }

    const { code: bundleCode, origin: resolvedOrigin } = await loadWidgetBundle(config, WIDGET_VERSION);
    // IMPORTANT: Keep the configured serverUrl (either default or user-set)
    // The bundle origin is only used for loading the bundle file, NOT for API calls
    // API calls should always go to config.serverUrl (defaults to https://omniops.co.uk)
    logDebug('[Initialize] Bundle loaded from:', resolvedOrigin);
    logDebug('[Initialize] API calls will go to:', config.serverUrl);

    logDebug('[Initialize] Bundle code length:', bundleCode?.length || 0);
    logDebug('[Initialize] Creating iframe with bundle...');

    const iframe = createIframe(config, isMobileViewport());
    const iframeHtml = buildIframeHtml(config, privacyPrefs, bundleCode, effectiveDomain, demoId || null);

    logDebug('[Initialize] Generated iframe HTML length:', iframeHtml?.length || 0);
    logDebug('[Initialize] Bundle in HTML?', iframeHtml?.includes('OmniopsWidget') ? 'YES' : 'NO');

    iframe.srcdoc = iframeHtml;

    // Mark iframe with current locale for context change detection
    const currentLocale = navigator.language || navigator.languages?.[0] || 'en';
    iframe.setAttribute('data-locale', currentLocale);

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.style.display = 'block';
      setTimeout(() => {
        // Retrieve stored conversation data from parent localStorage
        const storedSessionId = getPersistedState('session_id');
        const storedConversationId = getPersistedState('conversation_id');
        const storedWidgetOpen = getPersistedState('widget_open');

        if (config.debug || (window as any).ChatWidgetDebug) {
          console.log('[Chat Widget] Initializing with stored data:', {
            session_id: storedSessionId,
            conversation_id: storedConversationId,
            widget_open: storedWidgetOpen
          });
        }

        // SECURITY: Use exact origin instead of wildcard
        iframe.contentWindow?.postMessage(
          {
            type: 'init',
            config,
            privacyPrefs,
            storedData: {
              sessionId: storedSessionId,
              conversationId: storedConversationId,
              widgetOpen: storedWidgetOpen === 'true'
            }
          },
          config.serverUrl || window.location.origin
        );

        // Mark iframe as ready after initialization message sent
        // This provides a reliable signal for E2E tests
        iframe.setAttribute('data-ready', 'true');

        // Emit ready event for any listeners
        window.dispatchEvent(new CustomEvent('widget-ready', {
          detail: { language: storedLanguage || 'en' }
        }));

        if (config.debug || (window as any).ChatWidgetDebug) {
          console.log('[Chat Widget] Initialization complete, widget ready for interaction');
        }

        // Mark initialization as complete - remove both DOM and JS locks
        document.getElementById('widget-init-lock')?.remove();
        (window as any)._widgetInitializing = false;
      }, 100);
    };

    registerMessageHandlers({ iframe, privacyPrefs, config });
    registerApi(config, iframe, privacyPrefs, WIDGET_VERSION);
    scheduleConversationCleanup(config, iframe, CLEANUP_KEY);

    // Listen for page reload - clear ready flag so widget reinitializes
    window.addEventListener('beforeunload', () => {
      const iframeEl = document.getElementById('chat-widget-iframe');
      if (iframeEl) {
        iframeEl.removeAttribute('data-ready');
      }
      delete (window as any)._lastWidgetConfig;
      delete (window as any)._widgetInitializing;
      document.getElementById('widget-init-lock')?.remove();
    });
  } catch (error) {
    logError('Failed to initialize chat widget', error);
    document.getElementById('widget-init-lock')?.remove(); // Remove DOM lock
    (window as any)._widgetInitializing = false; // Reset on error
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
