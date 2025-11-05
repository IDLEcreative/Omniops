/**
 * MCP Executor Types
 *
 * Type definitions for the Deno-based code execution sandbox.
 */

export interface ExecutionContext {
  customerId: string;
  domain: string;
  conversationId?: string;
  userId?: string;
  platform?: 'woocommerce' | 'shopify' | 'generic';
  traceId?: string;
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    executionTime: number;
    tokensSaved?: number;
    cached?: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface CodeExecutionOptions {
  timeout?: number;
  memoryLimit?: number;
  allowedPermissions?: {
    read?: string[];
    write?: string[];
    net?: string[];
  };
}
