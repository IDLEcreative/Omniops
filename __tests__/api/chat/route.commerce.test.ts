/**
 * Commerce Integration Test Orchestrator
 *
 * This file orchestrates commerce integration tests across multiple platforms.
 * Actual test implementations are in ./tests/ subdirectory.
 *
 * Test Categories:
 * - WooCommerce Integration: tests/woocommerce-integration.test.ts
 * - Shopify Integration: tests/shopify-integration.test.ts
 * - Error Handling: tests/commerce-error-handling.test.ts
 */

import './tests/woocommerce-integration.test'
import './tests/shopify-integration.test'
import './tests/commerce-error-handling.test'
