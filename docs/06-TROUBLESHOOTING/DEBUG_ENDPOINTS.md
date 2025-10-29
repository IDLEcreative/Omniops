# Debug & Setup API Endpoints

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 20 minutes

## Purpose
⚠️ **These endpoints are for development and testing only** ⚠️ **Do not expose in production without authentication**

## Quick Links
- [Overview](#overview)
- [Security Configuration](#security-configuration)
- [Setup Endpoints](#setup-endpoints)
- [Testing Endpoints](#testing-endpoints)
- [Error Responses](#error-responses)

## Keywords
common, compliance, configuration, debug, documentation, endpoints, error, implementation, notes, overview

---


**Last Updated:** 2025-10-26

⚠️ **These endpoints are for development and testing only**
⚠️ **Do not expose in production without authentication**

## Overview

This document describes parameterized debug and setup endpoints that accept domain as a parameter instead of hardcoding specific customer domains. All endpoints are protected in production environments unless explicitly enabled.

## Security Configuration

By default, these endpoints are disabled in production. To enable them (not recommended), set:

```bash
ENABLE_DEBUG_ENDPOINTS=true
```

## Setup Endpoints

### Setup RAG System

Initialize RAG (Retrieval-Augmented Generation) for a domain.

**Endpoint:** `/api/setup-rag`

**Methods:** GET, POST

**Parameters:**
- `domain` (required): Customer domain to setup

**Example:**

```bash
# GET request
curl "http://localhost:3000/api/setup-rag?domain=example.com"

# POST request
curl -X POST "http://localhost:3000/api/setup-rag" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "results": {
    "customer_config": {
      "status": "created",
      "id": "uuid-here"
    },
    "embedding_test": {
      "total_embeddings": 150,
      "status": "ready"
    },
    "function_sql": "-- SQL to create search function"
  },
  "instructions": [
    "Customer config has been set up for example.com",
    "Found 150 embeddings ready to use",
    "Run the SQL in results.function_sql"
  ]
}
```

---

### Fix RAG Configuration

Fix broken RAG configuration for a domain.

**Endpoint:** `/api/fix-rag`

**Method:** POST

**Body:**
```json
{
  "domain": "example.com"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/fix-rag" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "results": {
    "function_creation": {
      "status": "success"
    },
    "customer_config": {
      "status": "already_exists",
      "id": "uuid-here"
    },
    "test_search": {
      "found": 3,
      "samples": ["chunk1...", "chunk2..."]
    }
  },
  "next_steps": [
    "Customer config has been set up for example.com",
    "The chat API should now be able to find and use the training data"
  ]
}
```

---

## Testing Endpoints

### Test WooCommerce Integration

Test WooCommerce API connectivity and data sync.

**Endpoint:** `/api/test-woocommerce`

**Method:** GET

**Parameters:**
- `domain` (required): Customer domain to test

**Example:**
```bash
curl "http://localhost:3000/api/test-woocommerce?domain=mystore.com"
```

**Response:**
```json
{
  "configuration": {
    "domain": "mystore.com",
    "business_name": "My Store",
    "woocommerce_url": "https://mystore.com",
    "woocommerce_enabled": true
  },
  "test_results": [
    {
      "endpoint": "products",
      "status": "success",
      "count": 5,
      "sample": [
        {
          "id": 123,
          "name": "Product Name",
          "price": "99.99",
          "stock_status": "instock"
        }
      ]
    }
  ],
  "summary": {
    "total_tests": 3,
    "successful": 3,
    "failed": 0,
    "status": "ALL PASSED"
  }
}
```

---

### Debug RAG System

Debug RAG system for a specific domain.

**Endpoint:** `/api/debug-rag`

**Method:** GET

**Parameters:**
- `domain` (required): Customer domain to debug

**Example:**
```bash
curl "http://localhost:3000/api/debug-rag?domain=example.com"
```

**Response:**
```json
{
  "domain": "example.com",
  "debug": {
    "customer_config": {
      "found": true,
      "id": "uuid-here"
    },
    "search_function": {
      "exists": true,
      "error": null
    },
    "embedding_search": {
      "query": "tipper products",
      "results_count": 5,
      "results": [...]
    },
    "lib_search": {
      "results_count": 3,
      "results": [...]
    },
    "raw_data": {
      "sample_chunks_with_tipper": 10,
      "samples": [...]
    }
  },
  "analysis": {
    "has_customer_config": true,
    "has_search_function": true,
    "search_returning_results": true,
    "lib_search_working": true,
    "raw_data_exists": true
  },
  "likely_issue": "Unknown issue - check the debug output"
}
```

---

### Fix Customer Configuration

Fix customer configuration issues.

**Endpoint:** `/api/fix-customer-config`

**Method:** POST

**Body:**
```json
{
  "domain": "example.com",
  "action": "reset"
}
```

**Parameters:**
- `domain` (required): Customer domain to fix
- `action` (optional): Action to perform (`reset` or `update`, defaults to `reset`)

**Example:**
```bash
curl -X POST "http://localhost:3000/api/fix-customer-config" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com", "action": "reset"}'
```

**Response:**
```json
{
  "success": true,
  "domain": "example.com",
  "action": "created",
  "config": {
    "id": "uuid-here",
    "domain": "example.com",
    "business_name": "Business example.com",
    "woocommerce_enabled": false
  }
}
```

---

## Error Responses

All endpoints return consistent error responses when parameters are missing:

```json
{
  "error": "domain parameter required",
  "usage": {
    "GET": "/api/endpoint?domain=example.com",
    "POST": "/api/endpoint with body: {domain: \"example.com\"}"
  },
  "note": "This is a development/testing endpoint"
}
```

When used in production without enabling:

```json
{
  "error": "Debug endpoints disabled in production"
}
```

---

## Security Notes

1. **Authentication Required:** In production, protect these endpoints with authentication
2. **Rate Limiting:** Apply rate limiting to prevent abuse
3. **Audit Logging:** Log all debug endpoint access
4. **Environment Restriction:** Consider disabling in production via environment variable

## Implementation

All debug endpoints check for production mode:

```typescript
if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
  return NextResponse.json(
    { error: 'Debug endpoints disabled in production' },
    { status: 403 }
  );
}
```

## NPM Scripts

Add these scripts to `package.json` for quick access:

```json
{
  "scripts": {
    "debug:setup-rag": "curl \"http://localhost:3000/api/setup-rag?domain=",
    "debug:test-woo": "curl \"http://localhost:3000/api/test-woocommerce?domain="
  }
}
```

Usage:
```bash
npm run debug:setup-rag\"example.com\"
npm run debug:test-woo\"mystore.com\"
```

## Common Workflows

### 1. Setting up a new domain

```bash
# Step 1: Setup RAG system
curl -X POST "http://localhost:3000/api/setup-rag" \
  -H "Content-Type: application/json" \
  -d '{"domain": "newcustomer.com"}'

# Step 2: Debug to verify
curl "http://localhost:3000/api/debug-rag?domain=newcustomer.com"

# Step 3: Test WooCommerce (if applicable)
curl "http://localhost:3000/api/test-woocommerce?domain=newcustomer.com"
```

### 2. Troubleshooting existing domain

```bash
# Step 1: Debug current state
curl "http://localhost:3000/api/debug-rag?domain=existing.com"

# Step 2: Fix configuration if needed
curl -X POST "http://localhost:3000/api/fix-customer-config" \
  -H "Content-Type: application/json" \
  -d '{"domain": "existing.com", "action": "update"}'

# Step 3: Fix RAG if needed
curl -X POST "http://localhost:3000/api/fix-rag" \
  -H "Content-Type: application/json" \
  -d '{"domain": "existing.com"}'
```

## Multi-Tenant Compliance

These endpoints follow the multi-tenant, brand-agnostic architecture:

- ✅ No hardcoded company names or branding
- ✅ Accept domain as parameter
- ✅ Generic placeholder data for new domains
- ✅ Work for any business type
- ✅ All business-specific data comes from database

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project instructions and guidelines
- [Database Schema](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Complete database reference
- [Search Architecture](01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md) - RAG system details

---

**Version:** 1.0.0
**Last Updated:** 2025-10-26
**Status:** Active
