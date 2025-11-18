**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Supabase Integration

Database clients and configuration for the Customer Service Agent application.

## Overview

This directory contains Supabase client configurations for both browser-side and server-side operations, enabling secure database access across different execution contexts.

## Files Structure

```
supabase/
├── __mocks__/
│   └── server.js          # Mock server client for testing
├── client.ts              # Browser-side Supabase client
└── server.ts              # Server-side Supabase client
```

## Client Configurations

### Browser Client (`client.ts`)

The browser client is used for client-side operations and authenticated user interactions.

**Features:**
- Environment fallback values to prevent build-time errors
- Automatic session management
- Client-side authentication handling

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Example: Fetch user data
const { data: user } = await supabase.auth.getUser()

// Example: Query data with RLS
const { data, error } = await supabase
  .from('customer_configs')
  .select('*')
  .eq('user_id', user.id)
```

**Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous/public API key

### Server Client (`server.ts`)

The server client provides two types of connections for server-side operations.

#### Standard Server Client

Used for authenticated operations that respect Row Level Security (RLS) policies.

**Features:**
- Cookie-based session management
- Next.js App Router compatibility
- Proper error handling for middleware scenarios

**Usage:**
```typescript
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  // Authenticated query - respects RLS
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    
  return Response.json({ data })
}
```

#### Service Role Client

Used for administrative operations that bypass RLS policies.

**Features:**
- Full database access (bypasses RLS)
- No cookie handling required
- Used for system operations and migrations

**Usage:**
```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'

// Administrative operation
export async function createSystemRecord() {
  const supabase = await createServiceRoleClient()
  
  // Bypasses RLS - use with caution
  const { data, error } = await supabase
    .from('system_logs')
    .insert({ action: 'cleanup', timestamp: new Date() })
    
  return data
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Public variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-only variables (keep secret)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Environment Variable Validation

Both clients validate environment variables at runtime:

```typescript
// Example error handling
try {
  const supabase = await createClient()
} catch (error) {
  // Handle "Supabase configuration is incomplete" error
  console.error('Check your environment variables:', error.message)
}
```

## Authentication Patterns

### Client-Side Authentication

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()
```

### Server-Side User Access

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }
  
  return user
}
```

## Database Operations

### Query Examples

```typescript
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// User-scoped query (with RLS)
const supabase = await createClient()
const { data: userChats } = await supabase
  .from('conversations')
  .select(`
    id,
    title,
    created_at,
    messages (
      id,
      content,
      role,
      timestamp
    )
  `)
  .order('created_at', { ascending: false })

// System-level query (bypass RLS)
const systemSupabase = await createServiceRoleClient()
const { data: allCustomers } = await systemSupabase
  .from('customer_configs')
  .select('*')
  .eq('status', 'active')
```

### Real-time Subscriptions

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Subscribe to changes
const channel = supabase
  .channel('conversation_updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    console.log('New message:', payload.new)
    // Handle new message
  })
  .subscribe()

// Clean up subscription
const unsubscribe = () => {
  channel.unsubscribe()
}
```

## Row Level Security (RLS)

Our application uses RLS policies to ensure data isolation:

### Customer Data Isolation
```sql
-- Example RLS policy
CREATE POLICY "Users can only see their own conversations"
ON conversations
FOR ALL
TO authenticated
USING (auth.uid() = user_id);
```

### Multi-tenant Customer Configs
```sql
-- Customer configs are isolated by domain
CREATE POLICY "Customer configs by domain"
ON customer_configs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'domain' = customer_configs.domain
  )
);
```

## Error Handling

### Common Patterns

```typescript
import { createClient } from '@/lib/supabase/server'

export async function safeQuery<T>(
  queryFn: (supabase: any) => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await queryFn(supabase)
    
    if (error) {
      console.error('Database error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Supabase client error:', error)
    return null
  }
}

// Usage
const conversations = await safeQuery(supabase =>
  supabase.from('conversations').select('*')
)
```

### Error Types

1. **Configuration Errors**: Missing environment variables
2. **Authentication Errors**: Invalid sessions, expired tokens
3. **Authorization Errors**: RLS policy violations
4. **Network Errors**: Connection timeouts, network issues
5. **Query Errors**: Invalid SQL, constraint violations

## Performance Optimization

### Connection Pooling

Supabase automatically handles connection pooling, but consider:

```typescript
// Reuse client instances where possible
const supabase = await createClient()

// Batch operations when feasible
const { data, error } = await supabase
  .from('messages')
  .insert([
    { content: 'Message 1', conversation_id: id },
    { content: 'Message 2', conversation_id: id },
    { content: 'Message 3', conversation_id: id }
  ])
```

### Query Optimization

```typescript
// Use select() to limit returned columns
const { data } = await supabase
  .from('conversations')
  .select('id, title, created_at') // Only needed columns
  .limit(20)
  .order('created_at', { ascending: false })

// Use single() for unique records
const { data } = await supabase
  .from('customer_configs')
  .select('*')
  .eq('domain', 'example.com')
  .single() // Expects exactly one result
```

## Testing

### Mock Configuration

```typescript
// __mocks__/supabase/server.js
export const createClient = jest.fn()
export const createServiceRoleClient = jest.fn()
```

### Test Setup

```typescript
import { createClient } from '@/lib/supabase/server'

// Mock the client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null })
}

;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
```

## Security Best Practices

1. **Environment Variables**: Never expose service role keys to the client
2. **RLS Policies**: Always implement proper RLS policies
3. **Input Validation**: Validate all inputs before database operations
4. **Error Handling**: Don't expose sensitive error details to clients
5. **Connection Management**: Use appropriate client types for each context

## Database Schema Integration

The clients work with our application schema:

```typescript
// Type-safe database operations
interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
        }
        Insert: {
          user_id: string
          title: string
        }
      }
      // ... other tables
    }
  }
}

// Type-safe client
const supabase: SupabaseClient<Database> = await createClient()
```

## Migration Support

For database migrations, use the service role client:

```typescript
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function runMigration() {
  const supabase = await createServiceRoleClient()
  
  // Execute migration SQL
  const { error } = await supabase.rpc('run_migration', {
    migration_sql: 'ALTER TABLE...'
  })
  
  if (error) {
    throw new Error(`Migration failed: ${error.message}`)
  }
}
```

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Verify all required environment variables are set
   - Check for typos in variable names
   - Ensure `.env.local` is in the project root

2. **"Row Level Security policy violation"**
   - Check RLS policies match your data access patterns
   - Verify user authentication state
   - Use service role client for administrative operations

3. **Cookie handling errors in middleware**
   - The server client gracefully handles middleware scenarios
   - Errors in `setAll` are expected and ignored

4. **Build-time errors with environment variables**
   - Client provides fallback values for build-time compatibility
   - Actual values are resolved at runtime

## Related Documentation

- [Supabase Official Documentation](https://supabase.com/docs)
- [Authentication Utilities](../auth/README.md)
- [Database Migrations](../../supabase/README.md)
- [Project Architecture](../../docs/ARCHITECTURE.md)