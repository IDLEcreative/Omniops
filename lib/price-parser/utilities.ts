/**
 * Price Parser Utility Functions
 */

import type { ParsedPrice } from './types';

export async function parseMultiplePrices(prices: (string | null | undefined)[]): Promise<ParsedPrice[]> {
  // Import here to avoid circular dependency
  const { PriceParser } = await import('./index');
  return prices
    .filter(p => p)
    .map(price => PriceParser.parse(price));
}

export function getBestPrice(prices: ParsedPrice[]): ParsedPrice | null {
  const validPrices = prices.filter(p => p.value !== null);

  if (validPrices.length === 0) {
    return null;
  }

  // Prefer sale prices
  const salePrices = validPrices.filter(p => p.onSale);
  if (salePrices.length > 0) {
    return salePrices.reduce((best, current) =>
      (current.value || 0) < (best.value || Infinity) ? current : best
    );
  }

  // Return lowest regular price
  return validPrices.reduce((best, current) =>
    (current.value || 0) < (best.value || Infinity) ? current : best
  );
}
