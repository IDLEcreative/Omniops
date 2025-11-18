/**
 * Content MCP Server
 *
 * Purpose: Tools for retrieving, searching, and managing website content and page details
 * Category: content
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

export {
  getCompletePageDetails,
  metadata as getCompletePageDetailsMetadata
} from './getCompletePageDetails';

export type {
  GetCompletePageDetailsInput,
  GetCompletePageDetailsOutput
} from './getCompletePageDetails';

export const contentCategoryMetadata = {
  name: 'content',
  description: 'Tools for retrieving and managing content from scraped websites',
  version: '1.0.0',
  tools: ['getCompletePageDetails']
};
