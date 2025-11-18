/**
 * Resource blocking utilities for scraper
 * Extracted from scraper-api-handlers.ts
 */

/**
 * Sets up turbo mode request blocking
 * Blocks unnecessary resources for speed
 */
export async function setupTurboModeBlocking(page: any): Promise<void> {

  await page.route('**/*', (route: any) => {
    const url = route.request().url();
    const resourceType = route.request().resourceType();

    // Block unnecessary resources for speed
    const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
    const blockedDomains = ['googletagmanager.com', 'google-analytics.com', 'facebook.com'];

    if (blockedTypes.includes(resourceType) ||
        blockedDomains.some(domain => url.includes(domain))) {
      // Only log first few blocks to avoid spam
      if (Math.random() < 0.05) { // Log 5% of blocks
        console.log(`[SCRAPER] Blocked resource: type=${resourceType}, domain=${new URL(url).hostname}`);
      }
      route.abort();
    } else {
      route.continue();
    }
  });

}

/**
 * Sets up legacy resource blocking based on configuration
 */
export async function setupLegacyBlocking(page: any, blockResources: string[]): Promise<void> {

  await page.route('**/*', (route: any) => {
    const resourceType = route.request().resourceType();
    if (blockResources.includes(resourceType as any)) {
      route.abort();
    } else {
      route.continue();
    }
  });
}
