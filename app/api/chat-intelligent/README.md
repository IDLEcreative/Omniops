# Intelligent Chat API

The advanced chat endpoint featuring parallel tool execution, enhanced AI reasoning, and comprehensive telemetry.

## Overview

This endpoint provides next-generation chat functionality with GPT-5-mini support, parallel search execution, detailed cost tracking, and superior reasoning capabilities. It's the recommended endpoint for production use.

## Endpoints

### POST `/api/chat-intelligent`

Processes chat messages using advanced AI reasoning with parallel tool execution and comprehensive analytics.

#### Authentication
- **Type**: Domain-based rate limiting (no authentication required)
- **Rate Limits**: 100 requests/minute per domain (default)

#### Request Format

```json
{
  "message": "I need parts for a Cifa concrete pump, specifically for the DC66-10P model",
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
  "message": "I found several parts compatible with the Cifa DC66-10P concrete pump...",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "sources": [
    {
      "url": "https://example.com/cifa-parts/dc66-10p",
      "title": "Cifa DC66-10P Replacement Parts",
      "relevance": 0.95
    }
  ],
  "searchMetadata": {
    "iterations": 2,
    "totalSearches": 4,
    "searchLog": [
      {
        "tool": "search_products",
        "query": "Cifa DC66-10P parts",
        "resultCount": 15,
        "source": "semantic"
      }
    ]
  },
  "tokenUsage": {
    "input": 1240,
    "output": 380,
    "total": 1620,
    "estimatedCostUSD": "0.004860"
  }
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

## Key Features

### Advanced AI Models
- **Primary**: GPT-5-mini with reasoning capabilities
- **Fallback**: GPT-4.1 for reliability
- **Automatic Fallback**: Seamless model switching on failures

### Parallel Tool Execution
- **Concurrent Search**: Multiple searches execute simultaneously
- **Faster Response**: 50-70% faster than sequential execution
- **Better Context**: AI sees all results before responding

### Comprehensive Telemetry
- **Token Tracking**: Input/output/total tokens and costs
- **Performance Metrics**: Response times, iterations, searches
- **Cost Analytics**: Real-time cost calculation and projections
- **Model Analytics**: Performance breakdown by AI model

### Enhanced Tool Functions
- `woocommerce_agent`: Complete e-commerce system handler
- `search_products`: Semantic product search
- `search_by_category`: Category-based browsing  
- `get_product_details`: Detailed product information
- `order_lookup`: Secure order information lookup

### Security Features
- **Customer Verification**: Multi-level security for sensitive operations
- **Domain Validation**: Automatic domain verification and normalization
- **Rate Limiting**: Configurable per-domain limits

## Configuration

### AI Configuration
```json
{
  "ai": {
    "maxSearchIterations": 3,    // 1-5, default: 3
    "searchTimeout": 60000       // 1000-120000ms, default: 60s
  }
}
```

### Feature Flags
```json
{
  "features": {
    "woocommerce": { "enabled": true },
    "websiteScraping": { "enabled": true }
  }
}
```

## Performance Metrics

### Response Times
- **Average**: 2-4 seconds (vs 3-6s for legacy chat)
- **P95**: <8 seconds
- **Parallel Execution**: 50-70% faster search completion

### Token Usage
- **Input**: 800-2500 tokens (including context)
- **Output**: 200-800 tokens  
- **Cost**: $0.002-$0.015 per request (GPT-5-mini)

### Search Performance
- **Concurrent Tools**: Up to 5 parallel searches
- **Result Quality**: Higher relevance through comprehensive search
- **Coverage**: More thorough product/content discovery

## Rate Limiting

- **Default**: 100 requests per minute per domain
- **Premium**: 500 requests per minute (configurable)
- **Headers**: Comprehensive rate limit information
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Examples

### Complex Product Search
```bash
curl -X POST 'http://localhost:3000/api/chat-intelligent' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "I need hydraulic seals for a Cifa DC66-10P concrete pump that are compatible with high-pressure applications",
    "session_id": "user-123",
    "domain": "example.com",
    "config": {
      "ai": {
        "maxSearchIterations": 5,
        "searchTimeout": 90000
      }
    }
  }'
```

### E-commerce Operations
```bash
curl -X POST 'http://localhost:3000/api/chat-intelligent' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Check stock levels for hydraulic pumps and add the DC66 pump to my cart",
    "session_id": "user-123",
    "domain": "example.com",
    "config": {
      "features": {
        "woocommerce": { "enabled": true }
      }
    }
  }'
```

### Order Tracking
```bash
curl -X POST 'http://localhost:3000/api/chat-intelligent' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Track my order #12345, I need to know the delivery status",
    "session_id": "user-123",
    "domain": "example.com"
  }'
```

## Telemetry & Analytics

### Cost Tracking
- Real-time token usage calculation
- Cost estimation per request
- Model-specific pricing
- Projected daily/monthly costs

### Performance Analytics
- Response time distribution
- Search iteration analysis
- Tool usage patterns
- Success/failure rates

### Search Analytics
- Query analysis and optimization
- Result relevance tracking
- Tool performance comparison
- Coverage gap identification

## WooCommerce Integration

### Supported Operations
- Product search and filtering
- Stock checking and inventory
- Order lookup and tracking
- Cart management
- Category browsing
- Shipping calculations

### Security Verification
```json
{
  "operation": "view_order",
  "parameters": {
    "orderNumber": "12345"
  }
}
```

Secure operations require customer verification:
- Email validation
- Order number verification
- Session-based security levels

## Anti-Hallucination System

### Strict Grounding
- All product mentions must have search result backing
- No invented specifications or prices
- Transparent about missing information
- Clear distinction between found and inferred data

### Verification Process
- Each product reference validated against search results
- Explicit uncertainty expression when data unavailable
- User guidance toward available alternatives
- Clear source attribution

## Error Handling

### Model Fallbacks
- GPT-5-mini → GPT-4.1 automatic fallback
- Graceful degradation on API failures
- Comprehensive error logging
- User-friendly error messages

### Timeout Management
- Configurable search timeouts
- Partial result handling
- Progressive response delivery
- Retry logic for transient failures

## Monitoring & Debugging

### Telemetry Dashboard
Access via `/api/monitoring/chat`:
- Real-time performance metrics
- Cost analysis and alerts
- Model performance comparison
- Domain-specific analytics

### Debug Information
- Search iteration logs
- Tool execution timing
- Token usage breakdown
- Model selection reasoning

## Related Endpoints

- `/api/monitoring/chat` - Telemetry and analytics dashboard
- `/api/scrape` - Content indexing for search
- `/api/woocommerce/*` - E-commerce integrations
- `/api/customer/config` - Domain and integration setup

## Migration from Legacy Chat

### Benefits
- 50-70% faster response times
- Better search comprehensiveness
- Detailed cost and performance analytics
- Enhanced reasoning capabilities
- Parallel tool execution

### Configuration Migration
```json
// Legacy config
{
  "features": { "woocommerce": { "enabled": true } }
}

// Enhanced config (fully compatible)
{
  "features": { "woocommerce": { "enabled": true } },
  "ai": {
    "maxSearchIterations": 3,
    "searchTimeout": 60000
  }
}
```

## Best Practices

### Optimization
- Use appropriate `maxSearchIterations` (3-5 for complex queries)
- Set reasonable `searchTimeout` based on content size
- Enable relevant features only to reduce latency
- Monitor token usage for cost optimization

### Integration
- Implement proper error handling for model fallbacks
- Use session-based customer verification for security
- Leverage telemetry for performance monitoring
- Configure domain-specific rate limits appropriately