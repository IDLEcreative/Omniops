/**
 * Types for tool execution handlers
 */

import { SearchResult } from '@/types';

export type ToolDependencies = {
  getCommerceProvider: (domain: string) => Promise<any>;
  searchSimilarContent: (query: string, domain: string, limit?: number, minSimilarity?: number) => Promise<SearchResult[]>;
};

export type ToolResult = {
  success: boolean;
  results: SearchResult[];
  source: string;
  pageInfo?: any;
};
