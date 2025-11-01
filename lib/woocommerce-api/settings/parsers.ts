/**
 * Schema parsers for WooCommerce Settings API
 */

import { getWooCommerceModule } from '../woo-module';

export const parseCoupon = (data: unknown) => getWooCommerceModule().CouponSchema.parse(data);
export const parseTaxRate = (data: unknown) => getWooCommerceModule().TaxRateSchema.parse(data);
export const parseTaxClass = (data: unknown) => getWooCommerceModule().TaxClassSchema.parse(data);
export const parseShippingZone = (data: unknown) => getWooCommerceModule().ShippingZoneSchema.parse(data);
export const parseShippingMethod = (data: unknown) => getWooCommerceModule().ShippingMethodSchema.parse(data);
export const parsePaymentGateway = (data: unknown) => getWooCommerceModule().PaymentGatewaySchema.parse(data);
export const parseWebhook = (data: unknown) => getWooCommerceModule().WebhookSchema.parse(data);
export const parseSystemStatus = (data: unknown) => getWooCommerceModule().SystemStatusSchema.parse(data);
