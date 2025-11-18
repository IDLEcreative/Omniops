/**
 * Standalone Widget Entry Point
 *
 * This file creates a self-contained widget bundle that can be embedded
 * in any website without depending on Next.js or the application's layout.
 *
 * Build with: npm run build:widget
 * Use with: public/embed.js
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from '../../components/ChatWidget';
import type { StandaloneWidgetConfig } from './types';
import { WIDGET_STYLES } from './constants';
import { buildWidgetConfig, buildPrivacySettings, injectStyles, setupContainer } from './utils';

/**
 * Initialize the standalone widget
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
      <ChatWidget
        demoConfig={widgetConfig}
        initialOpen={false}
        privacySettings={privacySettings}
      />
    </React.StrictMode>
  );

}

// Make it available globally for embed.js to call
if (typeof window !== 'undefined') {
  (window as any).OmniopsWidget = { initWidget };
}
