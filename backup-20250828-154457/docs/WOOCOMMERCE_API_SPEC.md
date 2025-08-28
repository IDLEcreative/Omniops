# WooCommerce Integration API Specification

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication
All endpoints require domain identification via the `domain` parameter in the request body.

---

## 1. Chat Endpoint

### `POST /chat`

Main conversational endpoint that handles both public and private queries.

#### Request Body
```typescript
{
  "message": string,           // User's message (max 1000 chars)
  "session_id": string,        // Unique session identifier
  "domain": string,            // Customer domain (e.g., "thompsonseparts.co.uk")
  "conversation_id"?: string   // UUID for continuing conversation (optional)
}
```

#### Response
```typescript
{
  "message": string,                // Assistant's response
  "conversation_id": string,        // Conversation UUID
  "sources"?: Array<{               // Optional source references
    "url": string,
    "title": string,
    "relevance": number
  }>,
  "requiresVerification"?: boolean, // True if verification needed
  "verified"?: boolean,            // True if customer is verified
  "error"?: string                 // Error message if failed
}
```

#### Example: Order Query (Triggers Verification)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of order 119166?",
    "session_id": "session-123",
    "domain": "thompsonseparts.co.uk"
  }'

# Response:
{
  "message": "To assist with your order, please provide your email address for verification.",
  "conversation_id": "uuid-here",
  "requiresVerification": true
}
```

#### Example: Product Query (No Verification)
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Do you have Palfinger parts?",
    "session_id": "session-456",
    "domain": "thompsonseparts.co.uk"
  }'

# Response:
{
  "message": "Yes, we have various Palfinger parts in stock...",
  "conversation_id": "uuid-here",
  "sources": [...]
}
```

---

## 2. Stock Check Endpoint

### `POST /woocommerce/stock`

Check product stock levels without verification.

#### Request Body
```typescript
{
  "domain": string,              // Customer domain
  "productName"?: string,        // Search by product name
  "sku"?: string,               // Search by SKU
  "productId"?: number          // Search by product ID
}
```

#### Response
```typescript
{
  "success": boolean,
  "message"?: string,           // Summary message
  "products"?: Array<{          // Matching products
    "id": number,
    "name": string,
    "sku": string,
    "price": string,
    "stock_status": "instock" | "outofstock" | "onbackorder",
    "stock_quantity": number | null
  }>,
  "error"?: string             // Error message if failed
}
```

#### Example
```bash
curl -X POST http://localhost:3001/api/woocommerce/stock \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "thompsonseparts.co.uk",
    "productName": "Palfinger Epsilon"
  }'

# Response:
{
  "success": true,
  "message": "Palfinger Epsilon M/E-Series Extension Load Holding Valve SEALING CAP is instock",
  "products": [
    {
      "id": 119123,
      "name": "Palfinger Epsilon M/E-Series Extension Load Holding Valve SEALING CAP",
      "sku": "PAL-001",
      "price": "3.60",
      "stock_status": "instock",
      "stock_quantity": 25
    }
  ]
}
```

---

## 3. Customer Action Endpoint

### `POST /woocommerce/customer-action`

Perform customer-specific actions after verification.

#### Request Body
```typescript
{
  "action": string,             // Action to perform (see below)
  "domain": string,             // Customer domain
  "conversationId": string,     // Verified conversation UUID
  "data": object               // Action-specific data
}
```

#### Available Actions

##### `get-info`
Get customer information.
```typescript
{
  "action": "get-info",
  "data": {}  // No additional data needed
}
```

##### `get-order-status`
Get specific order status.
```typescript
{
  "action": "get-order-status",
  "data": {
    "orderNumber": string  // Order number (e.g., "119166")
  }
}
```

##### `get-recent-orders`
Get customer's recent orders.
```typescript
{
  "action": "get-recent-orders",
  "data": {
    "limit"?: number  // Max orders to return (default: 10)
  }
}
```

##### `get-tracking`
Get order tracking information.
```typescript
{
  "action": "get-tracking",
  "data": {
    "orderNumber": string
  }
}
```

##### `update-address`
Update shipping address.
```typescript
{
  "action": "update-address",
  "data": {
    "address": {
      "first_name"?: string,
      "last_name"?: string,
      "address_1"?: string,
      "address_2"?: string,
      "city"?: string,
      "state"?: string,
      "postcode"?: string,
      "country"?: string
    }
  }
}
```

##### `cancel-order`
Cancel a pending order.
```typescript
{
  "action": "cancel-order",
  "data": {
    "orderNumber": string,
    "reason"?: string
  }
}
```

#### Response
```typescript
{
  "success": boolean,
  "message": string,
  "data"?: any,              // Action-specific response data
  "error"?: string
}
```

#### Example: Get Order Status
```bash
curl -X POST http://localhost:3001/api/woocommerce/customer-action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get-order-status",
    "domain": "thompsonseparts.co.uk",
    "conversationId": "verified-conversation-uuid",
    "data": {
      "orderNumber": "119166"
    }
  }'

# Response:
{
  "success": true,
  "message": "Order #119166 Status",
  "data": {
    "order_number": "119166",
    "status": "processing",
    "date": "2025-01-25T14:16:07",
    "total": "GBP 33.42",
    "payment_method": "Credit Card",
    "shipping_address": {...},
    "items": [...],
    "tracking": null
  }
}
```

---

## 4. Test WooCommerce Endpoint

### `GET /test-woocommerce`

Test WooCommerce connectivity and configuration.

#### Response
```typescript
{
  "configuration": {
    "domain": string,
    "business_name": string,
    "woocommerce_url": string
  },
  "test_results": Array<{
    "endpoint": string,
    "status": "success" | "error",
    "count": number,
    "sample": Array<any>,
    "error"?: string
  }>,
  "summary": {
    "total_tests": number,
    "successful": number,
    "failed": number,
    "status": string
  }
}
```

#### Example
```bash
curl http://localhost:3001/api/test-woocommerce

# Response:
{
  "configuration": {
    "domain": "thompsonseparts.co.uk",
    "business_name": "Thompson's E-Parts",
    "woocommerce_url": "https://www.thompsonseparts.co.uk"
  },
  "test_results": [
    {
      "endpoint": "products",
      "status": "success",
      "count": 5,
      "sample": [...]
    },
    {
      "endpoint": "orders",
      "status": "success",
      "count": 3,
      "sample": [...]
    }
  ],
  "summary": {
    "total_tests": 3,
    "successful": 3,
    "failed": 0,
    "status": "ALL PASSED"
  }
}
```

---

## Error Codes

| HTTP Status | Error Type | Description |
|------------|------------|-------------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Verification required or failed |
| 404 | Not Found | Resource not found |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

## Rate Limiting

- **Default**: 60 requests per minute per domain
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Webhooks (Future)

Planned webhook events:
- `order.verified` - Customer successfully verified
- `order.status_checked` - Order status was queried
- `order.cancelled` - Order was cancelled
- `address.updated` - Shipping address updated

---

## Testing

### Postman Collection
Import the following collection for testing:

```json
{
  "info": {
    "name": "WooCommerce Integration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Chat - Order Query",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"message\": \"Check order 119166\",\n  \"session_id\": \"test-{{$timestamp}}\",\n  \"domain\": \"thompsonseparts.co.uk\"\n}"
        },
        "url": "{{baseUrl}}/api/chat"
      }
    },
    {
      "name": "Stock Check",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"domain\": \"thompsonseparts.co.uk\",\n  \"productName\": \"Palfinger\"\n}"
        },
        "url": "{{baseUrl}}/api/woocommerce/stock"
      }
    },
    {
      "name": "Test WooCommerce",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/test-woocommerce"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001",
      "type": "string"
    }
  ]
}
```

---

*API Specification v1.0 - January 2025*