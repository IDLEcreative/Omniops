/**
 * MCP Server Registry
 *
 * Purpose: Central registry for all MCP server categories and tools
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

export const serverRegistry = {
  search: {
    path: "./search",
    description: "Search and discovery tools using semantic embeddings, exact matching, and commerce provider integration",
    tools: ["searchProducts", "searchByCategory"]
  },
  commerce: {
    path: "./commerce",
    description: "Order management, product operations, and e-commerce integrations for WooCommerce and Shopify",
    tools: ["lookupOrder", "getProductDetails"]
  },
  content: {
    path: "./content",
    description: "Tools for retrieving and managing content from scraped websites",
    tools: ["getCompletePageDetails"]
  }
};

// Export all server categories
export * from "./search";
export * from "./commerce";
export * from "./content";
export * from "./shared/types";
export * from "./shared/validation";
export * from "./shared/utils/logger";
