**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Chat API - Intelligent Implementation

The unified intelligent chat endpoint providing AI-powered customer service responses with advanced features.

## Current Implementation (September 2025)

This is now the single, consolidated chat endpoint with all intelligent features:
- **GPT-5-mini support**: Automatically uses GPT-5-mini when `USE_GPT5_MINI=true` environment variable is set
- **Natural inventory handling**: Recognizes search limits (20/50/100 results) as limits, not total inventory
- **Domain ID tracking**: Proper multi-tenant conversation association
- **Parallel tool execution**: Concurrent searches for faster responses
- **Smart telemetry**: Comprehensive performance and usage tracking
- **ReAct loop**: Iterative reasoning for better answers

## Endpoints

### POST `/api/chat`

Processes chat messages using intelligent AI reasoning with tool calling capabilities.

#### Authentication
- **Type**: Domain-based rate limiting (no authentication required)
- **Rate Limits**: 100 requests/minute per domain (default)

#### Request Format

```json
{
  "message": "Looking for hydraulic pumps for construction equipment",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "user-session-123",
  "domain": "example.com",
  "demoId": "demo-123",
  "config": {
    "features": {
      "woocommerce": { "enabled": true },
      "websiteScraping": { "enabled": true }
    },
    "ai": {
      "maxSearchIterations": 3,
      "searchTimeout": 10000
    }
  }
}
```

#### Required Fields
- `message` (string, 1-5000 chars): The user's chat message
- `session_id` (string): Unique session identifier

#### Optional Fields
- `conversation_id` (UUID): Existing conversation ID (creates new if omitted)
- `domain` (string): Customer domain for content filtering
- `demoId` (string): Demo session identifier
- `config` (object): Feature flags and AI configuration

#### Response Format

```json
{
  "message": "We have an extensive range of hydraulic pumps suitable for construction equipment. Here are some popular options...",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "sources": [
    {
      "url": "https://example.com/products/hydraulic-pump-xyz",
      "title": "Heavy Duty Hydraulic Pump",
      "relevance": 0.92
    }
  ],
  "searchMetadata": {
    "iterations": 2,
    "totalSearches": 3,
    "searchLog": [
      {
        "tool": "search_products",
        "query": "hydraulic pumps construction",
        "resultCount": 20,
        "source": "woocommerce"
      }
    ]
  }
}
```

## Key Features

### Intelligent Search & Response
- **Parallel Tool Execution**: Searches multiple sources simultaneously
- **Natural Language**: Handles search limits intelligently ("We have an extensive range..." vs "Found exactly 20 items")
- **ReAct Loop**: Iteratively searches and reasons until finding the best answer
- **Multi-source Integration**: Combines WooCommerce products and semantic search

### Model Selection
- **GPT-4** (default): Standard high-quality responses
- **GPT-5-mini** (when enabled): Faster responses with reasoning_effort='low'
  - Enable with: `USE_GPT5_MINI=true` in environment variables

### Tool Functions
- `search_products`: Product search with WooCommerce priority
- `search_by_category`: Category-based browsing
- `get_product_details`: Detailed product information with specs

### Anti-Hallucination
- Strict grounding to search results
- Transparent about search limits
- No invented information
- Admits uncertainty when appropriate

## Performance Metrics

- **Response Time**: 2-8 seconds (depending on search complexity)
- **Parallel Execution**: All tool calls run concurrently
- **Token Usage**: 
  - GPT-4: ~500-2000 tokens per request
  - GPT-5-mini: ~2500 max completion tokens
- **Search Iterations**: Max 3 by default (configurable)

## Telemetry

Built-in telemetry tracks:
- Session metrics and model usage
- Search performance and sources
- Iteration counts and tool usage
- Response times and error rates

## Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
USE_GPT5_MINI=true  # Enable GPT-5-mini model
NODE_ENV=development  # Enable detailed logging
```

### Domain Configuration
Configure domains in `customer_configs` table:
```sql
INSERT INTO customer_configs (domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret)
VALUES ('example.com', 'https://example.com', 'ck_...', 'cs_...');
```

## Examples

### Basic Query
```bash
curl -X POST 'http://localhost:3000/api/chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What products do you have?",
    "session_id": "user-123",
    "domain": "example.com"
  }'
```

### With Custom Configuration
```bash
curl -X POST 'http://localhost:3000/api/chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Show me pumps under £500",
    "session_id": "user-123",
    "domain": "example.com",
    "config": {
      "ai": {
        "maxSearchIterations": 5,
        "searchTimeout": 15000
      }
    }
  }'
```

## Error Handling

```json
// Rate limit exceeded
{
  "error": "Rate limit exceeded. Please try again later."
}

// Service unavailable
{
  "error": "Service temporarily unavailable",
  "message": "The chat service is currently undergoing maintenance."
}

// Invalid request
{
  "error": "Invalid request format",
  "details": [...]
}
```

## Database Schema

The chat system uses:
- `conversations`: Stores conversation metadata with domain_id
- `messages`: Stores individual messages with role (user/assistant)
- `domains`: Links domains to customer configurations
- `customer_configs`: Stores WooCommerce credentials and settings

## Monitoring & Debugging

- Console logs prefixed with `[Intelligent Chat]` for debugging
- Telemetry data available via `ChatTelemetry` class
- Search metadata included in responses for transparency
- Parallel execution stats logged for performance analysis

## Related Endpoints

- `/api/scrape` - Website content indexing
- `/api/woocommerce/*` - E-commerce integrations
- `/api/customer/config` - Domain configuration
- `/api/privacy/*` - GDPR compliance endpoints