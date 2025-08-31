(function() {
  'use strict';
  
  // Widget version
  const WIDGET_VERSION = '1.1.0';
  
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
    appearance: {},
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

    // Create iframe with privacy parameters
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-widget-iframe';
    iframe.title = 'Customer Support Chat';
    // Prevent iframe from showing its own scrollbars
    iframe.setAttribute('scrolling', 'no');
    
    // Check for demo mode
    const currentScript = document.currentScript || document.querySelector('script[src*="embed.js"]');
    const demoId = currentScript?.getAttribute('data-demo');
    
    // Build URL with privacy settings
    const urlParams = new URLSearchParams({
      domain: currentDomain,
      version: WIDGET_VERSION,
      optOut: config.privacy.allowOptOut ? 'true' : 'false',
      privacyNotice: config.privacy.showPrivacyNotice ? 'true' : 'false',
      requireConsent: config.privacy.requireConsent ? 'true' : 'false',
      consentGiven: privacyPrefs.consentGiven ? 'true' : 'false',
      retentionDays: config.privacy.retentionDays || '30',
    });
    
    // Add demo parameter if present
    if (demoId) {
      urlParams.append('demo', demoId);
    }
    
    // Add user context if available
    if (config.userData && config.userData.isLoggedIn) {
      urlParams.append('userId', config.userData.userId || '');
      urlParams.append('userEmail', config.userData.email || '');
      urlParams.append('userName', config.userData.displayName || '');
    }
    
    iframe.src = `${config.serverUrl}/embed?${urlParams.toString()}`;
    
    // Detect mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
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
      box-shadow: ${isMobile ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.15)'};
      background: white;
    `;
    // Extra guard to avoid scrollbars on some browsers
    iframe.style.overflow = 'hidden';
    
    // Hide initially to prevent flash
    iframe.style.display = 'none';
    
    // Append to body
    document.body.appendChild(iframe);

    // Show iframe when loaded
    iframe.onload = function() {
      iframe.style.display = 'block';
      
      // Send configuration to iframe with user context
      iframe.contentWindow.postMessage({
        type: 'init',
        config: config,
        privacyPrefs: privacyPrefs,
        userData: config.userData,
        pageContext: config.pageContext,
        cartData: config.cartData,
        orderContext: config.orderContext,
        woocommerceEnabled: config.woocommerceEnabled,
        storeDomain: config.storeDomain,
      }, config.serverUrl);
    };

    // Handle messages from iframe
    window.addEventListener('message', function(event) {
      // Verify origin
      if (!event.origin.startsWith(config.serverUrl)) {
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
        case 'error':
          logError('Widget error:', event.data.message);
          break;
      }
    });

    // Expose API for programmatic control
    window.ChatWidget = {
      open: function() {
        iframe.contentWindow.postMessage({ type: 'open' }, config.serverUrl);
      },
      close: function() {
        iframe.contentWindow.postMessage({ type: 'close' }, config.serverUrl);
      },
      sendMessage: function(message) {
        iframe.contentWindow.postMessage({ type: 'message', message: message }, config.serverUrl);
      },
      updateContext: function(newContext) {
        // Update user context dynamically
        iframe.contentWindow.postMessage({ 
          type: 'updateContext', 
          userData: newContext.userData,
          cartData: newContext.cartData,
          pageContext: newContext.pageContext,
        }, config.serverUrl);
      },
      // Privacy controls
      privacy: {
        optOut: function() {
          savePrivacyPreferences({ ...privacyPrefs, optedOut: true });
          iframe.remove();
        },
        optIn: function() {
          savePrivacyPreferences({ ...privacyPrefs, optedOut: false });
          location.reload(); // Reload to show widget
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
        // Clean up old data
        iframe.contentWindow.postMessage({ 
          type: 'cleanup',
          retentionDays: config.privacy.retentionDays,
        }, config.serverUrl);
        
        localStorage.setItem('chat_widget_last_cleanup', now.toString());
      }
    }

  } catch (error) {
    logError('Failed to initialize chat widget', error);
  }
})();
