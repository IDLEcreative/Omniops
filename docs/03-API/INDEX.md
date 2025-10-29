# API Documentation Index

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 4 minutes

## Purpose
All API requests require a Bearer token: Authorization: Bearer YOUR_API_KEY X-Domain: your-domain.com

## Quick Links
- [Quick Navigation](#quick-navigation)
- [Files in This Directory](#files-in-this-directory)
- [API Categories](#api-categories)
- [Quick Start](#quick-start)
- [Recommended Reading Order](#recommended-reading-order)

## Keywords
categories, directory, documentation, files, index, navigation, order, quick, reading, recommended

---


**Last Updated:** 2025-10-29
**Total Files:** 3
**Purpose:** Complete API reference documentation for all REST endpoints

## Quick Navigation
- [← Guides](../02-GUIDES/)
- [Next Category: Analysis →](../04-ANALYSIS/)
- [Documentation Home](../README.md)

---

## Files in This Directory

### API References
- **[REFERENCE_API_ENDPOINTS.md](REFERENCE_API_ENDPOINTS.md)** - Complete endpoint reference with authentication, rate limiting, and examples
- **[README.md](README.md)** - API overview and quick start guide

---

## API Categories

### Core Endpoints
- **Chat API** - Conversation management and message handling
- **Scraping API** - Website content indexing and extraction
- **Search API** - Hybrid search with semantic and keyword capabilities

### Integration Endpoints
- **WooCommerce API** - E-commerce product and order operations
- **Shopify API** - Shopify store integration
- **Stripe API** - Billing and subscription management

### Management Endpoints
- **Privacy API** - GDPR/CCPA compliance (data export, deletion)
- **Analytics API** - Usage metrics and insights
- **Admin API** - Organization and user management

---

## Quick Start

### Authentication
All API requests require a Bearer token:
```http
Authorization: Bearer YOUR_API_KEY
X-Domain: your-domain.com
```

### Rate Limiting
- **Default**: 100 requests/minute per domain
- **Burst**: 20 requests/second

### Common Patterns
- **Pagination**: Cursor-based for scalability
- **Async Processing**: Background jobs for long-running operations
- **Webhooks**: Event-driven notifications

---

## Recommended Reading Order

1. **[README.md](README.md)** - Start here for API overview
2. **[REFERENCE_API_ENDPOINTS.md](REFERENCE_API_ENDPOINTS.md)** - Comprehensive endpoint reference

---

## Related Documentation
- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - API data models
- [Architecture Overview](../01-ARCHITECTURE/ARCHITECTURE_OVERVIEW.md) - System design
- [Integration Guides](../06-INTEGRATIONS/) - Third-party API integrations
- [Rate Limiting](../01-ARCHITECTURE/ARCHITECTURE_RATE_LIMITING.md) - Rate limit implementation
