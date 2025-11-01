/**
 * Price Parser - Main Entry Point
 * Handles complex e-commerce price formats including sales, VAT, and contact pricing
 */

import type { ParsedPrice } from './types';
import { isContactPrice, isSalePrice, hasVATPrice, detectCurrency } from './detectors';
import { extractPriceValues } from './extractors';
import { parseSalePrice, parseVATPrice, parseSimplePrice } from './parsers';
import { cleanSKU, formatCurrency } from './formatters';
import { parseMultiplePrices, getBestPrice } from './utilities';

export class PriceParser {
  /**
   * Parse complex price strings from e-commerce sites
   * Handles various formats including WooCommerce, Shopify, etc.
   */
  static parse(priceString: string | null | undefined): ParsedPrice {
    if (!priceString || typeof priceString !== 'string') {
      return {
        value: null,
        formatted: 'No price',
        currency: 'GBP',
        onSale: false,
        raw: priceString || '',
      };
    }

    // Handle "Contact us" or similar pricing
    if (isContactPrice(priceString)) {
      return {
        value: null,
        formatted: 'Contact for price',
        currency: 'GBP',
        onSale: false,
        requiresContact: true,
        raw: priceString,
      };
    }

    // Detect currency
    const currency = detectCurrency(priceString);

    // Extract all price values
    const prices = extractPriceValues(priceString);

    if (prices.length === 0) {
      return {
        value: null,
        formatted: 'No price',
        currency,
        onSale: false,
        raw: priceString,
      };
    }

    // Parse based on detected patterns
    if (isSalePrice(priceString)) {
      return parseSalePrice(priceString, prices, currency);
    } else if (hasVATPrice(priceString)) {
      return parseVATPrice(priceString, prices, currency);
    } else {
      const firstPrice = prices[0];
      if (firstPrice !== undefined) {
        return parseSimplePrice(firstPrice, currency, priceString);
      }
      // Fallback - should never reach here due to the length check above
      return {
        value: null,
        formatted: 'No price',
        currency,
        onSale: false,
        raw: priceString,
      };
    }
  }

  /**
   * Clean SKU by removing common prefixes
   */
  static cleanSKU = cleanSKU;

  /**
   * Parse multiple prices from a product listing
   */
  static parseMultiplePrices = parseMultiplePrices;

  /**
   * Get the best price from multiple parsed prices
   */
  static getBestPrice = getBestPrice;
}

// Re-export types and utilities
export type { ParsedPrice } from './types';
export { formatCurrency, cleanSKU } from './formatters';
