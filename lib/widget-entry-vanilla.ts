/**
 * Vanilla JS Widget Entry Point (Zero React Dependencies)
 *
 * This is the initial loader that shows the chat button immediately
 * without loading React. React is only loaded when user clicks.
 *
 * Expected size: <5 KB
 */

import { createMinimalLoader, loadFullWidget } from './widget-loader-vanilla';
import type { StandaloneWidgetConfig } from './widget-standalone/types';

let isFullWidgetLoaded = false;

/**
 * Initialize the minimal vanilla loader
 * Called by embed.js after DOM is ready
 */
export function initWidget(containerId: string, config: StandaloneWidgetConfig = {}) {
  // Create and inject minimal loader
  const loader = createMinimalLoader(config);
  document.body.appendChild(loader);

  // Set up click handler to load full widget
  const button = loader.querySelector('button');
  if (button) {
    button.addEventListener('click', async () => {
      if (!isFullWidgetLoaded) {
        isFullWidgetLoaded = true;
        await loadFullWidget(containerId, config);
      }
    });
  }

  console.log('[Omniops Widget] Minimal loader initialized (vanilla JS)');
}

// Make it available globally for embed.js to call
if (typeof window !== 'undefined') {
  (window as any).OmniopsWidget = { initWidget };
}
