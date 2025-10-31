(async function() {
  'use strict';

  const WIDGET_VERSION = '2.0.0';

  const defaultConfig = {
    serverUrl: '',  // Will be set from window.ChatWidgetConfig
    appearance: {
      position: 'bottom-right',
      width: 400,
      height: 600,
      showPulseAnimation: true,
      showNotificationBadge: true,
      startMinimized: true,
    },
    features: {},
    behavior: {},
    privacy: {
      allowOptOut: true,
      showPrivacyNotice: true,
      requireConsent: false,
      retentionDays: 30,
    },
    userData: null,
    pageContext: null,
    cartData: null,
    orderContext: null,
    woocommerceEnabled: false,
    storeDomain: null,
    debug: false,
  };

  const PRIVACY_KEY = 'chat_widget_privacy';

  let activeConfig = {
    ...defaultConfig,
    appearance: { ...defaultConfig.appearance },
    features: { ...defaultConfig.features },
    behavior: { ...defaultConfig.behavior },
    privacy: { ...defaultConfig.privacy },
  };

  function getPrivacyPreferences() {
    try {
      const stored = localStorage.getItem(PRIVACY_KEY);
      return stored ? JSON.parse(stored) : { optedOut: false, consentGiven: false };
    } catch (e) {
      return { optedOut: false, consentGiven: false };
    }
  }

  function savePrivacyPreferences(prefs) {
    try {
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  function logError(message, error) {
    if ((activeConfig && activeConfig.debug) || window.ChatWidgetDebug) {
      console.error('[Chat Widget]', message, error || '');
    }
  }

  try {
    const userConfig = window.ChatWidgetConfig || {};
    const config = {
      ...defaultConfig,
      ...userConfig,
      appearance: { ...defaultConfig.appearance, ...userConfig.appearance },
      features: { ...defaultConfig.features, ...userConfig.features },
      behavior: { ...defaultConfig.behavior, ...userConfig.behavior },
      privacy: { ...defaultConfig.privacy, ...userConfig.privacy },
    };

    activeConfig = config;

    // serverUrl must be provided in window.ChatWidgetConfig
    if (!config.serverUrl) {
      console.error('[Chat Widget] serverUrl not configured. Please ensure window.ChatWidgetConfig includes a serverUrl.');
      return;
    }

    if (document.getElementById('chat-widget-iframe')) { logError('Widget already loaded'); return; }
    const privacyPrefs = getPrivacyPreferences();
    if (privacyPrefs.optedOut && config.privacy.allowOptOut) { console.log('[Chat Widget] User has opted out'); return; }
    const currentDomain = window.location.hostname;
    const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
    const demoId = currentScript?.getAttribute('data-demo');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

    if (!userConfig.skipRemoteConfig) {
      try {
        const res = await fetch(`${config.serverUrl}/api/widget/config?domain=${currentDomain}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.config) {
            const remote = data.config;
            ['appearance', 'behavior', 'features'].forEach(key => {
              if (remote[key]) config[key] = { ...config[key], ...remote[key], ...userConfig[key] };
            });
            if (remote.branding) {
              if (remote.branding.primary_color && !userConfig.appearance?.primaryColor) {
                config.appearance.primaryColor = remote.branding.primary_color;
              }
              if (remote.branding.welcome_message && !userConfig.behavior?.welcomeMessage) {
                config.behavior.welcomeMessage = remote.branding.welcome_message;
              }
            }
            config.woocommerceEnabled = remote.woocommerce_enabled || config.woocommerceEnabled;
            if (config.debug || window.ChatWidgetDebug) console.log('[Chat Widget] Loaded remote config:', remote);
          }
        }
      } catch (e) {
        if (config.debug || window.ChatWidgetDebug) console.warn('[Chat Widget] Remote config fetch failed:', e);
      }
    }

    // Load the standalone widget bundle
    const widgetBundleUrl = `${config.serverUrl}/widget-bundle.js`;

    // Fetch the widget bundle
    fetch(widgetBundleUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load widget bundle: ${response.statusText}`);
        }
        return response.text();
      })
      .then(widgetBundleCode => {
        // Create iframe with inline HTML skeleton
        const iframe = document.createElement('iframe');
        iframe.id = 'chat-widget-iframe';
        iframe.title = 'Customer Support Chat';
        iframe.setAttribute('scrolling', 'no');

        const iframeConfigJson = JSON.stringify({
          ...config,
          domain: currentDomain,
          demoId: demoId,
          privacySettings: { ...config.privacy, consentGiven: privacyPrefs.consentGiven },
        });
        const iframeHTML = [
          '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Chat Widget</title><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;overflow:hidden;background:transparent}#widget-root{width:100%;height:100%;position:fixed;inset:0;overflow:hidden;background:transparent}</style></head><body><div id="widget-root"></div><script>',
          `window.__WIDGET_CONFIG__=${iframeConfigJson};`,
          widgetBundleCode,
          'const init=window.OmniopsWidget?.initWidget||window.OmniopsWidgetBundle?.initWidget;if(!init){console.error("[Chat Widget] Widget bundle did not expose initWidget function");return;}init("widget-root",window.__WIDGET_CONFIG__);<\/script></body></html>',
        ].join('');

        // Set iframe source to inline HTML
        iframe.srcdoc = iframeHTML;

        // Style the iframe
        iframe.style.cssText = `
          position: fixed;
          ${isMobile ? 'bottom: 0' : config.appearance.position?.includes('bottom') ? 'bottom: 20px' : 'top: 20px'};
          ${isMobile ? 'right: 0' : config.appearance.position?.includes('right') ? 'right: 20px' : 'left: 20px'};
          ${isMobile ? 'left: 0' : ''};
          border: none;
          width: ${isMobile ? '100vw' : (config.appearance.width || 400) + 'px'};
          height: ${isMobile ? '100vh' : (config.appearance.height || 600) + 'px'};
          max-width: ${isMobile ? '100vw' : 'calc(100vw - 40px)'};
          max-height: ${isMobile ? '100vh' : 'calc(100vh - 40px)'};
          z-index: 9999;
          border-radius: ${isMobile ? '0' : '12px'};
          box-shadow: none;
          background: transparent;
          overflow: hidden;
        `;

        // Hide initially to prevent flash
        iframe.style.display = 'none';

        document.body.appendChild(iframe);

        iframe.onload = () => {
          iframe.style.display = 'block';
          setTimeout(() => iframe.contentWindow.postMessage({ type: 'init', config, privacyPrefs }, '*'), 100);
        };

        const privacyActions = {
          optOut: () => { savePrivacyPreferences({ ...privacyPrefs, optedOut: true }); iframe.remove(); },
          optIn: () => { savePrivacyPreferences({ ...privacyPrefs, optedOut: false }); },
          giveConsent: () => savePrivacyPreferences({ ...privacyPrefs, consentGiven: true }),
          requestDataExport: data => window.open(`${config.serverUrl}/privacy/export?user=${data.userId}`, '_blank'),
          requestDataDeletion: data => {
            if (confirm('Are you sure you want to delete all your chat data? This cannot be undone.')) {
              fetch(`${config.serverUrl}/api/privacy/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.userId }),
              });
            }
          },
        };

        const messageHandlers = {
          resize: data => {
            iframe.style.width = data.width + 'px';
            iframe.style.height = data.height + 'px';
          },
          analytics: data => {
            if (!privacyPrefs.optedOut && typeof gtag !== 'undefined') {
              gtag('event', data.event, {
                event_category: 'Chat Widget',
                event_label: data.label,
                value: data.value,
              });
            }
          },
          privacy: data => {
            const action = data.action && privacyActions[data.action];
            if (action) action(data);
          },
          ready: () => {
            if (config.debug || window.ChatWidgetDebug) {
              console.log('[Chat Widget] Widget ready');
            }
          },
          error: data => logError('Widget error:', data.message),
        };

        window.addEventListener('message', event => {
          const { data } = event;
          if (!data || typeof data.type !== 'string') return;
          const handler = messageHandlers[data.type];
          if (handler) handler(data);
        });

        window.ChatWidget = {
          open: () => iframe.contentWindow.postMessage({ type: 'open' }, '*'),
          close: () => iframe.contentWindow.postMessage({ type: 'close' }, '*'),
          sendMessage: message => iframe.contentWindow.postMessage({ type: 'message', message }, '*'),
          updateContext: newContext => iframe.contentWindow.postMessage({
            type: 'updateContext',
            userData: newContext.userData,
            cartData: newContext.cartData,
            pageContext: newContext.pageContext,
          }, '*'),
          privacy: {
            optOut: () => { savePrivacyPreferences({ ...privacyPrefs, optedOut: true }); iframe.remove(); },
            optIn: () => { savePrivacyPreferences({ ...privacyPrefs, optedOut: false }); location.reload(); },
            clearData: () => { localStorage.removeItem(PRIVACY_KEY); sessionStorage.clear(); },
            getStatus: () => getPrivacyPreferences(),
          },
          version: WIDGET_VERSION,
        };

        if (config.privacy.retentionDays) {
          const lastCleanup = localStorage.getItem('chat_widget_last_cleanup');
          const now = Date.now();
          if (!lastCleanup || now - Number(lastCleanup) > 24 * 60 * 60 * 1000) {
            iframe.contentWindow.postMessage({ type: 'cleanup', retentionDays: config.privacy.retentionDays }, '*');
            localStorage.setItem('chat_widget_last_cleanup', String(now));
          }
        }

      })
      .catch(error => {
        logError('Failed to load widget bundle', error);
        console.error('[Chat Widget] Could not load from:', widgetBundleUrl);
      });

  } catch (error) {
    logError('Failed to initialize chat widget', error);
  }
})();
