/**
 * Resource Blocker for Web Scraping
 *
 * Blocks unnecessary resources during web scraping to improve performance
 * and reduce bandwidth usage. This module creates Playwright route handlers
 * that intercept and abort requests for non-essential resources.
 *
 * @module lib/scraper/resource-blocker
 */

/**
 * Creates a Playwright route handler that blocks unnecessary resources
 * during web scraping operations.
 *
 * Blocked resources include:
 * - Images (jpeg, png, gif, webp, svg, ico)
 * - Media files (mp4, webm, mp3, wav)
 * - Fonts (woff, woff2, ttf, eot)
 * - Stylesheets (css)
 * - Analytics and tracking scripts
 *
 * @returns {Function} Async route handler function for page.route()
 *
 * @example
 * const blockResources = createResourceBlocker();
 * await page.route('**\/*', blockResources);
 */
export function createResourceBlocker() {
  // Resource types to block
  const blockedResourceTypes = [
    'image',
    'media',
    'font',
    'stylesheet'
  ];

  // File extensions to block
  const blockedExtensions = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    // Fonts
    '.woff', '.woff2', '.ttf', '.eot',
    // Media
    '.mp4', '.webm', '.mp3', '.wav'
  ];

  // Third-party domains to block (analytics, ads, social)
  const blockedDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.com',
    'doubleclick.net',
    'twitter.com',
    'linkedin.com',
    'pinterest.com'
  ];

  /**
   * Route handler that intercepts and blocks unnecessary resources
   * @param {import('playwright').Route} route - Playwright route object
   */
  return async (route) => {
    const request = route.request();
    const resourceType = request.resourceType();
    const url = request.url();
    const urlLower = url.toLowerCase();

    // Check if resource should be blocked
    const shouldBlock =
      blockedResourceTypes.includes(resourceType) ||
      blockedExtensions.some(ext => urlLower.endsWith(ext)) ||
      blockedDomains.some(domain => url.includes(domain));

    if (shouldBlock) {
      await route.abort();
    } else {
      await route.continue();
    }
  };
}
