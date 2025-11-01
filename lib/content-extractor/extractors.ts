/**
 * Content extraction methods
 */

import * as cheerio from 'cheerio';

/**
 * Extract metadata from the document
 */
export function extractMetadata(document: Document): Record<string, any> {
  const getMeta = (name: string): string | null => {
    const element = document.querySelector(
      `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[property="article:${name}"]`
    );
    return element ? element.getAttribute('content') : null;
  };

  // Extract JSON-LD structured data
  let structuredData = {};
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      structuredData = { ...structuredData, ...data };
    } catch (e) {
      // Ignore parsing errors
    }
  });

  return {
    title: getMeta('title') || document.title,
    description: getMeta('description'),
    author: getMeta('author') || getMeta('article:author'),
    publishedDate: getMeta('published_time') || getMeta('datePublished'),
    modifiedDate: getMeta('modified_time') || getMeta('dateModified'),
    keywords: getMeta('keywords'),
    type: getMeta('type'),
    image: getMeta('image'),
    site_name: getMeta('site_name'),
    ...structuredData,
  };
}

/**
 * Extract images with alt text
 */
export function extractImages(document: Document): Array<{ src: string; alt: string }> {
  const images: Array<{ src: string; alt: string }> = [];
  const imgElements = document.querySelectorAll('img');

  imgElements.forEach(img => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (src && !src.includes('data:image')) {
      images.push({
        src: src,
        alt: img.alt || img.getAttribute('title') || 'Image',
      });
    }
  });

  return images;
}

/**
 * Extract links
 */
export function extractLinks(document: Document, baseUrl: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
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

/**
 * Fallback extraction using cheerio
 */
export function fallbackExtraction(document: Document): { content: string; textContent: string; title: string } {
  const $ = cheerio.load(document.documentElement.outerHTML);

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, form, iframe, object, embed').remove();
  $('.nav, .header, .footer, .sidebar, .advertisement, .ads, .social-share, .comments').remove();
  $('[class*="sidebar"], [class*="header"], [class*="footer"], [class*="nav"]').remove();
  $('[id*="sidebar"], [id*="header"], [id*="footer"], [id*="nav"]').remove();

  // Try to find main content using various selectors
  const contentSelectors = [
    'main', 'article', '[role="main"]',
    '.main-content', '#main-content',
    '.post-content', '.entry-content',
    '.content-area', '.article-body',
    '.story-body', '.c-entry-content',
    '.Post-body', '#content', '.content', 'body',
  ];

  let mainContent = '';
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      mainContent = element.html() || '';
      break;
    }
  }

  // Get title
  const title = $('title').text() ||
                $('h1').first().text() ||
                $('meta[property="og:title"]').attr('content') ||
                '';

  // Convert to text
  const $2 = cheerio.load(mainContent);
  const content = $2.text();
  const textContent = $2(mainContent).text();

  return { content, textContent, title: title.trim() };
}
