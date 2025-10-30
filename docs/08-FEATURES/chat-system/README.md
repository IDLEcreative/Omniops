**Last Updated:** 2025-10-24
**Verified Accurate For:** v0.1.0

# Chat System Documentation

## Overview

The OmniOps Chat System is an AI-powered customer service solution built with Next.js 15, Supabase, and OpenAI. It provides intelligent, context-aware responses through persistent conversation management, semantic search, and platform-agnostic commerce integration.

**Current Status**: Production-ready with 100% test pass rate

## Table of Contents

- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Conversation Management](#conversation-management)
- [Context Window Management](#context-window-management)
- [Hallucination Prevention](#hallucination-prevention)
- [Search Integration (RAG)](#search-integration)
- [Tool Calling](#tool-calling)
- [Streaming Responses](#streaming-responses)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Performance & Scaling](#performance-and-scaling)

## Architecture

### System Design

The chat system uses a modular, dependency-injected architecture with clear separation of concerns:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Chat Widget    │────▶│  /api/chat       │────▶│    Supabase     │
│  (Next.js UI)   │     │  Route Handler   │     │  (PostgreSQL)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                          │
                               ├──────────┐               │
                               ▼          ▼               ▼
                        ┌──────────┐  ┌─────────┐  ┌─────────────┐
                        │ OpenAI   │  │Commerce │  │ Embeddings  │
                        │ GPT-5    │  │Provider │  │  (pgvector) │
                        └──────────┘  └─────────┘  └─────────────┘
```

### Component Breakdown

#### 1. Route Handler (`app/api/chat/route.ts`)
- Request validation using Zod schemas
- Rate limiting per domain
- Conversation initialization
- Message persistence
- AI response generation
- Error handling and fallbacks

#### 2. Conversation Manager (`lib/chat/conversation-manager.ts`)
- Domain lookup and configuration
- Conversation creation and retrieval
- Message saving (user and assistant)
- Conversation history loading
- Session management

#### 3. AI Processor (`lib/chat/ai-processor.ts`)
- OpenAI API integration
- System prompt construction
- Context injection
- Response streaming
- Token tracking

#### 4. Tool System (`lib/chat/tool-definitions.ts`, `lib/chat/tool-handlers.ts`)
- Tool definitions for OpenAI function calling
- Tool execution handlers
- Product search
- Category browsing
- Order lookup

#### 5. Commerce Integration (`lib/agents/commerce-provider.ts`)
- Platform-agnostic commerce abstraction
- WooCommerce support
- Shopify support
- Product search and details
- Stock checking

### Data Flow

```
1. Client Request
   └─▶ Validation (Zod schema)
       └─▶ Rate Limiting (per domain)
           └─▶ Domain Lookup (customer_configs)
               └─▶ Conversation Management
                   └─▶ Context Retrieval (history + embeddings)
                       └─▶ AI Processing (OpenAI)
                           └─▶ Response Generation
                               └─▶ Message Persistence
                                   └─▶ Client Response
```

## API Reference

### POST /api/chat

Main chat endpoint for processing user messages.

#### Request Body

```typescript
{
  // Required fields
  message: string;              // User's message (max 5000 chars)
  session_id: string;           // UUID v4 session identifier

  // Optional fields
  conversation_id?: string;     // Continue existing conversation
  domain?: string;              // Website domain for context
  demoId?: string;              // Demo session identifier

  // Configuration
  config?: {
    features?: {
      woocommerce?: { enabled: boolean };
      websiteScraping?: { enabled: boolean };
    }
  };

  // User context (from WordPress/WooCommerce)
  userData?: {
    userId?: string;
    firstName?: string;
    email?: string;
    isLoggedIn?: boolean;
    customerGroup?: string;
    totalOrders?: number;
  };

  // Page context
  pageContext?: {
    pageType?: string;
    productId?: string;
    categoryId?: string;
    currentUrl?: string;
  };

  // Cart data
  cartData?: {
    itemCount?: number;
    cartTotal?: number;
    items?: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}
```

#### Response

```typescript
{
  message: string;              // AI assistant's response
  conversation_id: string;      // Conversation UUID for continuity
  sources?: Array<{            // Optional context sources
    url: string;
    title: string;
    relevance: number;
  }>;
  metadata?: {
    tokensUsed?: number;
    searchResults?: number;
    responseTime?: number;
  };
}
```

#### Status Codes

- `200 OK`: Successful response
- `400 Bad Request`: Invalid input (missing fields, oversized message)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server or AI API error

#### Example Usage

```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What are your shipping policies?',
    session_id: crypto.randomUUID(),
    domain: 'example.com',
    userData: {
      isLoggedIn: true,
      firstName: 'John',
      email: 'john@example.com'
    }
  })
});

const data = await response.json();
console.log(data.message);          // AI response
console.log(data.conversation_id);  // Save for follow-ups
```

## Conversation Management

### Architecture

Conversations are persisted in Supabase with a two-table structure:

```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Flow

1. **New Conversation**
   - Client generates session_id (UUID v4)
   - First message creates conversation record
   - Conversation ID returned to client

2. **Continuing Conversation**
   - Client provides conversation_id from previous response
   - System loads conversation history (last 10 messages)
   - History included in AI context for continuity

3. **Message Persistence**
   - User messages saved asynchronously (non-blocking)
   - Assistant responses saved after generation
   - All messages include metadata (sources, timestamps, etc.)

### Session Management

```typescript
// Client-side session generation
function getChatSessionId() {
  let sessionId = sessionStorage.getItem('chat_session_id');

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('chat_session_id', sessionId);
  }

  return sessionId;
}
```

### Context Preservation

The system maintains context across messages:

```typescript
// Loading conversation history
const history = await getConversationHistory(conversationId, limit: 10);

// History format for AI
const messages = [
  { role: 'system', content: systemPrompt },
  ...history.map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: currentMessage }
];
```

**Test Results:**
- Maintains context across 10+ message exchanges
- Correctly references previously mentioned products
- Understands implicit references ("that one", "the first item")
- Preserves price and product details throughout conversation

## Context Window Management

### Strategy

The chat system uses a sliding window approach to manage OpenAI's context limits:

1. **System Prompt**: ~500-3,000 characters (depending on USE_SIMPLIFIED_PROMPT)
2. **Search Context**: Top 5-10 relevant chunks (~600 chars each)
3. **Conversation History**: Last 10 messages
4. **Current Message**: User's latest input

### Token Budget

```typescript
// Approximate token allocation (GPT-5-mini)
const TOKEN_BUDGET = {
  systemPrompt: 500,      // Core instructions
  searchContext: 2000,    // Embeddings results
  history: 1500,          // Last 10 messages
  userMessage: 500,       // Current input
  response: 1000,         // AI generation
  // Total: ~5,500 tokens
};
```

### Context Pruning

When approaching limits:
1. Remove oldest messages first
2. Preserve system prompt (always required)
3. Keep most recent 3-5 messages minimum
4. Maintain search context (critical for accuracy)

## Hallucination Prevention

**See full guide**: [docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md](./docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)

### Core Principles

The chat system implements strict anti-hallucination measures:

1. **Ground in Search Results**: Only mention products/info from search results
2. **Admit Uncertainty**: Say "I don't have that information" when data is missing
3. **No Speculation**: Never invent specifications, prices, or stock levels
4. **Source Attribution**: Include sources for all factual claims

### Forbidden Responses

The AI will NEVER provide these without explicit data:
- Specific technical specifications (horsepower, dimensions, weight)
- Stock quantities or availability numbers
- Delivery timeframes or shipping dates
- Warranty terms or guarantee periods
- Compatibility claims between products
- Price comparisons or discount amounts
- Manufacturing locations or origins
- Installation instructions or procedures

### Implementation

```typescript
// System prompt includes strict rules
const ANTI_HALLUCINATION_RULES = `
CRITICAL ANTI-HALLUCINATION RULES:
- ONLY mention products that appear in your search results
- NEVER invent or assume products exist
- If searching returns no results, clearly state it's not available
- Each product mentioned MUST have a corresponding search result
- When information is not available, say: "I don't have that specific
  information. Please contact customer service for [details requested]."
`;
```

### Testing

Run hallucination prevention tests:
```bash
npx tsx test-hallucination-prevention.ts
```

## Search Integration (RAG)

### Hybrid Search Strategy

The system uses Retrieval-Augmented Generation (RAG) with multiple search methods:

1. **Semantic Search** (Primary)
   - Vector embeddings via pgvector
   - Similarity threshold: 0.15-0.25 (configurable)
   - Top 100-200 results possible (see docs/SEARCH_ARCHITECTURE.md)

2. **Commerce Search** (Optional)
   - WooCommerce/Shopify product search
   - SKU matching
   - Category filtering

3. **Keyword Search** (Fallback)
   - Full-text search on scraped content
   - Useful when semantic search returns few results

### Search Flow

```typescript
// 1. Semantic search on embeddings
const embedResults = await searchSimilarContent(
  query,
  domain,
  limit: 100,
  minSimilarity: 0.15
);

// 2. Commerce search (if configured)
const provider = await getCommerceProvider(domain);
if (provider) {
  const products = await provider.searchProducts(query, { limit: 10 });
}

// 3. Combine and rank results
const combinedResults = rankAndDedupe([...embedResults, ...products]);
```

### Performance

**See**: docs/PERFORMANCE_OPTIMIZATION.md for detailed analysis

- Average search time: 200-500ms
- Average response time: 2-3 seconds
- 100-200 search results processed (not 20!)
- Parallel execution for multiple searches

## Tool Calling

### Available Tools

The chat system uses OpenAI function calling for structured operations:

#### 1. search_products
Search for products by query string.

```typescript
{
  name: "search_products",
  parameters: {
    query: string,      // Search query
    limit?: number      // Max results (default: 10)
  }
}
```

#### 2. search_by_category
Browse products by category.

```typescript
{
  name: "search_by_category",
  parameters: {
    category: string,   // Category name or slug
    limit?: number      // Max results (default: 10)
  }
}
```

#### 3. get_product_details
Get detailed information about a specific product.

```typescript
{
  name: "get_product_details",
  parameters: {
    productId: string   // Product ID or SKU
  }
}
```

#### 4. lookup_order
Look up order details (requires authentication).

```typescript
{
  name: "lookup_order",
  parameters: {
    orderId: string,    // Order number
    email: string       // Customer email for verification
  }
}
```

### Tool Execution

```typescript
// AI decides which tools to call
const response = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  tools: SEARCH_TOOLS,
  tool_choice: 'auto'
});

// Execute tools in parallel
if (response.choices[0].message.tool_calls) {
  const results = await Promise.all(
    response.choices[0].message.tool_calls.map(executeToolCall)
  );
}
```

## Streaming Responses

### Implementation Status

**Current**: Non-streaming (buffered responses)
**Planned**: Server-Sent Events (SSE) streaming

### Future Streaming Architecture

```typescript
// Planned implementation
const stream = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    // Send SSE event
    res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
}
```

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-proj-...

# Optional
USE_SIMPLIFIED_PROMPT=true          # Concise responses (recommended)
USE_GPT5_MINI=true                  # Use GPT-5-mini model
MAX_SEARCH_RESULTS=100              # Search result limit
MIN_SIMILARITY=0.15                 # Embedding similarity threshold

# Commerce Integration
WOOCOMMERCE_URL=https://store.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
```

### Response Modes

#### Simplified Mode (Recommended)
- `USE_SIMPLIFIED_PROMPT=true`
- Target: <75 words per response
- System prompt: ~294 characters
- Best for: Production, customer-facing

#### Detailed Mode
- `USE_SIMPLIFIED_PROMPT=false`
- No word limit
- System prompt: ~3,431 characters
- Best for: Complex queries, technical support

### Model Configuration

```typescript
// GPT-5-mini (recommended)
const config = {
  model: 'gpt-5-mini',
  max_completion_tokens: 2500,
  reasoning_effort: 'low',
};

// GPT-4.1 (fallback)
const config = {
  model: 'gpt-4.1',
  temperature: 0.7,
  max_tokens: 1000,
};
```

## Testing

### Test Suite

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Specific chat tests
npx tsx test-chat-integration.ts
npx tsx test-hallucination-prevention.ts
npx tsx test-conversation-context.ts
```

### Test Coverage

| Test Category | Coverage | Key Files |
|--------------|----------|-----------|
| Route Handler | 100% | `__tests__/api/chat/route.test.ts` |
| Conversation Manager | 100% | `__tests__/lib/chat/conversation-manager.test.ts` |
| Tool Execution | 100% | `__tests__/lib/chat/tool-handlers.test.ts` |
| Hallucination Prevention | 100% | `test-hallucination-prevention.ts` |
| Context Preservation | 100% | `test-conversation-context.ts` |

### Manual Testing Checklist

- [ ] Create new conversation
- [ ] Continue existing conversation
- [ ] Test with invalid UUID
- [ ] Test with oversized message (>5000 chars)
- [ ] Test concurrent requests
- [ ] Verify database persistence
- [ ] Test embeddings search
- [ ] Test commerce integration
- [ ] Test rate limiting
- [ ] Test error recovery
- [ ] Verify hallucination prevention
- [ ] Test context preservation across 10+ messages

## Troubleshooting

### Common Issues

#### 1. "Could not find the table 'conversations'"
**Cause**: Wrong Supabase project or tables not created

**Solution**:
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Check database connection
npx tsx verify-supabase.js

# Create tables if missing (see 09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
```

#### 2. "Invalid input syntax for type uuid"
**Cause**: Session ID is not a valid UUID

**Solution**:
```javascript
// Ensure client uses proper UUID generation
const sessionId = crypto.randomUUID();

// Validate format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
```

#### 3. Rate Limiting Not Working
**Cause**: High limit (100/minute) or domain not tracked

**Solution**:
```typescript
// Check rate limit configuration
import { RATE_LIMITS } from '@/constants';
console.log(RATE_LIMITS);

// Test with lower limit
const result = await checkDomainRateLimit('example.com');
```

#### 4. Context Not Preserved
**Cause**: conversation_id not provided or incorrect

**Solution**:
```javascript
// Ensure conversation_id from previous response is used
let conversationId = null;

const response1 = await chat({ message: 'Hello', session_id });
conversationId = response1.conversation_id;

const response2 = await chat({
  message: 'Follow-up',
  session_id,
  conversation_id  // Include this!
});
```

#### 5. No Search Results
**Cause**: Domain has no scraped content or similarity threshold too high

**Solution**:
```bash
# Check for scraped content
npx tsx test-database-cleanup.ts stats

# Scrape website if needed
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","url":"https://example.com"}'

# Adjust similarity threshold
MIN_SIMILARITY=0.10  # Lower threshold
```

## Performance & Scaling

### Current Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Average Response Time | 2.0s | <3s |
| Search Time | 200-500ms | <1s |
| Database Write | <100ms | <200ms |
| Concurrent Users | 10+ | 50+ |
| Rate Limit | 100/min/domain | Configurable |

### Optimization Strategies

#### 1. Caching
```typescript
// Implement query cache
const cacheKey = `chat:${domain}:${hashQuery(message)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Cache for 5 minutes
await redis.setex(cacheKey, 300, JSON.stringify(result));
```

#### 2. Connection Pooling
```typescript
// Supabase connection pool
const supabase = createClient(url, key, {
  db: {
    pool: {
      min: 5,
      max: 20
    }
  }
});
```

#### 3. Parallel Processing
```typescript
// Execute searches in parallel
const [embedResults, wooResults, history] = await Promise.all([
  searchSimilarContent(query, domain),
  provider?.searchProducts(query),
  getConversationHistory(conversationId)
]);
```

#### 4. Database Indexing
```sql
-- Ensure proper indexes exist
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### Scaling Considerations

**Horizontal Scaling:**
- Deploy multiple Next.js instances
- Use load balancer (nginx/Vercel)
- Share session state via Redis

**Database Scaling:**
- Enable Supabase connection pooling
- Use read replicas for queries
- Implement database sharding by domain

**Cost Optimization:**
- Cache frequent queries
- Use GPT-5-mini (cheaper than GPT-4)
- Batch similar requests
- Implement response caching

## Related Documentation

- **[Hallucination Prevention](./docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)** - Detailed anti-hallucination measures
- **[Search Architecture](../../SEARCH_ARCHITECTURE.md)** - Embeddings and search internals
- **[Performance Optimization](../../PERFORMANCE_OPTIMIZATION.md)** - Response time analysis
- **[Supabase Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)** - Complete database schema
- **[Chat Route Comparison](../../CHAT_ROUTES_COMPARISON.md)** - Basic vs Intelligent routes
- **[Dependency Injection](../../DEPENDENCY_INJECTION.md)** - Testing architecture

## Version History

- **2024-12**: Simplified prompt mode, category matching improvements
- **2024-11**: Intelligent chat route with function calling
- **2024-10**: Hallucination prevention measures
- **2024-08**: Initial conversation management system
- **2024-07**: Basic chat route implementation

---

**Last Updated**: October 2024
**Maintained by**: OmniOps Development Team
