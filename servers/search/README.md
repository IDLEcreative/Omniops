**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Search MCP Servers

Tools for searching products, content, and FAQs using semantic search with embeddings.

## Available Tools

- **searchProducts** - Multi-strategy product search (exact SKU, commerce provider, semantic) ✅
- **searchByCategory** - Category-based semantic search ✅
- **getProductDetails** - Get single product details (coming soon)
- **getCompletePageDetails** - Full page content retrieval (coming soon)

## Usage

### searchProducts

Multi-strategy product search with exact SKU matching, commerce provider integration, and semantic fallback.

```typescript
import { searchProducts } from './servers/search';
import { ExecutionContext } from '../shared/types';

const context: ExecutionContext = {
  customerId: 'cust_123',
  domain: 'example.com'
};

const results = await searchProducts(
  { query: 'featured equipment', limit: 15 },
  context
);
```

**Input**:
- `query` (required): Product name, SKU, or description (1-500 chars)
- `limit` (optional): Maximum results (default: 100, max: 1000)

**Output**:
- Array of search results with similarity scores
- Execution time and source (exact-match | woocommerce | shopify | semantic)
- Total matches count

**Migration Notes**:
- Migrated from: `lib/chat/tool-handlers/search-products.ts`
- Functional parity: 100%
- Test coverage: 45 tests, 100% passing

---

### searchByCategory

Search for products within a specific category using semantic embeddings.

```typescript
import { searchByCategory } from './servers/search';
const result = await searchByCategory(
  { category: 'featured-collection', limit: 20, threshold: 0.15 },
  context
);
```

**Input**:
- `category` (required): Category name or slug (1-200 chars)
- `limit` (optional): Maximum results (default: 100, max: 1000)
- `threshold` (optional): Minimum similarity (default: 0.15, range: 0-1)

**Output**:
- Array of products in the category
- Total result count
- Category metadata
- Execution time and threshold used

**Migration Notes**:
- Migrated from: `lib/chat/tool-handlers/search-by-category.ts`
- Functional parity: 100%
- Test coverage: 26 tests, 100% passing

---

## Performance

| Tool | Avg Latency | Max Latency | Token Usage | Cache TTL |
|------|-------------|-------------|-------------|-----------|
| searchProducts | 200ms | 2s | ~50 tokens | 5 min |
| searchByCategory | 250ms | 2s | ~50 tokens | 5 min |
