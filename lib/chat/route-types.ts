/**
 * Route Types
 *
 * Type definitions and dependency injection interfaces for the chat route.
 * Enables testability through dependency injection without complex mocking.
 */

import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { sanitizeOutboundLinks } from '@/lib/link-sanitizer';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Dependencies interface for the chat route.
 * Enables dependency injection for testability without complex mocking.
 *
 * @example
 * // Production usage (uses defaults automatically):
 * POST(request)
 *
 * @example
 * // Test usage (inject mocks):
 * POST(request, {
 *   deps: {
 *     searchSimilarContent: mockSearchFn,
 *     getCommerceProvider: mockProviderFn
 *   }
 * })
 *
 * @see {@link https://github.com/IDLEcreative/Omniops/blob/main/docs/DEPENDENCY_INJECTION.md}
 */
export interface RouteDependencies {
  /**
   * Rate limiting function - checks if domain has exceeded request limits.
   * Called at the start of every chat request to prevent abuse.
   *
   * @param domain - The domain to check rate limits for
   * @returns Object with allowed status, remaining requests, and reset time
   */
  checkDomainRateLimit: typeof checkDomainRateLimit;

  /**
   * Semantic search function - finds similar content using vector embeddings.
   * Called when the AI needs context from scraped website data.
   *
   * @param query - Search query string
   * @param domain - Domain to search within
   * @param limit - Maximum results to return (default: 100)
   * @param minSimilarity - Minimum similarity threshold (default: 0.7)
   * @returns Array of similar content chunks with similarity scores
   */
  searchSimilarContent: typeof searchSimilarContent;

  /**
   * Commerce provider factory - returns platform-specific commerce client.
   * Called when searching products or fetching product details.
   * Supports WooCommerce and Shopify platforms.
   *
   * @param domain - Domain to get commerce provider for
   * @returns Commerce provider instance or null if not configured
   */
  getCommerceProvider: typeof getCommerceProvider;

  /**
   * Link sanitizer - ensures outbound links are safe and properly formatted.
   * Called before returning AI responses to the user.
   *
   * @param message - Message text containing potential links
   * @returns Sanitized message with safe links
   */
  sanitizeOutboundLinks: typeof sanitizeOutboundLinks;

  /**
   * Supabase client factory - creates authenticated database client.
   * Called for all database operations (conversations, messages, embeddings).
   * Uses service role key for elevated permissions.
   *
   * @returns Authenticated Supabase client instance
   */
  createServiceRoleClient: typeof createServiceRoleClient;
}

/**
 * Default dependencies for production use
 */
export const defaultDependencies: RouteDependencies = {
  checkDomainRateLimit,
  searchSimilarContent,
  getCommerceProvider,
  sanitizeOutboundLinks,
  createServiceRoleClient,
};
