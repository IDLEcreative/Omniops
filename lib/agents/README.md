**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# AI Agents System

**Purpose:** Intelligent AI agent orchestration system for customer service interactions with specialized prompt engineering and provider-specific integrations.

**Integration Type:** System
**Last Updated:** 2025-10-30
**Status:** Active

This directory contains intelligent AI agents that handle customer service interactions with specialized prompt engineering and context building capabilities. The agents provide a modular, provider-agnostic approach to handling different types of customer queries.

## Overview

The agent system is designed with a clear separation of concerns:
- **Interface Definition**: `ECommerceAgent` interface defines the contract
- **Generic Implementation**: `CustomerServiceAgent` handles general queries
- **Specialized Agents**: Provider-specific implementations (e.g., WooCommerce, Shopify)
- **Domain Agnostic**: Universal agent for any business type

## Architecture

```
agents/
├── ecommerce-agent.ts              # TypeScript interface (contract)
├── customer-service-agent.ts       # Generic customer service agent
├── customer-service-agent-intelligent.ts  # Intelligent version
├── domain-agnostic-agent.ts        # Universal business agent
├── woocommerce-agent.ts            # WooCommerce specialization
├── shopify-agent.ts                # Shopify specialization
└── router.ts                       # Agent routing logic
```

## Core Components

### ECommerceAgent Interface (`ecommerce-agent.ts`)
Defines the contract that all agents must implement:

```typescript
interface ECommerceAgent {
  getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string;
  getActionPrompt(query: string, verificationLevel?: string): string;
  formatOrdersForAI(orders: any[]): string;
  buildCompleteContext(verificationLevel: string, customerContext: string, verificationPrompt: string, userQuery: string): string;
}
```

### Customer Service Agent (`customer-service-agent.ts`)
The main agent implementation with comprehensive prompt engineering:

**Key Features:**
- **Verification Levels**: Handles 'full', 'basic', and 'none' customer verification states
- **Anti-Hallucination**: Strict guidelines to prevent false information
- **Smart Query Detection**: Differentiates between general and order-specific queries
- **Product Display Logic**: Always shows available products before asking for clarification
- **Formatting Requirements**: Enforces clean, scannable responses with proper markdown

**Verification Handling:**
```typescript
// Not verified - asks for email/order number
CustomerServiceAgent.getEnhancedSystemPrompt('none', false)

// Basic verification - limited access
CustomerServiceAgent.getEnhancedSystemPrompt('basic', true)

// Full verification - complete access
CustomerServiceAgent.getEnhancedSystemPrompt('full', true)
```

**Usage Examples:**
```typescript
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';

// Get system prompt for unverified customer
const prompt = CustomerServiceAgent.getEnhancedSystemPrompt('none', false);

// Build complete context for AI
const context = CustomerServiceAgent.buildCompleteContext(
  'full',
  customerData,
  verificationPrompt,
  userQuery
);

// Format orders for AI consumption
const formattedOrders = CustomerServiceAgent.formatOrdersForAI(orders);
```

### Domain Agnostic Agent (`domain-agnostic-agent.ts`)
Universal agent that works for any business type without e-commerce specifics:

**Features:**
- Generic business support capabilities
- No WooCommerce/order-specific logic
- Flexible for various business models
- Service-oriented responses

### WooCommerce Agent (`woocommerce-agent.ts`)
Specialized agent for WooCommerce-specific functionality:

**Capabilities:**
- Order management guidance
- Product recommendations
- Cart assistance
- Shipping and billing support
- Return and refund processes

## Agent Router (`router.ts`)

Determines which agent to use based on context:

```typescript
export function selectAgent(query: string, hasWooCommerce: boolean): ECommerceAgent {
  if (hasWooCommerce && isOrderRelated(query)) {
    return new WooCommerceAgent();
  }
  return new CustomerServiceAgent();
}
```

## Key Design Principles

### 1. Anti-Hallucination Strategy
All agents implement strict anti-hallucination measures:
- Never recommend external competitors
- Only reference own website/domain
- Admit uncertainty rather than making false claims
- Use exact templates for verification requests

### 2. Product Query Philosophy
```typescript
// ✅ Always show products first
"Here are the available options:"
• [Product Name](url)
• [Another Product](url)

// ❌ Never ask "which type" before showing options
"What type of product are you looking for?"
```

### 3. Verification Flow
```typescript
// Unverified customer asking about orders
"I can help you track your order. Please provide your order number or email address so I can look it up."

// Customer provides email
"Thank you for providing your email. Let me look up your orders..."

// Display orders if found
"You have 2 orders:
• Order #12345 - Jan 15, 2024 - Processing - $299.99
• Order #12346 - Jan 10, 2024 - Completed - $149.99"
```

### 4. Response Formatting
- **Compact markdown links**: `[Product Name](url)` never raw URLs
- **Double line breaks**: Each bullet point on separate line
- **Concise responses**: 2-4 sentences or up to 8 brief bullets
- **Scannable format**: Break information into readable chunks

## Integration with Chat System

The agents integrate with the main chat system through:

```typescript
// In API route
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';

const agent = new CustomerServiceAgent();
const systemPrompt = agent.getEnhancedSystemPrompt(verificationLevel, hasCustomerData);
const context = agent.buildCompleteContext(verificationLevel, customerContext, verificationPrompt, userQuery);

// Send to OpenAI with context
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: context },
    { role: "user", content: userQuery }
  ]
});
```

## Backwards Compatibility

For legacy code compatibility:
```typescript
// Old import (still works)
import { WooCommerceAIInstructions } from '@/lib/woocommerce-ai-instructions';

// Maps to:
export const WooCommerceAIInstructions = new WooCommerceAgent();
```

## Testing

Test agents with different scenarios:

```typescript
import { CustomerServiceAgent } from '@/lib/agents/customer-service-agent';

const agent = new CustomerServiceAgent();

// Test unverified customer
const prompt1 = agent.getActionPrompt("show me my orders", "none");
expect(prompt1).toContain("I'd be happy to help you with your recent orders");

// Test verified customer
const prompt2 = agent.getActionPrompt("user@example.com", "full");
expect(prompt2).toContain("Customer provided email");
```

## Best Practices

### 1. Prompt Engineering
- Use specific templates for common scenarios
- Maintain consistent tone and language
- Test prompts with real customer queries
- Document prompt changes and their impact

### 2. Context Building
- Include relevant customer data when available
- Provide clear verification status
- Add product context when showing recommendations
- Keep context concise but complete

### 3. Error Handling
- Always provide helpful alternatives
- Guide customers toward resolution
- Escalate complex issues appropriately
- Maintain professional tone even for difficult queries

### 4. Performance
- Cache frequently used prompts
- Minimize token usage where possible
- Use lazy loading for large context
- Profile prompt performance regularly

## Configuration

**Environment Variables:**
None - Agents use configuration from customer database records

**Dependencies:**
- OpenAI GPT-4 for chat completion
- Customer verification system
- WooCommerce/Shopify provider integrations

## Troubleshooting

**Issue:** Agent produces hallucinated information
- **Solution:** Check that anti-hallucination guidelines are properly included in system prompt
- **Test:** Run `npx tsx test-hallucination-prevention.ts` to verify safeguards

**Issue:** Customer verification not working properly
- **Solution:** Verify verification level is being passed correctly ('none', 'basic', 'full')
- **Check:** Review customer-verification.ts for verification logic

**Issue:** Agent not showing products before asking questions
- **Solution:** Review Product Query Philosophy in this README - agents should always show available products first

## Related Documentation

**Internal:**
- [lib/woocommerce-ai-instructions.ts](/Users/jamesguy/Omniops/lib/woocommerce-ai-instructions.ts) - Legacy compatibility shim
- [app/api/chat/route.ts](/Users/jamesguy/Omniops/app/api/chat/route.ts) - Main chat integration
- [lib/customer-verification.ts](/Users/jamesguy/Omniops/lib/customer-verification.ts) - Customer verification logic
- [lib/embeddings.ts](/Users/jamesguy/Omniops/lib/embeddings.ts) - Content search integration
- [lib/agents/providers/](/Users/jamesguy/Omniops/lib/agents/providers/) - E-commerce provider implementations

**External:**
- [OpenAI Chat Completions API](https://platform.openai.com/docs/guides/chat)

## Contributing

When modifying agents:

1. **Test thoroughly** with different verification levels
2. **Maintain backwards compatibility** with existing integrations
3. **Document prompt changes** and their expected behavior
4. **Follow the interface** defined in `ECommerceAgent`
5. **Update tests** to cover new functionality

The agent system is critical for providing accurate, helpful customer service responses while maintaining security and preventing hallucinations.
