# Chat API Reference

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 23 minutes

## Purpose
The Chat API provides AI-powered conversational capabilities with Retrieval-Augmented Generation (RAG) for contextual responses.

## Quick Links
- [Endpoint](#endpoint)
- [Overview](#overview)
- [Authentication](#authentication)
- [Request](#request)
- [Response](#response)

## Keywords
advanced, api, authentication, best, chat, codes, documentation, endpoint, error, examples

---


The Chat API provides AI-powered conversational capabilities with Retrieval-Augmented Generation (RAG) for contextual responses.

## Endpoint

```
POST /api/chat
```

## Overview

The Chat API processes user messages and returns AI-generated responses using:
- OpenAI GPT-4 for conversational AI
- Vector embeddings for semantic search
- WooCommerce/Shopify integration for e-commerce context
- Real-time inventory and order information

## Authentication

No authentication required for basic chat. Domain-based isolation ensures multi-tenant security.

## Request

### Headers

```
Content-Type: application/json
```

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | Yes | User's message text |
| `domain` | string | Yes | Customer's domain for context |
| `conversationId` | string | No | Existing conversation ID to continue |
| `sessionId` | string | No | User session identifier |
| `context` | object | No | Additional context (e.g., cart data) |

### Example Request

```json
{
  "message": "Do you have the XL pump in stock?",
  "domain": "example.com",
  "conversationId": "conv_123abc",
  "sessionId": "session_xyz789",
  "context": {
    "currentPage": "/products/pumps",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## Response

### Success Response

**Status Code**: `200 OK`

```json
{
  "response": "Yes, we have the XL pump in stock! We currently have 15 units available. The price is $299.99 and it comes with a 2-year warranty. Would you like me to help you place an order?",
  "conversationId": "conv_123abc",
  "sources": [
    {
      "title": "Product: XL Industrial Pump",
      "url": "https://example.com/products/xl-pump",
      "relevance": 0.95
    }
  ],
  "metadata": {
    "tokensUsed": 450,
    "responseTime": 1250,
    "searchResults": 5,
    "confidence": 0.92
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | AI-generated response text |
| `conversationId` | string | Conversation ID for follow-ups |
| `sources` | array | Sources used to generate response |
| `metadata` | object | Performance and confidence metrics |

### Error Response

**Status Code**: `400 Bad Request` / `500 Internal Server Error`

```json
{
  "error": "Invalid request",
  "message": "Message text is required",
  "details": {
    "field": "message",
    "issue": "Cannot be empty"
  }
}
```

## Examples

### Basic Chat Query

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your business hours?",
    "domain": "example.com"
  }'
```

### Continue Existing Conversation

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What about shipping costs?",
    "domain": "example.com",
    "conversationId": "conv_123abc"
  }'
```

### Product Inquiry with E-commerce Integration

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you check my order status? My email is customer@example.com",
    "domain": "store.example.com",
    "context": {
      "customerEmail": "customer@example.com"
    }
  }'
```

## Features

### Retrieval-Augmented Generation (RAG)

The Chat API automatically:
1. Searches website content embeddings
2. Finds relevant context (products, FAQs, pages)
3. Includes context in AI prompt
4. Returns responses based on actual data

**Result**: Accurate, contextual answers instead of generic responses.

### E-commerce Integration

When WooCommerce/Shopify is configured:
- Real-time inventory checks
- Order status lookups
- Customer verification
- Product recommendations
- Pricing information

### Multi-language Support

Automatically detects and responds in 40+ languages:
- Spanish, French, German
- Mandarin, Japanese, Korean
- Portuguese, Italian, Dutch
- And many more...

### Conversation History

Maintains context across messages:
- Remembers previous questions
- Understands follow-up queries
- Tracks conversation flow
- Provides coherent multi-turn dialogues

## Rate Limiting

- **Rate**: 60 requests per minute per domain
- **Burst**: Up to 10 concurrent requests
- **Headers**:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time until reset (Unix timestamp)

**Rate Limit Exceeded Response**:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

## Performance

### Response Times

| Scenario | Typical Response Time |
|----------|----------------------|
| Simple query (no search) | 500-800ms |
| With vector search | 1-2 seconds |
| With e-commerce lookup | 1.5-3 seconds |
| Complex multi-step query | 2-4 seconds |

### Optimization Tips

1. **Reuse conversation IDs**: Maintains context without extra processing
2. **Provide specific context**: Reduces search scope
3. **Batch related questions**: Better than multiple separate queries
4. **Cache common queries**: Use query cache for frequent questions

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_REQUEST` | Missing or invalid parameters |
| 400 | `INVALID_DOMAIN` | Domain not configured |
| 401 | `UNAUTHORIZED` | Invalid credentials (if auth enabled) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | AI service temporarily unavailable |

## Best Practices

### Request Optimization

```javascript
// ✅ Good: Provide context
{
  "message": "Do you ship to Canada?",
  "domain": "store.com",
  "context": {
    "currentPage": "/shipping",
    "userCountry": "CA"
  }
}

// ❌ Bad: No context
{
  "message": "Do you ship?",
  "domain": "store.com"
}
```

### Conversation Management

```javascript
// ✅ Good: Maintain conversation
let conversationId = null;

async function chat(message) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      domain: 'store.com',
      conversationId // Reuse for follow-ups
    })
  });

  const data = await response.json();
  conversationId = data.conversationId; // Save for next message
  return data;
}
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify(chatRequest)
  });

  if (!response.ok) {
    if (response.status === 429) {
      // Handle rate limiting
      const retryAfter = response.headers.get('Retry-After');
      await sleep(retryAfter * 1000);
      return retry();
    }
    throw new Error(`Chat API error: ${response.status}`);
  }

  return await response.json();
} catch (error) {
  // Handle network errors
  console.error('Chat failed:', error);
  return { error: 'Chat temporarily unavailable' };
}
```

## Advanced Features

### Streaming Responses (Coming Soon)

Server-Sent Events for real-time streaming:

```javascript
const eventSource = new EventSource('/api/chat/stream?message=...');
eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);
  appendToChat(chunk.text);
};
```

### Context Injection

Provide additional context for better responses:

```json
{
  "message": "What warranty do you offer?",
  "domain": "store.com",
  "context": {
    "productId": "prod_12345",
    "category": "electronics",
    "priceRange": "500-1000"
  }
}
```

### Custom Instructions

Override default behavior per request:

```json
{
  "message": "Explain how this works",
  "domain": "store.com",
  "instructions": {
    "tone": "technical",
    "maxLength": 100,
    "includeLinks": true
  }
}
```

## Integration Examples

### JavaScript/TypeScript

```typescript
interface ChatRequest {
  message: string;
  domain: string;
  conversationId?: string;
  sessionId?: string;
}

interface ChatResponse {
  response: string;
  conversationId: string;
  sources: Source[];
  metadata: Metadata;
}

async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  return response.json();
}
```

### React Component

```tsx
import { useState } from 'react';

export function ChatInterface() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [conversationId, setConversationId] = useState(null);

  const handleSend = async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        domain: 'store.com',
        conversationId
      })
    });

    const data = await response.json();
    setConversationId(data.conversationId);
    setConversation([...conversation,
      { role: 'user', text: message },
      { role: 'assistant', text: data.response }
    ]);
    setMessage('');
  };

  return (
    <div>
      {conversation.map((msg, i) => (
        <div key={i} className={msg.role}>
          {msg.text}
        </div>
      ))}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## Related Documentation

- [Chat System Documentation](../CHAT_SYSTEM_DOCUMENTATION.md)
- [Search Architecture](../SEARCH_ARCHITECTURE.md)
- [Hallucination Prevention](../HALLUCINATION_PREVENTION.md)
- [WooCommerce Integration](../woocommerce/WOOCOMMERCE_INTEGRATION_DOCUMENTATION.md)

## Support

For technical issues or questions:
- Review [docs/06-TROUBLESHOOTING/README.md](../06-TROUBLESHOOTING/README.md)
- Check [docs/CHAT_SYSTEM_DOCUMENTATION.md](../CHAT_SYSTEM_DOCUMENTATION.md)
- Open a GitHub issue

---

**Last Updated**: 2025-10-24
