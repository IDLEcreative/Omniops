# Lib Directory

Core business logic, utilities, and service implementations.

## Structure

```
lib/
├── auth/              # Authentication utilities
├── repositories/      # Data access layer
├── services/          # Business logic services
├── supabase/          # Database clients
├── examples/          # Usage examples
├── config.ts          # Configuration schemas
├── embeddings.ts      # Vector embeddings
├── encryption.ts      # Encryption utilities
├── rate-limit.ts      # Rate limiting
├── redis.ts           # Redis client
├── utils.ts           # Common utilities
└── woocommerce*.ts    # E-commerce integration
```

## Core Modules

### Configuration (`config.ts`)
- Zod schemas for validation
- Customer configuration types
- Feature flags and settings
- Default configurations

### Database (`supabase/`)
- `client.ts` - Browser-side Supabase client
- `server.ts` - Server-side Supabase client with service role
- Handles all database operations
- Row Level Security (RLS) enforcement

### AI & Embeddings (`embeddings.ts`)
- OpenAI integration
- Text embedding generation
- Semantic search implementation
- Context retrieval for chat

### Web Scraping
- `crawler-config.ts` - Crawlee configuration
- `content-extractor.ts` - Mozilla Readability extraction
- `quick-crawl.ts` - Fast crawling implementation
- `scraper-api.ts` - Scraping API interface
- `sitemap-parser.ts` - XML sitemap parsing
- `own-site-detector.ts` - Detect owned domains for optimization

### Content Management
- `content-refresh.ts` - Automated content updates
- `structured-extraction.ts` - Extract FAQs, products
- `job-limiter.ts` - Job queue management

### WooCommerce Integration
- `woocommerce.ts` - Basic integration
- `woocommerce-dynamic.ts` - Dynamic endpoint routing
- `woocommerce-full.ts` - Complete API implementation
- `woocommerce-api.ts` - API client wrapper

### Security & Privacy
- `encryption.ts` - AES-256 encryption for credentials
- `rate-limit.ts` - Request throttling
- `auth/utils.ts` - Authentication helpers

### Infrastructure
- `redis.ts` - Redis client and job queue
- `redis-enhanced.ts` - Advanced Redis operations
- `logger.ts` - Structured logging
- `env-check.ts` - Environment validation

## Usage Examples

### Embeddings
```typescript
import { generateEmbedding, searchSimilarContent } from '@/lib/embeddings'

// Generate embedding
const embedding = await generateEmbedding("text to embed")

// Search similar content
const results = await searchSimilarContent(query, customerId, limit)
```

### Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/rate-limit'

const { success, remaining } = await checkRateLimit(identifier, {
  requests: 60,
  window: 60 * 1000 // 1 minute
})
```

### Encryption
```typescript
import { encrypt, decrypt } from '@/lib/encryption'

const encrypted = encrypt(sensitive_data)
const decrypted = decrypt(encrypted)
```

### Web Scraping
```typescript
import { scrapeWebsite } from '@/lib/scraper-api'

const result = await scrapeWebsite(url, {
  maxPages: 50,
  crawl: true
})
```

### WooCommerce
```typescript
import { WooCommerceAPI } from '@/lib/woocommerce-api'

const api = new WooCommerceAPI(config)
const products = await api.get('products', { per_page: 10 })
```

## Service Architecture

### Service Pattern
Services encapsulate business logic:
```typescript
class UserService {
  async createUser(data: UserInput): Promise<User> {
    // Validation
    // Business logic
    // Database operation
    // Return result
  }
}
```

### Repository Pattern
Repositories handle data access:
```typescript
class UserRepository {
  async findById(id: string): Promise<User | null> {
    // Database query
    // Data mapping
    // Return entity
  }
}
```

## Best Practices

1. **Separation of Concerns**: Keep business logic separate from data access
2. **Error Handling**: Always handle errors gracefully with proper logging
3. **Type Safety**: Use TypeScript types and Zod schemas
4. **Testing**: Write unit tests for all business logic
5. **Documentation**: Document complex algorithms and business rules

## Environment Dependencies

Required environment variables:
- `SUPABASE_SERVICE_ROLE_KEY` - Database access
- `OPENAI_API_KEY` - AI functionality
- `REDIS_URL` - Job queue (defaults to localhost)
- `ENCRYPTION_KEY` - Data encryption (32 chars)

## Performance Considerations

- Connection pooling for database
- Redis caching for frequent queries
- Batch operations where possible
- Lazy loading for heavy modules
- Proper indexing for vector search

## Security Notes

- Never log sensitive data
- Always encrypt credentials before storage
- Validate all external inputs
- Use parameterized queries
- Implement proper rate limiting