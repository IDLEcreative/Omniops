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

const WIDGET_VERSION = '2.1.0';
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

  // Try 2: Explicitly provided storeDomain in config
  if (userConfig.storeDomain) {
    logDebug('Domain resolved from userConfig.storeDomain', userConfig.storeDomain);
    return userConfig.storeDomain;
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
    configDomain: config.storeDomain,
    userConfigDomain: userConfig.storeDomain,
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
  if (!bundleCandidates.length) {
    throw new Error('No server URL candidates were provided');
  }

  const result = await fetchFromCandidates<string>(bundleCandidates, '/widget-bundle.js', {
    timeoutMs: 8000,
    retryDelaysMs: [0, 500, 1500],
    parser: response => response.text(),
  });

  logDebug('Loaded widget bundle from', result.origin);
  return result;
}

function scheduleConversationCleanup(config: WidgetConfig, iframe: HTMLIFrameElement) {
  if (!config.privacy.retentionDays) return;

  const lastCleanupRaw = localStorage.getItem(CLEANUP_KEY);
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  const lastCleanup = lastCleanupRaw ? Number(lastCleanupRaw) : 0;

  if (!lastCleanup || now - lastCleanup > dayInMs) {
    iframe.contentWindow?.postMessage({ type: 'cleanup', retentionDays: config.privacy.retentionDays }, '*');
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

    const demoId = (document.currentScript || document.querySelector('script[src*="embed.js"]'))?.getAttribute('data-demo');

    if (!userConfig.skipRemoteConfig) {
      if (resolvedDomain) {
        config = await loadRemoteConfig(config, resolvedDomain, userConfig);
      } else {
        logDebug('Skipping remote config fetch; domain could not be determined');
      }
    }

    const effectiveDomain = config.storeDomain || resolvedDomain || '';
    if (!config.storeDomain && effectiveDomain) {
      config.storeDomain = effectiveDomain;
    }

    const { code: bundleCode, origin: resolvedOrigin } = await loadWidgetBundle(config);
    config.serverUrl = resolvedOrigin;

    const iframe = createIframe(config, isMobileViewport());
    const iframeHtml = buildIframeHtml(config, privacyPrefs, bundleCode, effectiveDomain, demoId || null);
    iframe.srcdoc = iframeHtml;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.style.display = 'block';
      setTimeout(() => {
        iframe.contentWindow?.postMessage(
          {
            type: 'init',
            config,
            privacyPrefs,
          },
          '*'
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
