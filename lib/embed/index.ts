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

async function initialize() {
  console.log('[Chat Widget] Initialize function called');
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

    if (document.getElementById('chat-widget-iframe')) {
      logError('Widget already loaded');
      return;
    }

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

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.style.display = 'block';
      setTimeout(() => {
        // Retrieve stored conversation data from parent localStorage
        const storedSessionId = localStorage.getItem('chat_widget_session_id');
        const storedConversationId = localStorage.getItem('chat_widget_conversation_id');
        const storedWidgetOpen = localStorage.getItem('chat_widget_widget_open');

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
      }, 100);
    };

    registerMessageHandlers({ iframe, privacyPrefs, config });
    registerApi(config, iframe, privacyPrefs, WIDGET_VERSION);
    scheduleConversationCleanup(config, iframe, CLEANUP_KEY);
  } catch (error) {
    logError('Failed to initialize chat widget', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
