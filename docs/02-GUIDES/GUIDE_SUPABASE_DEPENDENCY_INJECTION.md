# Supabase Dependency Injection Guide

**Type:** Guide - Implementation Pattern
**Status:** Active
**Last Updated:** 2025-11-22
**Related:** [ANALYSIS_SUPABASE_DI_REFACTORING_PLAN.md](../10-ANALYSIS/ANALYSIS_SUPABASE_DI_REFACTORING_PLAN.md)

## Purpose
This guide teaches you how to refactor Supabase code from hardcoded `createClient()` calls to dependency injection, enabling unit testing and following SOLID principles.

## Quick Links
- [ChatService Example](../../lib/chat-service.ts) - Class-based DI (production code)
- [Chat Route Example](../../app/api/chat/route.ts) - Context dependencies (production code)
- [Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy) - Why DI matters

---

## Table of Contents
- [Why Dependency Injection?](#why-dependency-injection)
- [Three Patterns](#three-patterns)
- [When to Use Each Pattern](#when-to-use-each-pattern)
- [Migration Examples](#migration-examples)
- [Testing Guide](#testing-guide)
- [Common Pitfalls](#common-pitfalls)
- [FAQ](#faq)

---

## Why Dependency Injection?

### The Problem

Hardcoded database calls create **hidden dependencies** that are impossible to test:

```typescript
// ❌ HARD TO TEST: Hidden dependency
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getConversations(domain: string) {
  const supabase = await createServiceRoleClient(); // Hidden!
  return supabase.from('conversations').select().eq('domain', domain);
}

// Test attempt fails:
test('getConversations filters by domain', async () => {
  // ❌ Can't mock createServiceRoleClient (ESM limitation)
  // ❌ Can't inject mock client (no parameter for it)
  // ❌ Forced to use real Supabase (slow integration test)

  const result = await getConversations('example.com');
  // This hits real database! 😱
});
```

### The Solution

**Explicit dependencies** that can be injected:

```typescript
// ✅ EASY TO TEST: Explicit dependency
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getConversations(
  domain: string,
  supabase?: SupabaseClient  // Explicit! Optional for backward compatibility
) {
  const db = supabase || await createServiceRoleClient();
  return db.from('conversations').select().eq('domain', domain);
}

// Test succeeds:
test('getConversations filters by domain', async () => {
  const mockSupabase = createMockSupabaseClient();
  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ data: [{ id: '123' }], error: null })
  });

  const result = await getConversations('example.com', mockSupabase);

  expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
  expect(result.data).toHaveLength(1);
  // Fast, isolated unit test! 🎉
});
```

### Benefits

- ✅ **Unit testable** - No real database needed
- ✅ **Fast tests** - Mocks are instant
- ✅ **TDD-friendly** - Write tests before implementation
- ✅ **SOLID compliant** - Dependency Inversion Principle
- ✅ **Easy debugging** - Inject logging clients
- ✅ **Parallel tests** - No database contention

---

## Three Patterns

We use three different DI patterns depending on the context:

### Pattern 1: Class-Based Repository

**Use for:** Services with multiple related database operations

```typescript
export class ConversationsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getByDomain(domain: string) {
    return this.supabase.from('conversations').select().eq('domain', domain);
  }

  async create(data: ConversationData) {
    return this.supabase.from('conversations').insert(data);
  }
}

// Factory for production
export async function createConversationsRepository() {
  const supabase = await createServiceRoleClient();
  return new ConversationsRepository(supabase);
}
```

### Pattern 2: Function-Based Optional Parameter

**Use for:** Simple functions with 1-2 database operations

```typescript
export async function getConfig(
  domain: string,
  supabase?: SupabaseClient  // Optional parameter
) {
  const db = supabase || await createServiceRoleClient();
  const { data } = await db.from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();
  return data;
}
```

### Pattern 3: Context Dependencies (API Routes)

**Use for:** Next.js API route handlers

```typescript
interface RouteDependencies {
  createServiceRoleClient: () => Promise<SupabaseClient>;
}

const defaultDeps: RouteDependencies = {
  createServiceRoleClient
};

export async function GET(
  request: NextRequest,
  context?: { deps?: Partial<RouteDependencies> }
) {
  const deps = { ...defaultDeps, ...context?.deps };
  const supabase = await deps.createServiceRoleClient();

  // Use supabase...
}
```

---

## When to Use Each Pattern

### Decision Tree

```
Is this an API route handler?
├─ YES → Use Pattern 3 (Context Dependencies)
└─ NO → Continue...

Does this service have 2+ database operations?
├─ YES → Use Pattern 1 (Class-Based Repository)
└─ NO → Continue...

Does this service have 1 database operation?
├─ YES → Use Pattern 2 (Function-Based Optional Parameter)
└─ NO → Not a database service (no Supabase needed)
```

### Pattern Comparison

| Pattern | Use Case | Complexity | Test Setup |
|---------|----------|------------|------------|
| **Class-Based** | Multi-operation services | Medium | `new Service(mockDb)` |
| **Function-Based** | Single-operation utilities | Low | `fn(args, mockDb)` |
| **Context Deps** | API route handlers | High | `handler(req, { deps })` |

### Examples

#### Class-Based Repository

**Good for:**
- `ConversationsRepository` - getByDomain, create, update, delete
- `EmbeddingsRepository` - search, insert, delete, updateMetadata
- `CustomerConfigRepository` - get, update, create, validate

**Bad for:**
- Single utility function - overkill
- API routes - use Context Deps instead

#### Function-Based Optional Parameter

**Good for:**
- `getCustomerConfig(domain, supabase?)` - single query
- `saveScrapedPage(url, content, supabase?)` - single insert
- `updateConversationMetadata(id, metadata, supabase?)` - single update

**Bad for:**
- Services with 5+ operations - use class instead
- API routes - use Context Deps instead

#### Context Dependencies

**Good for:**
- All API route handlers
- Next.js server components
- Any Next.js-specific code

**Bad for:**
- Plain TypeScript services
- Utility functions

---

## Migration Examples

### Example 1: Simple Function → Optional Parameter

**Before:**

```typescript
// lib/customer-config.ts
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getCustomerConfig(domain: string) {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();

  if (error) throw error;
  return data;
}
```

**After:**

```typescript
// lib/customer-config.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get customer configuration by domain
 *
 * @param domain - Customer domain to look up
 * @param supabase - Optional Supabase client (for testing)
 * @returns Customer configuration or null
 */
export async function getCustomerConfig(
  domain: string,
  supabase?: SupabaseClient  // ← NEW: Optional parameter
) {
  const db = supabase || await createServiceRoleClient();  // ← NEW: Use injected or default

  const { data, error } = await db  // ← CHANGED: Use db instead of supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();

  if (error) throw error;
  return data;
}
```

**Changes:**
1. Import `SupabaseClient` type
2. Add optional `supabase?: SupabaseClient` parameter
3. Use `const db = supabase || await createServiceRoleClient()`
4. Replace `supabase` with `db` in function body
5. Add JSDoc comment documenting the parameter

### Example 2: Service Functions → Class Repository

**Before:**

```typescript
// lib/conversations-service.ts
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function getConversations(domain: string) {
  const supabase = await createServiceRoleClient();
  return supabase.from('conversations').select().eq('domain', domain);
}

export async function createConversation(data: ConversationData) {
  const supabase = await createServiceRoleClient();
  return supabase.from('conversations').insert(data).select().single();
}

export async function updateConversation(id: string, data: Partial<ConversationData>) {
  const supabase = await createServiceRoleClient();
  return supabase.from('conversations').update(data).eq('id', id);
}

export async function deleteConversation(id: string) {
  const supabase = await createServiceRoleClient();
  return supabase.from('conversations').delete().eq('id', id);
}
```

**After:**

```typescript
// lib/conversations-repository.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Repository for conversation database operations
 * Uses dependency injection for testability
 */
export class ConversationsRepository {
  constructor(private supabase: SupabaseClient) {}  // ← NEW: DI in constructor

  async getByDomain(domain: string) {
    return this.supabase.from('conversations').select().eq('domain', domain);
  }

  async create(data: ConversationData) {
    return this.supabase.from('conversations').insert(data).select().single();
  }

  async update(id: string, data: Partial<ConversationData>) {
    return this.supabase.from('conversations').update(data).eq('id', id);
  }

  async delete(id: string) {
    return this.supabase.from('conversations').delete().eq('id', id);
  }
}

/**
 * Factory function for production use
 * Creates repository with real Supabase client
 */
export async function createConversationsRepository(): Promise<ConversationsRepository> {
  const supabase = await createServiceRoleClient();
  return new ConversationsRepository(supabase);
}
```

**Migration for consumers:**

```typescript
// Before:
import { getConversations } from '@/lib/conversations-service';
const conversations = await getConversations('example.com');

// After:
import { createConversationsRepository } from '@/lib/conversations-repository';
const repo = await createConversationsRepository();
const conversations = await repo.getByDomain('example.com');
```

### Example 3: API Route → Context Dependencies

**Before:**

```typescript
// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('domain', domain);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

**After:**

```typescript
// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

// ← NEW: Define dependencies interface
interface RouteDependencies {
  createServiceRoleClient: () => Promise<SupabaseClient>;
}

// ← NEW: Default dependencies for production
const defaultDeps: RouteDependencies = {
  createServiceRoleClient
};

// ← NEW: Add context parameter with optional deps
export async function GET(
  request: NextRequest,
  context?: { deps?: Partial<RouteDependencies> }
) {
  // ← NEW: Merge injected deps with defaults
  const deps = { ...defaultDeps, ...context?.deps };

  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json({ error: 'Domain required' }, { status: 400 });
  }

  // ← CHANGED: Use deps.createServiceRoleClient()
  const supabase = await deps.createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('domain', domain);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

---

## Testing Guide

### Setting Up Test Helpers

First, create mock client helpers:

```typescript
// lib/supabase/test-helpers.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { jest } from '@jest/globals';

export function createMockSupabaseClient(): jest.Mocked<SupabaseClient> {
  return {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  } as unknown as jest.Mocked<SupabaseClient>;
}
```

### Testing Pattern 1: Class-Based Repository

```typescript
// __tests__/lib/conversations-repository.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockSupabaseClient } from '@/lib/supabase/test-helpers';
import { ConversationsRepository } from '@/lib/conversations-repository';

describe('ConversationsRepository', () => {
  let mockSupabase: any;
  let repo: ConversationsRepository;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repo = new ConversationsRepository(mockSupabase);  // ← Inject mock
  });

  it('should get conversations by domain', async () => {
    const mockData = [{ id: '123', domain: 'example.com' }];

    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    }));

    const result = await repo.getByDomain('example.com');

    expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
    expect(result.data).toEqual(mockData);
  });

  it('should create conversation', async () => {
    const newConvo = { domain: 'example.com', session_id: 'sess-123' };
    const createdConvo = { id: '456', ...newConvo };

    mockSupabase.from.mockImplementation(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: createdConvo, error: null }),
    }));

    const result = await repo.create(newConvo);

    expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
    expect(result.data).toEqual(createdConvo);
  });
});
```

### Testing Pattern 2: Function-Based Optional Parameter

```typescript
// __tests__/lib/customer-config.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { createMockSupabaseClient } from '@/lib/supabase/test-helpers';
import { getCustomerConfig } from '@/lib/customer-config';

describe('getCustomerConfig', () => {
  it('should fetch config by domain', async () => {
    const mockConfig = { domain: 'example.com', woocommerce_enabled: true };
    const mockSupabase = createMockSupabaseClient();

    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockConfig, error: null }),
    }));

    // ← Inject mock as second parameter
    const result = await getCustomerConfig('example.com', mockSupabase);

    expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
    expect(result).toEqual(mockConfig);
  });

  it('should throw on database error', async () => {
    const mockSupabase = createMockSupabaseClient();
    const dbError = new Error('Connection failed');

    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: dbError }),
    }));

    await expect(getCustomerConfig('example.com', mockSupabase))
      .rejects.toThrow('Connection failed');
  });
});
```

### Testing Pattern 3: Context Dependencies (API Routes)

```typescript
// __tests__/api/conversations/route.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { createMockSupabaseClient } from '@/lib/supabase/test-helpers';
import { GET } from '@/app/api/conversations/route';

describe('GET /api/conversations', () => {
  it('should return conversations for domain', async () => {
    const mockConversations = [{ id: '123', domain: 'example.com' }];
    const mockSupabase = createMockSupabaseClient();

    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockConversations, error: null }),
    }));

    const mockCreateClient = jest.fn().mockResolvedValue(mockSupabase);

    const request = new NextRequest('http://localhost:3000/api/conversations?domain=example.com');

    // ← Inject mock via context.deps
    const response = await GET(request, {
      deps: { createServiceRoleClient: mockCreateClient }
    });

    const data = await response.json();

    expect(mockCreateClient).toHaveBeenCalled();
    expect(data).toEqual(mockConversations);
  });

  it('should return 400 if domain missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/conversations');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Domain required');
  });
});
```

---

## Common Pitfalls

### Pitfall 1: Forgetting the Default

```typescript
// ❌ WRONG: No default, breaks production code
export async function getConfig(
  domain: string,
  supabase: SupabaseClient  // Required! Production code will break
) {
  return supabase.from('customer_configs').select();
}

// ✅ RIGHT: Optional parameter with default
export async function getConfig(
  domain: string,
  supabase?: SupabaseClient  // Optional - has default
) {
  const db = supabase || await createServiceRoleClient();
  return db.from('customer_configs').select();
}
```

### Pitfall 2: Creating Multiple Clients

```typescript
// ❌ WRONG: Creates unnecessary clients
export async function processConversation(id: string, supabase?: SupabaseClient) {
  const db1 = supabase || await createServiceRoleClient();
  const conversation = await db1.from('conversations').select();

  const db2 = supabase || await createServiceRoleClient();  // Unnecessary!
  const messages = await db2.from('messages').select();
}

// ✅ RIGHT: Reuse the same client
export async function processConversation(id: string, supabase?: SupabaseClient) {
  const db = supabase || await createServiceRoleClient();

  const conversation = await db.from('conversations').select();
  const messages = await db.from('messages').select();
  // Same client for both operations
}
```

### Pitfall 3: Not Typing the Parameter

```typescript
// ❌ WRONG: Untyped parameter
export async function getConfig(domain: string, supabase?: any) {
  // No type safety!
}

// ✅ RIGHT: Properly typed
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getConfig(domain: string, supabase?: SupabaseClient) {
  // Full type safety
}
```

### Pitfall 4: Using Wrong Pattern for API Routes

```typescript
// ❌ WRONG: Optional parameter in API route
export async function GET(
  request: NextRequest,
  supabase?: SupabaseClient  // Next.js won't call this correctly!
) {
  // ...
}

// ✅ RIGHT: Context dependencies
export async function GET(
  request: NextRequest,
  context?: { deps?: Partial<RouteDependencies> }
) {
  const deps = { ...defaultDeps, ...context?.deps };
  const supabase = await deps.createServiceRoleClient();
  // ...
}
```

---

## FAQ

### Q: Do I need to refactor ALL files at once?

**A:** No! This is a gradual migration:
- Start with files that have blocked tests
- Migrate high-value services next
- Low-priority files can stay unchanged temporarily

### Q: Will this break existing code?

**A:** No, if done correctly:
- Optional parameters are backward compatible
- Production code works without changes
- Only tests need to inject mocks

### Q: Should I use class or function pattern?

**A:** Follow the decision tree:
- **2+ DB operations** → Class
- **1 DB operation** → Function
- **API route** → Context dependencies

### Q: What about performance?

**A:** No performance impact:
- Production code still creates one client
- Optional parameter check is negligible
- Tests are actually faster (no real DB)

### Q: Can I mix patterns?

**A:** Not recommended, but acceptable:
- If migrating gradually, you'll have mixed patterns temporarily
- Aim for consistency within each module
- Document any exceptions

### Q: What about middleware?

**A:** Use Context Dependencies pattern:
```typescript
// middleware.ts
interface MiddlewareDeps {
  createServiceRoleClient: () => Promise<SupabaseClient>;
}

const defaultDeps: MiddlewareDeps = {
  createServiceRoleClient
};

export async function middleware(
  request: NextRequest,
  deps: MiddlewareDeps = defaultDeps
) {
  const supabase = await deps.createServiceRoleClient();
  // ...
}
```

### Q: How do I test error handling?

**A:** Mock the error response:
```typescript
mockSupabase.from.mockImplementation(() => ({
  select: jest.fn().mockResolvedValue({
    data: null,
    error: new Error('Database connection failed')
  })
}));

await expect(service.getData()).rejects.toThrow('Database connection failed');
```

---

## Related Documentation

- [ANALYSIS_SUPABASE_DI_REFACTORING_PLAN.md](../10-ANALYSIS/ANALYSIS_SUPABASE_DI_REFACTORING_PLAN.md) - Complete refactoring plan
- [CLAUDE.md Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy) - Why testing matters
- [ChatService](../../lib/chat-service.ts) - Production example of class-based DI
- [Chat Route](../../app/api/chat/route.ts) - Production example of context dependencies

---

## Need Help?

**Common Questions:**
1. "Which pattern should I use?" → See [Decision Tree](#when-to-use-each-pattern)
2. "How do I test this?" → See [Testing Guide](#testing-guide)
3. "My tests are failing!" → See [Common Pitfalls](#common-pitfalls)

**Still stuck?** Check the examples in production code:
- `lib/chat-service.ts` - Class-based repository
- `app/api/chat/route.ts` - Context dependencies
- `lib/customer-config-loader.ts` - Function-based (after migration)
