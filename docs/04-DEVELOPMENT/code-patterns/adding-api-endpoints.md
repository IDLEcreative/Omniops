# Adding API Endpoints to Omniops

A comprehensive guide for developers adding their first API endpoint to the Omniops codebase.

## Table of Contents

1. [Overview](#overview)
2. [Step-by-Step Guide](#guide)
3. [Complete Working Example](#complete-working-example)
4. [Common Patterns](#common-patterns)
5. [Security Checklist](#security-checklist)
6. [Testing Checklist](#testing-checklist)
7. [Real Examples from Codebase](#real-examples-from-codebase)
8. [Troubleshooting](#troubleshooting)

## Overview

### Next.js App Router Conventions

Omniops uses Next.js 15 with the App Router, which provides file-based routing with special conventions:

- **File-based routing**: Routes are defined by the file system structure
- **Route handlers**: Files named `route.ts` in the `app/api/` directory
- **HTTP methods**: Export async functions named after HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Request/Response**: Uses `NextRequest` and `NextResponse` for type-safe handling

### Route Handlers vs Server Actions

- **Route Handlers** (`route.ts`): For building API endpoints that external clients can call
- **Server Actions**: For form submissions and server-side mutations in React components
- **When to use Route Handlers**: Public APIs, webhooks, integrations, mobile apps
- **When to use Server Actions**: Internal form handling, progressive enhancement

## Step-by-Step Guide

### Step 1: Create Route File

**Location**: `app/api/[feature]/route.ts`

**Naming Conventions**:
- Use kebab-case for directory names: `user-profile`, `order-history`
- Always name the file `route.ts` (Next.js convention)
- Group related endpoints in subdirectories

**Example Structure**:
```
app/api/
├── chat/
│   └── route.ts          # POST /api/chat
├── scrape/
│   └── route.ts          # POST /api/scrape, GET /api/scrape?job_id=...
└── woocommerce/
    ├── products/
    │   └── route.ts      # POST /api/woocommerce/products
    └── configure/
        └── route.ts      # POST /api/woocommerce/configure
```

**Basic File Template**:
```typescript
import { NextRequest, NextResponse } from 'next/server';

// Configure runtime (nodejs for server-side, edge for edge functions)
export const runtime = 'nodejs';
// Force dynamic rendering (no static optimization)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 2: Define Request Schema

**Use Zod for Type-Safe Validation**:

Zod provides runtime type checking and automatic TypeScript type inference.

**Location**: Define schemas in `types/api.ts` for reusable schemas, or inline for endpoint-specific schemas.

**Example**:
```typescript
import { z } from 'zod';

// Define schema
const ProductsRequestSchema = z.object({
  domain: z.string(),
  per_page: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  category: z.number().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  featured: z.boolean().optional(),
});

// Infer TypeScript type from schema
type ProductsRequest = z.infer<typeof ProductsRequestSchema>;
```

**Benefits**:
- Runtime validation prevents invalid data
- Automatic TypeScript types (no duplication)
- Clear error messages for validation failures
- Self-documenting API contracts

### Step 3: Implement Handler

**HTTP Method Patterns**:

```typescript
// POST - Create or process data
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validatedData = MyRequestSchema.parse(body);
  // ... process
  return NextResponse.json({ success: true }, { status: 201 });
}

// GET - Retrieve data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  // ... fetch data
  return NextResponse.json({ data });
}

// PUT - Update entire resource
export async function PUT(request: NextRequest) {
  const body = await request.json();
  // ... update
  return NextResponse.json({ updated: true });
}

// PATCH - Partial update
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  // ... partial update
  return NextResponse.json({ updated: true });
}

// DELETE - Remove resource
export async function DELETE(request: NextRequest) {
  // ... delete
  return NextResponse.json({ deleted: true });
}
```

**NextRequest/NextResponse API**:

```typescript
// Reading request data
const body = await request.json();
const searchParams = request.nextUrl.searchParams;
const headers = request.headers;
const cookies = request.cookies;

// Sending responses
return NextResponse.json(data, {
  status: 200,
  headers: {
    'Cache-Control': 'no-store',
    'X-Custom-Header': 'value'
  }
});
```

### Step 4: Add Authentication (if needed)

**Supabase Auth Pattern**:

```typescript
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  // User-level authentication (RLS enforced)
  const userSupabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await userSupabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check organization membership
  const { data: membership } = await userSupabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: 'No organization access' },
      { status: 403 }
    );
  }

  // Check permissions
  if (!['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // Continue with authorized request...
}
```

**Domain Validation Pattern**:

```typescript
import { createServiceRoleClient } from '@/lib/supabase-server';

// Validate domain exists and get domain_id
const supabase = await createServiceRoleClient();
const { data: domainData, error } = await supabase
  .from('domains')
  .select('id')
  .eq('domain', domain)
  .single();

if (error || !domainData) {
  return NextResponse.json(
    { error: 'Domain not found' },
    { status: 404 }
  );
}
```

**Rate Limiting Pattern**:

```typescript
import { checkDomainRateLimit } from '@/lib/rate-limit';

// Check rate limit
const { allowed, remaining, resetTime } = checkDomainRateLimit(domain);

if (!allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString(),
      }
    }
  );
}
```

### Step 5: Add Database Logic

**Supabase Client Selection**:

- **`createClient()`**: User-level access with Row Level Security (RLS) enforced
- **`createServiceRoleClient()`**: Admin access that bypasses RLS (use carefully!)

```typescript
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection unavailable' },
      { status: 503 }
    );
  }

  // Perform database operations
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('domain_id', domainId);

  if (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Database operation failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
```

**Transaction Pattern**:

```typescript
// Use RPC for complex transactions
const { data, error } = await supabase
  .rpc('atomic_operation_name', {
    param1: value1,
    param2: value2
  });
```

### Step 6: Error Handling

**Standard Error Response Pattern**:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = MySchema.parse(body);

    // ... your logic

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);

    // Zod validation errors (400 Bad Request)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Authentication errors (401 Unauthorized)
    if (error.message.includes('auth')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generic server error (500 Internal Server Error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
```

**HTTP Status Codes**:

- `200 OK`: Successful GET, PUT, PATCH, DELETE
- `201 Created`: Successful POST that creates a resource
- `400 Bad Request`: Invalid input data (validation failure)
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but lacks permission
- `404 Not Found`: Resource doesn't exist
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Service temporarily down

### Step 7: Add Tests

**Test Structure**:

Create test file at `__tests__/api/[feature]/route.test.ts`

**Basic Test Template**:

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/[feature]/route';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/rate-limit');

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

describe('/api/[feature]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success for valid request', async () => {
    const request = new NextRequest('http://localhost:3000/api/feature', {
      method: 'POST',
      body: JSON.stringify({ valid: 'data' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject invalid input', async () => {
    const request = new NextRequest('http://localhost:3000/api/feature', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

**Mock Patterns (MSW)**:

```typescript
import { createFreshSupabaseMock } from '@/__tests__/setup/isolated-test-setup';

beforeEach(() => {
  // Reset Supabase mock
  const supabaseModule = jest.requireMock('@/lib/supabase-server');
  const mockSupabase = createFreshSupabaseMock();
  supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase);

  // Configure mock response
  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: '123' },
      error: null
    })
  });
});
```

### Step 8: Document the Endpoint

**Add to API Reference**:

Document your endpoint for other developers and API consumers.

**Example Documentation**:

```markdown
## POST /api/woocommerce/products

Fetch products from a WooCommerce store.

### Request

**Headers**:
- `Content-Type: application/json`

**Body**:
```json
{
  "domain": "example.com",
  "per_page": 10,
  "page": 1,
  "search": "widget",
  "stock_status": "instock"
}
```

**Parameters**:
- `domain` (string, required): Domain to fetch products for
- `per_page` (number, optional): Products per page (1-100, default: 10)
- `page` (number, optional): Page number (default: 1)
- `search` (string, optional): Search query
- `stock_status` (enum, optional): Filter by stock status

### Response

**Success (200)**:
```json
{
  "success": true,
  "products": [
    {
      "id": 123,
      "name": "Widget",
      "price": "19.99",
      "stock_status": "instock"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 42
  }
}
```

**Error (400)**:
```json
{
  "error": "Invalid request data",
  "details": [...]
}
```
```

## Complete Working Example

Here's a complete, production-ready API endpoint with all best practices:

```typescript
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createServiceRoleClient, createClient } from '@/lib/supabase-server';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// ===================================
// 1. REQUEST VALIDATION
// ===================================

const ProductSearchSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  query: z.string().min(1, 'Search query is required').max(200),
  category: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  in_stock_only: z.boolean().default(true),
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(100).default(10),
});

type ProductSearchRequest = z.infer<typeof ProductSearchSchema>;

// ===================================
// 2. MAIN HANDLER
// ===================================

export async function POST(request: NextRequest) {
  try {
    // ===================================
    // 3. PARSE AND VALIDATE REQUEST
    // ===================================

    const body = await request.json();
    const validatedData = ProductSearchSchema.parse(body);
    const { domain, query, page, per_page, in_stock_only } = validatedData;

    // ===================================
    // 4. RATE LIMITING
    // ===================================

    const { allowed, remaining, resetTime } = checkDomainRateLimit(domain);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
          }
        }
      );
    }

    // ===================================
    // 5. AUTHENTICATION (Optional)
    // ===================================

    const userSupabase = await createClient();
    let organizationId: string | undefined;

    try {
      const { data: { user }, error: authError } = await userSupabase.auth.getUser();

      if (!authError && user) {
        const { data: membership } = await userSupabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership && ['owner', 'admin'].includes(membership.role)) {
          organizationId = membership.organization_id;
        }
      }
    } catch (error) {
      console.log('Auth check failed, proceeding as anonymous');
    }

    // ===================================
    // 6. DATABASE OPERATIONS
    // ===================================

    const adminSupabase = await createServiceRoleClient();

    if (!adminSupabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get domain configuration
    const { data: domainConfig, error: configError } = await adminSupabase
      .from('customer_configs')
      .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
      .eq('domain', domain)
      .single();

    if (configError || !domainConfig) {
      return NextResponse.json(
        { error: 'Domain not configured' },
        { status: 404 }
      );
    }

    // ===================================
    // 7. BUSINESS LOGIC
    // ===================================

    // Import WooCommerce API dynamically
    const { WooCommerceAPI } = await import('@/lib/woocommerce-api');
    const wc = new WooCommerceAPI({
      url: domainConfig.woocommerce_url,
      consumerKey: domainConfig.woocommerce_consumer_key,
      consumerSecret: domainConfig.woocommerce_consumer_secret,
    });

    // Search products
    const products = await wc.searchProducts({
      search: query,
      per_page,
      page,
      stock_status: in_stock_only ? 'instock' : undefined,
    });

    // Transform response
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock_status: product.stock_status,
      in_stock: product.stock_status === 'instock',
    }));

    // ===================================
    // 8. RESPONSE WITH METADATA
    // ===================================

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        page,
        per_page,
        total: products.length,
      },
      metadata: {
        rate_limit_remaining: remaining,
        authenticated: !!organizationId,
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'Cache-Control': 'no-store', // No caching for dynamic data
      }
    });

  } catch (error) {
    // ===================================
    // 9. ERROR HANDLING
    // ===================================

    console.error('Product search error:', error);

    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    // WooCommerce API errors
    if (error.message?.includes('WooCommerce')) {
      return NextResponse.json(
        {
          error: 'Failed to fetch products',
          message: 'Unable to connect to store'
        },
        { status: 502 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// ===================================
// 10. ADDITIONAL HTTP METHODS
// ===================================

export async function GET(request: NextRequest) {
  // Simple GET endpoint that delegates to POST
  // Useful for quick testing in browser

  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const query = searchParams.get('query');

  if (!domain || !query) {
    return NextResponse.json(
      { error: 'Missing required parameters: domain, query' },
      { status: 400 }
    );
  }

  // Forward to POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ domain, query }),
  }));
}
```

## Common Patterns

### 1. Pagination

```typescript
const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  per_page: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(), // For cursor-based pagination
});

// Offset-based pagination (simple but not scalable)
const offset = (page - 1) * per_page;
const { data, count } = await supabase
  .from('table')
  .select('*', { count: 'exact' })
  .range(offset, offset + per_page - 1);

return NextResponse.json({
  data,
  pagination: {
    page,
    per_page,
    total_pages: Math.ceil(count / per_page),
    total_items: count,
  }
});

// Cursor-based pagination (better for large datasets)
const { data } = await supabase
  .from('table')
  .select('*')
  .gt('id', cursor)
  .order('id')
  .limit(per_page);

return NextResponse.json({
  data,
  next_cursor: data[data.length - 1]?.id,
  has_more: data.length === per_page,
});
```

### 2. Filtering and Sorting

```typescript
const FilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  created_after: z.string().datetime().optional(),
  sort_by: z.enum(['created_at', 'name', 'price']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

let query = supabase.from('items').select('*');

// Apply filters
if (status) query = query.eq('status', status);
if (created_after) query = query.gte('created_at', created_after);

// Apply sorting
query = query.order(sort_by, { ascending: sort_order === 'asc' });

const { data } = await query;
```

### 3. Batch Operations

```typescript
const BatchSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    action: z.enum(['update', 'delete']),
    data: z.record(z.any()).optional(),
  })).min(1).max(100), // Limit batch size
});

export async function POST(request: NextRequest) {
  const { items } = BatchSchema.parse(await request.json());

  const results = await Promise.allSettled(
    items.map(async (item) => {
      if (item.action === 'update') {
        return supabase
          .from('items')
          .update(item.data)
          .eq('id', item.id);
      } else {
        return supabase
          .from('items')
          .delete()
          .eq('id', item.id);
      }
    })
  );

  return NextResponse.json({
    success: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results: results.map((r, i) => ({
      id: items[i].id,
      success: r.status === 'fulfilled',
      error: r.status === 'rejected' ? r.reason : null,
    })),
  });
}
```

### 4. File Uploads

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json(
      { error: 'No file provided' },
      { status: 400 }
    );
  }

  // Validate file
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large' },
      { status: 400 }
    );
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type' },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const supabase = await createServiceRoleClient();
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    file_path: data.path,
  });
}
```

### 5. Streaming Responses

```typescript
export async function GET(request: NextRequest) {
  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createServiceRoleClient();

        // Fetch data in chunks
        let offset = 0;
        const chunkSize = 100;

        while (true) {
          const { data } = await supabase
            .from('large_table')
            .select('*')
            .range(offset, offset + chunkSize - 1);

          if (!data || data.length === 0) break;

          // Send chunk
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(data) + '\n')
          );

          offset += chunkSize;
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

## Security Checklist

Before deploying your API endpoint, ensure:

- [ ] **Input validation**: All input validated with Zod schema
- [ ] **Authentication check**: User authentication verified if required
- [ ] **Authorization**: User permissions checked (RLS or manual)
- [ ] **Rate limiting**: Rate limits applied to prevent abuse
- [ ] **CORS configuration**: Appropriate CORS headers set
- [ ] **Sensitive data**: No sensitive data logged or exposed in errors
- [ ] **SQL injection**: Using parameterized queries (Supabase handles this)
- [ ] **XSS prevention**: Not returning unsanitized user input
- [ ] **CSRF protection**: Using appropriate headers for state-changing operations
- [ ] **File upload validation**: File size, type, and content validated
- [ ] **Error messages**: Generic errors in production, detailed in development
- [ ] **Environment variables**: Secrets stored in environment variables, never hardcoded

## Testing Checklist

Ensure comprehensive test coverage:

- [ ] **Happy path test**: Valid request returns expected response
- [ ] **Validation tests**: Invalid input rejected with 400
- [ ] **Authentication tests**: Unauthenticated requests rejected with 401
- [ ] **Authorization tests**: Unauthorized users rejected with 403
- [ ] **Rate limiting test**: Exceeded limits return 429
- [ ] **Database error handling**: Database failures handled gracefully
- [ ] **Edge cases**: Empty data, null values, boundary conditions
- [ ] **Integration test**: End-to-end flow with real (test) dependencies
- [ ] **Mock isolation**: Tests don't interfere with each other
- [ ] **Performance test**: Endpoint responds within acceptable time

## Real Examples from Codebase

Learn from existing, production-tested endpoints:

### 1. `/api/chat/route.ts` - Complex AI Chat Endpoint

**Location**: `app/api/chat/route.ts`

**What it does well**:
- ✅ Comprehensive error handling with specific error types
- ✅ Dependency injection for testability
- ✅ Rate limiting with custom headers
- ✅ Telemetry and performance tracking
- ✅ Extensive documentation in code comments
- ✅ Graceful degradation when services unavailable

**Key patterns**:
- Environment validation before processing
- Dependency injection interface for testing
- Multi-step AI processing with ReAct loop
- Conversation history management
- Source attribution in responses

**Learn from**: How to structure complex business logic, dependency injection patterns

### 2. `/api/scrape/route.ts` - Background Job Endpoint

**Location**: `app/api/scrape/route.ts`

**What it does well**:
- ✅ Dual mode: Single page vs full crawl
- ✅ Background job processing with status checks
- ✅ Batch operations for performance
- ✅ Chunking and deduplication logic
- ✅ Incremental scraping support
- ✅ Health check endpoint (GET)

**Key patterns**:
- Async background processing
- Job status polling
- Batch database operations
- Performance optimization (bulk inserts)
- Cache warming

**Learn from**: Background job patterns, batch operations, performance optimization

### 3. `/api/woocommerce/products/route.ts` - Integration Endpoint

**Location**: `app/api/woocommerce/products/route.ts`

**What it does well**:
- ✅ External API integration (WooCommerce)
- ✅ Data transformation layer
- ✅ Query parameter building
- ✅ GET endpoint that delegates to POST
- ✅ Clean response structure

**Key patterns**:
- Dynamic import of heavy dependencies
- Configuration fetching from database
- Query parameter construction
- Response transformation
- Dual HTTP method support (GET/POST)

**Learn from**: External API integration, data transformation, query building

## Troubleshooting

### Common Issues and Solutions

#### 1. CORS Errors

**Symptom**: Browser shows CORS policy error

**Solution**:
```typescript
return NextResponse.json(data, {
  headers: {
    'Access-Control-Allow-Origin': '*', // Or specific domain
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
});

// Add OPTIONS handler for preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
```

#### 2. Type Errors with NextRequest

**Symptom**: TypeScript errors when accessing request properties

**Solution**:
```typescript
// ❌ Wrong
const body = request.body; // Type error

// ✅ Correct
const body = await request.json();
const searchParams = request.nextUrl.searchParams;
const headers = request.headers;
```

#### 3. Authentication Issues

**Symptom**: `auth.getUser()` returns null or error

**Solution**:
```typescript
// Ensure you're using the correct client
const userSupabase = await createClient(); // User client, NOT service role

// Check for both error and user
const { data: { user }, error } = await userSupabase.auth.getUser();

if (error) {
  console.error('Auth error:', error);
  // Handle authentication error
}

if (!user) {
  // User not authenticated
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

#### 4. Rate Limiting Not Working

**Symptom**: Rate limits not enforced

**Solution**:
```typescript
// Ensure you're checking rate limit BEFORE processing
const { allowed, remaining, resetTime } = checkDomainRateLimit(domain);

if (!allowed) {
  // Return IMMEDIATELY, don't continue processing
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}

// Continue with processing only if allowed
```

#### 5. Database Connection Issues

**Symptom**: `createServiceRoleClient()` returns null

**Solution**:
```typescript
// Always check if client is available
const supabase = await createServiceRoleClient();

if (!supabase) {
  return NextResponse.json(
    { error: 'Database connection unavailable' },
    { status: 503 }
  );
}

// Also verify environment variables
import { validateSupabaseEnv } from '@/lib/supabase-server';

if (!validateSupabaseEnv()) {
  console.error('Supabase environment variables not configured');
  return NextResponse.json(
    { error: 'Service unavailable' },
    { status: 503 }
  );
}
```

#### 6. Zod Validation Failing Silently

**Symptom**: Invalid data passes through validation

**Solution**:
```typescript
// ❌ Wrong - .safeParse() doesn't throw
const result = MySchema.safeParse(body);
// Continues even if validation fails!

// ✅ Correct - .parse() throws on failure
try {
  const validatedData = MySchema.parse(body);
  // Only reached if validation succeeds
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request', details: error.errors },
      { status: 400 }
    );
  }
}
```

#### 7. Tests Interfering with Each Other

**Symptom**: Tests pass individually but fail when run together

**Solution**:
```typescript
import { resetTestEnvironment } from '@/__tests__/setup/isolated-test-setup';

describe('API tests', () => {
  beforeEach(() => {
    // Reset ALL mocks before each test
    resetTestEnvironment();
    jest.clearAllMocks();

    // Re-configure mocks with fresh instances
    const supabaseModule = jest.requireMock('@/lib/supabase-server');
    const mockSupabase = createFreshSupabaseMock();
    supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase);
  });
});
```

#### 8. Environment Variables Not Available

**Symptom**: `process.env.VARIABLE_NAME` is undefined

**Solution**:
```typescript
// For Next.js public variables (client-side)
// Must be prefixed with NEXT_PUBLIC_
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// For server-side only variables (API routes)
// No prefix needed, but only available in API routes/server components
const secretKey = process.env.SECRET_KEY;

// Always validate critical environment variables
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY not configured');
}
```

---

## Additional Resources

- **Next.js Route Handlers**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Zod Documentation**: https://zod.dev/
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript/introduction
- **Testing with Jest**: https://jestjs.io/docs/getting-started

## Quick Reference Card

```typescript
// File: app/api/my-feature/route.ts

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

// 1. Define schema
const RequestSchema = z.object({
  domain: z.string(),
  // ... your fields
});

// 2. Implement handler
export async function POST(request: NextRequest) {
  try {
    // 3. Parse & validate
    const body = await request.json();
    const data = RequestSchema.parse(body);

    // 4. Rate limit
    const { allowed } = checkDomainRateLimit(data.domain);
    if (!allowed) return NextResponse.json({ error: 'Rate limit' }, { status: 429 });

    // 5. Database
    const supabase = await createServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });

    // 6. Your logic
    const result = await yourBusinessLogic(data);

    // 7. Return response
    return NextResponse.json({ success: true, result });

  } catch (error) {
    // 8. Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

**Last Updated**: October 24, 2024
**Maintainer**: Development Team
**Related Docs**:
- [Testing Guide](../../04-DEVELOPMENT/testing/testing-guide.md)
- [Database Schema](../../SUPABASE_SCHEMA.md)
- [Authentication Patterns](../07-REFERENCE/authentication.md)
