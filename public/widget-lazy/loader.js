/**
 * Lazy Widget Loader Wrapper (ESM)
 * This script loads the lazy widget bundle using ES modules
 */
import { initWidget } from './widget-entry-vanilla.js';

// Make it available globally for embed.js
if (typeof window !== 'undefined') {
  window.OmniopsWidget = { initWidget };
}

export { initWidget };
