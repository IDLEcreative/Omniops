/**
 * WooCommerce Tool Types
 * Type definitions and interfaces for WooCommerce operations
 */

// OpenAI function calling tool definition
export const WOOCOMMERCE_TOOL = {
  type: "function" as const,
  function: {
    name: "woocommerce_operations",
    description: "Handle WooCommerce operations like checking detailed stock, getting product info, checking order status, and other commerce-specific tasks",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["check_stock", "get_product_details", "check_order", "get_shipping_info", "check_price"],
          description: "The WooCommerce operation to perform"
        },
        productId: {
          type: "string",
          description: "Product ID or SKU for stock/product operations"
        },
        orderId: {
          type: "string",
          description: "Order ID for order operations"
        },
        email: {
          type: "string",
          description: "Customer email for order lookups"
        },
        includeQuantity: {
          type: "boolean",
          description: "Whether to include exact stock quantities",
          default: false
        }
      },
      required: ["operation"]
    }
  }
};

// Operation parameter types
export interface WooCommerceOperationParams {
  productId?: string;
  orderId?: string;
  email?: string;
  includeQuantity?: boolean;
}

// Operation result type
export interface WooCommerceOperationResult {
  success: boolean;
  data: any;
  message: string;
}

// Stock info type
export interface StockInfo {
  productName: string;
  sku: string;
  stockStatus: string;
  stockQuantity?: number;
  manageStock: boolean;
  backorders: string;
  price: string;
  onSale: boolean;
  salePrice: string;
}

// Product details type
export interface ProductDetails {
  id: number;
  name: string;
  sku: string;
  price: string;
  salePrice: string;
  description: string;
  shortDescription: string;
  categories: any[];
  images: any[];
  stockStatus: string;
  permalink: string;
  attributes: any[];
  variations: any[];
}

// Order info type
export interface OrderInfo {
  id: number;
  number: string;
  status: string;
  date: string;
  total: string;
  currency: string;
  items: OrderItem[];
  billing: BillingInfo | null;
  shipping: any;
  trackingNumber: string | null;
  permalink: string | null;
}

// Order item type
export interface OrderItem {
  name: string;
  quantity: number;
  total: string;
}

// Billing info type
export interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
}

// Price info type
export interface PriceInfo {
  regularPrice: string;
  salePrice: string;
  currentPrice: string;
  onSale: boolean;
  currency: string;
}
