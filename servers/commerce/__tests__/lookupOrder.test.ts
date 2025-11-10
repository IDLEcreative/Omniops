/**
 * Orchestrator for lookupOrder MCP tool tests.
 * Keeps the original entry path while delegating to focused spec files.
 */

import './lookupOrder/woocommerce.spec';
import './lookupOrder/shopify.spec';
import './lookupOrder/validation.spec';
import './lookupOrder/context.spec';
import './lookupOrder/provider.spec';
import './lookupOrder/response-format.spec';
