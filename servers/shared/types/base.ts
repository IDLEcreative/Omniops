/**
 * Base tool interfaces for all MCP servers
 */

export interface ToolExecutionLog {
  tool: string;
  category: string;
  customerId: string;
  status: 'success' | 'error';
  executionTime: number;
  resultCount?: number;
  error?: string;
  timestamp: string;
}

export interface ToolInput {
  [key: string]: any;
}

export interface ToolMetadata {
  executionTime: number;
  cached?: boolean;
  tokensSaved?: number;
}

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: ToolMetadata;
}

export interface ToolSchema {
  name: string;
  description: string;
  category: string;
  version: string;
  inputSchema: any; // Zod schema
  outputSchema?: any; // Zod schema
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
  examples?: Array<{
    description: string;
    input: any;
    expectedOutput: string;
  }>;
}
