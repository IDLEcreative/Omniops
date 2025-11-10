/**
 * Provider detection logic for Shopify and WooCommerce
 * Dynamically loads and initializes platform-specific providers
 */

import type { ProviderDetector } from './types';
import { hasShopifySupport, hasWooCommerceSupport } from './config-loader';

export const detectShopify: ProviderDetector = async ({ domain, config }) => {
  if (!hasShopifySupport(config)) {
    return null;
  }

  try {
    const { getDynamicShopifyClient } = await import('@/lib/shopify-dynamic');
    const client = await getDynamicShopifyClient(domain);

    if (!client) {
      return null;
    }

    const { ShopifyProvider } = await import('../providers/shopify-provider');
    return new ShopifyProvider(client);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize Shopify provider:', error);
    return null;
  }
};

export const detectWooCommerce: ProviderDetector = async ({ domain, config }) => {
  if (!hasWooCommerceSupport(config)) {
    return null;
  }

  try {
    const { getDynamicWooCommerceClient } = await import('@/lib/woocommerce-dynamic');
    const client = await getDynamicWooCommerceClient(domain);

    if (!client) {
      return null;
    }

    const { WooCommerceProvider } = await import('../providers/woocommerce-provider');
    return new WooCommerceProvider(client);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize WooCommerce provider:', error);
    return null;
  }
};

export const providerDetectors: ProviderDetector[] = [detectShopify, detectWooCommerce];
