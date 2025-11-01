/**
 * Tool Execution Handlers
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under tool-handlers/
 */

export {
  executeSearchProducts,
  executeSearchByCategory,
  executeGetProductDetails,
  executeLookupOrder,
  executeGetCompletePageDetails
} from './tool-handlers/index';

export type { ToolDependencies, ToolResult } from './tool-handlers/index';
