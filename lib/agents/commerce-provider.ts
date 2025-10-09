/**
 * Commerce Provider Interface
 * Defines operations that any e-commerce platform (WooCommerce, Shopify, etc.) must implement
 */

export interface OrderInfo {
  id: string | number;
  number: string | number;
  status: string;
  date: string;
  total: string | number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    total?: string;
  }>;
  billing?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  shipping?: any;
  trackingNumber?: string | null;
  permalink?: string | null;
}

export interface CommerceProvider {
  /**
   * Platform identifier (woocommerce, shopify, etc.)
   */
  readonly platform: string;

  /**
   * Look up an order by ID or email
   */
  lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null>;

  /**
   * Search for products
   */
  searchProducts(query: string, limit?: number): Promise<any[]>;

  /**
   * Check stock for a product
   */
  checkStock(productId: string): Promise<any>;

  /**
   * Get product details
   */
  getProductDetails(productId: string): Promise<any>;
}

/**
 * Commerce Provider Factory
 * Returns the appropriate provider based on domain configuration
 */
export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  // This will be implemented to detect which platform is configured
  // For now, we'll return WooCommerce provider if available

  // Future: Check domain config to see if it's WooCommerce, Shopify, etc.
  const { WooCommerceProvider } = await import('./providers/woocommerce-provider');

  try {
    return new WooCommerceProvider(domain);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize provider:', error);
    return null;
  }
}
