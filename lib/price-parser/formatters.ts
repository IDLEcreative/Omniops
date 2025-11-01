/**
 * Price Formatting Utilities
 */

import { CURRENCY_DISPLAY_SYMBOLS } from './constants';

export function formatCurrency(value: number, currency: string): string {
  const symbol = CURRENCY_DISPLAY_SYMBOLS[currency] || currency + ' ';
  return `${symbol}${value.toFixed(2)}`;
}

export function cleanSKU(sku: string | null | undefined): string | null {
  if (!sku || typeof sku !== 'string') {
    return null;
  }

  // Remove common SKU prefixes
  return sku
    .replace(/^(sku|SKU|item|Item|product|Product|code|Code):\s*/i, '')
    .replace(/^#/, '')
    .trim() || null;
}
