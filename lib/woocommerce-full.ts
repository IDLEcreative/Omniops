import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

declare const jest: any;

// Initialize WooCommerce client with full access
const createWooCommerceClientImpl = (config?: {
  url?: string;
  consumerKey?: string;
  consumerSecret?: string;
}) => {
  const url = config?.url || process.env.WOOCOMMERCE_URL;
  const consumerKey = config?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = config?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!url || !consumerKey || !consumerSecret) {
    // Return null instead of throwing during build time
    // This allows the app to build even without WooCommerce credentials
    if (process.env.NODE_ENV === 'production' && !process.env.BUILDING) {
      throw new Error('WooCommerce credentials are not properly configured');
    }
    return null;
  }

  return new WooCommerceRestApi({
    url,
    consumerKey,
    consumerSecret,
    version: 'wc/v3',
    queryStringAuth: true,
  });
};

export const createWooCommerceClient: typeof createWooCommerceClientImpl =
  typeof jest !== 'undefined' && typeof jest.fn === 'function'
    ? jest.fn(createWooCommerceClientImpl)
    : createWooCommerceClientImpl;

// Re-export all schemas and types from types module for backwards compatibility
export {
  // Product schemas
  ProductSchema,
  ProductVariationSchema,
  ProductAttributeSchema,
  ProductTagSchema,
  ProductShippingClassSchema,
  // Order schemas
  OrderSchema,
  OrderNoteSchema,
  RefundSchema,
  // Customer schema
  CustomerSchema,
  // Coupon schema
  CouponSchema,
  // Tax schemas
  TaxRateSchema,
  TaxClassSchema,
  // Shipping schemas
  ShippingZoneSchema,
  ShippingMethodSchema,
  // Payment Gateway schema
  PaymentGatewaySchema,
  // Webhook schema
  WebhookSchema,
  // System Status schema
  SystemStatusSchema,
  // Report schemas
  SalesReportSchema,
  TopSellersReportSchema,
  CouponsReportSchema,
  CustomersReportSchema,
  StockReportSchema,
  ReviewsReportSchema,
  // Type exports
  type Product,
  type ProductVariation,
  type ProductAttribute,
  type ProductTag,
  type ProductShippingClass,
  type Order,
  type OrderNote,
  type Refund,
  type Customer,
  type Coupon,
  type TaxRate,
  type TaxClass,
  type ShippingZone,
  type ShippingMethod,
  type PaymentGateway,
  type Webhook,
  type SystemStatus,
  type SalesReport,
  type TopSellersReport,
  type CouponsReport,
  type CustomersReport,
  type StockReport,
  type ReviewsReport,
  // Batch operation types
  type BatchOperation,
  type BatchResponse,
} from './woocommerce-full-types/index';
