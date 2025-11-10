/**
 * Readability Extractor
 * Main content extraction using readability-style algorithms
 */

import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { extractMetadata, extractBusinessInfo } from './metadata-extractor.js';
import { extractImages } from './image-extractor.js';
import { extractLinks } from './link-extractor.js';
import { cleanContent, generateContentHash } from './content-cleaner.js';
import { htmlToText } from './html-converter.js';

// Common page elements to filter out before content extraction
const COMMON_SELECTORS_TO_REMOVE = [
  'nav', 'navigation', '.nav', '#nav',
  'header', '.header', '#header', '.site-header',
  'footer', '.footer', '#footer', '.site-footer',
  'aside', '.sidebar', '#sidebar',
  '.cookie-banner', '.cookie-notice', '.cookie-consent',
  '.social-share', '.social-links', '.social-media',
  '.newsletter', '.subscribe',
  '.ads', '.advertisement', '.ad-container',
  '.comments', '#comments', '.comment-section',
  '.related-posts', '.related-articles',
  '.breadcrumb', '.breadcrumbs',
  '.pagination', '.page-numbers'
];

/**
 * Extracts content using readability-style algorithm
 * Falls back to simpler extraction if primary method fails
 *
 * @param {string} html - Raw HTML content
 * @param {string} url - Page URL for link resolution
 * @returns {Object} Extracted content with metadata
 */
export function extractWithReadability(html, url) {
  // Create virtual DOM
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;

  // Extract metadata before processing
  const metadata = extractMetadata(document);
  const images = extractImages(document);
  const links = extractLinks(document, url);

  // Use our fallback extraction method directly (since we don't have @mozilla/readability)
  const extracted = fallbackExtraction(document);
  let content = extracted.content;
  let textContent = extracted.textContent;
  let title = extracted.title || metadata.title || '';
  let excerpt = metadata.description || '';

  // If fallback didn't get much content, try a simpler approach
  if (!textContent || textContent.length < 100) {
    const $ = cheerio.load(html);
    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, header, footer').remove();

    // Get body text
    textContent = $('body').text() || '';
    content = textContent;
  }

  // Clean up content
  content = cleanContent(content);
  textContent = textContent.trim();

  // Calculate metrics
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  // Generate content hash for deduplication
  const contentHash = generateContentHash(textContent);

  return {
    title,
    content,
    textContent,
    excerpt,
    author: metadata.author,
    publishedDate: metadata.publishedDate,
    modifiedDate: metadata.modifiedDate,
    lang: document.documentElement.lang || 'en',
    images,
    links,
    metadata,
    contentHash,
    wordCount,
    readingTime,
  };
}

/**
 * Fallback content extraction when readability isn't available
 * Uses heuristics to find main content area
 *
 * @param {Document} document - DOM document object
 * @returns {Object} Extracted content, textContent, and title
 */
function fallbackExtraction(document) {
  const $ = cheerio.load(document.documentElement.outerHTML);

  // Remove unwanted elements - expanded list for better deduplication
  $('script, style, nav, header, footer, aside, form, iframe, object, embed').remove();

  // Remove all common selectors that appear on every page
  COMMON_SELECTORS_TO_REMOVE.forEach(selector => {
    $(selector).remove();
  });

  // Also remove elements with common class/id patterns
  $('[class*="sidebar"], [class*="header"], [class*="footer"], [class*="nav"]').remove();
  $('[id*="sidebar"], [id*="header"], [id*="footer"], [id*="nav"]').remove();
  $('[class*="cookie"], [class*="banner"], [class*="modal"], [class*="popup"]').remove();

  // Try to find main content using various selectors
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.post-content',
    '.entry-content',
    '.content-area',
    '.article-body',
    '.story-body',
    '.c-entry-content',
    '.Post-body',
    '#content',
    '.content',
    'body',
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
  const content = htmlToText(mainContent);
  const textContent = $(mainContent).text();

  return { content, textContent, title: title.trim() };
}
