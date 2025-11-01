/**
 * Stealth features for browser contexts
 */

import { BrowserContext } from 'playwright';
import { USER_AGENTS, VIEWPORTS } from './constants';

/**
 * Get random user agent
 */
export function getRandomUserAgent(): string {
  const index = Math.floor(Math.random() * USER_AGENTS.length);
  const agent = USER_AGENTS[index];
  return agent !== undefined ? agent : USER_AGENTS[0]!;
}

/**
 * Get random viewport size
 */
export function getRandomViewport(): { width: number; height: number } {
  const index = Math.floor(Math.random() * VIEWPORTS.length);
  const viewport = VIEWPORTS[index];
  return viewport !== undefined ? viewport : VIEWPORTS[0]!;
}

/**
 * Add stealth scripts to context
 */
export async function addStealthScripts(context: BrowserContext): Promise<void> {
  // Add script to hide automation indicators
  await context.addInitScript(`
    // Remove webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Mock plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Mock languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });
  `);
}

/**
 * Get stealth context options
 */
export function getStealthContextOptions(): any {
  return {
    userAgent: getRandomUserAgent(),
    viewport: getRandomViewport(),
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.0060 },
    permissions: ['geolocation'],
  };
}
