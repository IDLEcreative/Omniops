/**
 * End-to-End Integration Test: Chat Agent + WooCommerce
 *
 * This file has been refactored to comply with the 300 LOC limit.
 * Tests are now organized in focused modules:
 * - product-search.test.ts: Product search and details
 * - order-lookup.test.ts: Order status and tracking
 * - multi-turn-conversations.test.ts: Conversation context
 * - fallback-scenarios.test.ts: Error handling and semantic fallback
 *
 * Shared helpers: __tests__/utils/woocommerce/e2e-helpers.ts
 *
 * This file maintains backward compatibility by re-exporting all tests.
 * All tests can still be run with: npm test chat-woocommerce-e2e
 */

// Re-export all test suites
import './woocommerce/product-search.test';
import './woocommerce/order-lookup.test';
import './woocommerce/multi-turn-conversations.test';
import './woocommerce/fallback-scenarios.test';

/**
 * Test Organization:
 *
 * 1. Product Search Tests (woocommerce/product-search.test.ts)
 *    - search_products tool call validation
 *    - get_product_details tool call validation
 *    - Product information accuracy
 *
 * 2. Order Lookup Tests (woocommerce/order-lookup.test.ts)
 *    - lookup_order tool call validation
 *    - Order status tracking
 *    - Order not found handling
 *
 * 3. Multi-Turn Conversation Tests (woocommerce/multi-turn-conversations.test.ts)
 *    - Conversation context preservation
 *    - conversation_id tracking
 *    - Sequential searches in same session
 *
 * 4. Fallback Scenarios Tests (woocommerce/fallback-scenarios.test.ts)
 *    - WooCommerce API failure handling
 *    - Semantic search fallback
 *    - No provider configured scenarios
 *
 * Shared Utilities (utils/woocommerce/e2e-helpers.ts):
 *    - createChatRequest: Build NextRequest for testing
 *    - createProductSearchToolCall: Mock AI product search
 *    - createOrderLookupToolCall: Mock AI order lookup
 *    - setupTwoCallAIMock: Configure ReAct loop (tool call + response)
 *    - createRouteContext: Build route context with DI
 */
