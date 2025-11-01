/**
 * Page setup and configuration
 */

import { Page } from 'playwright';

/**
 * Setup page with optimizations
 */
export async function setupPage(page: Page): Promise<void> {
  // Set reasonable timeouts
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  // Block unnecessary resources for performance
  await page.route('**/*', async (route) => {
    const request = route.request();
    const resourceType = request.resourceType();

    // Block certain resource types for better performance
    if (['image', 'font', 'media'].includes(resourceType)) {
      await route.abort();
      return;
    }

    await route.continue();
  });

  // Add error handling
  page.on('pageerror', (error) => {
    console.warn('Page error:', error.message);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.warn('Console error:', msg.text());
    }
  });
}
