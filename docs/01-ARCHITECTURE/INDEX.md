# Architecture Documentation Index

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 5 minutes

## Purpose
1. [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - System-wide design 2. [ARCHITECTURE_DATA_MODEL.md](ARCHITECTURE_DATA_MODEL.md) - Data relationships 3. [ARCHITECTURE_MULTI_TENANT.md](ARCHITECTURE_MULTI_TENANT.md) - Tenant isolation

## Quick Links
- [Quick Navigation](#quick-navigation)
- [Files in This Directory](#files-in-this-directory)
- [Recommended Reading Order](#recommended-reading-order)
- [Key Architectural Principles](#key-architectural-principles)
- [Related Documentation](#related-documentation)

## Keywords
architectural, directory, documentation, files, index, navigation, order, principles, quick, reading

---


**Last Updated:** 2025-10-29
**Total Files:** 24
**Purpose:** System design, architectural patterns, data models, and core system infrastructure

## Quick Navigation
- [← Getting Started](../00-GETTING-STARTED/)
- [Next Category: Guides →](../02-GUIDES/)
- [Documentation Home](../README.md)

---

## Files in This Directory

### Core System Architecture
- **[ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md)** - Complete system architecture overview
- **[ARCHITECTURE_DATA_MODEL.md](ARCHITECTURE_DATA_MODEL.md)** - Multi-tenant data model (organizations → domains → conversations)
- **[ARCHITECTURE_SEARCH_SYSTEM.md](ARCHITECTURE_SEARCH_SYSTEM.md)** - Hybrid search with 100-200 result limits
- **[ARCHITECTURE_SEARCH_V2.md](ARCHITECTURE_SEARCH_V2.md)** - Next-generation search improvements

### Agent & AI Systems
- **[ARCHITECTURE_AGENT_SYSTEM.md](ARCHITECTURE_AGENT_SYSTEM.md)** - AI agent orchestration and provider pattern
- **[ARCHITECTURE_AGENT_ENHANCEMENTS.md](ARCHITECTURE_AGENT_ENHANCEMENTS.md)** - Agent capability improvements
- **[ARCHITECTURE_AI_SCRAPER_SYSTEM.md](ARCHITECTURE_AI_SCRAPER_SYSTEM.md)** - Intelligent web scraping architecture
- **[ARCHITECTURE_TRUST_AI.md](ARCHITECTURE_TRUST_AI.md)** - AI reliability and verification systems
- **[ARCHITECTURE_LEARNING_SYSTEM.md](ARCHITECTURE_LEARNING_SYSTEM.md)** - Adaptive learning mechanisms

### Multi-Tenant Architecture
- **[ARCHITECTURE_MULTI_TENANT.md](ARCHITECTURE_MULTI_TENANT.md)** - Organization-based tenant isolation with RLS
- **[ARCHITECTURE_MULTI_SEAT.md](ARCHITECTURE_MULTI_SEAT.md)** - Multi-seat team collaboration
- **[ARCHITECTURE_BRAND_EXTRACTION.md](ARCHITECTURE_BRAND_EXTRACTION.md)** - Brand-specific content extraction

### Content & Scraping
- **[ARCHITECTURE_SCRAPER.md](ARCHITECTURE_SCRAPER.md)** - Web scraping system design
- **[ARCHITECTURE_REINDEX_SYSTEM.md](ARCHITECTURE_REINDEX_SYSTEM.md)** - Content reindexing and refresh strategies
- **[ARCHITECTURE_SYNONYM_SYSTEM.md](ARCHITECTURE_SYNONYM_SYSTEM.md)** - Synonym management for search
- **[ARCHITECTURE_CACHE_CONSISTENCY.md](ARCHITECTURE_CACHE_CONSISTENCY.md)** - Cache invalidation patterns

### Development Patterns
- **[ARCHITECTURE_DEPENDENCY_INJECTION.md](ARCHITECTURE_DEPENDENCY_INJECTION.md)** - DI pattern for testable code
- **[ARCHITECTURE_CODE_ORGANIZATION.md](ARCHITECTURE_CODE_ORGANIZATION.md)** - File structure and modularity
- **[decisions.md](decisions.md)** - Architectural decision records (ADRs)

### Infrastructure
- **[ARCHITECTURE_BACKGROUND_WORKER.md](ARCHITECTURE_BACKGROUND_WORKER.md)** - Redis-backed job processing
- **[ARCHITECTURE_TELEMETRY_SYSTEM.md](ARCHITECTURE_TELEMETRY_SYSTEM.md)** - Observability and monitoring

### Legacy/Redirect Files
- **[database-schema.md](database-schema.md)** - ⚠️ REDIRECT → See [07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- **[search-architecture.md](search-architecture.md)** - ⚠️ REDIRECT → See [ARCHITECTURE_SEARCH_SYSTEM.md](ARCHITECTURE_SEARCH_SYSTEM.md)
- **[performance-optimization.md](performance-optimization.md)** - ⚠️ REDIRECT → See [07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

---

## Recommended Reading Order

### For Understanding Core Architecture (Start Here)
1. [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - System-wide design
2. [ARCHITECTURE_DATA_MODEL.md](ARCHITECTURE_DATA_MODEL.md) - Data relationships
3. [ARCHITECTURE_MULTI_TENANT.md](ARCHITECTURE_MULTI_TENANT.md) - Tenant isolation
4. [ARCHITECTURE_SEARCH_SYSTEM.md](ARCHITECTURE_SEARCH_SYSTEM.md) - Search internals

### For AI/Agent Development
1. [ARCHITECTURE_AGENT_SYSTEM.md](ARCHITECTURE_AGENT_SYSTEM.md) - Agent framework
2. [ARCHITECTURE_AGENT_ENHANCEMENTS.md](ARCHITECTURE_AGENT_ENHANCEMENTS.md) - Capabilities
3. [ARCHITECTURE_TRUST_AI.md](ARCHITECTURE_TRUST_AI.md) - Reliability patterns
4. [ARCHITECTURE_LEARNING_SYSTEM.md](ARCHITECTURE_LEARNING_SYSTEM.md) - Adaptive learning

### For Backend Development
1. [ARCHITECTURE_DEPENDENCY_INJECTION.md](ARCHITECTURE_DEPENDENCY_INJECTION.md) - Testability
2. [ARCHITECTURE_CODE_ORGANIZATION.md](ARCHITECTURE_CODE_ORGANIZATION.md) - File structure
3. [ARCHITECTURE_BACKGROUND_WORKER.md](ARCHITECTURE_BACKGROUND_WORKER.md) - Async jobs
4. [ARCHITECTURE_CACHE_CONSISTENCY.md](ARCHITECTURE_CACHE_CONSISTENCY.md) - Caching

---

## Key Architectural Principles

1. **Multi-Tenant First** - Organization-based isolation with RLS
2. **Brand Agnostic** - No hardcoded business logic
3. **AI-Powered** - ReAct agents with tool calling
4. **Privacy Compliant** - GDPR/CCPA by design
5. **Testable** - Dependency injection throughout
6. **Scalable** - Async processing and caching

---

## Related Documentation
- [Database Schema Reference](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Complete data model
- [Testing Strategy](../04-DEVELOPMENT/testing/) - Architecture testing
- [API Reference](../03-API/) - API design patterns
- [Deployment Architecture](../05-DEPLOYMENT/) - Production infrastructure
