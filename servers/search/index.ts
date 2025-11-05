/**
 * Search MCP Server Category
 *
 * Purpose: Export all search-related MCP tools
 * Category: search
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

export { searchProducts, metadata as searchProductsMetadata } from "./searchProducts";
export { searchByCategory, metadata as searchByCategoryMetadata } from "./searchByCategory";

export type { SearchProductsInput, SearchProductsOutput } from "./searchProducts";
export type { SearchByCategoryInput, SearchByCategoryOutput } from "./searchByCategory";

export const categoryMetadata = {
  name: "search",
  description: "Search and discovery tools using semantic embeddings, exact matching, and commerce provider integration",
  version: "1.0.0",
  tools: ["searchProducts", "searchByCategory"]
};
