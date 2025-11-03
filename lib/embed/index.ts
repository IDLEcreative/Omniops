import { createConfig, applyRemoteConfig } from './config';
import { createServerUrlCandidates } from './url';
import { fetchFromCandidates } from './network';
import { getPrivacyPreferences } from './privacy';
import {
  createIframe,
  buildIframeHtml,
  registerMessageHandlers,
  registerApi,
} from './dom';
import {
  WidgetConfig,
  RemoteWidgetConfig,
  PrivacyPreferences,
} from './types';

declare global {
  interface Window {
    ChatWidgetConfig?: Partial<WidgetConfig>;
    ChatWidgetDebug?: boolean;
    ChatWidget?: {
      open(): void;
      close(): void;
      sendMessage(message: string): void;
      updateContext(context: any): void;
      privacy: {
        optOut(): void;
        optIn(): void;
        clearData(): void;
        getStatus(): PrivacyPreferences;
      };
      version: string;
    };
    gtag?: (...args: any[]) => void;
  }
}

// Version is auto-generated at build time to force cache invalidation
// @ts-ignore - This will be replaced at build time
const WIDGET_VERSION = __WIDGET_VERSION__;
const CLEANUP_KEY = 'chat_widget_last_cleanup';

function logDebug(message: string, payload?: unknown) {
  if (window.ChatWidgetDebug) {
    console.debug('[Chat Widget]', message, payload || '');
  }
}

function logError(message: string, error?: unknown) {
  if (window.ChatWidgetDebug) {
    console.error('[Chat Widget]', message, error || '');
  }
}

function isMobileViewport(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function resolveDomain(config: WidgetConfig, userConfig: Partial<WidgetConfig>): string | null {
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

async function loadRemoteConfig(config: WidgetConfig, currentDomain: string | null, userConfig: Partial<WidgetConfig>) {
  const candidates = createServerUrlCandidates(config.serverUrl);
  if (!candidates.length) {
    logDebug('No server URL candidates available for remote config');
    return config;
  }
  if (!currentDomain) {
    logDebug('No domain resolved - skipping remote config fetch (will use defaults)');
    return config;
  }

  try {
    const query = new URLSearchParams({ domain: currentDomain });
    const { data, origin } = await fetchFromCandidates<{ success: boolean; config?: RemoteWidgetConfig | null }>(
      candidates,
      `/api/widget/config?${query.toString()}`,
      {
        timeoutMs: 8000,
        retryDelaysMs: [0, 500],
        parser: response => response.json(),
      }
    );

    if (data?.success && data.config) {
      const updated = applyRemoteConfig(config, data.config, userConfig);
      updated.serverUrl = origin;
      logDebug('Loaded remote widget config', data.config);
      return updated;
    }
  } catch (error) {
    logError('Remote config fetch failed', error);
  }

  return config;
}

async function loadWidgetBundle(config: WidgetConfig): Promise<{ code: string; origin: string }> {
  const bundleCandidates = createServerUrlCandidates(config.serverUrl);
  logDebug('[Bundle Load] Candidates:', bundleCandidates);

  if (!bundleCandidates.length) {
    throw new Error('No server URL candidates were provided');
  }

  const result = await fetchFromCandidates<string>(bundleCandidates, `/widget-bundle.js?v=${WIDGET_VERSION}`, {
    timeoutMs: 8000,
    retryDelaysMs: [0, 500, 1500],
    parser: response => response.text(),
  });

  logDebug('[Bundle Load] Fetched from:', result.origin);
  logDebug('[Bundle Load] Code length:', result.data?.length || 0);
  logDebug('[Bundle Load] Code preview:', result.data?.substring(0, 100) || 'EMPTY');

  return { code: result.data, origin: result.origin };
}

function scheduleConversationCleanup(config: WidgetConfig, iframe: HTMLIFrameElement) {
  if (!config.privacy.retentionDays) return;

  const lastCleanupRaw = localStorage.getItem(CLEANUP_KEY);
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const lastCleanup = lastCleanupRaw ? Number(lastCleanupRaw) : 0;

  if (!lastCleanup || now - lastCleanup > dayInMs) {
    // SECURITY: Use exact origin instead of wildcard
    iframe.contentWindow?.postMessage(
      { type: 'cleanup', retentionDays: config.privacy.retentionDays },
      config.serverUrl || window.location.origin
    );
    localStorage.setItem(CLEANUP_KEY, String(now));
  }
}

async function initialize() {
  try {
    const userConfig = window.ChatWidgetConfig || {};
    let config = createConfig(userConfig);

    if (!config.serverUrl) {
      console.error('[Chat Widget] serverUrl not configured. Please ensure window.ChatWidgetConfig includes a serverUrl.');
      return;
    }

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
        try {
          const candidates = createServerUrlCandidates(config.serverUrl);
          const { data } = await fetchFromCandidates<{ success: boolean; config?: any }>(
            candidates,
            `/api/widget/config?id=${encodeURIComponent(appId)}`,
            {
              timeoutMs: 8000,
              retryDelaysMs: [0, 500],
              parser: response => response.json(),
            }
          );

          if (data?.success && data.config) {
            config = applyRemoteConfig(config, data.config, userConfig);
            logDebug('[Initialize] Config loaded successfully by app_id');
          }
        } catch (error) {
          logError('[Initialize] Failed to load config by app_id', error);
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

    const { code: bundleCode, origin: resolvedOrigin } = await loadWidgetBundle(config);
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
        // SECURITY: Use exact origin instead of wildcard
        iframe.contentWindow?.postMessage(
          {
            type: 'init',
            config,
            privacyPrefs,
          },
          config.serverUrl || window.location.origin
        );
      }, 100);
    };

    registerMessageHandlers({ iframe, privacyPrefs, config });
    registerApi(config, iframe, privacyPrefs, WIDGET_VERSION);
    scheduleConversationCleanup(config, iframe);
  } catch (error) {
    logError('Failed to initialize chat widget', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}
