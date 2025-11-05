/**
 * Execution context passed to all MCP tools
 */

export interface ExecutionContext {
  // Required fields
  customerId: string;
  domain: string;

  // Optional fields
  userId?: string;
  conversationId?: string;

  // Platform-specific
  platform?: 'woocommerce' | 'shopify' | 'generic';

  // Rate limiting
  rateLimitKey?: string;

  // Tracing
  traceId?: string;
  requestId?: string;

  // Metadata
  metadata?: Record<string, any>;
}
