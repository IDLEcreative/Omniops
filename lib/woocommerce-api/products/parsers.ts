/**
 * Schema parsers for WooCommerce Products API
 */

import { getWooCommerceModule } from '../woo-module';

export const parseProduct = (data: unknown) => getWooCommerceModule().ProductSchema.parse(data);
export const parseProductVariation = (data: unknown) => getWooCommerceModule().ProductVariationSchema.parse(data);
export const parseProductAttribute = (data: unknown) => getWooCommerceModule().ProductAttributeSchema.parse(data);
export const parseProductTag = (data: unknown) => getWooCommerceModule().ProductTagSchema.parse(data);
export const parseProductShippingClass = (data: unknown) => getWooCommerceModule().ProductShippingClassSchema.parse(data);
