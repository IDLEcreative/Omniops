(function() {
  'use strict';

  // Widget version
  const WIDGET_VERSION = '2.0.0'; // Bumped to 2.0 for standalone architecture

  // Auto-detect server URL from script source or use current origin
  function getServerUrl() {
    // First try to get from script tag
    const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
    if (currentScript && currentScript.src) {
      const url = new URL(currentScript.src);
      // In development, always use port 3000
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return `http://localhost:3000`;
      }
      return url.origin;
    }
    // Fallback - in development use port 3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  }

  // Default configuration
  const defaultConfig = {
    serverUrl: getServerUrl(),
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

  // Privacy settings storage key
  const PRIVACY_KEY = 'chat_widget_privacy';

  // Get privacy preferences from localStorage
  function getPrivacyPreferences() {
    try {
      const stored = localStorage.getItem(PRIVACY_KEY);
      return stored ? JSON.parse(stored) : { optedOut: false, consentGiven: false };
    } catch (e) {
      return { optedOut: false, consentGiven: false };
    }
  }

  // Save privacy preferences
  function savePrivacyPreferences(prefs) {
    try {
      localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Error handler
  function logError(message, error) {
    if (config.debug || window.ChatWidgetDebug) {
      console.error('[Chat Widget]', message, error);
    }
  }

  try {
    // Merge user config with defaults
    const config = window.ChatWidgetConfig ?
      { ...defaultConfig, ...window.ChatWidgetConfig } :
      defaultConfig;

    // Ensure serverUrl is set
    if (!config.serverUrl) {
      config.serverUrl = getServerUrl();
    }

    // Check if already loaded
    if (document.getElementById('chat-widget-iframe')) {
      logError('Widget already loaded');
      return;
    }

    // Get privacy preferences
    const privacyPrefs = getPrivacyPreferences();

    // Check if user has opted out
    if (privacyPrefs.optedOut && config.privacy.allowOptOut) {
      console.log('[Chat Widget] User has opted out of chat widget');
      return;
    }

    // Get current domain
    const currentDomain = window.location.hostname;

    // Check for demo mode
    const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
    const demoId = currentScript?.getAttribute('data-demo');

    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

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

        // Create minimal HTML skeleton with widget bundle injected
        const iframeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Widget</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }
    #widget-root {
      width: 100%;
      height: 100%;
      position: fixed;
      inset: 0;
      overflow: hidden;
      background: transparent;
    }
  </style>
</head>
<body>
  <div id="widget-root"></div>
  <script>
    // Inject widget configuration
    window.__WIDGET_CONFIG__ = ${JSON.stringify({
      ...config,
      domain: currentDomain,
      demoId: demoId,
      privacySettings: {
        allowOptOut: config.privacy.allowOptOut,
        showPrivacyNotice: config.privacy.showPrivacyNotice,
        requireConsent: config.privacy.requireConsent,
        consentGiven: privacyPrefs.consentGiven,
        retentionDays: config.privacy.retentionDays,
      },
    })};

    // Inject widget bundle code
    ${widgetBundleCode}

    // Initialize widget after bundle loads
    if (window.OmniopsWidget && window.OmniopsWidget.initWidget) {
      window.OmniopsWidget.initWidget('widget-root', window.__WIDGET_CONFIG__);
    } else if (window.OmniopsWidgetBundle && window.OmniopsWidgetBundle.initWidget) {
      window.OmniopsWidgetBundle.initWidget('widget-root', window.__WIDGET_CONFIG__);
    } else {
      console.error('[Chat Widget] Widget bundle did not expose initWidget function');
    }
  </script>
</body>
</html>`;

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

        // Append to body
        document.body.appendChild(iframe);

        // Show iframe when loaded
        iframe.onload = function() {
          iframe.style.display = 'block';

          // Send initial config to iframe
          setTimeout(() => {
            iframe.contentWindow.postMessage({
              type: 'init',
              config: config,
              privacyPrefs: privacyPrefs,
            }, '*'); // Use '*' for srcdoc iframes
          }, 100);
        };

        // Handle messages from iframe
        window.addEventListener('message', function(event) {
          // Note: srcdoc iframes have origin 'null', so we can't validate origin
          // Instead, validate message structure
          if (!event.data || typeof event.data.type !== 'string') {
            return;
          }

          switch (event.data.type) {
            case 'resize':
              iframe.style.width = event.data.width + 'px';
              iframe.style.height = event.data.height + 'px';
              break;
            case 'analytics':
              // Track analytics event if user hasn't opted out
              if (!privacyPrefs.optedOut && typeof gtag !== 'undefined') {
                gtag('event', event.data.event, {
                  event_category: 'Chat Widget',
                  event_label: event.data.label,
                  value: event.data.value,
                });
              }
              break;
            case 'privacy':
              // Handle privacy-related messages
              switch (event.data.action) {
                case 'optOut':
                  savePrivacyPreferences({ ...privacyPrefs, optedOut: true });
                  iframe.remove();
                  break;
                case 'optIn':
                  savePrivacyPreferences({ ...privacyPrefs, optedOut: false });
                  break;
                case 'giveConsent':
                  savePrivacyPreferences({ ...privacyPrefs, consentGiven: true });
                  break;
                case 'requestDataExport':
                  // Trigger data export
                  window.open(`${config.serverUrl}/privacy/export?user=${event.data.userId}`, '_blank');
                  break;
                case 'requestDataDeletion':
                  // Trigger data deletion request
                  if (confirm('Are you sure you want to delete all your chat data? This cannot be undone.')) {
                    fetch(`${config.serverUrl}/api/privacy/delete`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: event.data.userId }),
                    });
                  }
                  break;
              }
              break;
            case 'ready':
              if (config.debug || window.ChatWidgetDebug) {
                console.log('[Chat Widget] Widget ready');
              }
              break;
            case 'error':
              logError('Widget error:', event.data.message);
              break;
          }
        });

        // Expose API for programmatic control
        window.ChatWidget = {
          open: function() {
            iframe.contentWindow.postMessage({ type: 'open' }, '*');
          },
          close: function() {
            iframe.contentWindow.postMessage({ type: 'close' }, '*');
          },
          sendMessage: function(message) {
            iframe.contentWindow.postMessage({ type: 'message', message: message }, '*');
          },
          updateContext: function(newContext) {
            iframe.contentWindow.postMessage({
              type: 'updateContext',
              userData: newContext.userData,
              cartData: newContext.cartData,
              pageContext: newContext.pageContext,
            }, '*');
          },
          // Privacy controls
          privacy: {
            optOut: function() {
              savePrivacyPreferences({ ...privacyPrefs, optedOut: true });
              iframe.remove();
            },
            optIn: function() {
              savePrivacyPreferences({ ...privacyPrefs, optedOut: false });
              location.reload();
            },
            clearData: function() {
              localStorage.removeItem(PRIVACY_KEY);
              sessionStorage.clear();
            },
            getStatus: function() {
              return getPrivacyPreferences();
            },
          },
          version: WIDGET_VERSION,
        };

        // Auto-delete old conversations based on retention policy
        if (config.privacy.retentionDays) {
          const lastCleanup = localStorage.getItem('chat_widget_last_cleanup');
          const now = Date.now();
          const dayInMs = 24 * 60 * 60 * 1000;

          if (!lastCleanup || now - parseInt(lastCleanup) > dayInMs) {
            iframe.contentWindow.postMessage({
              type: 'cleanup',
              retentionDays: config.privacy.retentionDays,
            }, '*');

            localStorage.setItem('chat_widget_last_cleanup', now.toString());
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
