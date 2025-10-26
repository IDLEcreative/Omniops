/**
 * Product Normalizer Constants
 * Currency symbols, codes, and pattern definitions
 */

import type { SpecificationPattern, VariantSelector } from './product-normalizer-types';

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  '$': 'USD',
  '£': 'GBP',
  '€': 'EUR',
  '¥': 'JPY',
  '₹': 'INR',
  'R$': 'BRL',
  'C$': 'CAD',
  'A$': 'AUD',
  'kr': 'SEK',
  'zł': 'PLN',
};

/**
 * Currency codes from text
 */
export const CURRENCY_CODES = [
  'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN',
  'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'CHF', 'ZAR', 'NZD', 'SGD',
  'HKD', 'KRW'
];

/**
 * Common specification patterns
 */
export const COMMON_SPEC_PATTERNS: SpecificationPattern[] = [
  { pattern: /dimensions?:\s*([^\n]+)/i, name: 'Dimensions' },
  { pattern: /weight:\s*([^\n]+)/i, name: 'Weight' },
  { pattern: /material:\s*([^\n]+)/i, name: 'Material' },
  { pattern: /color:\s*([^\n]+)/i, name: 'Color' },
  { pattern: /size:\s*([^\n]+)/i, name: 'Size' },
  { pattern: /model:\s*([^\n]+)/i, name: 'Model' },
  { pattern: /brand:\s*([^\n]+)/i, name: 'Brand' },
  { pattern: /warranty:\s*([^\n]+)/i, name: 'Warranty' },
];

/**
 * Variant selectors
 */
export const VARIANT_SELECTORS: VariantSelector = {
  color: ['[data-color]', '.color-option', '.swatch-color', '[class*="color-select"]'],
  size: ['[data-size]', '.size-option', '.size-select', '[class*="size-select"]'],
  material: ['[data-material]', '.material-option'],
  style: ['[data-style]', '.style-option'],
};
