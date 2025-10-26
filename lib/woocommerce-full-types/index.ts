/**
 * WooCommerce Full Types - Modular Type Definitions
 *
 * This module provides comprehensive Zod schemas and TypeScript types
 * for the WooCommerce REST API v3.
 *
 * Structure:
 * - base.ts: Shared base schemas and batch operation types
 * - products.ts: Product, variation, attribute, tag, shipping class schemas
 * - orders.ts: Order, order note, and refund schemas
 * - customers.ts: Customer and coupon schemas
 * - system.ts: Tax, shipping, payment, webhook, system status, and report schemas
 */

// Re-export base schemas and types
export {
  BaseSchema,
  MetaDataSchema,
  type BatchOperation,
  type BatchResponse,
} from './base';

// Re-export product schemas and types
export {
  ProductSchema,
  ProductVariationSchema,
  ProductAttributeSchema,
  ProductTagSchema,
  ProductShippingClassSchema,
  type Product,
  type ProductVariation,
  type ProductAttribute,
  type ProductTag,
  type ProductShippingClass,
} from './products';

// Re-export order schemas and types
export {
  OrderSchema,
  OrderNoteSchema,
  RefundSchema,
  type Order,
  type OrderNote,
  type Refund,
} from './orders';

// Re-export customer and coupon schemas and types
export {
  CustomerSchema,
  CouponSchema,
  type Customer,
  type Coupon,
} from './customers';

// Re-export system schemas and types
export {
  TaxRateSchema,
  TaxClassSchema,
  ShippingZoneSchema,
  ShippingMethodSchema,
  PaymentGatewaySchema,
  WebhookSchema,
  SystemStatusSchema,
  SalesReportSchema,
  TopSellersReportSchema,
  CouponsReportSchema,
  CustomersReportSchema,
  StockReportSchema,
  ReviewsReportSchema,
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
} from './system';
