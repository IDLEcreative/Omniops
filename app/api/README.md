**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# API Routes - OmniOps AI Customer Service Platform

Comprehensive REST API for the OmniOps AI Customer Service Platform, providing 60+ endpoints for intelligent customer service automation. Built with Next.js 15 App Router, featuring type-safe validation, enterprise-grade security, and performance optimization.

**Key Features:**
- **60+ Endpoints**: Complete coverage for AI chat, e-commerce, content management, and administration
- **Type-Safe Validation**: Zod schema validation for all request/response data
- **Rate Limiting**: Per-domain throttling with Redis backend for abuse prevention
- **Security-First**: Multi-layer protection with CSRF, XSS, and injection prevention
- **Performance Optimized**: Sub-300ms response times with intelligent caching
- **GDPR/CCPA Compliant**: Built-in privacy controls and data management

## Structure

```
api/
├── admin/                    # Admin management endpoints
│   ├── config/              # Customer configuration
│   ├── test-connection/     # WooCommerce connection testing
│   └── woocommerce/         # Admin WooCommerce endpoints
├── auth/                    # Authentication endpoints
│   └── customer/            # Customer authentication
├── chat/                    # Chat messaging endpoint
├── check-embedding-urls/    # Embedding URL validation
├── check-rag-data/         # RAG data validation
├── check-table-data/       # Database table validation
├── check-tables/           # Database table checking
├── cron/                   # Scheduled job endpoints
│   └── refresh/            # Automated content refresh
├── customer/               # Customer verification
│   ├── quick-verify/       # Quick verification
│   └── verify/             # Full customer verification
├── debug/                  # Debugging utilities
│   └── [domain]/           # Domain-specific debugging
├── debug-rag/              # RAG system debugging
├── demo/                   # Demo generation
├── extract/                # Content extraction
├── fix-customer-config/    # Configuration fixes
├── fix-rag/               # RAG system fixes
├── gdpr/                  # GDPR compliance
│   ├── delete/            # Data deletion
│   └── export/            # Data export
├── health/                # Health check
├── privacy/               # Privacy operations
│   └── delete/            # Privacy data deletion
├── refresh/               # Content refresh
├── scrape/                # Web scraping
├── search/                # Search functionality
├── setup-rag/             # RAG system setup
├── setup-rag-production/  # Production RAG setup
├── simple-rag-test/       # RAG testing
├── support/               # Support tickets
├── test-db/               # Database testing
├── test-direct-search/    # Direct search testing
├── test-multi-tenant/     # Multi-tenant testing
├── test-rag/              # RAG testing
├── test-search-function/  # Search function testing
├── test-search-lib/       # Search library testing
├── test-woo/              # WooCommerce testing
├── test-woocommerce/      # WooCommerce integration testing
├── training/              # Bot training
│   ├── [id]/              # Training by ID
│   ├── qa/                # Q&A training
│   └── text/              # Text training
├── version/               # API version
└── woocommerce/           # E-commerce integration
    ├── abandoned-carts/   # Abandoned cart tracking
    ├── cart/              # Cart operations
    ├── customer-action/   # Customer actions
    ├── customer-test/     # Customer testing
    ├── customers/         # Customer management
    ├── dashboard/         # WooCommerce dashboard
    ├── orders/            # Order management
    ├── products/          # Product management
    ├── stock/             # Stock management
    └── test/              # Testing endpoints
```

## Core Endpoints

### Chat API
**POST** `/api/chat`
- **Purpose**: Main chat endpoint for AI-powered conversations
- **Features**: 
  - Message processing with context awareness
  - RAG (Retrieval-Augmented Generation) integration
  - WooCommerce order lookup (when verified)
  - Website content search and embedding
  - Multi-language support (40+ languages)
  - Customer verification integration
- **Rate Limiting**: 100 requests/minute per domain
- **Authentication**: Session-based with conversation tracking
- **Input**: `{ message, conversation_id?, session_id, domain?, config? }`
- **Output**: `{ message, conversation_id, sources? }`

### Website Scraping API
**POST** `/api/scrape`
- **Purpose**: Scrape and index website content for context-aware responses
- **Features**:
  - Single page scraping or full website crawling
  - Content chunking and embedding generation
  - Turbo mode for faster processing
  - Owned domain detection for enhanced access
  - Automatic content deduplication
- **Rate Limiting**: 10 requests/hour per domain
- **Input**: `{ url, crawl: boolean, max_pages: number, turbo: boolean }`
- **Output**: Single page: `{ status: 'completed', pages_scraped: 1 }` | Crawl: `{ status: 'started', job_id }`

**GET** `/api/scrape?job_id={id}`
- **Purpose**: Check crawling job status and retrieve results
- **Parameters**: 
  - `job_id` (required): Crawl job identifier
  - `include_results=true`: Include scraped content in response
  - `offset=0&limit=100`: Pagination for results
- **Output**: `{ status, progress?, data?, total_pages? }`

**GET** `/api/scrape?health=true`
- **Purpose**: Health check for scraping service
- **Caching**: 10 seconds with stale-while-revalidate
- **Output**: `{ status: 'ok', timestamp, uptime, memory_usage }`

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

**GET** `/api/gdpr/audit`
- Fetch recent GDPR export/delete activity
- Supports filtering by request type and pagination

### WooCommerce APIs

**GET** `/api/woocommerce/products`
- Search products with authentication
- Real-time inventory

**GET** `/api/woocommerce/orders`
- Order lookup and status
- Customer order history

**GET** `/api/woocommerce/customers/test`
- Test customer lookup functionality
- Validate customer authentication

**GET** `/api/woocommerce/abandoned-carts`
- Track abandoned shopping carts
- Monitor incomplete purchases

**POST** `/api/woocommerce/customer-action`
- Handle customer actions
- Process customer requests

### Customer Verification APIs

**POST** `/api/customer/verify`
- Full customer verification
- Email and order matching

**POST** `/api/customer/quick-verify`
- Quick verification via order number
- Minimal friction verification

### Training APIs

**POST** `/api/training`
- General bot training endpoint
- Upload training data

**POST** `/api/training/text`
- Text-based training
- Process training documents

**POST** `/api/training/qa`
- Q&A pair training
- FAQ training data

**GET** `/api/training/[id]`
- Get training status by ID
- Monitor training progress

### Demo Generation API
**POST** `/api/demo`
- **Purpose**: Generate interactive demos for potential customers
- **Features**:
  - Quick website crawling for demo content
  - Automatic brand detection (colors, name, welcome message)
  - Temporary demo configurations (1 hour expiry)
  - Widget customization based on site content
- **Input**: `{ url: string }`
- **Output**: `{ demoId, widgetUrl, config, content, expiresIn }`

### System Health and Monitoring
**GET** `/api/health`
- **Purpose**: System health check with detailed status
- **Checks**: API status, database connectivity, response times
- **Output**: `{ status: 'healthy'|'unhealthy', checks, responseTime }`
- **Headers**: Cache-Control, X-Response-Time

**GET** `/api/version`
- **Purpose**: API version information
- **Output**: `{ version, build, environment }`

### Debug and Testing APIs

**GET** `/api/debug/[domain]`
- **Purpose**: Domain-specific debugging and configuration validation
- **Features**: Customer config validation, scraping status, embedding health
- **Access**: Admin only

**GET** `/api/debug-rag`
- **Purpose**: RAG system debugging and performance analysis
- **Features**: Query analysis, embedding search testing, similarity scoring
- **Output**: Debug information about retrieval and generation processes

**POST** `/api/test-rag`
- **Purpose**: Test RAG functionality with sample queries
- **Input**: `{ query: string, domain?: string }`
- **Output**: `{ results, embeddings, similarity_scores, response_time }`

**GET** `/api/test-multi-tenant`
- **Purpose**: Multi-tenant data isolation validation
- **Features**: Cross-tenant data leak testing, permission validation

**GET** `/api/check-embedding-urls`
- **Purpose**: Validate embedding URLs and content accessibility
- **Output**: `{ valid_urls, invalid_urls, total_embeddings }`

**GET** `/api/check-rag-data`
- **Purpose**: Validate RAG data integrity and quality
- **Output**: `{ total_chunks, avg_chunk_size, embedding_coverage }`

**GET** `/api/check-table-data` & `/api/check-tables`
- **Purpose**: Database table validation and health checks
- **Output**: Schema validation, record counts, index performance

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
