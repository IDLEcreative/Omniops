# API Documentation

Complete API reference for the Customer Service Agent.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Most endpoints don't require authentication as they use domain-based identification. Admin endpoints may require additional authentication in production.

## Rate Limiting

All endpoints are rate-limited:
- Default: 100 requests per minute per domain
- Premium: 500 requests per minute per domain

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

## Endpoints

### Chat Endpoints

#### Send Message

```http
POST /api/chat
```

Send a message to the AI assistant and receive a response.

**Request Body:**
```json
{
  "message": "string",
  "conversation_id": "uuid (optional)",
  "session_id": "string",
  "domain": "string (optional)",
  "config": {
    "features": {
      "woocommerce": { "enabled": boolean },
      "websiteScraping": { "enabled": boolean }
    }
  }
}
```

**Response:**
```json
{
  "message": "string",
  "conversation_id": "uuid",
  "sources": [
    {
      "url": "string",
      "title": "string",
      "relevance": "number (0-1)"
    }
  ]
}
```

**Error Responses:**
- `400`: Invalid request data
- `429`: Rate limit exceeded
- `500`: Internal server error

### Scraping Endpoints

#### Scrape Website

```http
POST /api/scrape
```

Scrape and index website content for AI context.

**Request Body:**
```json
{
  "url": "string (valid URL)",
  "crawl": "boolean (default: false)",
  "max_pages": "number (1-100, default: 50)"
}
```

**Response (Single Page):**
```json
{
  "status": "completed",
  "pages_scraped": 1,
  "message": "Successfully scraped and indexed {url}"
}
```

**Response (Crawl):**
```json
{
  "status": "started",
  "job_id": "string",
  "message": "Started crawling {url}. This may take a few minutes."
}
```

#### Check Crawl Status

```http
GET /api/scrape?job_id={job_id}
```

Check the status of a website crawl job.

**Response:**
```json
{
  "status": "processing|completed|failed",
  "progress": "number (0-1)",
  "data": [
    {
      "url": "string",
      "title": "string",
      "content": "string"
    }
  ]
}
```

### Admin Endpoints

#### Get Configuration

```http
GET /api/admin/config?domain={domain}
```

Retrieve customer configuration for a domain.

**Response:**
```json
{
  "config": {
    "business_name": "string",
    "welcome_message": "string",
    "primary_color": "string",
    "chat_icon_url": "string",
    "position": "bottom-right|bottom-left",
    "suggested_questions": ["string"],
    "features": {
      "woocommerce": { "enabled": boolean },
      "websiteScraping": { "enabled": boolean }
    }
  }
}
```

#### Update Configuration

```http
POST /api/admin/config
```

Update customer configuration.

**Request Body:**
```json
{
  "domain": "string",
  "config": {
    "business_name": "string",
    "welcome_message": "string",
    "primary_color": "string",
    "woocommerce_url": "string (optional)",
    "woocommerce_key": "string (optional)",
    "woocommerce_secret": "string (optional)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration updated successfully"
}
```

#### Test WooCommerce Connection

```http
POST /api/admin/test-connection
```

Test WooCommerce API credentials.

**Request Body:**
```json
{
  "url": "string",
  "consumerKey": "string",
  "consumerSecret": "string"
}
```

**Response:**
```json
{
  "success": true,
  "store_name": "string",
  "woocommerce_version": "string"
}
```

### WooCommerce Endpoints

#### Search Products

```http
GET /api/woocommerce/products/search?q={query}&domain={domain}
```

Search for products in the connected WooCommerce store.

**Response:**
```json
{
  "products": [
    {
      "id": "number",
      "name": "string",
      "price": "string",
      "description": "string",
      "stock_status": "string",
      "permalink": "string"
    }
  ]
}
```

#### Search Orders

```http
GET /api/woocommerce/orders/search?email={email}&domain={domain}
```

Search for customer orders by email.

**Response:**
```json
{
  "orders": [
    {
      "id": "number",
      "number": "string",
      "status": "string",
      "date_created": "string",
      "total": "string",
      "line_items": [
        {
          "name": "string",
          "quantity": "number",
          "total": "string"
        }
      ]
    }
  ]
}
```

### GDPR Endpoints

#### Export User Data

```http
POST /api/gdpr/export
```

Export all data associated with a session.

**Request Body:**
```json
{
  "session_id": "string"
}
```

**Response:**
```json
{
  "conversations": [...],
  "messages": [...],
  "support_tickets": [...]
}
```

#### Delete User Data

```http
POST /api/gdpr/delete
```

Delete all data associated with a session.

**Request Body:**
```json
{
  "session_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "deleted": {
    "conversations": "number",
    "messages": "number",
    "support_tickets": "number"
  }
}
```

### Support Endpoints

#### Create Support Ticket

```http
POST /api/support
```

Create a support ticket from a conversation.

**Request Body:**
```json
{
  "conversation_id": "uuid",
  "email": "string",
  "summary": "string"
}
```

**Response:**
```json
{
  "success": true,
  "ticket_id": "uuid"
}
```

### System Endpoints

#### Health Check

```http
GET /api/health
```

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "ISO 8601 string"
}
```

#### Version

```http
GET /api/version
```

Get the API version.

**Response:**
```json
{
  "version": "1.0.0"
}
```

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "string",
  "details": "object (optional)"
}
```

Common error codes:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server error

## Webhooks

The system can be configured to send webhooks for certain events:

### Conversation Started
```json
{
  "event": "conversation.started",
  "conversation_id": "uuid",
  "session_id": "string",
  "timestamp": "ISO 8601"
}
```

### Support Ticket Created
```json
{
  "event": "ticket.created",
  "ticket_id": "uuid",
  "conversation_id": "uuid",
  "timestamp": "ISO 8601"
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class CustomerServiceAPI {
  constructor(private baseUrl: string) {}

  async sendMessage(message: string, sessionId: string, conversationId?: string) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        conversation_id: conversationId,
      }),
    });
    return response.json();
  }
}
```

### Python

```python
import requests

class CustomerServiceAPI:
    def __init__(self, base_url):
        self.base_url = base_url
    
    def send_message(self, message, session_id, conversation_id=None):
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={
                "message": message,
                "session_id": session_id,
                "conversation_id": conversation_id
            }
        )
        return response.json()
```

### cURL

```bash
# Send a message
curl -X POST https://your-domain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I need help",
    "session_id": "test-session-123"
  }'

# Scrape a website
curl -X POST https://your-domain.com/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "crawl": true,
    "max_pages": 50
  }'
```