/**
 * Shopping Message Transformer
 *
 * Transforms WooCommerce/Shopify product data into shopping message format
 * for Instagram Stories-style product browsing experience.
 */

import { ShoppingProduct } from '@/types/shopping';
import { WooCommerceProduct } from '@/types';

/**
 * Transform WooCommerce products to shopping format
 */
export function transformWooCommerceProducts(
  products: WooCommerceProduct[]
): ShoppingProduct[] {
  return products.map(product => ({
    id: String(product.id),
    name: product.name,
    price: parseFloat(product.regular_price || product.price || '0'),
    salePrice: product.sale_price ? parseFloat(product.sale_price) : undefined,
    image: product.images?.[0]?.src || '',
    images: product.images?.map(img => img.src) || [],
    permalink: product.slug, // Will be enhanced by frontend
    stockStatus: product.stock_status as 'instock' | 'outofstock' | 'onbackorder',
    shortDescription: stripHtml(product.description || '').slice(0, 200),
  }));
}

/**
 * Transform Shopify products to shopping format
 * (Add when Shopify integration is needed)
 */
export function transformShopifyProducts(products: any[]): ShoppingProduct[] {
  return products.map(product => ({
    id: String(product.id),
    name: product.title,
    price: parseFloat(product.variants?.[0]?.price || '0'),
    salePrice: product.variants?.[0]?.compare_at_price
      ? parseFloat(product.variants[0].compare_at_price)
      : undefined,
    image: product.image?.src || product.images?.[0]?.src || '',
    images: product.images?.map((img: any) => img.src) || [],
    permalink: product.handle,
    stockStatus: product.variants?.[0]?.inventory_quantity > 0 ? 'instock' : 'outofstock',
    shortDescription: stripHtml(product.body_html || '').slice(0, 200),
  }));
}

/**
 * Detect if AI response contains product recommendations
 * that should trigger shopping mode
 *
 * @param aiResponse - The AI's response text
 * @param products - Array of products returned
 * @param isMobile - Whether the user is on a mobile device
 */
export function shouldTriggerShoppingMode(
  aiResponse: string,
  products?: any[],
  isMobile?: boolean
): boolean {
  if (!products || products.length === 0) {
    return false;
  }

  // MOBILE OPTIMIZATION: Always use shopping feed on mobile for better UX
  // Mobile users should see swipeable product carousel instead of text links
  if (isMobile && products.length > 0) {
    return true;
  }

  // DESKTOP: Use keyword detection for desktop users
  // Keywords that indicate product browsing intent
  const browseKeywords = [
    'here are',
    'here\'s',
    'found',
    'showing',
    'check out',
    'take a look',
    'browse',
    'products',
    'items',
  ];

  const lowerResponse = aiResponse.toLowerCase();
  const hasBrowseIntent = browseKeywords.some(keyword =>
    lowerResponse.includes(keyword)
  );

  // Trigger shopping mode if:
  // 1. We have multiple products (3+) OR
  // 2. AI explicitly suggests browsing AND we have products
  return products.length >= 3 || (hasBrowseIntent && products.length > 0);
}

/**
 * Extract shopping context from AI response
 * (e.g., "Search results for 'winter jackets'")
 */
export function extractShoppingContext(
  aiResponse: string,
  userQuery: string
): string | undefined {
  // Try to extract the context from the AI response
  const contextPatterns = [
    /(?:here (?:are|is)|showing|found) (.+?)(?:\.|:|$)/i,
    /(?:results for|looking for|searching for) ['"](.+?)['"]/i,
  ];

  for (const pattern of contextPatterns) {
    const match = aiResponse.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  // Fallback to user query
  if (userQuery) {
    return `Results for "${userQuery}"`;
  }

  return undefined;
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Create shopping message metadata from products
 */
export function createShoppingMetadata(
  products: ShoppingProduct[],
  context?: string
): {
  shoppingProducts: ShoppingProduct[];
  shoppingContext?: string;
} {
  return {
    shoppingProducts: products,
    shoppingContext: context,
  };
}
