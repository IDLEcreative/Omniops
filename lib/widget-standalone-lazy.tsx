/**
 * Standalone Widget with Lazy Loading (Two-Stage)
 *
 * This is an optimized version of the widget that:
 * 1. Shows a minimal loader immediately (<20 KB)
 * 2. Lazy-loads the full widget only when user clicks
 *
 * Build with: npm run build:widget:lazy
 * Use with: public/embed.js (set lazy=true)
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { LazyWidget } from './widget-lazy-loader';
import type { StandaloneWidgetConfig } from './widget-standalone/types';
import { WIDGET_STYLES } from './widget-standalone/constants';
import { buildWidgetConfig, buildPrivacySettings, injectStyles, setupContainer } from './widget-standalone/utils';

/**
 * Initialize the lazy-loading widget
 * Called by embed.js after DOM is ready
 */
export function initWidget(containerId: string, config: StandaloneWidgetConfig = {}) {
  injectStyles(WIDGET_STYLES);

  const container = setupContainer(containerId);
  if (!container) return;

  const root = createRoot(container);

  const widgetConfig = buildWidgetConfig(config);
  const privacySettings = buildPrivacySettings(config);

  root.render(
    <React.StrictMode>
      <LazyWidget
        config={widgetConfig}
        privacySettings={privacySettings}
      />
    </React.StrictMode>
  );

  console.log('[Omniops Widget] Lazy loader initialized');
}

// Make it available globally for embed.js to call
if (typeof window !== 'undefined') {
  (window as any).OmniopsWidget = { initWidget };
}
