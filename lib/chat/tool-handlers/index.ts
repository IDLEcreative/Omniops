/**
 * Tool Execution Handlers
 *
 * Implements the business logic for each AI tool/function call.
 * Each handler coordinates between commerce providers and semantic search.
 */

export { executeSearchProducts } from './search-products';
export { executeSearchByCategory } from './search-by-category';
export { executeGetProductDetails } from './product-details';
export { executeLookupOrder } from './lookup-order';
export { executeGetCompletePageDetails } from './complete-page-details';

export type { ToolDependencies, ToolResult } from './types';
