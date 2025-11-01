/**
 * E-commerce Data Extraction
 */

import type { EnhancedEmbeddingMetadata } from '../metadata-extractor-types';

/**
 * Extract e-commerce specific data
 */
export function extractEcommerceData(
  chunk: string,
  fullContent: string,
  htmlContent?: string
): Partial<EnhancedEmbeddingMetadata> {
  const result: Partial<EnhancedEmbeddingMetadata> = {};

  // Extract prices
  const pricePattern = /(?:[\$£€]\s?)([\d,]+(?:\.\d{2})?)/g;
  const prices: number[] = [];
  let priceMatch;
  while ((priceMatch = pricePattern.exec(chunk)) !== null) {
    if (priceMatch[1]) {
      const price = parseFloat(priceMatch[1].replace(',', ''));
      if (!isNaN(price)) prices.push(price);
    }
  }

  if (prices.length > 0) {
    result.price_range = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: chunk.includes('£') ? 'GBP' : chunk.includes('€') ? 'EUR' : 'USD'
    };
  }

  // Extract availability
  if (/in stock|available now|ready to ship/i.test(chunk)) {
    result.availability = 'in_stock';
  } else if (/out of stock|sold out|unavailable/i.test(chunk)) {
    result.availability = 'out_of_stock';
  } else if (/pre-?order|coming soon/i.test(chunk)) {
    result.availability = 'preorder';
  } else if (/discontinued|no longer available/i.test(chunk)) {
    result.availability = 'discontinued';
  }

  // Extract ratings
  const ratingPattern = /([\d.]+)\s*(?:out of\s*5|\s*stars?)/i;
  const ratingMatch = chunk.match(ratingPattern);
  if (ratingMatch && ratingMatch[1]) {
    const value = parseFloat(ratingMatch[1]);
    if (!isNaN(value) && value <= 5) {
      const countPattern = /(\d+)\s*(?:reviews?|ratings?)/i;
      const countMatch = chunk.match(countPattern);
      result.ratings = {
        value,
        count: countMatch && countMatch[1] ? parseInt(countMatch[1]) : 0
      };
    }
  }

  return result;
}

/**
 * Extract date from content
 */
export function extractDate(content: string, htmlContent?: string): string | undefined {
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {}
    }
  }

  return undefined;
}
