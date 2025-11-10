/**
 * Type definitions for commerce provider system
 * Defines interfaces and types for e-commerce platform integrations
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
  readonly platform: string;
  lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null>;
  searchProducts(query: string, limit?: number): Promise<any[]>;
  checkStock(productId: string): Promise<any>;
  getProductDetails(productId: string): Promise<any>;
}

export type CustomerConfig = {
  woocommerce_enabled?: boolean | null;
  woocommerce_url?: string | null;
  shopify_enabled?: boolean | null;
  shopify_shop?: string | null;
};

export type ProviderDetectorContext = {
  domain: string;
  config: CustomerConfig | null;
};

export type ProviderDetector = (ctx: ProviderDetectorContext) => Promise<CommerceProvider | null>;
