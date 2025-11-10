/**
 * Page Scraper Module
 *
 * Handles the core page scraping logic for extracting content from web pages.
 * This module coordinates between Playwright page navigation and content extraction utilities.
 *
 * @module page-scraper
 */

import { extractWithReadability, extractBusinessInfo } from './content-extraction/index.js';

/**
 * Scrapes a single web page and extracts structured content
 *
 * @param {import('playwright').Page} page - Playwright page instance
 * @param {string} pageUrl - The URL of the page to scrape
 * @param {string} jobId - The job ID for logging and tracking
 * @returns {Promise<PageData>} Structured page data including content, metadata, and business info
 *
 * @typedef {Object} PageData
 * @property {string} url - The page URL
 * @property {string} title - The page title
 * @property {string} content - Extracted text content (cleaned)
 * @property {Object} metadata - Page metadata
 * @property {number} metadata.wordCount - Number of words in content
 * @property {string[]} metadata.images - Array of image URLs
 * @property {string[]} metadata.links - Array of link URLs
 * @property {Object} [metadata.author] - Author information if available
 * @property {string} [metadata.description] - Page description if available
 * @property {Date} [metadata.publishedTime] - Publication date if available
 * @property {Object} businessInfo - Extracted business information
 * @property {string[]} businessInfo.emails - Email addresses found
 * @property {string[]} businessInfo.phones - Phone numbers found
 * @property {string[]} businessInfo.addresses - Physical addresses found
 * @property {string} html - Raw HTML content
 *
 * @example
 * const pageData = await scrapePage(page, 'https://example.com/about', 'job-123');
 * console.log(`Scraped: ${pageData.title}`);
 * console.log(`Word count: ${pageData.metadata.wordCount}`);
 * console.log(`Found ${pageData.businessInfo.emails.length} email addresses`);
 */
export async function scrapePage(page, pageUrl, jobId) {
  try {
    // Wait for content to load with timeout
    // We try 'domcontentloaded' first as it's faster than 'networkidle'
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {
      console.warn(`[Job ${jobId}] DOM content load timeout for ${pageUrl}, continuing anyway`);
    });

    // Get raw page content
    const html = await page.content();
    const title = await page.title();

    // Extract business information (contact details, addresses, etc.)
    const businessInfo = extractBusinessInfo(html);

    // Extract clean content using Readability
    const extracted = extractWithReadability(html, pageUrl);

    // Merge business info into extracted data
    extracted.businessInfo = businessInfo;

    // Prepare structured page data
    const pageData = {
      url: pageUrl,
      title: title || extracted.title,
      content: extracted.textContent || extracted.content,
      metadata: {
        ...extracted.metadata,
        wordCount: extracted.wordCount,
        images: extracted.images,
        links: extracted.links
      },
      businessInfo: businessInfo,
      html: html
    };

    return pageData;

  } catch (error) {
    console.error(`[Job ${jobId}] Error scraping page ${pageUrl}:`, error.message);
    throw new Error(`Failed to scrape page: ${error.message}`);
  }
}

/**
 * Validates that the extracted page data is complete and usable
 *
 * @param {PageData} pageData - The page data to validate
 * @returns {boolean} True if valid, false otherwise
 *
 * @example
 * const pageData = await scrapePage(page, url, jobId);
 * if (isValidPageData(pageData)) {
 *   await saveToDatabase(pageData);
 * }
 */
export function isValidPageData(pageData) {
  // Must have a URL
  if (!pageData.url || typeof pageData.url !== 'string') {
    return false;
  }

  // Must have some content (title or text content)
  if (!pageData.title && !pageData.content) {
    return false;
  }

  // Content should have meaningful length (more than just whitespace)
  if (pageData.content && pageData.content.trim().length < 10) {
    return false;
  }

  return true;
}
