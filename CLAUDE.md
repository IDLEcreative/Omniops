# CLAUDE.md

## 🚨 CRITICAL: BRAND-AGNOSTIC APPLICATION 🚨

**THIS IS A MULTI-TENANT, BRAND-AGNOSTIC SYSTEM**

### ABSOLUTELY NO HARDCODING OF:
- ❌ Company names, logos, or branding
- ❌ Specific product names, SKUs, or product types
- ❌ Industry-specific terminology (e.g., "pumps", "parts", "Cifa products")
- ❌ Business-specific categories or classifications
- ❌ Domain names or company-specific URLs
- ❌ Company-specific email addresses or contact info
- ❌ Industry-specific assumptions (e.g., assuming it's always e-commerce)

### THIS SYSTEM MUST WORK EQUALLY FOR:
- ✅ E-commerce stores (any product type)
- ✅ Restaurants and food services
- ✅ Real estate and housing
- ✅ Healthcare providers
- ✅ Educational institutions
- ✅ Service businesses
- ✅ ANY other business type

**VIOLATION CONSEQUENCES**: Hardcoding specific information will break the system for other tenants and violate the multi-tenant architecture. All business-specific data must come from the database configuration, NOT from code.

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a General purpose AI-powered customer service chat widget built with Next.js 15, React 19, TypeScript, and Supabase. The application provides an embeddable chat widget that can be integrated into any website, with features including web scraping, WooCommerce integration, and privacy-compliant data handling

## Key Documentation

- **[Search Architecture](docs/SEARCH_ARCHITECTURE.md)** - CRITICAL: Explains actual search result limits (100-200, NOT 20!), hybrid search behavior, and token usage
- **[Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md)** - Response time analysis, bottlenecks, and optimization recommendations
- **[Supabase Schema](SUPABASE_SCHEMA.md)** - Complete database schema reference
- **[Hallucination Prevention](docs/HALLUCINATION_PREVENTION.md)** - Anti-hallucination safeguards and testing
- **[Docker Setup](DOCKER_README.md)** - Complete Docker configuration and commands


### FILE LENGTH
- **STRICT RULE**: All files must be under 300 LOC
- Current codebase has violations that need refactoring
- Files must be modular & single-purpose

### READING FILES
- **ALWAYS** read the entire file before making changes
- Find and read ALL related files before coding
- Never make changes without reading the complete file

### EGO
- Do not make assumptions or jump to conclusions
- You are a Large Language Model with limitations
- Always consider multiple different approaches like a Senior Engineer

### AGENT PARALLELIZATION
- **ALWAYS** launch multiple agents in parallel when possible to complete tasks
- Running agents concurrently is significantly faster and maintains better context
- Use a single message with multiple Task tool invocations for parallel execution
- This reduces overall processing time and prevents context fragmentation
- Example: When searching, analyzing, and implementing - launch all relevant agents together

## Key Commands

```bash
# Development
npm run dev              # Start development server on port 3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing
npm test                 # Run all tests (unit + integration)
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Type Checking
npx tsc --noEmit        # Run TypeScript type checking

# Database Migration
npm run migrate:encrypt-credentials  # Migrate credentials to encrypted format

# Database Cleanup
npx tsx test-database-cleanup.ts stats              # View scraping statistics
npx tsx test-database-cleanup.ts clean              # Clean all scraped data
npx tsx test-database-cleanup.ts clean --domain=X   # Clean specific domain
npx tsx test-database-cleanup.ts clean --dry-run    # Preview cleanup

# Performance Monitoring & Optimization
# See docs/NPX_TOOLS_GUIDE.md for monitoring tools
# See docs/ALL_NPX_TOOLS_REFERENCE.md for COMPLETE list of 100+ NPX tools
npx tsx monitor-embeddings-health.ts check          # Run health check
npx tsx monitor-embeddings-health.ts auto           # Run auto-maintenance
npx tsx monitor-embeddings-health.ts watch          # Start continuous monitoring
npx tsx optimize-chunk-sizes.ts analyze             # Analyze chunk sizes
npx tsx optimize-chunk-sizes.ts optimize            # Optimize oversized chunks
npx tsx batch-rechunk-embeddings.ts --force         # Batch process oversized chunks
npx tsx simple-rechunk.ts                           # Simple sequential rechunking

# Dependencies
npm run check:deps       # Check for dependency issues
npm run check:all        # Run all checks (deps + lint + typecheck)
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.4.3, React 19.1.0, TypeScript 5, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI**: OpenAI GPT-4 for chat, embeddings for semantic search
- **Web Scraping**: Crawlee + Playwright, Mozilla Readability for extraction
- **Job Queue**: Redis for background job management
- **E-commerce**: WooCommerce REST API v3 + Shopify Admin API integration

### Core Services Architecture

The application follows a service-oriented architecture with clear separation of concerns:

1. **API Layer** (`app/api/`): All endpoints for chat, scraping, privacy, and integrations
2. **Business Logic** (`lib/`): Core services including embeddings, rate limiting, encryption, and scraping
3. **Data Layer**: Supabase client/server instances with Row Level Security
4. **External Integrations**: OpenAI, WooCommerce

### Key Patterns

- **Multi-tenancy**: Domain-based customer isolation with encrypted credentials
- **Rate Limiting**: Per-domain request throttling to prevent abuse
- **Job Processing**: Redis-backed async processing for web scraping
- **Vector Search**: Hybrid search combining embeddings with real-time web results
- **Privacy First**: GDPR/CCPA compliant with configurable retention and user rights

## Database Structure

**📚 Complete Schema Reference: See [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md) for authoritative database documentation**

Main tables:
- `customer_configs`: Customer settings and encrypted credentials
- `scraped_pages` / `website_content`: Indexed website content
- `page_embeddings`: Vector embeddings for semantic search
- `conversations` & `messages`: Chat history
- `structured_extractions`: FAQs, products, contact info
- `scrape_jobs`: Background job queue for scraping tasks
- `query_cache`: Performance optimization cache

### Database Operations via Supabase Management API

When MCP tools are unavailable or Supabase CLI has migration conflicts, use the Management API directly:

```javascript
// Direct SQL execution via Supabase Management API
const SUPABASE_ACCESS_TOKEN = 'sbp_...'; // Your access token
const PROJECT_REF = 'birugqyuqhiahxvxeyqg'; // Project reference

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sqlStatement })
  }
);
```

**Use cases:**
- Executing DDL statements (CREATE/DROP/ALTER TABLE)
- Running migrations when CLI has conflicts
- Bulk data operations
- Direct database maintenance

**Note:** The Management API is equivalent to running SQL in the Supabase Dashboard and bypasses migration tracking.

## Environment Setup

Required environment variables (copy `.env.example` to `.env.local`):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- OpenAI: `OPENAI_API_KEY`
- Redis: `REDIS_URL` (defaults to `redis://localhost:6379`)
- Optional: WooCommerce credentials for testing

### Docker Setup
- **Docker Desktop**: Version 28.3.2 installed and configured
- **Full Docker Documentation**: See [DOCKER_README.md](DOCKER_README.md) for complete setup guide

#### Quick Docker Commands
```bash
# Start Docker Desktop (macOS)
open -a "Docker"

# Build and run the entire application stack
DOCKER_BUILDKIT=1 docker-compose build  # Optimized build (59% faster with cache)
docker-compose up -d                    # Production mode
docker-compose -f docker-compose.dev.yml up -d  # Development with hot reload

# Container management
docker-compose down                     # Stop all services
docker-compose ps                       # Check service status
docker-compose logs -f app              # View application logs
docker-compose logs -f redis            # View Redis logs

# Rebuild after code changes
DOCKER_BUILDKIT=1 docker-compose build --no-cache  # Full rebuild
DOCKER_BUILDKIT=1 docker-compose up -d --build     # Rebuild and restart (uses cache)

# Access running container
docker exec -it omniops-app sh         # Shell into app container

# Performance monitoring
npx tsx profile-docker-quick.ts        # Profile Docker build performance
```

#### Docker Files Structure
- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development with hot reload
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development orchestration
- `.dockerignore` - Build exclusions
- `.env.docker.example` - Environment template

## Development Workflow

### Starting Development
1. Ensure Docker is running: `open -a "Docker"` (if not already running)
2. Start Redis and services: `docker-compose up -d`
3. Start dev server: `npm run dev`
4. Access at http://localhost:3000

### Port Configuration
- **IMPORTANT**: Always ensure the development server runs on port 3000
- If port 3000 is in use, kill existing processes first:
  ```bash
  pkill -f "next dev"  # Kill any Next.js dev servers
  lsof -i :3000        # Check what's using port 3000
  ```
- The application is configured to use port 3000 for consistency

### Code Conventions
- Use TypeScript strict mode
- Follow existing component patterns in `components/ui/`
- API routes use Zod for validation
- Services use class-based patterns in `lib/`
- All WooCommerce credentials are encrypted using AES-256

### Testing Approach
- Unit tests for business logic (`lib/`)
- Integration tests for API routes (`app/api/`)
- Component tests for React components
- MSW (Mock Service Worker) for external API mocking

## Key Features & Entry Points

### Chat System
- Entry: `app/api/chat/route.ts`
- Widget: `app/embed/page.tsx`, `public/embed.js`
- Processing: `lib/embeddings.ts`

### Web Scraping
- Entry: `app/api/scrape/route.ts`
- Core: `lib/crawler-config.ts`, `lib/content-extractor.ts`
- Jobs: Redis-backed via `lib/redis.ts`

### WooCommerce Integration
- Dynamic API: `lib/woocommerce-dynamic.ts`
- Full API: `lib/woocommerce-full.ts`
- Cart Tracker: `lib/woocommerce-cart-tracker.ts`
- Endpoints: `app/api/woocommerce/`
- Abandoned Carts: `app/api/woocommerce/abandoned-carts/route.ts`

### Shopify Integration
- API Client: `lib/shopify-api.ts`
- Dynamic Loader: `lib/shopify-dynamic.ts`
- Provider: `lib/agents/providers/shopify-provider.ts`
- Endpoints: `app/api/shopify/`
- Test Route: `app/api/shopify/test/route.ts`

### Privacy Features
- GDPR APIs: `app/api/gdpr/`
- Data Export: `app/api/privacy/export/route.ts`
- Data Deletion: `app/api/privacy/delete/route.ts`

## Common Development Tasks

### Adding a New API Endpoint
1. Create route in `app/api/[feature]/route.ts`
2. Add Zod schema for validation in `types/api.ts`
3. Implement business logic in `lib/services/`
4. Add tests in `__tests__/api/[feature]/`

### Modifying the Chat Widget
1. Edit embed code in `public/embed.js`
2. Update widget UI in `app/embed/page.tsx`
3. Test embedding on different sites

### Working with Scraping
1. Scraping config: `lib/crawler-config.ts`
2. Content extraction: `lib/content-extractor.ts`
3. Job monitoring: Check Redis or use job status endpoint

### Database Cleanup & Maintenance
When you need to clean scraped data for fresh re-scraping:

1. **Check Current Data**: `npx tsx test-database-cleanup.ts stats`
2. **Clean Specific Domain**: `npx tsx test-database-cleanup.ts clean --domain=example.com`
3. **Clean Everything**: `npx tsx test-database-cleanup.ts clean`

The cleanup system uses CASCADE foreign keys for safe deletion:
- Removes: scraped pages, embeddings, extractions, cache
- Preserves: customer configs, credentials, user accounts
- See `lib/database-cleaner.ts` for implementation
- Full docs: `docs/DATABASE_CLEANUP.md`

## Critical Development Guidelines

### ACTIVE CONTRIBUTORS
- This section contains critical guidelines that must be followed

### Hallucination Prevention
- **CRITICAL**: The chat system has strict anti-hallucination measures in place
- See `docs/HALLUCINATION_PREVENTION.md` for comprehensive documentation
- Key principle: Always admit uncertainty rather than making false claims
- Run `npx tsx test-hallucination-prevention.ts` after any chat prompt changes

## Optimization Philosophy

### Core Principles
**Every decision should prioritize efficiency and scalability:**

- **Minimize Everything**: Every line of code, every dependency, every API call must justify its existence
- **Think Scale First**: Design for 10x growth - what works for 100 users should work for 1,000 or 10,000
- **Performance is a Feature**: Not an afterthought - consider performance implications during design phase
- **Simplicity Over Cleverness**: Simple, readable code is easier to optimize than clever abstractions

### Code Minimalism
**Less code = fewer bugs, faster execution, easier maintenance:**

```typescript
// ❌ Over-engineered
class UserDataTransformerFactory {
  private static instance: UserDataTransformerFactory;
  private transformers: Map<string, ITransformer>;
  // ... 50 lines of abstraction
}

// ✅ Minimal and efficient
function transformUserData(user: User): TransformedUser {
  return { id: user.id, name: user.name };
}
```

**Guidelines:**
- No premature abstractions - wait for 3+ use cases
- Delete dead code immediately - don't comment it out
- Prefer functions over classes when state isn't needed
- Use native JS/TS features over libraries when possible

### Future-Proofing Strategies
**Build for tomorrow's scale today:**

1. **Database Optimization**
   - Index from day one on commonly queried fields
   - Use pagination everywhere - never fetch unbounded lists
   - Design schemas to minimize JOIN operations
   - Consider read/write splitting early

2. **API Design**
   - Implement rate limiting on all endpoints
   - Use cursor-based pagination, not offset
   - Return only needed fields (GraphQL-style thinking)
   - Cache aggressively but invalidate intelligently

3. **Frontend Performance**
   - Lazy load everything that's not critical path
   - Implement virtual scrolling for long lists
   - Use React.memo/useMemo strategically
   - Minimize bundle size - audit regularly

### Resource Efficiency
**Every resource call costs time and money:**

```typescript
// ❌ Wasteful
const users = await db.select('*').from('users');
const filtered = users.filter(u => u.active);

// ✅ Efficient
const users = await db
  .select(['id', 'name', 'email'])
  .from('users')
  .where('active', true);
```

**Optimization Checklist:**
- [ ] Batch database operations where possible
- [ ] Use connection pooling effectively
- [ ] Implement request deduplication
- [ ] Cache computed values aggressively
- [ ] Stream large datasets instead of loading to memory
- [ ] Use background jobs for heavy processing

### Bundle Size Optimization
**Every KB matters for user experience:**

- **Before adding any dependency:** Can native JS/TS do this?
- **Regular audits:** `npm run analyze` weekly
- **Tree-shaking:** Ensure all imports are specific
- **Dynamic imports:** Split code by route/feature
- **Image optimization:** WebP, lazy loading, responsive sizes

### Measurement & Monitoring
**You can't optimize what you don't measure:**

```typescript
// Add performance markers
performance.mark('fetch-start');
const data = await fetchData();
performance.mark('fetch-end');
performance.measure('fetch-duration', 'fetch-start', 'fetch-end');
```

**Key Metrics to Track:**
- API response times (p50, p95, p99)
- Database query performance
- Bundle size changes per PR
- Memory usage patterns
- Cache hit rates

### Decision Framework
**Before writing any code, ask:**

1. **Is this necessary?** Can we achieve the goal without it?
2. **Is there a simpler way?** What's the minimal solution?
3. **Will this scale?** What happens at 10x load?
4. **What's the performance impact?** CPU, memory, network?
5. **Can this be async/deferred?** Does the user need to wait?
6. **Is there a native solution?** Before adding dependencies?
7. **Can we reuse existing code?** Before creating new abstractions?

### Anti-Patterns to Avoid
- **Gold plating**: Adding features "just in case"
- **Dependency bloat**: Package for every small utility
- **Synchronous everything**: Not utilizing async operations
- **Unbounded operations**: Queries/loops without limits
- **Memory leaks**: Not cleaning up listeners/subscriptions
- **Premature optimization**: Optimizing without profiling
- **But also**: Ignoring obvious inefficiencies

**Remember:** The best code is no code. The second best is minimal, efficient code that does exactly what's needed and nothing more.

## Performance Guidelines

### Algorithmic Complexity
**Avoid O(n²) or worse - aim for O(n) or O(n log n):**

```typescript
// ❌ O(n²) - Nested loops
for (const item of items) {
  for (const other of items) {
    if (item.id === other.parentId) { /* ... */ }
  }
}

// ✅ O(n) - Use Map/Set for lookups
const itemMap = new Map(items.map(i => [i.id, i]));
for (const item of items) {
  const parent = itemMap.get(item.parentId); // O(1) lookup
}
```

**Common pitfalls:**
- Nested array searches → Use Maps/Sets
- Multiple database queries in loops → Batch fetch
- Array.includes() in loops → Use Set.has()
- Sorting inside loops → Sort once, reuse

### Async and Parallel Processing
**Use async/parallel processing wherever possible:**

```typescript
// ❌ Sequential
const a = await fetchA();
const b = await fetchB();

// ✅ Parallel
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

**Apply to:** API routes, web scraping, embeddings, WooCommerce sync, data exports  
**Use:** `Promise.all()` for must-succeed, `Promise.allSettled()` for partial failures

## Important Notes

- Always check `lib/config.ts` for feature flags and configuration schemas
- Rate limiting is enforced per domain - see `lib/rate-limit.ts`
- All customer WooCommerce credentials must be encrypted before storage
- Redis must be running for web scraping features to work