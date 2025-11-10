/**
 * URL Utilities
 *
 * Helper functions for URL processing and pattern matching
 */

/**
 * Check if URL is a product page
 */
export function isProductPage(url: string): boolean {
  const productPatterns = [
    '/product/',
    '/products/',
    '/item/',
    '/p/',
    '/shop/',
    '-p-', // Common in e-commerce URLs
  ];

  return productPatterns.some(pattern => url.includes(pattern));
}

/**
 * Clean URL for grouping (remove query params, trailing slash)
 */
export function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url.split('?')[0]?.replace(/\/$/, '') || url;
  }
}
