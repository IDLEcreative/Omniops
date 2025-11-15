import { WidgetConfig, PrivacyPreferences } from './types';
import { savePrivacyPreferences, PRIVACY_KEY, getPrivacyPreferences } from './privacy';
import { setStorageCookie, getStorageCookie, deleteStorageCookie } from './storage-helpers';

export interface IframeContext {
  iframe: HTMLIFrameElement;
  privacyPrefs: PrivacyPreferences;
  config: WidgetConfig;
}

export function createIframe(config: WidgetConfig, isMobile: boolean): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.id = 'chat-widget-iframe';
  iframe.title = 'Customer Support Chat';
  iframe.setAttribute('scrolling', 'no');

  // Check if widget should start minimized (default is true)
  const startMinimized = config.appearance.startMinimized ?? true;

  // Use smaller size if starting minimized (just for the button)
  const initialWidth = startMinimized && !isMobile ? 64 : (config.appearance.width || 400);
  const initialHeight = startMinimized && !isMobile ? 64 : (config.appearance.height || 600);

  const styles = [
    'position: fixed',
    isMobile ? 'bottom: 0' : config.appearance.position?.includes('bottom') ? 'bottom: 20px' : 'top: 20px',
    isMobile ? 'right: 0' : config.appearance.position?.includes('right') ? 'right: 20px' : 'left: 20px',
    isMobile ? 'left: 0' : '',
    'border: none',
    `width: ${isMobile ? '100vw' : initialWidth + 'px'}`,
    `height: ${isMobile ? '100dvh' : initialHeight + 'px'}`,
    `max-width: ${isMobile ? '100vw' : 'calc(100vw - 40px)'}`,
    `max-height: ${isMobile ? '100dvh' : 'calc(100dvh - 40px)'}`,
    'z-index: 9999',
    `border-radius: ${isMobile || startMinimized ? '0' : config.appearance.borderRadius || '12px'}`,
    'box-shadow: none',
    'background: transparent',
    'overflow: hidden',
  ].filter(Boolean);

  iframe.style.cssText = `${styles.join('; ')};`;
  iframe.style.display = 'none';
  // Start with pointer-events auto so the minimized button is clickable
  iframe.style.pointerEvents = 'auto';

  return iframe;
}

export function buildIframeHtml(config: WidgetConfig, privacyPrefs: PrivacyPreferences, bundleCode: string, domain: string, demoId: string | null): string {
  if ((window as any).ChatWidgetDebug || config.debug) {
    console.debug('[buildIframeHtml] Received bundleCode length:', bundleCode?.length || 0);
    console.debug('[buildIframeHtml] BundleCode preview:', bundleCode?.substring(0, 100) || 'EMPTY');
    console.debug('[buildIframeHtml] Domain:', domain);
  }

  const configForIframe = {
    ...config,
    domain,
    demoId,
    privacySettings: {
      allowOptOut: config.privacy.allowOptOut,
      showPrivacyNotice: config.privacy.showPrivacyNotice,
      requireConsent: config.privacy.requireConsent,
      consentGiven: privacyPrefs.consentGiven,
      retentionDays: config.privacy.retentionDays,
    },
  };

  const htmlParts = [
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Chat Widget</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:transparent}#widget-root{width:100%;height:100%;position:fixed;inset:0;overflow:hidden;background:transparent}</style></head><body><div id="widget-root"></div><script>',
    `window.__WIDGET_CONFIG__=${JSON.stringify(configForIframe)};`,
    bundleCode,
    'const initFn=window.OmniopsWidget?.initWidget||window.OmniopsWidgetBundle?.initWidget;if(initFn){initFn("widget-root",window.__WIDGET_CONFIG__);}else{console.error("[Chat Widget] Widget bundle did not expose initWidget function");}<\/script></body></html>',
  ];

  const html = htmlParts.join('');

  if ((window as any).ChatWidgetDebug || config.debug) {
    console.debug('[buildIframeHtml] Final HTML length:', html.length);
    console.debug('[buildIframeHtml] Contains OmniopsWidget?', html.includes('OmniopsWidget'));
  }

  return html;
}

export function registerMessageHandlers(ctx: IframeContext): void {
  const { iframe, privacyPrefs, config } = ctx;

  const privacyActions: Record<string, (data: any) => void> = {
    optOut: () => {
      savePrivacyPreferences({ ...privacyPrefs, optedOut: true });
      iframe.remove();
    },
    optIn: () => {
      savePrivacyPreferences({ ...privacyPrefs, optedOut: false });
    },
    giveConsent: () => savePrivacyPreferences({ ...privacyPrefs, consentGiven: true }),
    requestDataExport: data => {
      if (data?.userId) {
        window.open(`${config.serverUrl}/privacy/export?user=${data.userId}`, '_blank');
      }
    },
    requestDataDeletion: data => {
      if (data?.userId && confirm('Are you sure you want to delete all your chat data? This cannot be undone.')) {
        fetch(`${config.serverUrl}/api/privacy/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.userId }),
        });
      }
    },
  };

  const handlers: Record<string, (data: any) => void> = {
    ping: data => {
      // Respond to heartbeat ping with pong
      if (data?.pingTime) {
        iframe.contentWindow?.postMessage({
          type: 'pong',
          pingTime: data.pingTime,
        }, config.serverUrl || '*');
      }
    },
    resize: data => {
      if (typeof data?.width === 'number') iframe.style.width = `${data.width}px`;
      if (typeof data?.height === 'number') iframe.style.height = `${data.height}px`;
    },
    widgetOpened: () => {
      iframe.style.pointerEvents = 'auto';
    },
    widgetClosed: () => {
      // Keep pointer-events enabled so the button remains clickable when minimized
      iframe.style.pointerEvents = 'auto';
    },
    // Handle conversation persistence in parent window
    saveToParentStorage: data => {
      if (data?.key && data?.value !== undefined) {
        try {
          localStorage.setItem(`chat_widget_${data.key}`, data.value);
          setStorageCookie(data.key, data.value);
          if (config.debug || (window as any).ChatWidgetDebug) {
            console.log('[Chat Widget] Saved to parent localStorage:', data.key, data.value);
          }
        } catch (error) {
          console.error('[Chat Widget] Failed to save to parent localStorage:', error);
        }
      }
    },
    getFromParentStorage: data => {
      if (data?.key && data?.requestId) {
        try {
          let value = localStorage.getItem(`chat_widget_${data.key}`);
          if (!value) {
            value = getStorageCookie(data.key);
          }
          // Send value back to iframe
          iframe.contentWindow?.postMessage({
            type: 'storageResponse',
            requestId: data.requestId,
            key: data.key,
            value: value,
          }, config.serverUrl || '*');

          if (config.debug || (window as any).ChatWidgetDebug) {
            console.log('[Chat Widget] Retrieved from parent localStorage:', data.key, value);
          }
        } catch (error) {
          console.error('[Chat Widget] Failed to read from parent localStorage:', error);
          // Send null value on error
          iframe.contentWindow?.postMessage({
            type: 'storageResponse',
            requestId: data.requestId,
            key: data.key,
            value: null,
          }, config.serverUrl || '*');
        }
      }
    },
    removeFromParentStorage: data => {
      if (data?.key) {
        try {
          localStorage.removeItem(`chat_widget_${data.key}`);
          deleteStorageCookie(data.key);
          if (config.debug || (window as any).ChatWidgetDebug) {
            console.log('[Chat Widget] Removed from parent localStorage:', data.key);
          }
        } catch (error) {
          console.error('[Chat Widget] Failed to remove from parent localStorage:', error);
        }
      }
    },
    analytics: data => {
      if (!privacyPrefs.optedOut && typeof window.gtag === 'function' && data?.event) {
        window.gtag('event', data.event, {
          event_category: 'Chat Widget',
          event_label: data.label,
          value: data.value,
        });
      }
    },
    privacy: data => {
      const action = data?.action;
      if (action && privacyActions[action]) {
        privacyActions[action](data);
      }
    },
    ready: () => {
      if (config.debug || (window as any).ChatWidgetDebug) {
        console.log('[Chat Widget] Widget ready');
      }
    },
    error: data => {
      if (data?.message) {
        console.error('[Chat Widget] Widget error:', data.message);
      }
    },
  };

  window.addEventListener('message', event => {
    // Security: Validate origin to prevent XSS attacks
    // Accept messages from either the parent origin or the widget's serverUrl
    const parentOrigin = window.location.origin;
    const widgetOrigin = config.serverUrl ? new URL(config.serverUrl).origin : parentOrigin;

    const isAllowedOrigin =
      event.origin === parentOrigin ||
      event.origin === widgetOrigin;

    if (!isAllowedOrigin) {
      console.warn('[ChatWidget] Blocked message from untrusted origin:', event.origin);
      return;
    }

    const data = event.data;
    if (!data || typeof data.type !== 'string') {
      return;
    }
    const handler = handlers[data.type];
    if (handler) handler(data);
  });
}

export function registerApi(
  config: WidgetConfig,
  iframe: HTMLIFrameElement,
  privacyPrefs: PrivacyPreferences,
  version: string
): void {
  // SECURITY: Use exact origin instead of wildcard for postMessage
  const targetOrigin = config.serverUrl || window.location.origin;

  window.ChatWidget = {
    open() {
      iframe.contentWindow?.postMessage({ type: 'open' }, targetOrigin);
    },
    close() {
      iframe.contentWindow?.postMessage({ type: 'close' }, targetOrigin);
    },
    sendMessage(message: string) {
      iframe.contentWindow?.postMessage({ type: 'message', message }, targetOrigin);
    },
    updateContext(newContext: any) {
      iframe.contentWindow?.postMessage(
        {
          type: 'updateContext',
          userData: newContext?.userData,
          cartData: newContext?.cartData,
          pageContext: newContext?.pageContext,
        },
        targetOrigin
      );
    },
    privacy: {
      optOut() {
        savePrivacyPreferences({ ...privacyPrefs, optedOut: true });
        iframe.remove();
      },
      optIn() {
        savePrivacyPreferences({ ...privacyPrefs, optedOut: false });
        window.location.reload();
      },
      clearData() {
        localStorage.removeItem(PRIVACY_KEY);
        sessionStorage.clear();
      },
      getStatus() {
        return getPrivacyPreferences();
      },
    },
    version,
  };
}
