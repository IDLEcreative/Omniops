/**
 * Page navigation and setup utilities
 */

import { setupTurboModeBlocking, setupLegacyBlocking } from './resource-blocker';

/**
 * Pre-navigation hook setup
 * Configures page settings before navigation
 */
export async function setupPreNavigationHook(page: any, finalConfig: any, turboMode: boolean): Promise<void> {

  try {
    // Set viewport
    await page.setViewportSize(finalConfig.browser.viewport);

    // Set custom headers if any
    if (Object.keys(finalConfig.advanced.customHeaders).length > 0) {
      await page.setExtraHTTPHeaders(finalConfig.advanced.customHeaders);
    }

    // Setup resource blocking based on mode
    if (turboMode) {
      await setupTurboModeBlocking(page);
    } else if (finalConfig.browser.blockResources.length > 0) {
      await setupLegacyBlocking(page, finalConfig.browser.blockResources);
    } else {
    }

  } catch (preNavError) {
    console.error(`[SCRAPER] Error in pre-navigation hook:`, preNavError);
    throw preNavError;
  }
}

/**
 * Wait for page content to load
 */
export async function waitForContent(page: any, finalConfig: any): Promise<void> {
  console.log(`[SCRAPER] Waiting for DOM content loaded (timeout: ${finalConfig.timeouts.navigation}ms)`);
  await page.waitForLoadState('domcontentloaded', {
    timeout: finalConfig.timeouts.navigation
  });

  // Wait for specific selector if configured
  if (finalConfig.advanced.waitForSelector) {
    try {
      await page.waitForSelector(finalConfig.advanced.waitForSelector, {
        timeout: finalConfig.timeouts.resourceLoad
      });
    } catch (selectorError) {
      console.warn(`[SCRAPER] Custom selector not found within ${finalConfig.timeouts.resourceLoad}ms: ${finalConfig.advanced.waitForSelector}`);
      console.warn(`[SCRAPER] Continuing without custom selector...`);
    }
  } else {
    // Try to wait for common content selectors
    try {
      await page.waitForSelector('main, article, [role="main"], .content', {
        timeout: finalConfig.timeouts.resourceLoad
      });
    } catch (contentSelectorError) {
      console.warn(`[SCRAPER] No common content selectors found within ${finalConfig.timeouts.resourceLoad}ms`);
      console.warn(`[SCRAPER] Continuing with page as-is...`);
    }
  }
}
