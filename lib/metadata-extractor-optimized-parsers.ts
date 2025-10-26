/**
 * Metadata Extraction Parsers
 * Parsing logic for various content types and patterns
 */

import { EnhancedEmbeddingMetadata } from './metadata-extractor-optimized';

/**
 * Pre-compiled regex patterns for performance optimization
 */
export const PATTERNS = {
  // SKU patterns
  sku: /\b(?:[A-Z]{2,}[\-\/]?[\d]{2,}[\w\-]*|SKU[\s]?[\d]+)\b/gi,
  // Model patterns
  model: /\b(?:model\s+)?([A-Z]{1,}[\-]?[\d]{2,}[\w\-]*)\b/gi,
  // Price patterns
  price: /(?:[\$£€]\s?)([\d,]+(?:\.\d{2})?)/g,
  // Email pattern - simplified
  email: /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/gi,
  // Phone patterns - combined
  phone: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  // Q&A patterns - optimized
  qaFormat1: /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis,
  qaFormat2: /([^.!?\n]+\?)\s*\n+([^?]+?)(?=\n[^.!?\n]+\?|$)/gis,
  // Date patterns
  isoDate: /(\d{4}-\d{2}-\d{2})/,
  usDate: /(\d{1,2}\/\d{1,2}\/\d{4})/,
  // Availability patterns
  inStock: /in stock|available now|ready to ship/i,
  outOfStock: /out of stock|sold out|unavailable/i,
  preorder: /pre-?order|coming soon/i,
  discontinued: /discontinued|no longer available/i,
  // Rating pattern
  rating: /([\d.]+)\s*(?:out of\s*5|\s*stars?)/i,
  reviewCount: /(\d+)\s*(?:reviews?|ratings?)/i,
  // Address pattern - simplified
  address: /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr)/gi
};

/**
 * Extract SKUs from text
 */
export function extractSKUs(text: string, limit: number = 5): string[] | undefined {
  const skus = text.match(PATTERNS.sku);
  if (skus && skus.length > 0) {
    return [...new Set(skus.slice(0, limit).map(s => s.toUpperCase()))];
  }
  return undefined;
}

/**
 * Extract model numbers from text
 */
export function extractModels(text: string, limit: number = 5): string[] | undefined {
  const models: string[] = [];
  let match;
  PATTERNS.model.lastIndex = 0; // Reset regex
  let count = 0;
  while ((match = PATTERNS.model.exec(text)) !== null && count < limit) {
    if (match[1]) {
      models.push(match[1].toUpperCase());
    }
    count++;
  }
  if (models.length > 0) {
    return [...new Set(models)];
  }
  return undefined;
}

/**
 * Extract brands from text
 */
export function extractBrands(text: string, brandList: Set<string>, limit: number = 5): string[] | undefined {
  const foundBrands: string[] = [];
  for (const brand of brandList) {
    if (text.includes(brand)) {
      foundBrands.push(brand);
      if (foundBrands.length >= limit) break;
    }
  }
  return foundBrands.length > 0 ? foundBrands : undefined;
}

/**
 * Extract contact information from text
 */
export function extractContactInfo(text: string): EnhancedEmbeddingMetadata['contact_info'] | undefined {
  const result: EnhancedEmbeddingMetadata['contact_info'] = {};

  // Email - first match only
  const emailMatch = text.match(PATTERNS.email);
  if (emailMatch && emailMatch[0]) {
    result.email = emailMatch[0].toLowerCase();
  }

  // Phone - first valid match only
  const phoneMatch = text.match(PATTERNS.phone);
  if (phoneMatch && phoneMatch[0]) {
    const cleaned = phoneMatch[0].replace(/[^\d+]/g, '');
    if (cleaned.length >= 10) {
      result.phone = phoneMatch[0];
    }
  }

  // Address - first match only
  const addressMatch = text.match(PATTERNS.address);
  if (addressMatch && addressMatch[0]) {
    result.address = addressMatch[0];
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Extract Q&A pairs from text
 */
export function extractQAPairs(text: string, limit: number = 5): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];

  // Try simple Q: A: format first (fastest)
  PATTERNS.qaFormat1.lastIndex = 0;
  let match;
  let count = 0;
  while ((match = PATTERNS.qaFormat1.exec(text)) !== null && count < limit) {
    if (match[1] && match[2]) {
      pairs.push({
        question: match[1].trim().replace(/\s+/g, ' '),
        answer: match[2].trim().replace(/\s+/g, ' ')
      });
      count++;
    }
  }

  // Only try second pattern if first found nothing
  if (pairs.length === 0) {
    PATTERNS.qaFormat2.lastIndex = 0;
    count = 0;
    while ((match = PATTERNS.qaFormat2.exec(text)) !== null && count < limit) {
      if (match[1] && match[2]) {
        pairs.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
        count++;
      }
    }
  }

  return pairs;
}

/**
 * Extract date from content
 */
export function extractDate(content: string): string | undefined {
  // Try ISO format first (most common)
  const isoMatch = content.match(PATTERNS.isoDate);
  if (isoMatch) {
    return isoMatch[0];
  }

  // Try US format
  const usMatch = content.match(PATTERNS.usDate);
  if (usMatch) {
    try {
      const date = new Date(usMatch[0]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {}
  }

  return undefined;
}

/**
 * Extract price information
 */
export function extractPrices(chunk: string, limit: number = 10): number[] {
  const prices: number[] = [];
  PATTERNS.price.lastIndex = 0;
  let priceMatch;
  let priceCount = 0;
  while ((priceMatch = PATTERNS.price.exec(chunk)) !== null && priceCount < limit) {
    if (priceMatch[1]) {
      const price = parseFloat(priceMatch[1].replace(',', ''));
      if (!isNaN(price) && price > 0 && price < 1000000) {
        prices.push(price);
        priceCount++;
      }
    }
  }
  return prices;
}

/**
 * Detect availability status
 */
export function detectAvailability(chunk: string): 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued' | undefined {
  if (PATTERNS.inStock.test(chunk)) {
    return 'in_stock';
  } else if (PATTERNS.outOfStock.test(chunk)) {
    return 'out_of_stock';
  } else if (PATTERNS.preorder.test(chunk)) {
    return 'preorder';
  } else if (PATTERNS.discontinued.test(chunk)) {
    return 'discontinued';
  }
  return undefined;
}

/**
 * Extract rating information
 */
export function extractRating(chunk: string): { value: number; count: number } | undefined {
  const ratingMatch = chunk.match(PATTERNS.rating);
  if (ratingMatch && ratingMatch[1]) {
    const value = parseFloat(ratingMatch[1]);
    if (!isNaN(value) && value <= 5) {
      const countMatch = chunk.match(PATTERNS.reviewCount);
      return {
        value,
        count: countMatch && countMatch[1] ? parseInt(countMatch[1]) : 0
      };
    }
  }
  return undefined;
}
