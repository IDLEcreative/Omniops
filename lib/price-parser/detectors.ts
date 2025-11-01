/**
 * Price Detection and Pattern Recognition
 */

import { CONTACT_PRICE_PATTERNS, SALE_PRICE_PATTERNS, CURRENCY_SYMBOLS } from './constants';

export function isContactPrice(priceString: string): boolean {
  return CONTACT_PRICE_PATTERNS.some(pattern => pattern.test(priceString));
}

export function isSalePrice(priceString: string): boolean {
  return SALE_PRICE_PATTERNS.some(pattern => pattern.test(priceString));
}

export function hasVATPrice(priceString: string): boolean {
  return /\b(inc|incl|ex|excl|excluding|including)\s*(\.?\s*)?vat\b/i.test(priceString);
}

export function detectCurrency(priceString: string): string {
  // Check for currency codes first (more specific than symbols)
  const currencyCodeMatch = priceString.match(/\b(GBP|USD|EUR|JPY|INR|ZAR|AUD|CAD)\b/i);
  if (currencyCodeMatch && currencyCodeMatch[1]) {
    return currencyCodeMatch[1].toUpperCase();
  }

  // Then check for currency symbols
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (priceString.includes(symbol)) {
      return code;
    }
  }

  return 'GBP'; // Default to GBP
}
