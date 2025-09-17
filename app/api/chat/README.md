# Chat API

The legacy chat endpoint providing AI-powered customer service responses.

## Overview

This endpoint provides traditional chat functionality with basic tool calling and semantic search. For enhanced performance and better reasoning capabilities, consider using the `/api/chat-intelligent` endpoint instead.

## Endpoints

### POST `/api/chat`

Processes chat messages and returns AI-generated responses with contextual information.

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
      "searchTimeout": 60000
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
  "message": "I found several hydraulic pumps suitable for construction equipment...",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "sources": [
    {
      "url": "https://example.com/products/hydraulic-pump-xyz",
      "title": "Heavy Duty Hydraulic Pump",
      "relevance": 0.92
    }
  ]
}
```

#### Error Responses

```json
// Rate limit exceeded
{
  "error": "Rate limit exceeded. Please try again later."
}

// Service unavailable
{
  "error": "Service temporarily unavailable",
  "message": "The chat service is currently undergoing maintenance. Please try again later."
}

// Invalid request
{
  "error": "Invalid request format",
  "details": [
    {
      "path": ["message"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

## Features

### AI-Powered Search
- **Semantic Search**: Uses OpenAI embeddings for content matching
- **WooCommerce Integration**: Searches products when configured
- **Multi-source Results**: Combines website content and e-commerce data

### Anti-Hallucination System
- Strict grounding to search results only
- No invented product names or specifications
- Transparent about missing information

### Tool Functions
- `search_products`: Search website content for products
- `search_by_category`: Browse by category or topic
- `get_product_details`: Get detailed product information
- `order_lookup`: Look up order information (requires verification)
- `woocommerce_agent`: Complete e-commerce operations

## Rate Limiting

- **Default**: 100 requests per minute per domain
- **Headers**: Response includes rate limit information
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Performance

- **Average Response Time**: ~2-5 seconds
- **Token Usage**: ~500-2000 tokens per request
- **Search Timeout**: 60 seconds (configurable)
- **Max Iterations**: 3 search rounds (configurable)

## Examples

### Basic Product Search
```bash
curl -X POST 'http://localhost:3000/api/chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Do you have any torque wrenches?",
    "session_id": "user-123",
    "domain": "example.com"
  }'
```

### With Configuration
```bash
curl -X POST 'http://localhost:3000/api/chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Show me all pumps under £500",
    "session_id": "user-123",
    "domain": "example.com",
    "config": {
      "features": {
        "woocommerce": { "enabled": true }
      },
      "ai": {
        "maxSearchIterations": 5,
        "searchTimeout": 90000
      }
    }
  }'
```

### Order Lookup
```bash
curl -X POST 'http://localhost:3000/api/chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What is the status of order #12345?",
    "session_id": "user-123",
    "domain": "example.com"
  }'
```

## Domain Configuration

The chat system requires proper domain configuration in the `customer_configs` table:

```sql
-- Example configuration
INSERT INTO customer_configs (domain, woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret)
VALUES ('example.com', 'https://example.com', 'ck_...', 'cs_...');
```

## Monitoring

- All requests are logged to `conversations` and `messages` tables
- No built-in telemetry (use `/api/chat-intelligent` for detailed analytics)
- Errors logged to console with structured information

## Migration Path

For enhanced performance and features, migrate to:
- `/api/chat-intelligent` - Better reasoning, parallel search, telemetry
- Consider configuration updates for optimal results

## Related Endpoints

- `/api/chat-intelligent` - Enhanced chat with better AI reasoning
- `/api/scrape` - Website content indexing
- `/api/woocommerce/*` - E-commerce integrations
- `/api/customer/config` - Domain configuration management