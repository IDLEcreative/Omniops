# Agent Layer

This project uses a modular Agent architecture to keep the main Customer Service Agent lean and provider-agnostic while enabling specialized e-commerce logic via provider agents.

## Components

- `lib/agents/ecommerce-agent.ts`: Interface that defines a common contract for all agents. Methods include `getEnhancedSystemPrompt`, `getActionPrompt`, `formatOrdersForAI`, and `buildCompleteContext`.
- `lib/agents/customer-service-agent.ts`: Generic Customer Service Agent. This is the primary agent the user interacts with; it handles all general support and product guidance.
- `lib/agents/woocommerce-agent.ts`: WooCommerce-specific agent. Reuses generic behavior but tailors the system prompt for WooCommerce and order handling.
- `lib/woocommerce-ai-instructions.ts`: Legacy compatibility shim that re-exports the WooCommerce agent as `WooCommerceAIInstructions`.

## Routing

Provider routing happens in the chat API when a message is identified as an order/delivery/account query (i.e., a “customer” query).

- Decision: `app/api/chat/route.ts:585`.
- If `config.features.woocommerce.enabled === true`, the system uses `WooCommerceAgent`.
- If not specified, it falls back to environment detection: if `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, and `WOOCOMMERCE_CONSUMER_SECRET` are set, it uses `WooCommerceAgent`.
- Otherwise, it uses the generic `CustomerServiceAgent`.

This makes it easy to add more providers (e.g., Shopify) later without changing the main agent or bloating its logic.

## Rationale

- Keep the user-facing agent (CSA) small and focused on customer service tone, constraints, and general product support.
- Encapsulate provider-specific policies and heuristics in dedicated agents.
- Maintain backwards compatibility for existing tools/tests using the old `WooCommerceAIInstructions` entry point.
