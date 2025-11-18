/**
 * Commerce MCP Server Category
 *
 * Purpose: Export all commerce-related MCP tools
 * Category: commerce
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

export { lookupOrder, metadata as lookupOrderMetadata } from "./lookupOrder";
export type { LookupOrderInput, LookupOrderOutput } from "./lookupOrder";

export { getProductDetails, metadata as getProductDetailsMetadata } from "./getProductDetails";
export type { GetProductDetailsInput, GetProductDetailsOutput } from "./getProductDetails";

export { woocommerceOperations, metadata as woocommerceOperationsMetadata } from "./woocommerceOperations";
export type { WoocommerceOperationsInput, WoocommerceOperationsOutput } from "./woocommerceOperations";

export const commerceCategoryMetadata = {
  name: "commerce",
  description: "Order management, product operations, and e-commerce integrations for WooCommerce and Shopify",
  version: "1.0.0",
  tools: ["lookupOrder", "getProductDetails", "woocommerceOperations"]
};
