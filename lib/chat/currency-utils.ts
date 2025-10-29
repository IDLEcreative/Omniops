/**
 * Currency Utilities for WooCommerce Operations
 *
 * Provides helper functions for formatting prices with dynamic currency symbols.
 * CRITICAL: Multi-tenant system - NO hardcoded currencies allowed!
 */

import type { WooCommerceOperationParams } from './woocommerce-tool-types';

/**
 * Get currency symbol from operation params
 *
 * @param params - WooCommerce operation parameters (contains currency data)
 * @returns Currency symbol (e.g., "£", "$", "€")
 * @default "$" if currency not provided
 *
 * @example
 * const symbol = getCurrencySymbol(params); // "£" for GBP store
 * message += `Price: ${symbol}100.00`;
 */
export function getCurrencySymbol(params: WooCommerceOperationParams): string {
  return params.currency?.symbol || '$';
}

/**
 * Format price with currency symbol
 *
 * @param amount - Price amount (number or string)
 * @param params - WooCommerce operation parameters
 * @returns Formatted price string
 *
 * @example
 * formatPrice(100.50, params); // "£100.50" or "$100.50"
 * formatPrice("99.99", params); // "€99.99"
 */
export function formatPrice(
  amount: number | string,
  params: WooCommerceOperationParams
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = getCurrencySymbol(params);
  return `${symbol}${numAmount.toFixed(2)}`;
}

/**
 * Format price range with currency symbol
 *
 * @param min - Minimum price (0 if not specified)
 * @param max - Maximum price (null/undefined for no limit)
 * @param params - WooCommerce operation parameters
 * @returns Formatted price range string
 *
 * @example
 * formatPriceRange(50, 200, params); // "£50-£200"
 * formatPriceRange(0, null, params); // "$0-∞"
 */
export function formatPriceRange(
  min: number | undefined,
  max: number | undefined | null,
  params: WooCommerceOperationParams
): string {
  const symbol = getCurrencySymbol(params);
  const minStr = min !== undefined ? `${symbol}${min}` : `${symbol}0`;
  const maxStr = max !== undefined && max !== null ? `${symbol}${max}` : '∞';
  return `${minStr}-${maxStr}`;
}
