/**
 * Price Value Extraction
 */

import { PRICE_EXTRACTION_PATTERNS } from './constants';

export function extractPriceValues(priceString: string): number[] {
  const prices: number[] = [];

  for (const pattern of PRICE_EXTRACTION_PATTERNS) {
    const matches = priceString.matchAll(pattern);
    for (const match of matches) {
      const priceStr = match[1] || match[0];
      const cleaned = priceStr.replace(/[^0-9.]/g, '');
      const value = parseFloat(cleaned);

      if (!isNaN(value) && value > 0) {
        prices.push(value);
      }
    }

    if (prices.length > 0) break;
  }

  // Remove duplicates and sort
  return [...new Set(prices)].sort((a, b) => b - a);
}
