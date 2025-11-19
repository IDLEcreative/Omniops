/**
 * MSW Mock Handlers - Main Export
 *
 * This file aggregates all mock handlers from modular files.
 * Each handler category is split into focused modules:
 *
 * - handlers-auth.ts: Supabase authentication mocks
 * - handlers-openai.ts: OpenAI API mocks (chat, embeddings)
 * - handlers-woocommerce.ts: WooCommerce REST API mocks
 *
 * Usage in tests:
 * ```typescript
 * import { handlers } from '__tests__/mocks/handlers'
 * const server = setupServer(...handlers)
 * ```
 */

import { authHandlers } from './handlers-auth'
import { openaiHandlers } from './handlers-openai'
import { woocommerceHandlers } from './handlers-woocommerce'
import { chatHandlers } from './handlers-chat'
import { shopifyHandlers } from './handlers-shopify'

/**
 * Combined array of all mock handlers for MSW
 *
 * Note: For integration tests, most handlers use passthrough() to allow
 * real API calls. Unit tests can override with specific mocks by prepending
 * handlers to this array.
 */
export const handlers = [
  ...chatHandlers,
  ...openaiHandlers,
  ...authHandlers,
  ...woocommerceHandlers,
  ...shopifyHandlers
]

/**
 * Re-export individual handler groups for granular testing control
 */
export { authHandlers, openaiHandlers, woocommerceHandlers, chatHandlers, shopifyHandlers }
