/**
 * Metadata Extractor
 * Extracts metadata from HTML documents including Open Graph, Twitter Cards, and JSON-LD
 */

/**
 * Extracts metadata from a document
 * Supports Open Graph, Twitter Cards, article metadata, and JSON-LD structured data
 *
 * @param {Document} document - DOM document object
 * @returns {Object} Extracted metadata
 */
export function extractMetadata(document) {
  const getMeta = (name) => {
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
 * Extracts business contact information from HTML
 * Finds phone numbers, emails, addresses, and business hours
 *
 * @param {string} html - Raw HTML content
 * @returns {Object} Business contact information
 */
export function extractBusinessInfo(html, cheerio) {
  // Guard against undefined/null/empty HTML
  if (!html || typeof html !== 'string') {
    console.warn('[extractBusinessInfo] Invalid HTML provided, returning empty object');
    return {
      phones: [],
      emails: [],
      addresses: []
    };
  }

  const $ = cheerio.load(html);

  // Phone patterns
  const phonePatterns = [
    /(\+?[\d\s()-]{10,20})/g,
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
    /(0[1-9]\d{9,10})/g,
  ];

  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

  const phones = new Set();
  const emails = new Set();
  const addresses = new Set();

  $('a[href^="tel:"]').each((_, el) => {
    const phone = $(el).attr('href')?.replace('tel:', '').trim();
    if (phone) phones.add(phone);
  });

  $('a[href^="mailto:"]').each((_, el) => {
    const email = $(el).attr('href')?.replace('mailto:', '').trim();
    if (email) emails.add(email);
  });

  const bodyText = $('body').text();
  if (phones.size === 0) {
    phonePatterns.forEach(pattern => {
      const matches = bodyText.match(pattern);
      matches?.forEach(match => {
        const cleaned = match.trim();
        if (cleaned.length >= 10) phones.add(cleaned);
      });
    });
  }

  if (emails.size === 0) {
    const emailMatches = bodyText.match(emailPattern);
    emailMatches?.forEach(email => emails.add(email));
  }

  $('address, .address, .location, [itemtype*="PostalAddress"]').each((_, el) => {
    const addr = $(el).text().trim();
    if (addr.length > 10) addresses.add(addr);
  });

  const businessHours = [];
  const hoursSelectors = ['.hours', '.business-hours', '.opening-hours', '.store-hours'];
  hoursSelectors.forEach(selector => {
    $(selector).each((_, el) => {
      const hours = $(el).text().trim();
      if (hours && hours.length < 500) businessHours.push(hours);
    });
  });

  return {
    contactInfo: {
      phones: Array.from(phones).slice(0, 5),
      emails: Array.from(emails).slice(0, 5),
      addresses: Array.from(addresses).slice(0, 3),
    },
    businessHours,
  };
}
