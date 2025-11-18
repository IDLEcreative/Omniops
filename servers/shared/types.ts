/**
 * Shared types for MCP server tools
 *
 * Purpose: Define common types and interfaces used across all MCP tools
 * Category: shared
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 */

/**
 * Execution context passed to all MCP tools
 * Contains customer-specific information and session data
 */
export interface ExecutionContext {
  customerId?: string;
  domain?: string;
  sessionId?: string;
  userId?: string;
  platform?: string;
  traceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Standard result envelope for all MCP tools
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    executionTime?: number;
    cached?: boolean;
    source?: string;
    [key: string]: unknown;
  };
}

/**
 * Tool metadata structure
 */
export interface ToolMetadata {
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  inputSchema: unknown;
  capabilities: {
    requiresAuth: boolean;
    requiresContext: string[];
    rateLimit?: {
      requests: number;
      window: string;
    };
    caching?: {
      enabled: boolean;
      ttl: number;
    };
  };
  examples: Array<{
    description: string;
    input: unknown;
    expectedOutput: string;
  }>;
  performance: {
    avgLatency: string;
    maxLatency: string;
    tokenUsage: {
      input: number;
      output: number;
    };
  };
}

/**
 * Tool execution log entry
 */
export interface ToolExecutionLog {
  tool: string;
  category: string;
  customerId: string;
  status: 'success' | 'error';
  resultCount?: number;
  executionTime: number;
  error?: string;
  timestamp: string;
}
