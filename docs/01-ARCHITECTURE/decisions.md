# Architecture Decision Records

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 25 minutes

## Purpose
This document captures key architectural decisions made during the development of the Omniops AI customer service chat widget. These ADRs serve as historical context for understanding why certain technical choices were made.

## Quick Links
- [ADR-001: Why Supabase as Database Platform](#adr-001-why-supabase-as-database-platform)
- [ADR-002: Why pgvector for Vector Search](#adr-002-why-pgvector-for-vector-search)
- [ADR-003: Why Next.js 15 and React 19](#adr-003-why-nextjs-15-and-react-19)
- [ADR-004: Why Multi-Tenant Architecture](#adr-004-why-multi-tenant-architecture)
- [ADR-005: Why Hybrid Search (Vector + Keyword)](#adr-005-why-hybrid-search-vector--keyword)

## Keywords
additional, architecture, chat, crawlee, credential, database, decision, decisions, document, embeddable

---


This document captures key architectural decisions made during the development of the Omniops AI customer service chat widget. These ADRs serve as historical context for understanding why certain technical choices were made.

---

## ADR-001: Why Supabase as Database Platform

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** The application requires a database solution for storing customer configurations, scraped website content, chat conversations, and vector embeddings. We needed built-in authentication, security, and real-time capabilities.

**Decision:** Use Supabase as our database platform (PostgreSQL with managed services).

**Alternatives Considered:**
- **Direct PostgreSQL deployment:** Full control, but significant operational overhead for auth, backups, scaling
- **Firebase:** Easy to use, but NoSQL doesn't fit relational data model, vendor lock-in concerns
- **PlanetScale:** MySQL-based, good for relational data, but lacks native vector search support
- **MongoDB Atlas:** Good for flexible schemas, but not ideal for structured multi-tenant data

**Rationale:**
- Built-in authentication and Row Level Security (RLS) for multi-tenant isolation
- Native pgvector extension support for semantic search
- Excellent developer experience with auto-generated APIs
- Real-time subscriptions for live chat features
- Managed backups, scaling, and maintenance
- Open source PostgreSQL foundation reduces vendor lock-in risk
- Generous free tier for development

**Consequences:**
- **Positive:** Massive reduction in infrastructure setup time, built-in security features, excellent TypeScript support
- **Negative:** Vendor dependency, some advanced PostgreSQL features may require custom setup
- **Neutral:** Learning curve for RLS policies, must follow Supabase best practices

**References:**
- `SUPABASE_SCHEMA.md` - Complete schema documentation
- `lib/supabase/client.ts` and `lib/supabase/server.ts` - Client implementations

---

## ADR-002: Why pgvector for Vector Search

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** Semantic search is core to the chat functionality. The system needs to find relevant content from scraped websites using natural language queries.

**Decision:** Use pgvector extension in PostgreSQL for vector embeddings and similarity search.

**Alternatives Considered:**
- **Pinecone:** Purpose-built vector database, fast, but adds separate infrastructure and costs
- **Weaviate:** Feature-rich vector database, but operational complexity
- **Qdrant:** Modern vector DB with good performance, but another service to manage
- **Separate vector database (Milvus/FAISS):** High performance, but architectural complexity

**Rationale:**
- Co-location with relational data simplifies architecture (single database)
- No need to sync data between databases
- Leverages existing PostgreSQL knowledge and tooling
- Significantly lower cost than dedicated vector databases
- Joins between embeddings and metadata are straightforward
- Proven performance up to millions of vectors
- Open source with strong community support

**Consequences:**
- **Positive:** Simplified architecture, reduced operational complexity, lower costs, easier development
- **Negative:** PostgreSQL scaling may become a bottleneck at massive scale (10M+ vectors)
- **Neutral:** Performance tuning required for optimal vector search (see `docs/SEARCH_ARCHITECTURE.md`)

**References:**
- `docs/SEARCH_ARCHITECTURE.md` - Detailed search implementation and optimization
- `lib/embeddings.ts` - Vector search implementation
- `docs/PERFORMANCE_OPTIMIZATION.md` - Search performance analysis

---

## ADR-003: Why Next.js 15 and React 19

**Date:** Early 2024 (Project Inception), Updated Q4 2024
**Status:** Accepted
**Context:** Need a modern web framework that supports both server-side rendering and API routes, with excellent developer experience and performance.

**Decision:** Use Next.js 15 with React 19, leveraging React Server Components and modern React features.

**Alternatives Considered:**
- **Remix:** Strong server-side model, but smaller ecosystem and less mature
- **SvelteKit:** Excellent performance, but team expertise in React ecosystem
- **Vanilla React + Express:** Full control, but significant boilerplate and infrastructure setup
- **Astro:** Great for content sites, but less ideal for dynamic applications

**Rationale:**
- React Server Components enable optimal performance with server-side rendering
- Next.js API Routes provide serverless functions without separate backend
- React 19 features (actions, use hook, optimistic updates) improve UX
- Excellent TypeScript support throughout
- Strong ecosystem and community
- Vercel deployment optimization (though not vendor-locked)
- App Router enables modern patterns with great developer experience

**Consequences:**
- **Positive:** Faster page loads, smaller client bundles, excellent DX, future-proof architecture
- **Negative:** Learning curve for React Server Components, some experimental features, migration path for future versions
- **Neutral:** Framework-specific patterns require team onboarding

**References:**
- `app/` directory structure - Next.js 15 App Router
- `app/api/` - API routes implementation
- `app/embed/page.tsx` - Server Component example

---

## ADR-004: Why Multi-Tenant Architecture

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** The application serves multiple customers, each with their own websites, configurations, and data. Need to ensure complete data isolation while maintaining operational efficiency.

**Decision:** Single database with domain-based tenant isolation using Row Level Security (RLS).

**Alternatives Considered:**
- **Separate databases per customer:** Maximum isolation, but significant operational overhead
- **Schema-based multi-tenancy:** Middle ground, but complex migrations and maintenance
- **Application-level filtering only:** Simpler code, but higher security risk
- **Separate application instances:** Maximum isolation, prohibitive costs

**Rationale:**
- Cost efficiency - single infrastructure serves all customers
- Operational simplicity - one schema to maintain and migrate
- RLS provides database-level security guarantees (not just app-level)
- Easy to add new customers without infrastructure changes
- Shared indexes and query optimizations benefit all tenants
- Supabase RLS integrates seamlessly with authentication

**Consequences:**
- **Positive:** Lower costs, easier operations, faster customer onboarding, database-level security
- **Negative:** Must ensure all queries include tenant filters, potential noisy neighbor issues at scale
- **Neutral:** Requires discipline in query design, careful RLS policy management

**References:**
- `SUPABASE_SCHEMA.md` - RLS policies documented
- `lib/config.ts` - Domain-based configuration
- All API routes include domain-based filtering

---

## ADR-005: Why Hybrid Search (Vector + Keyword)

**Date:** Mid 2024 (Search Optimization Phase)
**Status:** Accepted
**Context:** Pure vector search sometimes misses exact keyword matches, while keyword search lacks semantic understanding. Users expect both "fuzzy" semantic matches and exact term matches.

**Decision:** Implement hybrid search combining vector similarity with keyword fallback.

**Alternatives Considered:**
- **Vector-only search:** Semantic understanding, but misses exact matches
- **Keyword-only search:** Fast and precise, but no semantic understanding
- **BM25 ranking:** Advanced keyword relevance, but still no semantic matching
- **Elasticsearch integration:** Powerful hybrid search, but additional infrastructure

**Rationale:**
- Vector search handles semantic queries ("how do I reset my password")
- Keyword search handles exact terms (product codes, names, technical terms)
- Fallback mechanism ensures results even with poor embeddings
- Weighted combination provides best of both worlds
- No additional infrastructure needed
- Addresses real user pain points from testing

**Consequences:**
- **Positive:** Better search accuracy, handles diverse query types, more robust
- **Negative:** More complex implementation, slightly higher query latency, requires tuning
- **Neutral:** Need to maintain both search indexes, complexity in ranking algorithm

**References:**
- `docs/SEARCH_ARCHITECTURE.md` - Complete hybrid search documentation
- `lib/embeddings.ts` - Implementation of hybrid search logic
- `docs/HALLUCINATION_PREVENTION.md` - Search quality safeguards

---

## ADR-006: Why Redis for Job Queue

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** Web scraping is long-running and resource-intensive. Cannot block HTTP requests waiting for scraping to complete. Need reliable background job processing with retries.

**Decision:** Use Redis with BullMQ for background job queue management.

**Alternatives Considered:**
- **Database-backed queue:** Simple setup, but polling overhead and performance issues
- **RabbitMQ:** Enterprise-grade, but operational complexity overkill for our needs
- **AWS SQS:** Managed service, but vendor lock-in and additional costs
- **In-memory queue (no persistence):** Simple, but jobs lost on restart

**Rationale:**
- Redis is extremely fast for queue operations
- BullMQ provides excellent TypeScript support and developer experience
- Built-in job retries, delays, and failure handling
- Monitoring and debugging tools available
- Can also use Redis for caching (dual purpose)
- Lightweight infrastructure addition
- Easy to run locally with Docker

**Consequences:**
- **Positive:** Fast job processing, reliable retry logic, good observability, dual-use for caching
- **Negative:** Additional infrastructure component to manage, Redis memory limits
- **Neutral:** Need Redis running in all environments (dev, staging, prod)

**References:**
- `lib/redis.ts` - Redis client and queue implementation
- `lib/scrape-job-processor.ts` - Job processing logic
- `docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md` - Redis setup in Docker

---

## ADR-007: Why Crawlee + Playwright for Scraping

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** Need to scrape diverse websites including modern SPAs with JavaScript rendering. Must handle rate limiting, retries, and extract clean content.

**Decision:** Use Crawlee framework with Playwright browser automation.

**Alternatives Considered:**
- **Puppeteer:** Similar to Playwright, but less modern API and worse cross-browser support
- **Cheerio (static parsing):** Fast and lightweight, but cannot handle SPAs or JavaScript-rendered content
- **Selenium:** Mature but slower and more complex API
- **Custom crawler:** Full control, but significant development time and maintenance

**Rationale:**
- Crawlee provides intelligent crawling patterns (breadth-first, depth-first)
- Built-in rate limiting and request throttling
- Automatic retry logic with exponential backoff
- Playwright handles modern SPAs and JavaScript-heavy sites
- Cross-browser support (Chromium, Firefox, WebKit)
- Request queue management and deduplication
- Excellent TypeScript support
- Active development and community

**Consequences:**
- **Positive:** Handles modern websites, robust error handling, faster development, reliable crawling
- **Negative:** Higher resource usage (headless browsers), slower than static parsers, browser binaries to manage
- **Neutral:** Learning curve for Crawlee patterns, browser automation complexity

**References:**
- `lib/crawler-config.ts` - Crawlee configuration
- `lib/content-extractor.ts` - Content extraction with Readability
- `app/api/scrape/route.ts` - Scraping API endpoint

---

## ADR-008: Why AES-256 for Credential Encryption

**Date:** Early 2024 (Security Hardening Phase)
**Status:** Accepted
**Context:** Application stores customer WooCommerce and Shopify API credentials. These credentials provide access to sensitive business data and must be protected at rest.

**Decision:** Use AES-256-GCM for application-level encryption of credentials before storing in database.

**Alternatives Considered:**
- **Database-level encryption only:** Protects against disk theft, but not application compromise
- **Separate secrets vault (HashiCorp Vault, AWS Secrets Manager):** Enterprise-grade, but operational complexity
- **No encryption (HTTPS only):** Protects in transit, unacceptable for data at rest
- **Supabase Vault:** Built-in secrets management, but less flexible for our use case

**Rationale:**
- AES-256-GCM is industry-standard encryption (NIST approved)
- GCM mode provides authenticated encryption (prevents tampering)
- Application-level encryption protects against database compromise
- Encryption key managed separately from database
- Allows for key rotation without database migration
- No additional infrastructure dependencies
- Better performance than network calls to external vault

**Consequences:**
- **Positive:** Strong security for credentials, compliance-friendly, no external dependencies
- **Negative:** Application must manage encryption keys securely, key loss means credential loss
- **Neutral:** Slightly increased code complexity, must ensure key backup strategy

**References:**
- `lib/encryption.ts` - AES-256-GCM implementation
- `lib/woocommerce-dynamic.ts` - Credential decryption usage
- `lib/shopify-dynamic.ts` - Shopify credential handling

---

## ADR-009: Why OpenAI GPT-4 for Chat

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** Need high-quality AI chat capabilities with function calling for tool use, reliable performance, and good customer support integration.

**Decision:** Use OpenAI GPT-4 and GPT-4o for chat completions with function calling.

**Alternatives Considered:**
- **Anthropic Claude:** Excellent quality, longer context, but function calling less mature at decision time
- **Open source models (Llama, Mistral):** Cost savings, but requires hosting infrastructure and quality concerns
- **Google Gemini:** Competitive features, but newer and less proven at decision time
- **Mix of models:** Different models for different tasks, but operational complexity

**Rationale:**
- GPT-4/GPT-4o provide best-in-class quality for customer service
- Excellent function calling support for tool integration
- Reliable API uptime and performance
- Comprehensive documentation and community support
- Embeddings API for semantic search (text-embedding-3-small)
- Structured outputs with JSON mode
- Good cost/performance ratio with GPT-4o

**Consequences:**
- **Positive:** High-quality responses, reliable service, excellent developer experience, comprehensive features
- **Negative:** API costs scale with usage, vendor dependency, potential future pricing changes
- **Neutral:** Rate limits require handling, must monitor token usage, data sent to third party

**References:**
- `app/api/chat/route.ts` - GPT-4 integration
- `lib/embeddings.ts` - Embeddings generation
- `docs/HALLUCINATION_PREVENTION.md` - Quality safeguards

---

## ADR-010: Why Embeddable Widget Architecture

**Date:** Early 2024 (Project Inception)
**Status:** Accepted
**Context:** Need to integrate chat functionality into diverse customer websites without requiring code changes or complex technical setup.

**Decision:** Use JavaScript embed snippet that loads widget in sandboxed iframe.

**Alternatives Considered:**
- **Native integration (npm package):** Better performance, but requires developer integration and build process
- **Browser extension:** Easy for users, but limited distribution and browser-specific
- **WordPress plugin:** Easy for WordPress sites, but not applicable to all customers
- **Direct embed (no iframe):** Simpler, but CSS conflicts and security concerns

**Rationale:**
- JavaScript snippet is one-line integration (copy-paste)
- Iframe provides CSS isolation (no style conflicts with host site)
- Security sandboxing protects both widget and host site
- Works on any website regardless of technology stack
- No customer code changes or build process required
- Easy to update widget without customer changes
- Supports cross-origin communication for functionality

**Consequences:**
- **Positive:** Extremely easy integration, CSS isolation, security sandboxing, universal compatibility
- **Negative:** Cross-origin complexity (postMessage), iframe performance overhead, some browser restrictions
- **Neutral:** Must handle iframe sizing and positioning, CORS considerations for API calls

**References:**
- `public/embed.js` - Widget embed script
- `app/embed/page.tsx` - Widget implementation
- Customer integration documentation

---

## Additional Technical Decisions

### ADR-011: Why Mozilla Readability for Content Extraction

**Date:** Mid 2024
**Status:** Accepted
**Context:** Scraped web pages contain navigation, ads, footers, and other non-content elements that reduce search quality and waste token space.

**Decision:** Use Mozilla's Readability library for content extraction.

**Rationale:**
- Battle-tested algorithm from Firefox Reader Mode
- Excellent at identifying main content vs boilerplate
- Removes ads, navigation, footers automatically
- Preserves article structure and formatting
- Better embedding quality from clean content
- Reduces token usage in LLM context

**References:**
- `lib/content-extractor.ts` - Readability integration

---

### ADR-012: Why Domain-Based Rate Limiting

**Date:** Early 2024
**Status:** Accepted
**Context:** Need to prevent abuse while allowing legitimate high-volume customers to use the system effectively.

**Decision:** Implement per-domain rate limiting with configurable limits per customer.

**Rationale:**
- Fair usage across all customers (prevent one customer from monopolizing resources)
- Configurable limits allow premium customers higher quotas
- Domain-based tracking aligns with multi-tenant architecture
- Prevents accidental DDoS from customer integrations
- Redis-backed for distributed rate limiting

**References:**
- `lib/rate-limit.ts` - Rate limiting implementation
- `lib/config.ts` - Per-customer rate limit configuration

---

### ADR-013: Why Zod for Schema Validation

**Date:** Early 2024
**Status:** Accepted
**Context:** API routes need robust input validation with TypeScript type inference.

**Decision:** Use Zod for runtime schema validation throughout the application.

**Rationale:**
- TypeScript-first design with excellent type inference
- Runtime validation prevents invalid data from entering system
- Clear error messages for debugging
- Composable schemas for reuse
- Integration with form libraries
- Parse and transform capabilities

**References:**
- `types/api.ts` - Zod schema definitions
- All API routes use Zod validation

---

### ADR-014: Why Privacy-First Design (GDPR/CCPA Compliance)

**Date:** Early 2024
**Status:** Accepted
**Context:** Handling customer conversation data requires compliance with privacy regulations and building user trust.

**Decision:** Implement privacy-first architecture with data export, deletion, and retention policies.

**Rationale:**
- Legal compliance with GDPR and CCPA requirements
- Builds customer trust through transparency
- Configurable data retention per customer
- User-initiated data export and deletion
- Privacy-by-design reduces future compliance risk

**References:**
- `app/api/privacy/export/route.ts` - Data export
- `app/api/privacy/delete/route.ts` - Data deletion
- `app/api/gdpr/` - GDPR compliance endpoints

---

### ADR-015: Why TypeScript Strict Mode

**Date:** Early 2024
**Status:** Accepted
**Context:** Need to prevent runtime errors and improve code quality across the codebase.

**Decision:** Enable TypeScript strict mode with all strict checks enabled.

**Rationale:**
- Catches potential runtime errors at compile time
- Improves code documentation through types
- Better IDE autocomplete and refactoring
- Reduces bugs from undefined/null issues
- Forces explicit handling of edge cases

**References:**
- `tsconfig.json` - Strict mode configuration
- All `.ts` and `.tsx` files follow strict typing

---

## Superseded Decisions

### ~~ADR-016: Database-Level Credential Storage~~ (Superseded by ADR-008)

**Date:** Early 2024
**Status:** Superseded by ADR-008 (Encryption)
**Original Decision:** Store WooCommerce credentials in plain text with database-level encryption only.
**Why Superseded:** Security review identified need for application-level encryption to protect against database compromise.
**Superseded By:** ADR-008 - AES-256-GCM application-level encryption

---

## Decision Making Process

When making architectural decisions for this project:

1. **Document the context** - What problem are we solving?
2. **List alternatives** - What other options did we consider?
3. **Explain rationale** - Why did we choose this option?
4. **Identify consequences** - What are the trade-offs?
5. **Add references** - Link to relevant code and documentation
6. **Review regularly** - Decisions may need revisiting as requirements change

New ADRs should be added to this document following the template above.

---

## Document Metadata

**Created:** 2024-10-24
**Last Updated:** 2024-10-24
**Total ADRs:** 16 (15 active, 1 superseded)
**Maintainer:** Development Team
