/**
 * Breadcrumb extraction utilities
 */

import * as cheerio from 'cheerio';
import { Breadcrumb } from './types';

/**
 * Extract breadcrumb navigation from HTML
 */
export function extractBreadcrumbs($: cheerio.CheerioAPI): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [];

  // Common breadcrumb selectors
  const breadcrumbSelectors = [
    '.breadcrumb li',
    '.breadcrumbs li',
    '.woocommerce-breadcrumb a',
    '.woocommerce-breadcrumb span',
    '[aria-label="breadcrumb"] li',
    '[aria-label="Breadcrumb"] li',
    '.breadcrumb-item',
    '.trail-item',
    'nav.breadcrumb a',
    '.yoast-breadcrumb a',
    '.rank-math-breadcrumb a',
    '[itemtype*="BreadcrumbList"] [itemprop="itemListElement"]'
  ];

  // Try each selector until we find breadcrumbs
  for (const selector of breadcrumbSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, el) => {
        const $el = $(el);
        let name = '';
        let url = '';

        // Handle different breadcrumb structures
        if ($el.find('a').length > 0) {
          const $link = $el.find('a').first();
          name = $link.text().trim();
          url = $link.attr('href') || '';
        } else if ($el.is('a')) {
          name = $el.text().trim();
          url = $el.attr('href') || '';
        } else {
          // Text-only breadcrumb item
          name = $el.text().trim();
        }

        // Clean up the name (remove separators like > or /)
        name = name.replace(/^[>\/\-→»]+/, '').replace(/[>\/\-→»]+$/, '').trim();

        if (name && name.length > 0 && name !== '>' && name !== '/') {
          breadcrumbs.push({ name, url });
        }
      });

      // If we found breadcrumbs, stop looking
      if (breadcrumbs.length > 0) break;
    }
  }

  // Try JSON-LD structured data for breadcrumbs
  if (breadcrumbs.length === 0) {
    $('script[type="application/ld+json"]').each((_, script) => {
      try {
        const data = JSON.parse($(script).text());
        if (data['@type'] === 'BreadcrumbList' && data.itemListElement) {
          data.itemListElement.forEach((item: any) => {
            if (item.name) {
              breadcrumbs.push({
                name: item.name,
                url: item.item || ''
              });
            }
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    });
  }

  return breadcrumbs;
}
