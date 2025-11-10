/**
 * HTML to Text Converter
 * Converts HTML to clean text while preserving business information
 */

import * as cheerio from 'cheerio';

/**
 * Converts HTML to clean text while preserving important business information
 * Removes navigation, promotional content, and clutter while keeping contact info
 *
 * @param {string} html - Raw HTML content
 * @returns {string} Cleaned text content
 */
export function htmlToText(html) {
  const $ = cheerio.load(html);

  // Selective stripping that preserves business info

  // Remove pure navigation menus
  $('.mega-menu, .dropdown-menu, .nav-menu, .mobile-menu').remove();
  $('nav ul, nav ol').each((_, el) => {
    const $el = $(el);
    const linkCount = $el.find('a').length;
    const textLength = $el.text().length;
    if (linkCount > 5 && textLength / linkCount < 20) {
      $el.remove();
    }
  });

  // Remove social sharing widgets (not social links)
  $('.share-buttons, .social-share, .addthis, .sharethis').remove();

  // Remove promotional banners and popups
  $('.popup, .modal, .overlay, .banner:not(.info-banner)').remove();
  $('.promo, .advertisement, .ads, [class*="popup"]').remove();

  // Remove cookie notices
  $('.cookie, .gdpr, [class*="cookie"], [id*="cookie"]').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    if (text.includes('cookie') || text.includes('gdpr')) {
      $el.remove();
    }
  });

  // Smart header/footer removal - only if they don't contain important info
  $('header, footer, .header, .footer').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();

    const hasImportantInfo =
      text.includes('phone') ||
      text.includes('email') ||
      text.includes('address') ||
      text.includes('hours') ||
      text.includes('contact') ||
      $el.find('address, .contact, .phone, .email, .hours').length > 0;

    const linkCount = $el.find('a').length;
    const wordCount = $el.text().split(/\s+/).length;
    const isMainlyNav = linkCount > 10 && wordCount < linkCount * 3;

    if (isMainlyNav && !hasImportantInfo) {
      $el.remove();
    }
  });

  // Remove sidebar if mainly navigation
  $('.sidebar, aside').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();

    if (text.includes('contact') || text.includes('hours') || text.includes('location')) {
      return; // Keep this sidebar
    }

    const linkCount = $el.find('a').length;
    const wordCount = $el.text().split(/\s+/).length;
    if (linkCount > 5 && wordCount < linkCount * 5) {
      $el.remove();
    }
  });

  // Remove related posts but keep related products
  $('.related, .recommended, [class*="related"]').each((_, el) => {
    const $el = $(el);
    if (!$el.hasClass('products')) {
      $el.remove();
    }
  });

  // Remove breadcrumbs and comments
  $('.breadcrumb, .breadcrumbs, [aria-label="breadcrumb"]').remove();
  $('.comments, #comments, .disqus, #disqus_thread').remove();

  // Also remove script/style tags
  $('script, style, noscript').remove();

  // Preserve some structure
  $('p, div, section, article').append('\n\n');
  $('br').replaceWith('\n');
  $('li').prepend('• ');

  // Get text content
  return $.text()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
