/**
 * Compatibility shim for legacy imports.
 * The system now uses a generic Customer Service Agent facade with
 * provider-specific agents. This module re-exports the WooCommerce agent
 * under the original class name to avoid breaking existing imports.
 */
export { WooCommerceAgent as WooCommerceAIInstructions } from './agents/woocommerce-agent';

