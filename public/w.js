/**
 * Omniops Chat Widget - Minimal Loader
 *
 * Ultra-minimal embed script for simplified widget integration.
 * Target size: <5 KB
 *
 * Usage:
 *   <script async src="https://omniops.co.uk/w.js?id=app_abc123"></script>
 *
 * Or with data attribute:
 *   <script async data-id="app_abc123" src="https://omniops.co.uk/w.js"></script>
 *
 * Or with config object:
 *   <script>window.OmniopsConfig={id:"app_abc123"};</script>
 *   <script async src="https://omniops.co.uk/w.js"></script>
 */

(function() {
  'use strict';

  // Prevent multiple loads
  if (window.__OmniopsLoaded) return;
  window.__OmniopsLoaded = true;

  // Parse configuration from multiple sources
  const script = document.currentScript || document.querySelector('script[src*="w.js"]');

  // Get app ID from:
  // 1. URL parameter (?id=app_xxx)
  // 2. Data attribute (data-id="app_xxx")
  // 3. Config object (window.OmniopsConfig.id)
  const urlParams = new URLSearchParams(script?.src.split('?')[1] || '');
  const appId = urlParams.get('id') ||
                script?.getAttribute('data-id') ||
                (window.OmniopsConfig && window.OmniopsConfig.id);

  // Get server URL (defaults to production)
  const serverUrl = script?.getAttribute('data-server') ||
                     (window.OmniopsConfig && window.OmniopsConfig.serverUrl) ||
                     'https://omniops.co.uk';

  // Validate app ID
  if (!appId) {
    console.error('[Omniops] Missing app ID. Please provide via URL parameter (?id=app_xxx), data attribute (data-id="app_xxx"), or window.OmniopsConfig.id');
    return;
  }

  if (!appId.startsWith('app_')) {
    console.warn('[Omniops] App ID should start with "app_". Got:', appId);
  }

  // Store config for embed.js to use
  window.ChatWidgetConfig = {
    ...(window.ChatWidgetConfig || {}),
    serverUrl: serverUrl,
    appId: appId,
    // Skip remote config fetch in embed.js since we'll use app_id lookup
    skipRemoteConfig: false
  };

  // Load the full embed script asynchronously
  const loader = document.createElement('script');
  loader.src = serverUrl + '/embed.js';
  loader.async = true;
  loader.setAttribute('data-app-id', appId);
  loader.setAttribute('data-server-url', serverUrl);

  // Error handling
  loader.onerror = function() {
    console.error('[Omniops] Failed to load widget from:', serverUrl);
  };

  loader.onload = function() {
    if (window.ChatWidgetDebug) {
      console.log('[Omniops] Widget loaded successfully');
      console.log('[Omniops] App ID:', appId);
      console.log('[Omniops] Server:', serverUrl);
    }
  };

  // Inject script
  (document.head || document.documentElement).appendChild(loader);
})();
