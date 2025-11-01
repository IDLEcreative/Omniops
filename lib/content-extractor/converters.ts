/**
 * Content conversion utilities
 */

import * as cheerio from 'cheerio';
import { smartHtmlToText, selectiveStripBoilerplate } from '../business-content-extractor';

/**
 * Convert HTML to plain text using smart extraction
 */
export function htmlToText(html: string): string {
  return smartHtmlToText(html);
}

/**
 * Strip boilerplate/navigation from a DOM document
 * Uses selective stripping that preserves business-critical information
 */
export function stripBoilerplate(document: Document): void {
  const html = document.documentElement.outerHTML;
  const $ = cheerio.load(html);

  // Apply selective stripping
  selectiveStripBoilerplate($);

  // Update the document with the cleaned HTML
  document.documentElement.innerHTML = $.html();
}
