# Reference Documentation Index

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 8 minutes

## Purpose
Complete authoritative reference:

## Quick Links
- [Quick Navigation](#quick-navigation)
- [Files in This Directory](#files-in-this-directory)
- [Most Referenced Documents](#most-referenced-documents)
- [Quick Reference Cards](#quick-reference-cards)
- [Glossary of Key Terms](#glossary-of-key-terms)

## Keywords
cards, directory, documentation, documents, files, glossary, index, most, navigation, order

---


**Last Updated:** 2025-10-29
**Total Files:** 10+
**Purpose:** Complete technical references, schemas, glossaries, and comprehensive guides

## Quick Navigation
- [← Troubleshooting](../06-TROUBLESHOOTING/)
- [Documentation Home](../README.md)

---

## Files in This Directory

### Core References
- **[REFERENCE_DATABASE_SCHEMA.md](REFERENCE_DATABASE_SCHEMA.md)** - Complete database schema (29 tables, 214 indexes, 24 foreign keys)
- **[REFERENCE_PERFORMANCE_OPTIMIZATION.md](REFERENCE_PERFORMANCE_OPTIMIZATION.md)** - Comprehensive optimization guide
- **[REFERENCE_NPX_SCRIPTS.md](REFERENCE_NPX_SCRIPTS.md)** - NPX maintenance scripts reference

### API & Features
- **[REFERENCE_API_ENDPOINTS.md](../03-API/REFERENCE_API_ENDPOINTS.md)** - Complete API endpoint reference
- **[REFERENCE_DASHBOARD_FEATURES.md](REFERENCE_DASHBOARD_FEATURES.md)** - Dashboard capabilities and features
- **[REFERENCE_ANALYTICS_OVERVIEW.md](REFERENCE_ANALYTICS_OVERVIEW.md)** - Analytics system overview

### Compliance & Privacy
- **[REFERENCE_PRIVACY_COMPLIANCE.md](REFERENCE_PRIVACY_COMPLIANCE.md)** - GDPR/CCPA compliance reference
- **[REFERENCE_SECURITY_CHECKLIST.md](REFERENCE_SECURITY_CHECKLIST.md)** - Security audit checklist

### Performance
- **[REFERENCE_PERFORMANCE_ANALYSIS_INDEX.md](REFERENCE_PERFORMANCE_ANALYSIS_INDEX.md)** - Performance metrics and analysis

### Complete Guides
- **[REFERENCE_NPX_TOOLS_COMPLETE.md](REFERENCE_NPX_TOOLS_COMPLETE.md)** - Complete NPX tools documentation
- **[REFERENCE_GLOSSARY.md](REFERENCE_GLOSSARY.md)** - Technical terms and definitions

---

## Most Referenced Documents

### 1. Database Schema (214 references)
**[REFERENCE_DATABASE_SCHEMA.md](REFERENCE_DATABASE_SCHEMA.md)**

Complete authoritative reference:
- 29 active tables across 10 categories
- 214 indexes (HNSW, GIN, B-tree)
- 24 foreign key relationships
- 53 RLS policies
- Entity relationship diagrams

**Use when**: Understanding data model, writing queries, designing features

---

### 2. Performance Optimization (156 references)
**[REFERENCE_PERFORMANCE_OPTIMIZATION.md](REFERENCE_PERFORMANCE_OPTIMIZATION.md)**

Comprehensive optimization guide covering:
- Database optimization (query patterns, indexing)
- API performance (caching, rate limiting)
- Search performance (hybrid search, result limits)
- Frontend optimization (lazy loading, bundle size)

**Use when**: Addressing performance issues, scaling the application

---

### 3. NPX Scripts (92 references)
**[REFERENCE_NPX_SCRIPTS.md](REFERENCE_NPX_SCRIPTS.md)**

Essential maintenance tools:
- `test-database-cleanup.ts` - Database cleanup and fresh re-scraping
- `monitor-embeddings-health.ts` - Vector search health monitoring
- `test-hallucination-prevention.ts` - AI accuracy testing

**Use when**: Database maintenance, quality assurance, troubleshooting

---

## Quick Reference Cards

### Database Quick Facts
- **Total Tables**: 29 (public schema)
- **Total Indexes**: 214 (performance optimized)
- **Foreign Keys**: 24 relationships
- **RLS Policies**: 53 (multi-tenant isolation)
- **Primary Extension**: pgvector (1536-dimensional embeddings)

### Performance Targets
- **API Response**: p50 < 200ms, p95 < 1s
- **Search Latency**: < 500ms for 100-200 results
- **Database Queries**: < 100ms average
- **Error Rate**: < 0.1%

### API Limits
- **Rate Limit**: 100 requests/minute per domain
- **Burst**: 20 requests/second
- **Search Results**: 100-200 (default), up to 1000 max
- **File Upload**: 10MB max

---

## Glossary of Key Terms

### Multi-Tenant Architecture
- **organization_id**: Tenant identifier (WHO owns the data)
- **domain_id**: Website identifier (WHICH website)
- **RLS**: Row Level Security (tenant isolation)

### Search Architecture
- **Hybrid Search**: Combining keyword + vector search
- **Embeddings**: 1536-dimensional OpenAI vectors
- **HNSW Index**: Fast vector similarity search
- **Result Limits**: 100-200 (NOT 20!)

### E-Commerce Integration
- **Provider Pattern**: Abstract interface for multiple platforms
- **WooCommerce**: 6 tools, 5.7% API coverage
- **Shopify**: Full integration
- **Commerce Operations**: Product search, order lookup, stock checking

**Full Glossary**: [REFERENCE_GLOSSARY.md](REFERENCE_GLOSSARY.md)

---

## Recommended Reading Order

### For Architecture Understanding
1. [REFERENCE_DATABASE_SCHEMA.md](REFERENCE_DATABASE_SCHEMA.md) - Data model
2. [../01-ARCHITECTURE/ARCHITECTURE_OVERVIEW.md](../01-ARCHITECTURE/ARCHITECTURE_OVERVIEW.md) - System design
3. [../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md) - Search internals

### For Performance Optimization
1. [REFERENCE_PERFORMANCE_OPTIMIZATION.md](REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Complete guide
2. [REFERENCE_PERFORMANCE_ANALYSIS_INDEX.md](REFERENCE_PERFORMANCE_ANALYSIS_INDEX.md) - Metrics
3. [../04-ANALYSIS/ANALYSIS_PERFORMANCE_BOTTLENECKS.md](../04-ANALYSIS/ANALYSIS_PERFORMANCE_BOTTLENECKS.md) - Issues

### For Operations & Maintenance
1. [REFERENCE_NPX_SCRIPTS.md](REFERENCE_NPX_SCRIPTS.md) - Maintenance tools
2. [../06-TROUBLESHOOTING/](../06-TROUBLESHOOTING/) - Problem solving
3. [../05-DEPLOYMENT/GUIDE_MONITORING_SETUP.md](../05-DEPLOYMENT/GUIDE_MONITORING_SETUP.md) - Monitoring

---

## Related Documentation
- [Architecture Documentation](../01-ARCHITECTURE/) - System design
- [API Documentation](../03-API/) - Endpoint reference
- [Analysis Documentation](../04-ANALYSIS/) - Problem analysis
- [Integration Guides](../06-INTEGRATIONS/) - Third-party integrations
