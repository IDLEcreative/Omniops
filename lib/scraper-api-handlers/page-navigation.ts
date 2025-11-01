/**
 * Page navigation and setup utilities
 */

import { setupTurboModeBlocking, setupLegacyBlocking } from './resource-blocker';

/**
 * Pre-navigation hook setup
 * Configures page settings before navigation
 */
export async function setupPreNavigationHook(page: any, finalConfig: any, turboMode: boolean): Promise<void> {
  console.log(`[SCRAPER] Pre-navigation hook started`);

  try {
    // Set viewport
    console.log(`[SCRAPER] Setting viewport to:`, finalConfig.browser.viewport);
    await page.setViewportSize(finalConfig.browser.viewport);

    // Set custom headers if any
    if (Object.keys(finalConfig.advanced.customHeaders).length > 0) {
      console.log(`[SCRAPER] Setting custom headers:`, finalConfig.advanced.customHeaders);
      await page.setExtraHTTPHeaders(finalConfig.advanced.customHeaders);
    }

    // Setup resource blocking based on mode
    if (turboMode) {
      await setupTurboModeBlocking(page);
    } else if (finalConfig.browser.blockResources.length > 0) {
      await setupLegacyBlocking(page, finalConfig.browser.blockResources);
    } else {
      console.log(`[SCRAPER] No resource blocking configured`);
    }

    console.log(`[SCRAPER] Pre-navigation hook completed successfully`);
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
  console.log(`[SCRAPER] DOM content loaded successfully`);

  // Wait for specific selector if configured
  if (finalConfig.advanced.waitForSelector) {
    console.log(`[SCRAPER] Waiting for custom selector: ${finalConfig.advanced.waitForSelector}`);
    try {
      await page.waitForSelector(finalConfig.advanced.waitForSelector, {
        timeout: finalConfig.timeouts.resourceLoad
      });
      console.log(`[SCRAPER] Custom selector found: ${finalConfig.advanced.waitForSelector}`);
    } catch (selectorError) {
      console.warn(`[SCRAPER] Custom selector not found within ${finalConfig.timeouts.resourceLoad}ms: ${finalConfig.advanced.waitForSelector}`);
      console.warn(`[SCRAPER] Continuing without custom selector...`);
    }
  } else {
    // Try to wait for common content selectors
    console.log(`[SCRAPER] Waiting for common content selectors...`);
    try {
      await page.waitForSelector('main, article, [role="main"], .content', {
        timeout: finalConfig.timeouts.resourceLoad
      });
      console.log(`[SCRAPER] Common content selector found`);
    } catch (contentSelectorError) {
      console.warn(`[SCRAPER] No common content selectors found within ${finalConfig.timeouts.resourceLoad}ms`);
      console.warn(`[SCRAPER] Continuing with page as-is...`);
    }
  }
}
