/**
 * Utility functions for e-commerce data extraction
 * Extracted from lib/ecommerce-extractor.ts for modularity
 */

import type { CheerioAPI } from 'cheerio';
import type { ProductSpecification, ProductVariant, BusinessInfo } from '@/lib/ecommerce-extractor-types';

/**
 * Extract product variants (colors, sizes, etc.)
 */
export function extractVariants($: CheerioAPI): ProductVariant[] {
  const variants: ProductVariant[] = [];

  // WooCommerce variations
  $('.variations select').each((_, select) => {
    const $select = $(select);
    const label = $select.attr('data-attribute_name') ||
                 $select.attr('name')?.replace('attribute_', '') ||
                 $select.prev('label').text();

    $select.find('option').each((_, option) => {
      const value = $(option).text()?.trim();
      if (value && value !== 'Choose an option') {
        variants.push({
          type: label,
          value: value,
          price: $(option).attr('data-price'),
        });
      }
    });
  });

  // Shopify variants
  $('[data-variant-id]').each((_, el) => {
    const $el = $(el);
    variants.push({
      id: $el.attr('data-variant-id'),
      value: $el.text()?.trim(),
      price: $el.attr('data-price'),
      available: $el.attr('data-available') !== 'false',
    });
  });

  // Generic color swatches
  $('.color-swatch, .swatch-color, [class*="color-option"]').each((_, el) => {
    const $el = $(el);
    variants.push({
      type: 'color',
      value: $el.attr('title') || $el.attr('data-color') || $el.text()?.trim(),
      image: $el.find('img').attr('src'),
    });
  });

  // Generic size options
  $('.size-option, [class*="size-select"] option').each((_, el) => {
    const $el = $(el);
    const value = $el.text()?.trim();
    if (value && value !== 'Select Size') {
      variants.push({
        type: 'size',
        value: value,
      });
    }
  });

  return variants;
}

/**
 * Extract product specifications
 */
export function extractSpecifications($: CheerioAPI): ProductSpecification[] {
  const specs: ProductSpecification[] = [];
  const seen = new Set<string>();
  const addSpec = (name?: string | null, value?: string | null) => {
    const cleanName = name?.trim();
    const cleanValue = value?.trim();
    if (!cleanName || !cleanValue || cleanName === cleanValue) {
      return;
    }
    const key = `${cleanName}::${cleanValue}`;
    if (seen.has(key)) return;
    seen.add(key);
    specs.push({ name: cleanName, value: cleanValue });
  };

  const tableSelectors = [
    '.specifications table',
    '.product-specs table',
    '#tab-additional_information table',
    'table.specifications',
    'table.product-specs',
    'table[data-specification]',
    'table[class*="spec"]'
  ].join(', ');

  $(tableSelectors).each((_, table) => {
    $(table).find('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('th, td');
      if (cells.length === 0) return;
      const name = cells.first().text();
      const valueCell = cells.length > 1 ? cells.last().text() : $row.find('td').attr('data-value');
      addSpec(name, valueCell);
    });
  });

  // Look for definition lists
  $('dl.specs, dl.specifications, dl.product-specs').each((_, dl) => {
    $(dl).find('dt').each((_, dt) => {
      const name = $(dt).text();
      const value = $(dt).next('dd').text();
      addSpec(name, value);
    });
  });

  // Attribute-driven specs
  $('[data-spec-name]').each((_, el) => {
    const name = $(el).attr('data-spec-name') || $(el).find('[data-spec-label]').attr('data-spec-label');
    const value = $(el).attr('data-spec-value') || $(el).text();
    addSpec(name, value);
  });

  // Look for list-based specs
  $('.product-features li, .specifications li, [class*="spec"] li').each((_, li) => {
    const text = $(li).text()?.trim();
    if (!text) return;
    const colonIndex = text.indexOf(':');
    if (colonIndex > 0 && colonIndex < text.length - 1) {
      addSpec(text.substring(0, colonIndex), text.substring(colonIndex + 1));
    }
  });

  return specs;
}

/**
 * Extract business information
 */
export function extractBusinessInfo($: CheerioAPI): BusinessInfo {
  return {
    contactInfo: {
      phones: extractPhoneNumbers($),
      emails: extractEmails($),
      addresses: extractAddresses($)
    },
    businessHours: extractBusinessHours($)
  };
}

/**
 * Extract phone numbers from page
 */
export function extractPhoneNumbers($: CheerioAPI): string[] {
  const phones: string[] = [];
  const phoneRegex = /(?:\+?[\d\s\-\(\)]{10,})/g;

  // Check common phone selectors
  $('.phone, .telephone, .contact-phone, [href^="tel:"]').each((_, el) => {
    const text = $(el).text().trim();
    const matches = text.match(phoneRegex);
    if (matches) phones.push(...matches);
  });

  return [...new Set(phones)]; // Remove duplicates
}

/**
 * Extract email addresses from page
 */
export function extractEmails($: CheerioAPI): string[] {
  const emails: string[] = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Check common email selectors
  $('.email, .contact-email, [href^="mailto:"]').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');

    if (href?.startsWith('mailto:')) {
      emails.push(href.replace('mailto:', ''));
    }

    const matches = text.match(emailRegex);
    if (matches) emails.push(...matches);
  });

  return [...new Set(emails)]; // Remove duplicates
}

/**
 * Extract addresses from page
 */
export function extractAddresses($: CheerioAPI): string[] {
  const addresses: string[] = [];

  // Check common address selectors
  $('.address, .contact-address, [itemtype*="PostalAddress"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) addresses.push(text);
  });

  return addresses;
}

/**
 * Extract business hours from page
 */
export function extractBusinessHours($: CheerioAPI): string[] {
  const hours: string[] = [];

  // Check common business hours selectors
  $('.hours, .business-hours, .opening-hours, [itemtype*="OpeningHoursSpecification"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) hours.push(text);
  });

  return hours;
}
