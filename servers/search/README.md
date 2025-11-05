# Search MCP Servers

Tools for searching products, content, and FAQs using semantic search with embeddings.

## Available Tools

- **searchProducts** - Search for products using embeddings (coming soon)
- **searchByCategory** - Category-based product search (coming soon)
- **getProductDetails** - Get single product details (coming soon)
- **getCompletePageDetails** - Full page content retrieval (coming soon)

## Usage

```typescript
import { searchProducts } from './searchProducts';
import { ExecutionContext } from '../shared/types';

const context: ExecutionContext = {
  customerId: 'cust_123',
  domain: 'example.com'
};

const results = await searchProducts(
  { query: 'hydraulic pumps', limit: 15 },
  context
);
```

## Performance

- Average latency: 200ms
- Token usage: ~50 tokens per query
- Cache TTL: 5 minutes
