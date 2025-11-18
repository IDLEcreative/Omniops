**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Lib Directory

Core business logic, utilities, and service implementations for the Customer Service Agent application.

## Overview

The `/lib` directory contains the foundational modules that power our customer service automation platform, including database clients, AI integrations, web scraping systems, WooCommerce API integration, and various utilities.

## Directory Structure

```
lib/
├── agents/                     # AI agents (📋 see agents/README.md)
│   ├── ecommerce-agent.ts     # Interface for provider agents
│   ├── customer-service-agent.ts  # Generic main agent (user-facing)
│   ├── domain-agnostic-agent.ts   # Universal business agent
│   └── woocommerce-agent.ts   # WooCommerce-specific specialization
├── __mocks__/                    # Mock implementations for testing
│   ├── supabase/               # Supabase mocks
│   ├── woocommerce-full.ts     # WooCommerce API mocks
│   └── woocommerce.ts          # WooCommerce mocks
├── auth/                       # Authentication utilities (📋 see auth/README.md)
│   └── utils.ts               # Auth helper functions
├── examples/                   # Usage examples and demos
│   ├── rate-limiter-usage.ts  # Rate limiter implementation examples
│   └── scrape-own-site.ts     # Own site scraping examples
├── integrations/               # External integrations (📋 see integrations/README.md)
│   └── customer-scraping-integration.ts  # Customer scraping workflows
├── monitoring/                 # Monitoring utilities (📋 see monitoring/README.md)
│   ├── dashboard-data.ts      # Dashboard analytics
│   └── scrape-monitor.ts      # Scraping operation monitoring
├── queue/                      # Job queue system (📋 see queue/README.md)
│   ├── index.ts               # Main exports and public API
│   ├── queue-manager.ts       # Core queue management with BullMQ
│   ├── job-processor.ts       # Job processing worker
│   ├── queue-utils.ts         # Utility functions and monitoring
│   └── scrape-queue.ts        # Specialized scraping queue
├── supabase/                   # Database clients (📋 see supabase/README.md)
│   ├── __mocks__/             # Supabase test mocks
│   ├── client.ts              # Browser Supabase client
│   └── server.ts              # Server Supabase client
├── utils/                      # Utility functions (📋 see utils/README.md)
│   └── domain-validator.ts    # Domain validation and security
├── woocommerce-api/            # WooCommerce API (📋 see woocommerce-api/README.md)
│   ├── customers.ts           # Customer operations
│   ├── index.ts               # Main exports and API wrapper
│   ├── orders.ts              # Order management
│   ├── products.ts            # Product operations
│   ├── reports.ts             # Analytics and reports
│   └── settings.ts            # Store settings
└── [various utility files]      # Individual utility modules
```

## Core Modules

### 🗄️ Database & Storage (`supabase/`)
- **`client.ts`** - Browser-side Supabase client with environment fallbacks
- **`server.ts`** - Server-side Supabase client with cookie handling and service role access
- Handles all database operations with Row Level Security (RLS) enforcement
- Supports both authenticated and service role connections

### 🤖 AI & Embeddings 
- **`embeddings.ts`** - OpenAI integration for text embeddings and semantic search
- **`ai-content-extractor.ts`** - AI-powered content extraction and analysis
- **`ai-metadata-generator.ts`** - Generate metadata using AI
- **`pattern-learner.ts`** - Learn content patterns for better extraction
- **`embedding-cache.ts`** - Vector embedding caching system

### 🕷️ Web Scraping & Content Extraction
- **`scraper-api.ts`** - Main web scraping API interface
- **`crawler-config.ts`** - Crawlee crawler configuration and setup
- **`content-extractor.ts`** - Mozilla Readability integration for clean content
- **`quick-crawl.ts`** - Fast website crawling implementation
- **`sitemap-parser.ts`** - XML sitemap parsing and URL extraction
- **`own-site-detector.ts`** - Detect owned domains for optimization (20x faster)
- **`hybrid-scraper.js`** - Hybrid scraping approach combining methods
- **`incremental-scraper.js`** - Incremental content scraping for updates
- **`smart-periodic-scraper.js`** - Intelligent periodic scraping system
- **`pagination-crawler.ts`** - Handle paginated content crawling
- **`scraper-worker.js`** - Background scraper worker implementation
- **`scraper-worker-standalone.js`** - Standalone scraper worker

### 📝 Content Management & Processing
- **`content-refresh.ts`** - Automated content updates and scheduling
- **`content-deduplicator.ts`** - Remove duplicate content entries
- **`ecommerce-extractor.ts`** - Extract e-commerce specific data
- **`product-normalizer.ts`** - Normalize product data across sources
- **`price-parser.ts`** - Parse and normalize price information
- **`url-deduplicator.ts`** - Remove duplicate URLs

### 🛒 WooCommerce Integration
- **`woocommerce-api/`** - Structured API modules (see detailed README in subdirectory)
- **`woocommerce-full.ts`** - Complete WooCommerce API implementation
- **`woocommerce-dynamic.ts`** - Dynamic endpoint routing and handling
- **`woocommerce-cache.ts`** - Caching layer for WooCommerce data
- **`woocommerce-cart-tracker.ts`** - Abandoned cart tracking functionality
- **`woocommerce-chat-functions.ts`** - Chat integration with WooCommerce

### 🤝 Agents (Modular Prompt Layer)
- **`agents/ecommerce-agent.ts`** - TypeScript interface defining a common contract for agent capabilities (prompt/context builders)
- **`agents/customer-service-agent.ts`** - Generic Customer Service Agent used for all user interactions; handles general queries and product guidance
- **`agents/woocommerce-agent.ts`** - WooCommerce specialization used when WooCommerce is enabled and the user asks about orders/delivery/account
- Backwards compatibility shim: `lib/woocommerce-ai-instructions.ts` re-exports the WooCommerce agent as `WooCommerceAIInstructions`

### 🔐 Security & Authentication
- **`auth/`** - Authentication utilities (see detailed README in subdirectory)
- **`encryption.ts`** - AES-256 encryption for credentials
- **`rate-limit.ts`** - Request throttling and rate limiting
- **`rate-limiter-enhanced.ts`** - Advanced rate limiting with Redis
- **`customer-verification.ts`** - Full customer verification system
- **`multi-tenant-verification.ts`** - Multi-tenant customer verification

### ⚡ Performance & Infrastructure
- **`redis.ts`** - Redis client and job queue management
- **`redis-enhanced.ts`** - Advanced Redis operations and caching
- **`api-cache.ts`** - API response caching layer
- **`browser-context-pool.ts`** - Browser context pool for scraping
- **`performance-monitor.ts`** - Performance monitoring and metrics
- **`db-optimization.ts`** - Database optimization utilities

### 🛠️ Utilities & Helpers
- **`utils.ts`** - Common utility functions
- **`cn.ts`** - Tailwind CSS class name utility (clsx + tailwind-merge)
- **`config.ts`** - Configuration schemas and validation with Zod
- **`logger.ts`** - Structured logging system
- **`env-check.ts`** - Environment variable validation

## Installation & Dependencies

### Required Environment Variables

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (Required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Encryption (Required for secure data storage)
ENCRYPTION_KEY=your_32_character_encryption_key

# Redis (Optional - defaults to localhost)
REDIS_URL=redis://localhost:6379

# WooCommerce (Optional - for e-commerce integration)
WOOCOMMERCE_URL=your_store_url
WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret

# Optional
CRON_SECRET=your_cron_security_key
ANTHROPIC_API_KEY=your_anthropic_key
```

### Key Dependencies

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.4",
    "openai": "^4.67.3",
    "redis": "^4.7.0",
    "zod": "^3.23.8",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  }
}
```

## Usage Examples

### Database Operations
```typescript
import { createClient } from '@/lib/supabase/server'

// Server-side database query
const supabase = await createClient()
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('id', customerId)
```

### AI Embeddings
```typescript
import { generateEmbedding, searchSimilarContent } from '@/lib/embeddings'

// Generate embedding for text
const embedding = await generateEmbedding("How do I return a product?")

// Search for similar content
const results = await searchSimilarContent(query, customerId, 10)
```

### Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/rate-limit'

const { success, remaining } = await checkRateLimit('user_123', {
  requests: 60,
  window: 60 * 1000 // 1 minute
})

if (!success) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

### Web Scraping
```typescript
import { scrapeWebsite } from '@/lib/scraper-api'

const result = await scrapeWebsite('https://example.com', {
  maxPages: 50,
  crawl: true,
  respectRobots: true
})
```

### WooCommerce Integration
```typescript
import { WooCommerceAPI } from '@/lib/woocommerce-api'

const wc = new WooCommerceAPI()
const products = await wc.getProducts({ per_page: 10, status: 'publish' })
const customer = await wc.getCustomerByEmail('customer@example.com')
```

### Encryption
```typescript
import { encrypt, decrypt } from '@/lib/encryption'

// Encrypt sensitive data before storage
const encryptedCredentials = encrypt(JSON.stringify(credentials))

// Decrypt when needed
const credentials = JSON.parse(decrypt(encryptedCredentials))
```

## Service Architecture Pattern

### Recommended Structure
```typescript
// Service layer - business logic
class CustomerService {
  async createCustomer(data: CustomerInput): Promise<Customer> {
    // 1. Validation
    const validated = customerSchema.parse(data)
    
    // 2. Business logic
    const processedData = await this.processCustomerData(validated)
    
    // 3. Database operation
    const customer = await this.repository.create(processedData)
    
    // 4. Return result
    return customer
  }
}

// Repository layer - data access
class CustomerRepository {
  async findById(id: string): Promise<Customer | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }
}
```

## Testing

The library includes comprehensive mocks for testing:

```typescript
// Example test setup
import { jest } from '@jest/globals'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createServiceRoleClient: jest.fn()
}))

// Mock WooCommerce
jest.mock('@/lib/woocommerce-full')
```

## Performance Considerations

1. **Connection Pooling**: Supabase clients use connection pooling
2. **Caching**: Redis caching for frequent queries and API responses
3. **Batch Operations**: Use batch operations where possible
4. **Lazy Loading**: Heavy modules are loaded only when needed
5. **Vector Search**: Proper indexing for embedding searches
6. **Rate Limiting**: Prevent API abuse and manage external service limits

## Security Best Practices

1. **Never Log Sensitive Data**: Use structured logging with data sanitization
2. **Encrypt Credentials**: Always encrypt before database storage
3. **Validate Inputs**: Use Zod schemas for all external inputs
4. **Parameterized Queries**: Supabase handles SQL injection prevention
5. **Rate Limiting**: Implement proper rate limiting for all endpoints
6. **RLS Policies**: Leverage Supabase Row Level Security

## Troubleshooting

### Common Issues

1. **"Supabase configuration is incomplete"**
   - Check environment variables are set correctly
   - Verify URLs don't have trailing slashes

2. **"OPENAI_API_KEY is not configured"**
   - Ensure OpenAI API key is set in environment variables
   - Check API key has sufficient credits

3. **Rate limiting errors**
   - Implement exponential backoff
   - Check Redis connection

4. **WooCommerce connection issues**
   - Verify WooCommerce REST API is enabled
   - Check consumer key/secret permissions

## Contributing

When adding new utilities to this directory:

1. **Follow Naming Conventions**: Use kebab-case for files, PascalCase for classes
2. **Add Type Definitions**: Include comprehensive TypeScript types
3. **Write Tests**: Add corresponding test files in `__tests__/lib/`
4. **Update Documentation**: Update this README and create module-specific docs
5. **Error Handling**: Implement proper error handling with logging

## Related Documentation

### Library Components
- [AI Agents Documentation](./agents/README.md) - Intelligent customer service agents and prompt engineering
- [Authentication Utilities](./auth/README.md) - Security, session management, and auth helpers
- [External Integrations](./integrations/README.md) - Third-party service integrations and workflows
- [Monitoring Utilities](./monitoring/README.md) - Performance monitoring, analytics, and observability
- [Job Queue System](./queue/README.md) - Background job processing with Redis and BullMQ
- [Supabase Integration Guide](./supabase/README.md) - Database clients and configuration
- [Utility Functions](./utils/README.md) - Common utilities and helper functions
- [WooCommerce API Reference](./woocommerce-api/README.md) - Complete WooCommerce REST API implementation

### Project Documentation
- [Project Architecture](../docs/ARCHITECTURE.md)
- [API Reference](../docs/API.md)
