/**
 * Link Extractor
 * Extracts and normalizes links from HTML documents
 */

/**
 * Extracts links from a document
 * Filters to same-domain links only and removes duplicates
 * Skips anchor links and javascript: pseudo-links
 *
 * @param {Document} document - DOM document object
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {Array<Object>} Array of link objects with href and text
 */
export function extractLinks(document, baseUrl) {
  const links = [];
  const linkElements = document.querySelectorAll('a[href]');
  const baseUrlObj = new URL(baseUrl);

  linkElements.forEach(link => {
    try {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkUrl = new URL(absoluteUrl);

        // Only include same-domain links
        if (linkUrl.hostname === baseUrlObj.hostname) {
          links.push({
            href: absoluteUrl,
            text: link.textContent?.trim() || '',
          });
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });

  // Remove duplicates
  const uniqueLinks = Array.from(
    new Map(links.map(link => [link.href, link])).values()
  );

  return uniqueLinks;
}
