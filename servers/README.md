# MCP Servers

This directory contains all MCP (Model Context Protocol) servers organized by category.

## Directory Structure

- **search/** - Search and discovery tools
- **shared/** - Common utilities and types used by all servers

## Quick Start

```typescript
// List available categories
import { listCategories } from './index';
const categories = listCategories(); // ['search']

// List tools in a category
import { listTools } from './index';
const tools = listTools('search'); // ['searchProducts', ...]

// Import and use a tool
import { searchProducts } from './search/searchProducts';
import { ExecutionContext } from './shared/types';

const context: ExecutionContext = {
  customerId: 'cust_123',
  domain: 'example.com'
};

const results = await searchProducts(
  { query: 'pumps', limit: 15 },
  context
);
```

## Adding New Tools

1. Create tool file in appropriate category: `{category}/{toolName}.ts`
2. Follow the tool wrapper template (see any existing tool)
3. Export tool from category `index.ts`
4. Add metadata to category
5. Write unit tests in `__tests__/`

See [Contributing Guide](../docs/CONTRIBUTING.md) for details.

## Categories

- **search/** - Product and content search
- **commerce/** - E-commerce operations (coming soon)
- **analytics/** - Business intelligence (coming soon)
- **content/** - Content management (coming soon)
- **integrations/** - Third-party platforms (coming soon)

## Security

All tools must:
- ✅ Validate input using Zod schemas
- ✅ Use ExecutionContext for customer isolation
- ✅ Log execution via shared logger
- ✅ Handle errors gracefully
- ✅ Return standardized ToolResult

See [Security Architecture](../docs/03-REFERENCE/REFERENCE_MCP_SECURITY_ARCHITECTURE.md) for details.
