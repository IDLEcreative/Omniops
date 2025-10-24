/**
 * Product Formatting Utilities
 *
 * Transforms commerce provider data (WooCommerce, Shopify) into standardized
 * SearchResult format for consistent AI responses.
 */

import { SearchResult } from '@/types';

/**
 * Strip HTML tags and normalize whitespace
 */
function stripHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Ensure product URL is absolute and valid
 */
function ensureProductUrl(rawUrl: string | null | undefined, domain: string, fallbackPath?: string): string {
  if (rawUrl && /^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const base = domain.startsWith('http') ? domain : `https://${domain}`;
  const path = fallbackPath ? `/${fallbackPath.replace(/^\//, '')}` : '';
  return `${base}${path}`;
}

/**
 * Format WooCommerce product into SearchResult
 */
export function formatWooProduct(product: any, domain: string): SearchResult {
  const price = product.price || product.regular_price || product.sale_price || '';
  const sku = product.sku || '';
  const description = stripHtml(product.short_description || product.description);

  const details: string[] = [];
  details.push(price ? `Price: ${price}` : 'Price: Contact for pricing');
  details.push(`SKU: ${sku || 'N/A'}`);
  if (description) {
    details.push(description);
  }

  return {
    content: `${product.name || 'Product'}\n${details.join('\n')}`.trim(),
    url: ensureProductUrl(product.permalink, domain),
    title: product.name || 'Product',
    similarity: 0.9,
  };
}

/**
 * Format Shopify product into SearchResult
 */
export function formatShopifyProduct(product: any, domain: string): SearchResult {
  const firstVariant = Array.isArray(product?.variants) ? product.variants[0] : undefined;
  const price = firstVariant?.price || '';
  const sku = firstVariant?.sku || '';
  const description = stripHtml(product?.body_html);
  const vendor = product?.vendor ? `Vendor: ${product.vendor}` : '';

  const details: string[] = [];
  details.push(price ? `Price: ${price}` : 'Price: Contact for pricing');
  details.push(`SKU: ${sku || 'N/A'}`);
  if (vendor) details.push(vendor);
  if (description) details.push(description);

  const handle = product?.handle ? `products/${product.handle}` : '';

  return {
    content: `${product?.title || 'Product'}\n${details.join('\n')}`.trim(),
    url: ensureProductUrl(product?.online_store_url, domain, handle),
    title: product?.title || 'Product',
    similarity: 0.88,
  };
}

/**
 * Format multiple products from any commerce provider
 */
export function formatProviderProducts(platform: string, products: any[], domain: string): SearchResult[] {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  if (platform === 'woocommerce') {
    return products.map(product => formatWooProduct(product, domain));
  }

  if (platform === 'shopify') {
    return products.map(product => formatShopifyProduct(product, domain));
  }

  return products.map((product, index) => ({
    content: typeof product === 'string' ? product : JSON.stringify(product),
    url: ensureProductUrl('', domain),
    title: product?.title || product?.name || `Result ${index + 1}`,
    similarity: 0.5,
  }));
}

/**
 * Format a single product from any commerce provider
 */
export function formatProviderProduct(platform: string, product: any, domain: string): SearchResult | null {
  if (!product) return null;

  if (platform === 'woocommerce') {
    return formatWooProduct(product, domain);
  }

  if (platform === 'shopify') {
    return formatShopifyProduct(product, domain);
  }

  return {
    content: typeof product === 'string' ? product : JSON.stringify(product),
    url: ensureProductUrl('', domain),
    title: product?.title || product?.name || 'Product',
    similarity: 0.5,
  };
}
