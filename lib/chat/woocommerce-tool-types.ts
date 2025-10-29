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
          enum: ["check_stock", "get_stock_quantity", "get_product_details", "check_order", "get_shipping_info", "get_shipping_methods", "check_price", "get_product_variations", "get_product_categories", "get_product_reviews", "validate_coupon", "check_refund_status", "get_customer_orders", "get_order_notes", "get_payment_methods", "get_customer_insights", "get_low_stock_products", "get_sales_report"],
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
        },
        categoryId: {
          type: "string",
          description: "Category ID for category operations"
        },
        parentCategory: {
          type: "number",
          description: "Parent category ID to filter subcategories"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return"
        },
        minRating: {
          type: "number",
          description: "Minimum rating filter (1-5 stars)"
        },
        couponCode: {
          type: "string",
          description: "Coupon code to validate"
        },
        status: {
          type: "string",
          description: "Order status filter (pending, processing, completed, etc.)"
        },
        dateFrom: {
          type: "string",
          description: "Start date for order history filter (YYYY-MM-DD)"
        },
        dateTo: {
          type: "string",
          description: "End date for order history filter (YYYY-MM-DD)"
        },
        variationId: {
          type: "string",
          description: "Specific variation ID to retrieve"
        },
        country: {
          type: "string",
          description: "Country code for shipping calculation (e.g., GB, US)"
        },
        postcode: {
          type: "string",
          description: "Postcode/ZIP code for shipping calculation"
        },
        threshold: {
          type: "number",
          description: "Stock threshold for low stock alerts (default: 5)"
        },
        period: {
          type: "string",
          description: "Report period: day, week, month, year"
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
  categoryId?: string;
  parentCategory?: number;
  limit?: number;
  minRating?: number;
  couponCode?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  variationId?: string;
  country?: string;
  postcode?: string;
  threshold?: number;
  period?: string;
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

// Category info type
export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  count: number;
}

// Review info type
export interface ReviewInfo {
  id: number;
  productId: number;
  rating: number;
  reviewer: string;
  reviewerEmail: string;
  review: string;
  dateCreated: string;
  verified: boolean;
}

// Coupon info type
export interface CouponInfo {
  id: number;
  code: string;
  amount: string;
  discountType: string;
  description: string;
  dateExpires: string | null;
  usageCount: number;
  usageLimit: number | null;
  minimumAmount: string;
  maximumAmount: string;
}

// Refund info type
export interface RefundInfo {
  id: number;
  orderId: number;
  dateCreated: string;
  amount: string;
  reason: string;
  refundedBy: number;
  lineItems: any[];
}

// Order note info type
export interface OrderNoteInfo {
  id: number;
  author: string;
  dateCreated: string;
  note: string;
  customerNote: boolean;
}

// Product variation info type
export interface ProductVariationInfo {
  id: number;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stockStatus: string;
  stockQuantity: number | null;
  attributes: Array<{
    name: string;
    option: string;
  }>;
  image: any;
  available: boolean;
}

// Payment method info type
export interface PaymentMethodInfo {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  methodTitle: string;
  methodDescription: string;
  supports: string[];
}

// Shipping method info type
export interface ShippingMethodInfo {
  id: string;
  title: string;
  description: string;
  methodId: string;
  cost: string;
  taxable: boolean;
  zones: Array<{
    id: number;
    name: string;
    locations: any[];
  }>;
}

// Customer insights info type
export interface CustomerInsightsInfo {
  topCustomers: Array<{
    customerId: number;
    email: string;
    name: string;
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
  }>;
  totalCustomers: number;
  totalRevenue: number;
  averageLTV: number;
}

// Sales report info type
export interface SalesReportInfo {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  period: string;
  startDate: string;
  endDate: string;
}
