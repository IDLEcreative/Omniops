**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# MCP Servers

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** None
**Estimated Read Time:** 3 minutes

## Purpose

Documentation for MCP (Model Context Protocol) servers organized by category, providing tools for search, commerce, content operations, and shared utilities across the Omniops platform.

## Quick Links
- [Search MCP Servers](/home/user/Omniops/servers/search/README.md)
- [Commerce MCP Tools](/home/user/Omniops/servers/commerce/README.md)
- [Content MCP Tools](/home/user/Omniops/servers/content/README.md)
- [Contributing Guide](/home/user/Omniops/docs/CONTRIBUTING.md)

## Table of Contents
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Adding New Tools](#adding-new-tools)
- [Categories](#categories)
- [Security](#security)

**Keywords:** MCP, Model Context Protocol, servers, tools, search, commerce, content

---

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
