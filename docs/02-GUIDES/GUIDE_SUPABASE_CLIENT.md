# Supabase Client Usage Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/middleware.ts`
- ESLint configuration
**Estimated Read Time:** 19 minutes

## Purpose
Standardizes Supabase client imports across the codebase with a single, ESLint-enforced pattern for server components, API routes, client components, and middleware. Eliminates confusion, prevents SSR bugs, and provides type-safe, maintainable, and testable database access with clear separation between user context and service role operations.

## Quick Links
- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Detailed Examples](#detailed-examples)
- [Why This Pattern?](#why-this-pattern)
- [Common Pitfalls](#common-pitfalls)
- [Helper File Reference](#helper-file-reference)
- [ESLint Enforcement](#eslint-enforcement)
- [Migration Checklist](#migration-checklist)

## Keywords
Supabase client, server components, client components, API routes, service role, user context, SSR-safe, middleware, dependency injection, type safety, Row Level Security, RLS policies, database access, authentication, ESLint enforcement

## Aliases
- "service role client" (also known as: admin client, privileged client, RLS-bypass client)
- "user context client" (also known as: authenticated client, RLS client, session client)
- "SSR-safe" (also known as: server-side rendering safe, Next.js compatible, cookie-aware)
- "middleware session" (also known as: auth refresh, session update, cookie handling)

---

**Last Updated**: 2025-10-29
**Issue**: #10 - Standardize Supabase client imports

## Overview

This project uses a **single standardized pattern** for Supabase client imports. Direct imports from `@supabase/supabase-js` or `@supabase/ssr` are prohibited (enforced by ESLint).

## Quick Reference

| Context | Import | Usage | When to Use |
|---------|--------|-------|-------------|
| **Server Components** | `import { createClient } from '@/lib/supabase/server'` | `const supabase = await createClient()` | React Server Components, Server Actions |
| **API Routes (User Context)** | `import { createClient } from '@/lib/supabase/server'` | `const supabase = await createClient()` | API routes needing user auth context |
| **API Routes (Service Role)** | `import { createServiceRoleClient } from '@/lib/supabase/server'` | `const supabase = await createServiceRoleClient()` | API routes needing admin access, bypassing RLS |
| **Client Components** | `import { createClient } from '@/lib/supabase/client'` | `const supabase = createClient()` | Browser-side React components |
| **Middleware** | `import { updateSession } from '@/lib/supabase/middleware'` | `const { supabase, response } = await updateSession(request)` | Next.js middleware for auth refresh |
| **Class Constructors** | `import { createServiceRoleClientSync } from '@/lib/supabase/server'` | `this.supabase = createServiceRoleClientSync()` | Synchronous initialization in classes |
| **Type Imports Only** | `import type { SupabaseClient } from '@supabase/supabase-js'` | Type annotations only | When you only need TypeScript types |

## Detailed Examples

### Server Components

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  if (!supabase) {
    return <div>Database unavailable</div>;
  }

  const { data, error } = await supabase
    .from('posts')
    .select();

  if (error) {
    return <div>Error loading posts</div>;
  }

  return (
    <div>
      {data.map(post => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select();

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    }

    loadPosts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {posts.map(post => (
        <Post key={post.id} {...post} />
      ))}
    </div>
  );
}
```

### API Routes (User Context)

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database unavailable' },
      { status: 503 }
    );
  }

  // This query respects RLS policies based on the authenticated user
  const { data, error } = await supabase
    .from('user_posts')
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### API Routes (Service Role - Admin Access)

```typescript
import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database unavailable' },
      { status: 503 }
    );
  }

  const body = await request.json();

  // Service role client bypasses RLS - use with caution!
  // This can read/write all data regardless of user permissions
  const { data, error } = await supabase
    .from('admin_settings')
    .insert(body);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

### Middleware

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update session and get Supabase client
  const { supabase, response } = await updateSession(request);

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser();

  // Protected route logic
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}
```

### Class Constructors (Synchronous)

```typescript
import { createServiceRoleClientSync } from '@/lib/supabase/server';

export class DataLoader {
  private supabase: any;

  constructor() {
    // Use sync version in constructors
    this.supabase = createServiceRoleClientSync();

    if (!this.supabase) {
      console.error('Failed to initialize Supabase client');
    }
  }

  async loadData() {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.supabase
      .from('data')
      .select();

    return data;
  }
}
```

### Type-Only Imports (Always Allowed)

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

// This is OK - type-only imports don't create runtime dependencies
export async function processData(supabase: SupabaseClient) {
  const { data } = await supabase.from('table').select();
  return data;
}
```

## Why This Pattern?

### 1. **Consistency**
One import pattern per context eliminates confusion about which Supabase client to use.

### 2. **SSR-Safe**
Our helpers properly handle cookies and Next.js request/response cycles, preventing common SSR bugs.

### 3. **Type-Safe**
Full TypeScript support with proper type inference for all operations.

### 4. **Maintainable**
Changes to Supabase configuration happen in one place (`lib/supabase/*`), not scattered across hundreds of files.

### 5. **Testable**
Easy to mock these helpers in tests:

```typescript
// __tests__/my-component.test.ts
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

test('loads data', async () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null }))
    }))
  };

  (createClient as jest.Mock).mockResolvedValue(mockSupabase);

  // Your test here
});
```

### 6. **Security**
Clear separation between user context (RLS-protected) and service role (admin access).

## Common Pitfalls

### ❌ DON'T: Import directly from @supabase packages

```typescript
// ❌ WRONG - ESLint will error
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
```

### ❌ DON'T: Forget null checks

```typescript
// ❌ WRONG - client might be null
const supabase = await createClient();
const { data } = await supabase.from('table').select();
```

### ❌ DON'T: Use service role client carelessly

```typescript
// ❌ WRONG - bypasses RLS without justification
export async function GET() {
  const supabase = await createServiceRoleClient();
  // This returns ALL user data, ignoring permissions!
  const { data } = await supabase.from('user_profiles').select();
  return NextResponse.json(data);
}
```

### ✅ DO: Check for null and handle errors

```typescript
// ✅ CORRECT
const supabase = await createClient();

if (!supabase) {
  return NextResponse.json(
    { error: 'Database unavailable' },
    { status: 503 }
  );
}

const { data, error } = await supabase.from('table').select();

if (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
}

return NextResponse.json(data);
```

### ✅ DO: Use the right client for the job

```typescript
// ✅ CORRECT - User context for user-specific data
const supabase = await createClient();
const { data } = await supabase
  .from('user_posts')
  .select(); // RLS ensures only user's posts

// ✅ CORRECT - Service role for admin operations
const adminSupabase = await createServiceRoleClient();
const { data: allUsers } = await adminSupabase
  .from('users')
  .select(); // Admin access, use carefully!
```

## Helper File Reference

All helper files are in `lib/supabase/`:

- **`server.ts`** - Server-side clients (user context + service role)
- **`client.ts`** - Browser-side client
- **`middleware.ts`** - Middleware session management

## ESLint Enforcement

Direct imports are blocked by ESLint. You'll see:

```
error: Import from @/lib/supabase/server (for service role) or
@/lib/supabase/client (for browser) instead.
```

This is intentional! Use the helper imports instead.

## Migration Checklist

If you're updating old code:

- [ ] Replace `@supabase/supabase-js` imports with appropriate helper
- [ ] Replace `@supabase/ssr` imports with appropriate helper
- [ ] Add null checks after `createClient()` or `createServiceRoleClient()`
- [ ] Use `createServiceRoleClientSync()` in class constructors
- [ ] Update tests to mock the helper imports
- [ ] Run `npm run lint` to verify no violations

## Questions?

- **Q: Why can't I use `@supabase/supabase-js` directly?**
  A: It bypasses our SSR-safe wrapper and creates maintenance issues.

- **Q: When should I use service role vs user context?**
  A: Use service role only when you need to bypass RLS for admin operations. Default to user context.

- **Q: What if I only need TypeScript types?**
  A: Type-only imports are fine: `import type { SupabaseClient } from '@supabase/supabase-js'`

- **Q: How do I test components that use these helpers?**
  A: Mock the helper module: `jest.mock('@/lib/supabase/server')`

---

**See Also:**
- [Database Schema](./SUPABASE_SCHEMA.md)
- [Security Model](./SECURITY_MODEL.md)
- [CLAUDE.md](../CLAUDE.md) - Project conventions
