/**
 * WooCommerce Currency Management
 *
 * Dynamically fetches and caches currency information per domain.
 * CRITICAL: Multi-tenant architecture - NO hardcoded currencies!
 *
 * Features:
 * - Fetches currency from WooCommerce settings API
 * - 24-hour in-memory cache per domain
 * - Fallback to USD on errors
 * - Type-safe currency data
 */

import type { WooCommerceAPI } from './woocommerce-api';
import type { CurrencyData } from './woocommerce-types';

/**
 * Currency cache structure
 */
interface CurrencyCache {
  data: CurrencyData;
  timestamp: number;
}

/**
 * In-memory cache: domain -> currency data
 * TTL: 24 hours (currencies rarely change)
 */
const currencyCache = new Map<string, CurrencyCache>();

/**
 * Cache TTL: 24 hours in milliseconds
 */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Default fallback currency (USD)
 */
const DEFAULT_CURRENCY: CurrencyData = {
  code: 'USD',
  name: 'United States Dollar',
  symbol: '$'
};

/**
 * Get currency for a WooCommerce store
 *
 * @param wc - WooCommerce API client
 * @param domain - Store domain (for cache key)
 * @returns Currency data with code and symbol
 *
 * @example
 * const currency = await getCurrency(wc, 'store.example.com');
 * console.log(`${currency.symbol}${price}`); // £100.00 or $100.00
 */
export async function getCurrency(
  wc: WooCommerceAPI,
  domain: string
): Promise<CurrencyData> {
  try {
    // Check cache first
    const cached = currencyCache.get(domain);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.data;
    }

    // Fetch from WooCommerce API
    const currencyData = await wc.getCurrentCurrency();

    // Cache the result
    currencyCache.set(domain, {
      data: currencyData,
      timestamp: now
    });

    console.log(`[Currency] Fetched ${currencyData.code} (${currencyData.symbol}) for ${domain}`);
    return currencyData;

  } catch (error) {
    console.error(`[Currency] Failed to fetch currency for ${domain}:`, error);

    // Return cached data if available (even if expired)
    const cached = currencyCache.get(domain);
    if (cached) {
      console.log(`[Currency] Using expired cache for ${domain}`);
      return cached.data;
    }

    // Final fallback to USD
    console.log(`[Currency] Falling back to USD for ${domain}`);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Format price with currency symbol
 *
 * @param amount - Price amount
 * @param currency - Currency data
 * @returns Formatted price string
 *
 * @example
 * formatPrice(100.50, { symbol: '£', code: 'GBP' }); // "£100.50"
 */
export function formatPrice(amount: number | string, currency: CurrencyData): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${currency.symbol}${numAmount.toFixed(2)}`;
}

/**
 * Clear currency cache for a domain
 * Useful for testing or forced refresh
 */
export function clearCurrencyCache(domain?: string): void {
  if (domain) {
    currencyCache.delete(domain);
    console.log(`[Currency] Cleared cache for ${domain}`);
  } else {
    currencyCache.clear();
    console.log(`[Currency] Cleared all currency cache`);
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCurrencyCacheStats(): {
  size: number;
  domains: string[];
} {
  return {
    size: currencyCache.size,
    domains: Array.from(currencyCache.keys())
  };
}
