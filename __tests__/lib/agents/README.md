# AI Agents Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 8 minutes

**Purpose:** Comprehensive test suite for AI agent routing, commerce providers, customer service agents, and intelligent query processing.

**Coverage:** Agent routing logic, WooCommerce/Shopify providers, domain-agnostic agents, and intelligent customer service responses.

**Estimated Test Count:** 80+ tests

## Overview

Agent tests validate the core AI functionality including:
- Intelligent routing of customer queries to appropriate handlers
- E-commerce provider integration (WooCommerce, Shopify)
- Domain-agnostic conversation handling
- Customer service quality and accuracy
- Multi-tenant agent initialization

## Test Structure

```
__tests__/lib/agents/
├── commerce-provider-integration.test.ts   # Commerce provider integration tests
├── commerce-provider.test.ts               # Commerce provider unit tests
├── customer-service-agent-core.test.ts     # Core agent functionality
├── customer-service-agent-intelligent.test.ts  # Intelligent response generation
├── customer-service-agent-quality.test.ts  # Response quality validation
├── domain-agnostic-agent-execution.test.ts # Execution without domain assumptions
├── domain-agnostic-agent-initialization.test.ts  # Agent initialization
├── domain-agnostic-agent-integration.test.ts  # Integration scenarios
├── router.test.ts                          # Agent routing logic
├── woocommerce-agent.test.ts              # WooCommerce-specific agent
└── providers/                              # Provider-specific tests
    ├── shopify-provider.test.ts           # Shopify integration
    └── woocommerce-provider.test.ts       # WooCommerce integration
```

## Running Tests

```bash
# Run all agent tests
npm test -- __tests__/lib/agents/

# Run specific test file
npm test -- customer-service-agent-core.test.ts

# Run provider tests only
npm test -- __tests__/lib/agents/providers/

# Run with coverage
npm test -- --coverage __tests__/lib/agents/

# Run intelligent agent tests
npm test -- --testNamePattern="intelligent"
```

## Test Files

### Core Agent Tests

**customer-service-agent-core.test.ts**

Tests fundamental customer service agent capabilities.

**Key Test Areas:**
- Agent initialization with customer config
- Message processing pipeline
- Context management
- Response generation
- Error handling

**Example Test:**
```typescript
describe('CustomerServiceAgent - Core', () => {
  it('should initialize with customer configuration', async () => {
    const agent = new CustomerServiceAgent({
      customerId: 'test-customer',
      domain: 'example.com'
    })

    expect(agent.isReady()).toBe(true)
    expect(agent.getCustomerId()).toBe('test-customer')
  })

  it('should process user messages', async () => {
    const agent = new CustomerServiceAgent(config)

    const response = await agent.processMessage({
      content: 'What are your business hours?',
      conversationId: 'conv-123'
    })

    expect(response).toHaveProperty('content')
    expect(response.content).toBeTruthy()
  })
})
```

**customer-service-agent-intelligent.test.ts**

Tests intelligent response generation and context understanding.

**Key Test Areas:**
- Natural language understanding
- Intent recognition
- Context-aware responses
- Multi-turn conversations
- Sentiment analysis

**customer-service-agent-quality.test.ts**

Tests response quality, accuracy, and safety.

**Key Test Areas:**
- Response accuracy validation
- Hallucination prevention
- Source attribution
- Safety guardrails
- Tone and professionalism

### Domain-Agnostic Agent Tests

**domain-agnostic-agent-initialization.test.ts**

Tests agent initialization without domain-specific assumptions.

**Key Test Areas:**
- Generic configuration loading
- Multi-industry support
- Dynamic capability detection
- Fallback behavior

**Example Test:**
```typescript
describe('DomainAgnosticAgent - Initialization', () => {
  it('should work for e-commerce domain', async () => {
    const agent = new DomainAgnosticAgent({
      domain: 'shop.example.com',
      industry: 'ecommerce'
    })

    expect(agent.getCapabilities()).toContain('product_search')
    expect(agent.getCapabilities()).toContain('order_tracking')
  })

  it('should work for restaurant domain', async () => {
    const agent = new DomainAgnosticAgent({
      domain: 'restaurant.example.com',
      industry: 'food_service'
    })

    expect(agent.getCapabilities()).toContain('menu_inquiry')
    expect(agent.getCapabilities()).toContain('reservation')
  })
})
```

**domain-agnostic-agent-execution.test.ts**

Tests execution across different business types.

**Key Test Areas:**
- Industry-agnostic query handling
- Dynamic capability invocation
- Graceful degradation
- Unsupported operation handling

**domain-agnostic-agent-integration.test.ts**

Tests integration with various backend systems.

**Key Test Areas:**
- Integration with multiple data sources
- Cross-industry tool usage
- Unified response formatting
- Multi-tenant isolation

### Router Tests

**router.test.ts**

Tests agent routing logic for query classification.

**Key Test Areas:**
- Query classification
- Agent selection
- Routing priority
- Fallback routing
- Performance metrics

**Example Test:**
```typescript
describe('AgentRouter', () => {
  it('should route product queries to commerce provider', async () => {
    const router = new AgentRouter()

    const route = await router.route({
      query: 'Do you have blue widgets in stock?',
      domain: 'example.com'
    })

    expect(route.handler).toBe('commerce_provider')
    expect(route.confidence).toBeGreaterThan(0.8)
  })

  it('should route general queries to customer service agent', async () => {
    const router = new AgentRouter()

    const route = await router.route({
      query: 'What are your business hours?',
      domain: 'example.com'
    })

    expect(route.handler).toBe('customer_service')
  })
})
```

### Commerce Provider Tests

**commerce-provider.test.ts**

Unit tests for abstract commerce provider interface.

**Key Test Areas:**
- Provider interface compliance
- Product search abstraction
- Order tracking abstraction
- Inventory checking
- Error handling

**commerce-provider-integration.test.ts**

Integration tests for commerce providers.

**Key Test Areas:**
- Multi-provider support
- Automatic provider detection
- Fallback mechanisms
- Provider switching
- Data normalization

**woocommerce-agent.test.ts**

WooCommerce-specific agent tests.

**Key Test Areas:**
- WooCommerce API integration
- Product catalog access
- Order management
- Customer data retrieval
- Webhook handling

### Provider-Specific Tests

**providers/woocommerce-provider.test.ts**

WooCommerce provider implementation tests.

**Key Test Areas:**
- Product search via WooCommerce API
- Order lookup
- Customer authentication
- Cart operations
- API error handling

**Example Test:**
```typescript
describe('WooCommerceProvider', () => {
  it('should search products by query', async () => {
    const provider = new WooCommerceProvider(config)

    const results = await provider.searchProducts('blue widget')

    expect(results).toBeArray()
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toHaveProperty('id')
    expect(results[0]).toHaveProperty('name')
  })

  it('should handle API rate limiting', async () => {
    mockWooCommerce.get.mockRejectedValue(
      new Error('Rate limit exceeded')
    )

    const provider = new WooCommerceProvider(config)

    await expect(
      provider.searchProducts('widget')
    ).rejects.toThrow('Rate limit exceeded')
  })
})
```

**providers/shopify-provider.test.ts**

Shopify provider implementation tests.

**Key Test Areas:**
- Shopify GraphQL API integration
- Product variant handling
- Collections and categories
- Customer data access
- Metafields support

## Testing Patterns

### Agent Response Validation
```typescript
it('should return well-formed responses', async () => {
  const agent = new CustomerServiceAgent(config)

  const response = await agent.processMessage({
    content: 'Hello',
    conversationId: 'conv-123'
  })

  expect(response).toMatchObject({
    content: expect.any(String),
    conversationId: 'conv-123',
    metadata: expect.any(Object)
  })
})
```

### Multi-Turn Conversation Testing
```typescript
it('should maintain context across turns', async () => {
  const agent = new CustomerServiceAgent(config)
  const conversationId = 'conv-test'

  // First turn
  await agent.processMessage({
    content: 'I want to buy a widget',
    conversationId
  })

  // Second turn - should remember context
  const response = await agent.processMessage({
    content: 'What colors do you have?',
    conversationId
  })

  expect(response.content).toContain('widget')
})
```

### Provider Abstraction Testing
```typescript
it('should work with any commerce provider', async () => {
  const providers = [
    new WooCommerceProvider(wooConfig),
    new ShopifyProvider(shopifyConfig)
  ]

  for (const provider of providers) {
    const results = await provider.searchProducts('test')
    expect(results).toBeArray()
  }
})
```

## Mock Setup

### OpenAI Mocking
```typescript
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockChatResponse)
      }
    }
  }))
}))
```

### Commerce API Mocking
```typescript
const mockWooCommerce = {
  get: jest.fn().mockResolvedValue({ data: mockProducts }),
  post: jest.fn().mockResolvedValue({ data: { success: true } })
}

jest.mock('@/lib/woocommerce-api', () => ({
  createWooCommerceClient: jest.fn(() => mockWooCommerce)
}))
```

## Coverage Targets

| Component | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| Agent Core | 90%+ | 95%+ | 85%+ | 90%+ |
| Routing | 95%+ | 100% | 90%+ | 95%+ |
| Providers | 85%+ | 90%+ | 80%+ | 85%+ |
| Integration | 80%+ | 85%+ | 75%+ | 80%+ |

## Best Practices

1. **Test agent behavior, not AI output**: Focus on structure and logic, not exact AI responses
2. **Mock external APIs**: Never make real API calls in tests
3. **Test error paths**: Verify graceful degradation
4. **Test multi-tenancy**: Ensure agents are isolated per customer
5. **Validate response quality**: Check for hallucination prevention
6. **Test performance**: Measure response times

## Related Code

- **Source Agents**: `/lib/agents/` - Agent implementations
- **Providers**: `/lib/agents/providers/` - Commerce provider implementations
- **Router**: `/lib/agents/router.ts` - Routing logic
- **API Routes**: `/app/api/chat/` - Chat API using agents

## Troubleshooting

### Common Issues

1. **"OpenAI API key missing"**: Check mock setup in beforeEach
2. **"Provider not found"**: Verify provider registration
3. **"Conversation context lost"**: Check session management mocks
4. **"Flaky tests"**: Ensure mocks are properly reset between tests

### Debug Tips

```bash
# Run with detailed agent logging
DEBUG=agent:* npm test -- customer-service-agent-core.test.ts

# Test specific agent scenario
npm test -- --testNamePattern="should handle product queries"
```

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [Library Tests](/Users/jamesguy/Omniops/__tests__/lib/README.md) - Business logic tests
- [Agent Architecture](../../../docs/01-ARCHITECTURE/ARCHITECTURE_AI_AGENTS.md) - Agent design patterns
