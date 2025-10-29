# Reference: Glossary of Terms

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 15 minutes

## Purpose
Comprehensive glossary of technical terms, abbreviations, database entities, and architectural concepts used throughout the Omniops documentation and codebase. Provides quick reference for developers, operators, and integrators working with the multi-tenant AI-powered customer service platform.

## Table of Contents
- [A](#a)
- [B](#b)
- [C](#c)
- [D](#d)
- [E](#e)
- [F](#f)
- [G](#h)
- [I](#i)
- [J](#j)
- [L](#l)
- [M](#m)
- [N](#n)
- [O](#o)
- [P](#p)
- [Q](#q)
- [R](#r)
- [S](#s)
- [T](#t)
- [U](#u)
- [V](#v)
- [W](#w)

---

## A {#a}

### Abandoned Cart
**Definition:** An e-commerce cart where items were added but checkout was not completed within a configurable timeframe.
**Related:** [WooCommerce Integration](../06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md)
**Database Table:** `abandoned_carts`
**Used in:** WooCommerce cart tracker, analytics dashboard

### Agent (AI Agent)
**Definition:** An AI-powered component that performs specific domain tasks within the customer service system using tool-calling capabilities.
**Related:** [Agent Architecture](../01-ARCHITECTURE/ARCHITECTURE_AGENT_SYSTEM.md)
**Types:** Knowledge Agent, Order Lookup Agent, Product Search Agent, WooCommerce Provider, Shopify Provider
**Code Location:** `lib/agents/`, `lib/chat/tool-handlers.ts`

### Agent Orchestration
**Definition:** Pattern for deploying multiple specialized agents in parallel to maximize efficiency and protect context windows.
**Related:** [CLAUDE.md Agent Framework](../../CLAUDE.md#agent-orchestration--parallelization)
**Use Cases:** Dependency updates, file refactoring, multi-module testing, category-based fixes

### Aliases
**Definition:** Alternative names or terms for technical concepts, used in documentation to improve discoverability.
**Related:** This glossary document, all documentation files
**Example:** "RLS" (also known as: Row Level Security, tenant isolation, access control)

---

## B {#b}

### Brand-Agnostic
**Definition:** Architecture principle requiring no hardcoded company names, product types, or industry-specific terminology in code.
**Related:** [CLAUDE.md Brand-Agnostic Rules](../../CLAUDE.md#critical-brand-agnostic-application)
**Enforcement:** All business-specific data must come from database configuration
**Exception:** Test files may use domain-specific terminology

### Bundle Size
**Definition:** Total size of JavaScript/CSS assets sent to browser, measured before and after compression.
**Related:** [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#frontend-performance)
**Tools:** `npm run analyze`, `next-bundle-analyzer`
**Target:** <300KB gzipped

---

## C {#c}

### Caching (Cache Layer)
**Definition:** Multi-layer strategy for storing computed results to avoid redundant processing.
**Related:** [Performance Optimization - Caching](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#caching-strategies)
**Layers:** Browser cache (LocalStorage), Application cache (Redis), Database query cache
**Database Table:** `query_cache`, `search_cache`
**Code Location:** `lib/embedding-cache.ts`, `lib/search-cache.ts`, `lib/domain-cache.ts`

### CASCADE (Cascade Deletion)
**Definition:** Database foreign key behavior that automatically deletes child records when parent is deleted.
**Related:** [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#foreign-key-relationships)
**Example:** Deleting an organization automatically deletes all its domains, conversations, and messages
**Syntax:** `ON DELETE CASCADE`

### Context Grounding
**Definition:** AI technique ensuring responses are based only on retrieved information, not model knowledge.
**Related:** [Hallucination Prevention](../02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)
**Also Known As:** RAG (Retrieval Augmented Generation), source-based responses, evidence-based answers
**Implementation:** System prompts with strict accuracy rules

### customer_configs
**Definition:** Database table storing domain-specific configuration including API credentials, branding, and feature flags.
**Related:** [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#core-business-tables)
**Note:** Misleading name - actually stores domain configurations, not customer/user data
**Foreign Keys:** `organization_id` (owner)
**Key Columns:** `domain`, `business_name`, `encrypted_credentials`, `settings`

---

## D {#d}

### Dashboard
**Definition:** Admin interface for managing organizations, domains, scraping, analytics, and billing.
**Related:** [Dashboard Features Reference](REFERENCE_DASHBOARD_FEATURES.md)
**Code Location:** `app/dashboard/page.tsx`, `lib/queries/dashboard-stats.ts`
**Optimization:** Batch queries eliminated N+1 pattern (Issue #8)

### Dependency Injection (DI)
**Definition:** Design pattern providing dependencies via constructor parameters instead of internal instantiation.
**Related:** [Dependency Injection Architecture](../01-ARCHITECTURE/ARCHITECTURE_DEPENDENCY_INJECTION.md)
**Benefits:** Easier testing, loose coupling, better separation of concerns
**Example:** `WooCommerceProvider(client)` instead of `new WooCommerceAPI()` inside provider

### Docker Compose
**Definition:** Tool for defining and running multi-container Docker applications using YAML configuration.
**Related:** [Docker Setup](../00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
**Files:** `docker-compose.yml` (production), `docker-compose.dev.yml` (development)
**Usage:** `docker-compose up -d`, `docker-compose logs -f`

### Domain (Domain Configuration)
**Definition:** A website/subdomain with its own chat widget configuration, owned by an organization.
**Related:** [Multi-Tenant Architecture](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#multi-tenant-architecture)
**Database Table:** `domains`
**Relationships:** Belongs to organization, has many conversations, scraped_pages, embeddings

---

## E {#e}

### Embeddings (Vector Embeddings)
**Definition:** Numerical vector representations of text enabling semantic similarity search.
**Related:** [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md), [AI & Embeddings](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#ai--embeddings)
**Model:** `text-embedding-3-small` (1,536 dimensions)
**Database Table:** `page_embeddings`
**Cost:** $0.02 per 1M tokens (62.5% cheaper than ada-002)

### Entity Catalog
**Definition:** System for identifying and categorizing entities (products, contacts, FAQs) from scraped content.
**Related:** [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#ai--embeddings)
**Database Table:** `entity_catalog`
**Entity Types:** product, contact, faq, category, specification

---

## F {#f}

### Foreign Key
**Definition:** Database constraint ensuring referential integrity between related tables.
**Related:** [Database Schema - Foreign Keys](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#foreign-key-relationships)
**Count:** 24 foreign key relationships in schema
**Common Pattern:** `domain_id REFERENCES domains(id) ON DELETE CASCADE`

---

## G {#g}

### GDPR (General Data Protection Regulation)
**Definition:** European privacy regulation requiring user data rights (access, deletion, portability).
**Related:** [Privacy Compliance](REFERENCE_PRIVACY_COMPLIANCE.md)
**Database Table:** `gdpr_requests`
**API Endpoints:** `/api/privacy/export`, `/api/privacy/delete`

### GIN Index
**Definition:** Generalized Inverted Index, PostgreSQL index type for JSONB and full-text search.
**Related:** [Database Schema - Index Strategy](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#index-strategy)
**Use Cases:** JSONB column indexing, full-text search, array operations
**Example:** `CREATE INDEX idx_settings_gin ON customer_configs USING gin(settings);`

### GPT-5-mini
**Definition:** OpenAI's latest small model providing excellent quality at 83% lower cost than GPT-4.
**Related:** [AI Model Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#ai-model-optimization)
**Cost:** $0.002/1k input tokens, $0.008/1k output tokens
**Performance:** 2.8s average response time
**Status:** **RECOMMENDED** production model

---

## H {#h}

### Hallucination (AI Hallucination)
**Definition:** When AI generates false information not supported by retrieved context.
**Related:** [Hallucination Prevention](../02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)
**Prevention:** System prompts, context grounding, response validation, comprehensive testing
**Also Known As:** AI fabrication, confabulation, false claims, invented facts

### HNSW (Hierarchical Navigable Small World)
**Definition:** Graph-based algorithm for fast approximate nearest neighbor search in high-dimensional spaces.
**Related:** [Database Schema - Index Strategy](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#index-strategy)
**Use Case:** Vector similarity search for embeddings
**Performance:** Faster than IVFFlat for large datasets
**Index Type:** `USING hnsw (embedding vector_cosine_ops)`

### Hot Reload
**Definition:** Development feature automatically refreshing application when code changes.
**Related:** [Docker Setup - Development](../00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md#development-setup)
**Also Known As:** Live reload, auto-refresh, watch mode
**Configuration:** `docker-compose.dev.yml`, Next.js Fast Refresh

### Hybrid Search
**Definition:** Search strategy combining keyword matching and vector similarity for optimal results.
**Related:** [Search Architecture - Hybrid Search](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md#hybrid-search-strategy)
**Decision Logic:** Keyword for short queries (≤2 words), vector for complex queries (>2 words)
**Performance:** 10× faster keyword search for simple queries

---

## I {#i}

### Index (Database Index)
**Definition:** Database structure improving query performance by creating sorted lookup tables.
**Related:** [Database Schema - Index Strategy](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#index-strategy)
**Total:** 214 indexes across all tables
**Types:** B-tree (default), GIN (JSONB/arrays), HNSW (vectors), Partial (filtered)

---

## J {#j}

### JSONB
**Definition:** PostgreSQL binary JSON data type supporting indexing and efficient querying.
**Related:** [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Use Cases:** `settings` columns, `metadata` columns, flexible schemas
**Indexing:** GIN indexes for fast lookups

---

## L {#l}

### LRU Cache
**Definition:** Least Recently Used cache eviction policy, removing oldest accessed items when full.
**Related:** [Performance Optimization - Caching](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#search--embeddings-performance)
**Implementation:** `lib/embedding-cache.ts` (1000 item max)
**Use Case:** Query embedding cache

---

## M {#m}

### Messages
**Definition:** Individual chat messages within a conversation, with role (user/assistant/system) and content.
**Related:** [Chat & Communication](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#chat--communication)
**Database Table:** `messages`
**Foreign Keys:** `conversation_id` (parent conversation), `organization_id` (denormalized for fast queries)
**Replaces:** `chat_messages` (removed in Issue #11)

### Multi-Tenant Architecture
**Definition:** System design allowing multiple organizations to use shared infrastructure with data isolation.
**Related:** [Multi-Tenant Architecture](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#multi-tenant-architecture), [RLS](#rls-row-level-security)
**Hierarchy:** Organizations → Domains → Conversations → Messages
**Isolation Method:** Row Level Security (RLS) policies
**Primary Key:** `organization_id`

---

## N {#n}

### N+1 Query Problem
**Definition:** Performance anti-pattern executing N additional queries inside a loop, instead of one batch query.
**Related:** [Performance Optimization - Database](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#database-optimizations)
**Example:** Fetching organizations, then querying configs for each (20+ queries)
**Solution:** Batch queries with JOINs and IN clauses (3-4 queries)
**Impact:** 90% faster load times after fixing

---

## O {#o}

### Organization (Multi-Tenant Entity)
**Definition:** Top-level tenant entity representing a company/client using the platform.
**Related:** [Multi-Tenant Architecture](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#multi-tenant-architecture)
**Database Table:** `organizations`
**Relationships:** Has many organization_members, domains, conversations (via domains)
**Billing:** Linked to Stripe via `stripe_customer_id`

### organization_members
**Definition:** Join table linking users to organizations with role-based access control.
**Related:** [Multi-Tenant Architecture](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#multi-tenant-architecture)
**Database Table:** `organization_members`
**Roles:** owner, admin, member
**Foreign Keys:** `organization_id`, `user_id`

---

## P {#p}

### page_embeddings
**Definition:** Vector embeddings of scraped page content chunks for semantic search.
**Related:** [AI & Embeddings](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#ai--embeddings), [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
**Database Table:** `page_embeddings`
**Columns:** `embedding` (vector(1536)), `chunk_text`, `page_id`, `domain_id`
**Index:** HNSW index on `embedding` column
**Count:** 20,229 embeddings (verified 2025-10-24)

### pgvector
**Definition:** PostgreSQL extension adding vector data type and similarity search operations.
**Related:** [Database Schema - Technology Stack](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#database-overview)
**Operations:** Cosine similarity (`<=>`), L2 distance (`<->`), Inner product (`<#>`)
**Index Types:** IVFFlat, HNSW
**Dimension:** 1,536 (text-embedding-3-small)

### Promise.all()
**Definition:** JavaScript method executing multiple async operations in parallel, waiting for all to complete.
**Related:** [Performance Optimization - Parallel Processing](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#api-layer-optimizations)
**Use Case:** Execute multiple tool calls simultaneously
**Impact:** 3 sequential 5s searches → 1 parallel 5s search (10s saved)

---

## Q {#q}

### Query Cache
**Definition:** Redis-backed cache storing search results to avoid redundant database queries.
**Related:** [Caching Strategies](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#caching-strategies)
**Database Table:** `query_cache`
**TTL:** 300 seconds (5 minutes)
**Hit Rate Target:** >70%

---

## R {#r}

### RAG (Retrieval Augmented Generation)
**Definition:** AI technique augmenting model responses with retrieved relevant documents from knowledge base.
**Related:** [Hallucination Prevention](../02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md), [Context Grounding](#context-grounding)
**Flow:** User query → Retrieve relevant docs → AI generates response grounded in docs
**Benefits:** Reduces hallucinations, provides source citations, enables domain-specific knowledge

### Rate Limiting
**Definition:** Throttling mechanism preventing abuse by limiting requests per time window.
**Related:** [Performance Optimization - API Layer](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#api-layer-optimizations)
**Implementation:** `lib/rate-limit.ts` (in-memory), Redis-backed (planned)
**Default:** 100 requests/minute per domain
**Premium:** 500 requests/minute

### Redis
**Definition:** In-memory data store used for caching, job queues, and rate limiting.
**Related:** [Architecture Overview](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#architecture-overview)
**Use Cases:** BullMQ job queue, search cache, embedding cache, rate limiting
**Configuration:** `REDIS_URL` environment variable
**Docker:** Included in `docker-compose.yml`

### RLS (Row Level Security)
**Definition:** PostgreSQL feature restricting row visibility/modification based on user/session context.
**Related:** [Database Schema - RLS](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#row-level-security), [Multi-Tenant Architecture](#multi-tenant-architecture)
**Purpose:** Multi-tenant data isolation
**Policy Count:** 53 policies across 24 tables
**Testing:** [RLS Security Testing Guide](../04-DEVELOPMENT/testing/GUIDE_RLS_SECURITY_TESTING.md)

---

## S {#s}

### scraped_pages
**Definition:** Database table storing indexed website content from web scraping operations.
**Related:** [Content & Scraping](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#content--scraping)
**Database Table:** `scraped_pages`
**Foreign Key:** `domain_id` (which website this content belongs to)
**Relationships:** Has many page_embeddings (vector chunks)
**Cleanup:** `npx tsx test-database-cleanup.ts clean`

### Search Cache
**Definition:** Redis-backed cache storing search query results for fast repeat queries.
**Related:** [Search & Embeddings Performance](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#search--embeddings-performance)
**Implementation:** `lib/search-cache.ts`
**Cache Key Format:** `search:{domain}:{query}:{limit}`
**TTL:** 300 seconds
**Impact:** 21s saved on cache hit

### Semantic Search
**Definition:** Search technique using vector embeddings to find conceptually similar content, not just keyword matches.
**Related:** [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md), [Hybrid Search](#hybrid-search)
**Also Known As:** Vector search, embedding search, similarity search
**Model:** text-embedding-3-small
**Threshold:** 0.15-0.3 cosine similarity

### Shopify Provider
**Definition:** E-commerce integration provider for Shopify Admin API enabling order lookup and product search.
**Related:** [Shopify Configuration](../06-INTEGRATIONS/GUIDE_SHOPIFY_CONFIGURATION.md)
**Code Location:** `lib/agents/providers/shopify-provider.ts`, `lib/shopify-api.ts`
**API Version:** 2024-01
**Endpoints:** `/api/shopify/test`, `/api/shopify/orders`

### Stripe
**Definition:** Payment processing platform integrated for subscription billing.
**Related:** [Stripe Integration](../06-INTEGRATIONS/INTEGRATION_STRIPE_BILLING.md)
**Database Tables:** `organizations` (billing columns), `billing_events`, `invoices`
**Plans:** Starter (£29/month), Professional (£99/month)
**API Routes:** 6 endpoints in `app/api/stripe/`

### Supabase
**Definition:** Open-source Firebase alternative providing PostgreSQL database, authentication, and storage.
**Related:** [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Components:** PostgreSQL 15+, pgvector, Row Level Security, real-time subscriptions
**Project:** birugqyuqhiahxvxeyqg (production)
**Connection:** Service role key (server), Anon key (client)

### System Prompt
**Definition:** Initial instructions to AI model defining behavior, constraints, and response format.
**Related:** [Hallucination Prevention](../02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md), [AI Model Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#ai-model-optimization)
**Implementation:** `lib/chat/system-prompts.ts`
**Token Budget:** ~1,500 tokens
**Optimization:** Concise, rule-based, no verbose examples

---

## T {#t}

### Telemetry
**Definition:** System for tracking performance metrics, costs, and usage patterns.
**Related:** [Telemetry & Analytics](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#telemetry--analytics)
**Database Tables:** `token_tracking_events`, `conversation_metrics`, `ai_usage_logs`, `performance_metrics`
**Code Location:** `lib/chat-telemetry.ts`

### Token Budget
**Definition:** Allocation of AI model context window tokens across system prompt, history, search results, and response.
**Related:** [AI Model Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md#ai-model-optimization)
**Breakdown:** System (1,500) + History (2,000) + Search (15,000) + Response (500) = ~19,000 tokens
**Context Window:** 128,000 tokens (GPT-5-mini)

### Tool (AI Tool)
**Definition:** Function that AI can call to perform actions like searching products, looking up orders, or fetching information.
**Related:** [Tool Definitions](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md), [Chat System](../02-FEATURES/chat-system/)
**Implementation:** `lib/chat/tool-definitions.ts`, `lib/chat/tool-handlers.ts`
**Examples:** `search_products`, `get_product_details`, `search_by_category`, `lookup_order`

---

## U {#u}

### UUID (Universally Unique Identifier)
**Definition:** 128-bit identifier used as primary keys for all database tables.
**Related:** [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Format:** 8-4-4-4-12 hexadecimal (e.g., `123e4567-e89b-12d3-a456-426614174000`)
**Generation:** `gen_random_uuid()` function in PostgreSQL

---

## V {#v}

### Vector Search
**Definition:** Search technique using vector embeddings and cosine similarity to find semantically similar content.
**Related:** [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md#hybrid-search-strategy)
**Also Known As:** Semantic search, embedding search, similarity search
**Implementation:** `search_embeddings` database RPC function
**Performance:** ~4.1s for 100 results

---

## W {#w}

### Webhook
**Definition:** HTTP callback notifying application of external events (e.g., Stripe payment completed).
**Related:** [Stripe Integration - Webhooks](../06-INTEGRATIONS/INTEGRATION_STRIPE_BILLING.md)
**Endpoint:** `/api/stripe/webhook`
**Security:** HMAC signature verification
**Idempotency:** `billing_events` table prevents duplicate processing

### Widget (Chat Widget)
**Definition:** Embeddable JavaScript chat interface added to customer websites.
**Related:** [Widget Configuration](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#widget-configuration)
**Database Tables:** `widget_configs`, `widget_variants`, `widget_history`
**Embed Code:** `<script src="https://yourdomain.com/embed.js"></script>`
**Files:** `public/embed.js`, `app/embed/page.tsx`

### WooCommerce Provider
**Definition:** E-commerce integration provider for WooCommerce REST API v3 enabling product search and order lookup.
**Related:** [WooCommerce Integration](../06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md), [WooCommerce Customization](../02-GUIDES/GUIDE_WOOCOMMERCE_CUSTOMIZATION.md)
**Code Location:** `lib/agents/providers/woocommerce-provider.ts`, `lib/woocommerce-dynamic.ts`
**Credentials:** Encrypted in `customer_configs.encrypted_credentials`
**Endpoints:** `/api/woocommerce/products`, `/api/woocommerce/orders`, `/api/woocommerce/abandoned-carts`

---

## Document Conventions

### Keywords
**Definition:** Comma-separated list of search terms appearing at top of documentation files.
**Purpose:** Enable AI agents and developers to quickly find relevant documentation
**Location:** After metadata header, before Table of Contents
**Example:** `Keywords: database, schema, PostgreSQL, Supabase, pgvector, RLS`

### Aliases
**Definition:** Alternative names and acronyms for technical terms, formatted as "term (also known as: alt1, alt2)".
**Purpose:** Improve documentation discoverability for users with different terminology backgrounds
**Format:** Bulleted list with quotation marks around primary term
**Example:** `- "RLS" (also known as: Row Level Security, tenant isolation)`

---

## Related Documentation

- [Database Schema Reference](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Complete schema documentation
- [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md) - Search system and result limits
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Optimization strategies
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines and architectural principles

---

**Maintenance:** Update quarterly or when new major features/concepts are introduced
**Contributors:** Add new terms via PR with definition, related docs, and usage context
**Verification:** Terms should appear in at least 2 documentation files or be central to architecture
