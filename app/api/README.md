# API Routes

All Next.js API routes for the Customer Service Agent application.

## Structure

```
api/
├── admin/           # Admin management endpoints
├── auth/            # Authentication endpoints
├── chat/            # Chat messaging endpoint
├── cron/            # Scheduled job endpoints
├── debug/           # Debugging utilities
├── demo/            # Demo generation
├── extract/         # Content extraction
├── gdpr/            # GDPR compliance
├── health/          # Health check
├── privacy/         # Privacy operations
├── refresh/         # Content refresh
├── scrape/          # Web scraping
├── search/          # Search functionality
├── support/         # Support tickets
├── training/        # Bot training
├── version/         # API version
└── woocommerce/     # E-commerce integration
```

## Core Endpoints

### Chat API
**POST** `/api/chat`
- Main chat endpoint for AI conversations
- Handles message processing, context retrieval, and response generation
- Rate limited per domain

### Scraping API
**POST** `/api/scrape`
- Scrapes and indexes website content
- Supports single page or full site crawling
- Returns job ID for tracking progress

**GET** `/api/scrape?job_id={id}`
- Check crawling job status
- Returns progress and completion info

### Search API
**POST** `/api/search`
- Hybrid search across embeddings and web
- Returns relevant context for chat responses

### Admin APIs

**GET/POST** `/api/admin/config`
- Manage customer configurations
- Encrypted credential storage

**POST** `/api/admin/test-connection`
- Test WooCommerce connections
- Validate API credentials

### Privacy APIs

**POST** `/api/gdpr/delete`
- Delete user data (GDPR compliance)
- Complete data erasure

**GET** `/api/gdpr/export`
- Export user data
- JSON format download

### WooCommerce APIs

**GET** `/api/woocommerce/products`
- Search products with authentication
- Real-time inventory

**GET** `/api/woocommerce/orders`
- Order lookup and status
- Customer order history

## Authentication

Most endpoints require proper authentication:
- Public endpoints: `/api/health`, `/api/version`
- Session-based: `/api/chat`, `/api/support`
- Admin only: `/api/admin/*`, `/api/cron/*`

## Rate Limiting

Endpoints are rate limited:
- Chat: 60 requests/minute per domain
- Scraping: 10 requests/hour per domain
- Search: 100 requests/minute per domain

## Error Responses

Standard error format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

Common status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 429: Rate Limited
- 500: Server Error

## Development Tips

1. All routes use Zod for input validation
2. Check `types/api.ts` for request/response types
3. Use proper error handling with try/catch
4. Log errors for debugging
5. Test with Postman or curl