/**
 * Product Normalizer Price Strategy
 * Price normalization and formatting
 */

import type { NormalizedPrice } from './product-normalizer-types';
import { CURRENCY_SYMBOLS, CURRENCY_CODES } from './product-normalizer-constants';

/**
 * Price Normalization Strategy
 */
export class PriceNormalizationStrategy {
  /**
   * Detect currency from text
   */
  static detectCurrency(text: string, providedCurrency?: string): string {
    if (providedCurrency) return providedCurrency;

    // Check for currency symbols
    for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
      if (text.includes(symbol)) {
        return code;
      }
    }

    // Check for currency codes
    for (const code of CURRENCY_CODES) {
      if (text.toUpperCase().includes(code)) {
        return code;
      }
    }

    return 'USD';
  }

  /**
   * Extract numeric amounts from text
   */
  static extractAmounts(text: string): number[] {
    const priceMatches = text.match(/[\d,]+\.?\d*/g);
    if (!priceMatches || priceMatches.length === 0) return [];

    return priceMatches
      .map(match => parseFloat(match.replace(/,/g, '')))
      .filter(n => !isNaN(n));
  }

  /**
   * Detect discount from text
   */
  static detectDiscount(text: string): boolean {
    return text.toLowerCase().includes('was') ||
           text.toLowerCase().includes('original') ||
           (text.includes('£') && text.split('£').length > 2);
  }

  /**
   * Detect price range from text
   */
  static detectPriceRange(text: string): boolean {
    return text.toLowerCase().includes('from') ||
           text.includes('-') ||
           text.toLowerCase().includes('to');
  }

  /**
   * Detect VAT status from text
   */
  static detectVATStatus(text: string): boolean | undefined {
    const vatIncluded = text.toLowerCase().includes('inc vat') ||
                        text.toLowerCase().includes('incl vat') ||
                        text.toLowerCase().includes('including vat');

    const vatExcluded = text.toLowerCase().includes('ex vat') ||
                        text.toLowerCase().includes('excl vat') ||
                        text.toLowerCase().includes('excluding vat');

    if (vatIncluded) return true;
    if (vatExcluded) return false;
    return undefined;
  }

  /**
   * Format price with currency
   */
  static formatPrice(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  }

  /**
   * Normalize price from various formats
   */
  static normalizePrice(
    priceText: string | number | undefined,
    currency?: string
  ): NormalizedPrice | undefined {
    if (!priceText) return undefined;

    // Convert to string if number
    const text = typeof priceText === 'number' ? priceText.toString() : priceText.trim();

    // Detect currency
    const detectedCurrency = this.detectCurrency(text, currency);

    // Extract amounts
    const amounts = this.extractAmounts(text);
    if (amounts.length === 0) return undefined;

    // Detect features
    const hasRange = this.detectPriceRange(text);
    const hasDiscount = this.detectDiscount(text);
    const vatIncluded = this.detectVATStatus(text);

    // Determine current and original price
    let amount = amounts[0];
    let original: number | undefined;

    if (hasDiscount && amounts.length >= 2) {
      original = amounts[0];
      amount = amounts[amounts.length - 1];
    }

    // Calculate discount
    let discount: number | undefined;
    let discountPercent: number | undefined;
    if (original && amount !== undefined && original > amount) {
      discount = original - amount;
      discountPercent = Math.round((discount / original) * 100);
    }

    return {
      amount: amount || 0,
      currency: detectedCurrency,
      formatted: this.formatPrice(amount || 0, detectedCurrency),
      original,
      discount,
      discountPercent,
      vatIncluded,
      priceType: hasRange ? 'starting-from' : 'single',
    };
  }
}
