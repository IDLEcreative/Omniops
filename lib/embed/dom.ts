import { WidgetConfig, PrivacyPreferences } from './types';
import { savePrivacyPreferences, PRIVACY_KEY, getPrivacyPreferences } from './privacy';

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

  const styles = [
    'position: fixed',
    isMobile ? 'bottom: 0' : config.appearance.position?.includes('bottom') ? 'bottom: 20px' : 'top: 20px',
    isMobile ? 'right: 0' : config.appearance.position?.includes('right') ? 'right: 20px' : 'left: 20px',
    isMobile ? 'left: 0' : '',
    'border: none',
    `width: ${isMobile ? '100vw' : (config.appearance.width || 400) + 'px'}`,
    `height: ${isMobile ? '100vh' : (config.appearance.height || 600) + 'px'}`,
    `max-width: ${isMobile ? '100vw' : 'calc(100vw - 40px)'}`,
    `max-height: ${isMobile ? '100vh' : 'calc(100vh - 40px)'}`,
    'z-index: 9999',
    `border-radius: ${isMobile ? '0' : config.appearance.borderRadius || '12px'}`,
    'box-shadow: none',
    'background: transparent',
    'overflow: hidden',
  ].filter(Boolean);

  iframe.style.cssText = `${styles.join('; ')};`;
  iframe.style.display = 'none';

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
    resize: data => {
      if (typeof data?.width === 'number') iframe.style.width = `${data.width}px`;
      if (typeof data?.height === 'number') iframe.style.height = `${data.height}px`;
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
  window.ChatWidget = {
    open() {
      iframe.contentWindow?.postMessage({ type: 'open' }, '*');
    },
    close() {
      iframe.contentWindow?.postMessage({ type: 'close' }, '*');
    },
    sendMessage(message: string) {
      iframe.contentWindow?.postMessage({ type: 'message', message }, '*');
    },
    updateContext(newContext: any) {
      iframe.contentWindow?.postMessage(
        {
          type: 'updateContext',
          userData: newContext?.userData,
          cartData: newContext?.cartData,
          pageContext: newContext?.pageContext,
        },
        '*'
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
