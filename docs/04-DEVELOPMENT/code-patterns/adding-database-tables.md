# Adding Database Tables to Omniops

A comprehensive guide for developers adding their first database table to the Omniops codebase.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Guide](#guide)
4. [Complete Working Example](#complete-working-example)
5. [Common Table Patterns](#common-table-patterns)
6. [RLS Policy Patterns](#rls-policy-patterns)
7. [Migration Best Practices](#migration-best-practices)
8. [Real Examples from Codebase](#real-examples-from-codebase)
9. [Troubleshooting](#troubleshooting)

## Overview

### Supabase Migration System

Omniops uses Supabase for database management with PostgreSQL. The migration system:

- **Version-controlled migrations**: All schema changes are tracked via SQL migration files
- **Idempotent**: Migrations use `IF NOT EXISTS` to be safely re-runnable
- **Sequential**: Migrations execute in timestamp order
- **Declarative**: SQL-based for clarity and portability

### SQL vs Supabase Dashboard

**Use SQL migrations for:**
- Table creation and schema changes
- Indexes and constraints
- RLS policies
- Functions and triggers
- Any production schema changes

**Use Supabase Dashboard for:**
- Quick data queries during development
- Troubleshooting and debugging
- Manual data inspection
- Testing queries before writing code

**Critical Rule**: Never make schema changes via the dashboard in production. Always use migrations for reproducibility and version control.

### Best Practices for Schema Changes

1. **One logical change per migration** - Keep migrations focused and reviewable
2. **Always reversible** - Write down migrations (though Supabase doesn't enforce this)
3. **Test locally first** - Apply migrations to local database before production
4. **Brand-agnostic design** - Never hardcode business-specific terms
5. **Add indexes from day one** - Don't wait for performance issues

## Prerequisites

### Required Knowledge

- **PostgreSQL**: Understanding of SQL, data types, constraints
- **Row Level Security (RLS)**: Multi-tenant security model
- **Supabase CLI**: Migration commands and workflow
- **TypeScript**: For generated types and queries

### Required Tools

- Supabase CLI installed: `npm install -g supabase`
- Local Supabase instance (optional): `supabase start`
- Database access credentials in `.env.local`

### Understanding Multi-Tenancy

Omniops is **multi-tenant by design**. Every table should:

- Isolate data by `domain` or `organization_id` or `user_id`
- Implement RLS policies to enforce isolation
- Never leak data between tenants
- Support multiple customers on same database

## Step-by-Step Guide

### Step 1: Plan Your Schema

Before writing any SQL, document your table requirements:

**Questions to Answer:**
1. What data does this table store?
2. How does it relate to existing tables?
3. What queries will be common?
4. What isolation strategy (domain, org, user)?
5. What are the write patterns (insert-heavy, update-heavy)?
6. What are the read patterns (single lookups, list queries, aggregations)?

**Naming Conventions:**
- **Tables**: Plural, snake_case - `user_preferences`, `chat_sessions`
- **Columns**: Singular, snake_case - `user_id`, `created_at`
- **Indexes**: `idx_tablename_columnname` - `idx_users_email`
- **Foreign keys**: `fk_tablename_columnname` - `fk_messages_conversation_id`
- **RLS Policies**: Descriptive - `"Users can view own data"`

**Column Types Reference:**
```sql
-- IDs and References
UUID                        -- Primary keys, foreign keys
SERIAL / BIGSERIAL         -- Auto-incrementing integers (rare in Supabase)

-- Text
TEXT                       -- Variable length, no limit
VARCHAR(n)                 -- Variable length, max n chars (avoid unless needed)
CHAR(n)                    -- Fixed length (rarely used)

-- Numbers
INTEGER                    -- 4-byte integer (-2B to 2B)
BIGINT                     -- 8-byte integer (use for counts that may grow)
NUMERIC(p, s)             -- Exact decimal (prices, currency)
REAL / DOUBLE PRECISION   -- Floating point (avoid for money)

-- Boolean
BOOLEAN                    -- true/false/null

-- Timestamps
TIMESTAMPTZ               -- Timestamp with timezone (always use this)
TIMESTAMP                 -- Without timezone (avoid)
DATE                      -- Date only
TIME                      -- Time only

-- JSON
JSONB                     -- Binary JSON (use this)
JSON                      -- Text JSON (slower, avoid)

-- Arrays
TEXT[]                    -- Array of text
INTEGER[]                 -- Array of integers

-- Special Types
VECTOR(1536)              -- pgvector for OpenAI embeddings
```

**Brand-Agnostic Design Checklist:**
- ❌ Column named `pump_type` → ✅ Column named `product_type`
- ❌ Column named `cifa_sku` → ✅ Column named `sku` or `product_code`
- ❌ Hardcoded enum `('pump', 'valve')` → ✅ Generic `product_category` JSONB
- ❌ Table named `pump_specifications` → ✅ Table named `product_specifications`

### Step 2: Create Migration File

Use the Supabase CLI to create a new migration:

```bash
# Format: YYYYMMDD_descriptive_name.sql
supabase migration new add_user_preferences_table
```

This creates: `supabase/migrations/20241024_add_user_preferences_table.sql`

**Migration Naming Conventions:**
- `add_[table_name]` - Creating new table
- `alter_[table_name]_[change]` - Modifying existing table
- `add_[feature]_support` - Adding feature-related tables
- `fix_[issue]` - Bug fixes
- `drop_[table_name]` - Removing table (rare)

**Where Files Are Created:**
- Local: `supabase/migrations/`
- Tracked in Git for version control
- Applied in timestamp order

### Step 3: Write Migration SQL

**Basic Table Creation Template:**

```sql
-- Migration: Add user_preferences table
-- Description: Stores user-specific settings and preferences
-- Date: 2024-10-24

-- Create table with IF NOT EXISTS for idempotency
CREATE TABLE IF NOT EXISTS user_preferences (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Data columns
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  email_notifications BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_preferences_theme_check CHECK (theme IN ('light', 'dark', 'auto')),
  CONSTRAINT user_preferences_language_check CHECK (language ~ '^[a-z]{2}$'),
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Add comments for documentation
COMMENT ON TABLE user_preferences IS 'Stores user-specific UI and notification preferences';
COMMENT ON COLUMN user_preferences.settings IS 'JSONB object for flexible preference storage';
COMMENT ON COLUMN user_preferences.theme IS 'UI theme preference: light, dark, or auto';
```

**Foreign Key Best Practices:**

```sql
-- Always specify ON DELETE behavior
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE     -- Delete child when parent deleted
customer_id UUID REFERENCES customers(id) ON DELETE SET NULL  -- Set to NULL when parent deleted
domain_id UUID REFERENCES domains(id) ON DELETE RESTRICT      -- Prevent deletion if children exist

-- NOT NULL foreign keys for required relationships
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE

-- Nullable foreign keys for optional relationships
parent_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL
```

**Default Values Best Practices:**

```sql
-- Timestamps - always use NOW()
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- UUIDs - use gen_random_uuid()
id UUID DEFAULT gen_random_uuid() PRIMARY KEY

-- Booleans - set sensible defaults
active BOOLEAN DEFAULT true
email_verified BOOLEAN DEFAULT false

-- Empty arrays/objects
tags TEXT[] DEFAULT '{}'
metadata JSONB DEFAULT '{}'::jsonb

-- Enums - default to most common
status TEXT DEFAULT 'pending'
```

### Step 4: Add Row Level Security (RLS)

**Why RLS is Critical:**
- Supabase exposes your database directly to clients via PostgREST
- Without RLS, any client can read/write any data
- RLS enforces tenant isolation at the database level
- Defense in depth - works even if application logic fails

**Enable RLS:**

```sql
-- Always enable RLS on new tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
```

**Create Policies - Basic Pattern:**

```sql
-- SELECT: Users can read their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can create their own preferences
CREATE POLICY "Users can create own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Domain-Based Isolation Pattern:**

```sql
-- For tables tied to customer domains (scraped_pages, website_content, etc.)
CREATE POLICY "Users can view domain data"
  ON scraped_pages
  FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert domain data"
  ON scraped_pages
  FOR INSERT
  WITH CHECK (
    domain_id IN (
      SELECT id FROM domains WHERE user_id = auth.uid()
    )
  );
```

**Organization-Based Isolation Pattern:**

```sql
-- For multi-seat organizations
CREATE POLICY "Organization members can view data"
  ON project_data
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Admin-only modification
CREATE POLICY "Admins can modify data"
  ON project_data
  FOR UPDATE
  USING (
    has_organization_role(organization_id, auth.uid(), 'admin')
  );
```

**Service Role Bypass:**

```sql
-- Service role always has full access (for backend operations)
CREATE POLICY "Service role has full access"
  ON user_preferences
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Step 5: Add Indexes

**When to Add Indexes:**
- ✅ Foreign key columns (for JOIN performance)
- ✅ Columns in WHERE clauses
- ✅ Columns in ORDER BY clauses
- ✅ Columns used in GROUP BY
- ✅ UNIQUE constraints
- ❌ Small tables (< 1000 rows)
- ❌ Columns that are rarely queried
- ❌ Columns with low cardinality (few unique values)

**Basic Index Patterns:**

```sql
-- Single column index
CREATE INDEX idx_user_preferences_user_id
  ON user_preferences(user_id);

-- Composite index (column order matters!)
CREATE INDEX idx_messages_conversation_created
  ON messages(conversation_id, created_at DESC);

-- Unique index
CREATE UNIQUE INDEX idx_user_preferences_unique_user
  ON user_preferences(user_id);

-- Partial index (conditional)
CREATE INDEX idx_active_users
  ON users(email)
  WHERE active = true;

-- Index on JSONB field
CREATE INDEX idx_metadata_category
  ON products((metadata->>'category'));

-- Full-text search index
CREATE INDEX idx_content_search
  ON articles USING GIN(to_tsvector('english', content));
```

**Performance Considerations:**

```sql
-- For foreign keys (CRITICAL for JOIN performance)
CREATE INDEX idx_scraped_pages_domain_id ON scraped_pages(domain_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- For timestamp-based queries (newest first)
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- For domain lookups (common in multi-tenant)
CREATE INDEX idx_customer_configs_domain ON customer_configs(domain);

-- For status filtering
CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status)
  WHERE status != 'completed';
```

**Composite Index Guidelines:**

```sql
-- ✅ GOOD: Most selective column first
CREATE INDEX idx_orders_customer_status_date
  ON orders(customer_id, status, created_at);
-- Supports: WHERE customer_id = ? AND status = ? AND created_at > ?
-- Also supports: WHERE customer_id = ?
-- Also supports: WHERE customer_id = ? AND status = ?

-- ❌ BAD: Low selectivity first
CREATE INDEX idx_orders_status_customer
  ON orders(status, customer_id);
-- Only efficient for: WHERE status = ? AND customer_id = ?
```

### Step 6: Test Migration Locally

**Apply Migration:**

```bash
# If running local Supabase
supabase db reset  # Applies all migrations from scratch

# Or apply new migrations only
supabase migration up

# Check migration status
supabase migration list
```

**Verify Table Created:**

```bash
# Connect to local database
supabase db reset

# Use psql
psql postgresql://postgres:postgres@localhost:54322/postgres

# Check table exists
\dt user_preferences

# Describe table
\d user_preferences

# Check RLS enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_preferences';

# List policies
\d+ user_preferences
```

**Test RLS Policies:**

```sql
-- Set session to specific user (simulates auth.uid())
SET request.jwt.claim.sub = 'user-id-here';

-- Try queries (should respect RLS)
SELECT * FROM user_preferences;

-- Reset to service role (bypass RLS)
RESET request.jwt.claim.sub;
```

**Rollback if Needed:**

```bash
# Revert last migration (local only)
supabase migration down

# Or delete migration file and reset
rm supabase/migrations/20241024_add_user_preferences_table.sql
supabase db reset
```

### Step 7: Update TypeScript Types

**Generate Types from Schema:**

```bash
# Generate types from remote database
supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts

# Or from local database
supabase gen types typescript --local > types/supabase.ts
```

**Update Type Definitions:**

```typescript
// types/database.ts
export interface UserPreference {
  id: string;
  user_id: string;
  organization_id: string | null;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  email_notifications: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Use generated types from Supabase
import { Database } from '@/types/supabase';

type UserPreference = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferenceInsert = Database['public']['Tables']['user_preferences']['Insert'];
type UserPreferenceUpdate = Database['public']['Tables']['user_preferences']['Update'];
```

**Type-Safe Queries:**

```typescript
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';

const supabase = createClient<Database>();

// Type-safe query
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

// data is automatically typed as UserPreference
if (data) {
  console.log(data.theme); // TypeScript knows this exists
}
```

### Step 8: Write Data Access Layer

**Service Pattern (Recommended):**

```typescript
// lib/services/user-preferences.ts
import { createClient } from '@/lib/supabase/server';
import type { UserPreference, UserPreferenceInsert } from '@/types/database';

export class UserPreferencesService {
  /**
   * Get user preferences by user ID
   */
  static async getByUserId(userId: string): Promise<UserPreference | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  }

  /**
   * Create or update user preferences (upsert)
   */
  static async upsert(
    userId: string,
    preferences: Partial<UserPreferenceInsert>
  ): Promise<UserPreference | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user preferences:', error);
      return null;
    }

    return data;
  }

  /**
   * Update theme preference
   */
  static async updateTheme(
    userId: string,
    theme: 'light' | 'dark' | 'auto'
  ): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_preferences')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return !error;
  }

  /**
   * Delete user preferences
   */
  static async delete(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    return !error;
  }
}
```

**Error Handling Best Practices:**

```typescript
// ✅ GOOD: Handle errors explicitly
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .single();

if (error) {
  console.error('Database error:', error.message);
  return { error: 'Failed to fetch preferences' };
}

return { data };

// ❌ BAD: Ignoring errors
const { data } = await supabase.from('user_preferences').select('*');
return data; // What if there was an error?
```

### Step 9: Add Tests

**Unit Tests for Service Layer:**

```typescript
// __tests__/lib/services/user-preferences.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserPreferencesService } from '@/lib/services/user-preferences';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('UserPreferencesService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should fetch user preferences by user ID', async () => {
    const mockPreferences = {
      id: 'pref-123',
      user_id: 'user-456',
      theme: 'dark',
      language: 'en',
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPreferences,
        error: null
      }),
    });

    const result = await UserPreferencesService.getByUserId('user-456');

    expect(result).toEqual(mockPreferences);
    expect(mockSupabase.from).toHaveBeenCalledWith('user_preferences');
  });

  it('should handle database errors gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      }),
    });

    const result = await UserPreferencesService.getByUserId('user-456');

    expect(result).toBeNull();
  });

  it('should upsert user preferences', async () => {
    const mockPreferences = {
      id: 'pref-123',
      user_id: 'user-456',
      theme: 'light',
    };

    mockSupabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockPreferences,
        error: null
      }),
    });

    const result = await UserPreferencesService.upsert('user-456', {
      theme: 'light'
    });

    expect(result).toEqual(mockPreferences);
  });
});
```

**Integration Tests (Optional):**

```typescript
// __tests__/integration/user-preferences.integration.test.ts
import { createServiceRoleClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

describe('User Preferences Integration', () => {
  let supabase: any;
  let testUserId: string;

  beforeAll(async () => {
    supabase = await createServiceRoleClient();
    testUserId = uuidv4();
  });

  afterEach(async () => {
    // Cleanup test data
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', testUserId);
  });

  it('should create and retrieve user preferences', async () => {
    // Insert preferences
    const { data: created } = await supabase
      .from('user_preferences')
      .insert({
        user_id: testUserId,
        theme: 'dark',
        language: 'en',
      })
      .select()
      .single();

    expect(created).toBeDefined();
    expect(created.theme).toBe('dark');

    // Retrieve preferences
    const { data: fetched } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(fetched).toEqual(created);
  });

  it('should enforce UNIQUE constraint on user_id', async () => {
    // Insert first preference
    await supabase
      .from('user_preferences')
      .insert({
        user_id: testUserId,
        theme: 'light',
      });

    // Try to insert duplicate
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: testUserId,
        theme: 'dark',
      });

    expect(error).toBeDefined();
    expect(error.message).toContain('unique');
  });
});
```

**Testing RLS Policies:**

```typescript
// __tests__/rls/user-preferences.rls.test.ts
import { createClient } from '@/lib/supabase/client';
import { createServiceRoleClient } from '@/lib/supabase/server';

describe('User Preferences RLS', () => {
  it('should prevent users from viewing other users preferences', async () => {
    const serviceRole = await createServiceRoleClient();

    // Create preference for user A
    const { data: prefA } = await serviceRole
      .from('user_preferences')
      .insert({ user_id: 'user-a', theme: 'dark' })
      .select()
      .single();

    // Try to access as user B (simulated)
    const clientB = createClient();
    // Set auth context to user B (requires test setup)

    const { data, error } = await clientB
      .from('user_preferences')
      .select('*')
      .eq('id', prefA.id)
      .single();

    // Should fail or return empty due to RLS
    expect(data).toBeNull();
  });
});
```

### Step 10: Document the Table

**Update 09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md:**

```markdown
#### `user_preferences`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
organization_id       UUID REFERENCES organizations(id) ON DELETE CASCADE
theme                 TEXT DEFAULT 'light'
language              TEXT DEFAULT 'en'
email_notifications   BOOLEAN DEFAULT true
settings              JSONB DEFAULT '{}'::jsonb
created_at            TIMESTAMPTZ DEFAULT NOW()
updated_at            TIMESTAMPTZ DEFAULT NOW()

-- Constraints
CONSTRAINT user_preferences_theme_check CHECK (theme IN ('light', 'dark', 'auto'))
CONSTRAINT unique_user_preferences UNIQUE(user_id)
```

**Purpose**: Stores user-specific UI preferences and notification settings

**Indexes**:
- `idx_user_preferences_user_id` on `user_id`

**RLS Policies**:
- Users can only view/modify their own preferences
- Service role has full access

**Relationships**:
- `user_id` → `auth.users.id` (CASCADE on delete)
- `organization_id` → `organizations.id` (CASCADE on delete)
```

**Add Comments in Migration:**

```sql
-- Table-level comment
COMMENT ON TABLE user_preferences IS 'Stores user-specific UI and notification preferences';

-- Column comments
COMMENT ON COLUMN user_preferences.theme IS 'UI theme: light, dark, or auto';
COMMENT ON COLUMN user_preferences.settings IS 'Flexible JSONB for additional preferences';
COMMENT ON COLUMN user_preferences.email_notifications IS 'Master toggle for email notifications';
```

## Complete Working Example

Here's a full migration for a `product_reviews` table with all best practices:

```sql
-- Migration: Add product_reviews table
-- Description: Stores customer reviews for products across all tenants
-- Date: 2024-10-24
-- Brand-agnostic: Works for any product type

-- =====================================================
-- CREATE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Multi-tenant Isolation
  domain TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Product Reference (generic, not tied to specific platform)
  product_id TEXT NOT NULL,
  product_name TEXT,

  -- Review Data
  reviewer_name TEXT,
  reviewer_email TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT false,

  -- Moderation
  status TEXT DEFAULT 'pending',
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT product_reviews_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  CONSTRAINT product_reviews_domain_product_reviewer UNIQUE(domain, product_id, reviewer_email)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Domain isolation (most common query)
CREATE INDEX idx_product_reviews_domain ON product_reviews(domain);

-- Product lookups
CREATE INDEX idx_product_reviews_product ON product_reviews(product_id);

-- Composite for domain + product queries
CREATE INDEX idx_product_reviews_domain_product ON product_reviews(domain, product_id);

-- Status filtering (for moderation)
CREATE INDEX idx_product_reviews_status ON product_reviews(status) WHERE status = 'pending';

-- Timestamp queries (newest first)
CREATE INDEX idx_product_reviews_created ON product_reviews(created_at DESC);

-- Organization-based queries
CREATE INDEX idx_product_reviews_organization ON product_reviews(organization_id) WHERE organization_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view approved reviews for a domain
CREATE POLICY "Public can view approved reviews"
  ON product_reviews
  FOR SELECT
  USING (status = 'approved');

-- Service role has full access (for moderation, imports)
CREATE POLICY "Service role has full access"
  ON product_reviews
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Domain owners can view all reviews for their domain
CREATE POLICY "Domain owners can view own reviews"
  ON product_reviews
  FOR SELECT
  USING (
    domain IN (
      SELECT domain FROM customer_configs WHERE customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Domain owners can moderate reviews
CREATE POLICY "Domain owners can moderate reviews"
  ON product_reviews
  FOR UPDATE
  USING (
    domain IN (
      SELECT domain FROM customer_configs WHERE customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    domain IN (
      SELECT domain FROM customer_configs WHERE customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Anyone can submit reviews (rate limited at app level)
CREATE POLICY "Anyone can submit reviews"
  ON product_reviews
  FOR INSERT
  WITH CHECK (status = 'pending');

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE product_reviews IS 'Customer reviews for products - brand-agnostic, works for any product type';
COMMENT ON COLUMN product_reviews.domain IS 'Domain for multi-tenant isolation';
COMMENT ON COLUMN product_reviews.product_id IS 'Platform-agnostic product identifier (SKU, slug, or ID)';
COMMENT ON COLUMN product_reviews.rating IS 'Star rating from 1-5';
COMMENT ON COLUMN product_reviews.status IS 'Moderation status: pending, approved, rejected, spam';
COMMENT ON COLUMN product_reviews.verified_purchase IS 'Whether reviewer actually purchased the product';
COMMENT ON COLUMN product_reviews.metadata IS 'Flexible JSONB for platform-specific data';

-- =====================================================
-- HELPER FUNCTIONS (Optional)
-- =====================================================

-- Function to calculate average rating for a product
CREATE OR REPLACE FUNCTION get_product_average_rating(p_domain TEXT, p_product_id TEXT)
RETURNS NUMERIC AS $$
  SELECT ROUND(AVG(rating)::numeric, 2)
  FROM product_reviews
  WHERE domain = p_domain
    AND product_id = p_product_id
    AND status = 'approved';
$$ LANGUAGE SQL STABLE;

-- Function to get review count by rating
CREATE OR REPLACE FUNCTION get_product_rating_breakdown(p_domain TEXT, p_product_id TEXT)
RETURNS TABLE(rating INTEGER, count BIGINT) AS $$
  SELECT rating, COUNT(*)
  FROM product_reviews
  WHERE domain = p_domain
    AND product_id = p_product_id
    AND status = 'approved'
  GROUP BY rating
  ORDER BY rating DESC;
$$ LANGUAGE SQL STABLE;
```

## Common Table Patterns

### Pattern 1: Audit Tables

```sql
-- Track all changes to sensitive data
CREATE TABLE IF NOT EXISTS customer_config_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT audit_action_check CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX idx_config_audit_config ON customer_config_audit(config_id);
CREATE INDEX idx_config_audit_changed_at ON customer_config_audit(changed_at DESC);
```

### Pattern 2: Junction Tables (Many-to-Many)

```sql
-- Users can belong to multiple organizations
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_org_user UNIQUE(organization_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- Composite index for lookups from either direction
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
```

### Pattern 3: Configuration Tables

```sql
-- System-wide or tenant-specific config
CREATE TABLE IF NOT EXISTS system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_config_key ON system_config(key);
```

### Pattern 4: Cache Tables

```sql
-- Cache expensive queries or API calls
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  domain TEXT, -- For multi-tenant caches
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cache_key ON query_cache(cache_key);
CREATE INDEX idx_cache_domain ON query_cache(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_cache_expires ON query_cache(expires_at);

-- Auto-cleanup expired cache
CREATE INDEX idx_cache_expired ON query_cache(expires_at) WHERE expires_at < NOW();
```

### Pattern 5: Soft Deletes

```sql
-- Don't actually delete data, just mark as deleted
CREATE TABLE IF NOT EXISTS soft_delete_example (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only show non-deleted records by default
CREATE INDEX idx_example_active ON soft_delete_example(id) WHERE deleted_at IS NULL;

-- RLS policy to hide deleted records
CREATE POLICY "Hide deleted records"
  ON soft_delete_example
  FOR SELECT
  USING (deleted_at IS NULL OR auth.jwt() ->> 'role' = 'service_role');
```

### Pattern 6: Timestamps with Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## RLS Policy Patterns

### Pattern 1: User-Owned Data

```sql
-- Users can only access their own data
CREATE POLICY "Users own their data"
  ON user_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Pattern 2: Domain Isolation

```sql
-- Users access data for domains they own
CREATE POLICY "Domain owners access domain data"
  ON domain_data
  FOR SELECT
  USING (
    domain IN (
      SELECT d.domain FROM domains d
      INNER JOIN customers c ON d.user_id = c.auth_user_id
      WHERE c.auth_user_id = auth.uid()
    )
  );
```

### Pattern 3: Organization Membership

```sql
-- Organization members can view shared data
CREATE POLICY "Organization members view shared data"
  ON shared_data
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Pattern 4: Role-Based Access

```sql
-- Admins can modify, members can only view
CREATE POLICY "Admins can modify"
  ON project_settings
  FOR UPDATE
  USING (
    has_organization_role(organization_id, auth.uid(), 'admin')
  );

CREATE POLICY "Members can view"
  ON project_settings
  FOR SELECT
  USING (
    is_organization_member(organization_id, auth.uid())
  );
```

### Pattern 5: Public Read, Authenticated Write

```sql
-- Anyone can read, only authenticated users can write
CREATE POLICY "Public read access"
  ON blog_posts
  FOR SELECT
  USING (published = true);

CREATE POLICY "Authenticated users can create"
  ON blog_posts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

### Pattern 6: Service Role Bypass

```sql
-- Service role always has full access
CREATE POLICY "Service role full access"
  ON all_tables
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

## Migration Best Practices

### Rule 1: One Migration Per Logical Change

```sql
-- ✅ GOOD: Single focused migration
-- Migration: add_email_verification_to_users
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- ❌ BAD: Multiple unrelated changes
-- Migration: misc_updates
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN featured BOOLEAN DEFAULT false;
CREATE TABLE reviews (...);
```

### Rule 2: Always Idempotent

```sql
-- ✅ GOOD: Safe to run multiple times
CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ❌ BAD: Fails on second run
CREATE TABLE users (...);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN;
CREATE INDEX idx_users_email ON users(email);
```

### Rule 3: Add Indexes for Foreign Keys

```sql
-- ✅ GOOD: Index all foreign keys
ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- ❌ BAD: Forgetting index (slow JOINs)
ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id);
```

### Rule 4: Set ON DELETE Behavior

```sql
-- ✅ GOOD: Explicit cascade behavior
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
parent_id UUID REFERENCES comments(id) ON DELETE SET NULL

-- ❌ BAD: Default behavior (RESTRICT)
user_id UUID REFERENCES auth.users(id)
```

### Rule 5: Never Edit Applied Migrations

```sql
-- ❌ NEVER DO THIS: Editing 20241020_add_users.sql after it's been applied

-- ✅ DO THIS: Create new migration
-- Migration: 20241024_add_missing_user_index.sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### Rule 6: Test Migrations Locally First

```bash
# ✅ GOOD: Test before production
supabase db reset  # Apply all migrations locally
# Run tests
# Verify data
# Then apply to production

# ❌ BAD: Apply directly to production
supabase db push --production  # Hope it works!
```

### Rule 7: Include Rollback Comments

```sql
-- Migration: add_user_roles
-- Rollback: DROP TABLE user_roles CASCADE;

CREATE TABLE user_roles (...);
```

### Rule 8: Use Constraints Liberally

```sql
-- ✅ GOOD: Constraints prevent bad data
rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
status TEXT CHECK (status IN ('active', 'inactive', 'suspended'))

-- ❌ BAD: Rely on application validation only
rating INTEGER
email TEXT
status TEXT
```

## Real Examples from Codebase

### Example 1: `customer_configs` Table

From `supabase/migrations/000_complete_schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS customer_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  business_name TEXT,
  business_description TEXT,
  primary_color TEXT DEFAULT '#000000',
  welcome_message TEXT,
  suggested_questions JSONB DEFAULT '[]'::jsonb,
  woocommerce_url TEXT,
  woocommerce_consumer_key TEXT,
  woocommerce_consumer_secret TEXT,
  encrypted_credentials JSONB,
  owned_domains TEXT[] DEFAULT '{}',
  rate_limit INTEGER DEFAULT 10,
  allowed_origins TEXT[] DEFAULT ARRAY['*'],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_configs_domain ON customer_configs(domain);
CREATE INDEX idx_customer_configs_customer ON customer_configs(customer_id);
```

**Design Decisions:**
- `domain` is UNIQUE for easy lookups
- JSONB for `encrypted_credentials` (flexible)
- TEXT[] for `owned_domains` (array of strings)
- Sensible defaults (`active`, `rate_limit`)

### Example 2: `scraped_pages` with RLS

From `supabase/migrations/002_add_auth.sql`:

```sql
-- Enable RLS
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;

-- Users can only view pages for their domains
CREATE POLICY "Users can view their domain's pages"
  ON scraped_pages
  FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages for their domains"
  ON scraped_pages
  FOR INSERT
  WITH CHECK (
    domain_id IN (
      SELECT id FROM domains WHERE user_id = auth.uid()
    )
  );
```

**Design Decisions:**
- Subquery checks domain ownership
- Separate policies for SELECT and INSERT
- Prevents data leakage between customers

### Example 3: `organizations` with Helper Functions

From `supabase/migrations/20251020_add_multi_seat_organizations.sql`:

```sql
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  plan_type TEXT DEFAULT 'free',
  seat_limit INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT organizations_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Helper function for role checking
CREATE OR REPLACE FUNCTION has_organization_role(
  p_organization_id UUID,
  p_user_id UUID,
  p_required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy JSONB := '{"owner": 4, "admin": 3, "member": 2, "viewer": 1}'::jsonb;
BEGIN
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = p_organization_id
    AND user_id = p_user_id;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN (role_hierarchy->>user_role)::int >= (role_hierarchy->>p_required_role)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Design Decisions:**
- CHECK constraints for data validation
- Helper function for role hierarchies
- SECURITY DEFINER for elevated permissions

### Example 4: `demo_attempts` with Views

From `supabase/migrations/20251019_create_demo_attempts.sql`:

```sql
CREATE TABLE IF NOT EXISTS demo_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  pages_scraped INTEGER DEFAULT 0,
  scrape_success BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT demo_attempts_url_check CHECK (url ~ '^https?://')
);

-- Analytical view
CREATE OR REPLACE VIEW demo_leads_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE scrape_success = true) as successful_attempts,
  COUNT(DISTINCT domain) as unique_domains
FROM demo_attempts
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Design Decisions:**
- CHECK constraint for URL validation
- Materialized view for analytics (fast queries)
- FILTER clause for conditional aggregation

## Troubleshooting

### Issue 1: Migration Failed

**Symptom:**
```
Error: relation "table_name" already exists
```

**Solution:**
```sql
-- Add IF NOT EXISTS to all CREATE statements
CREATE TABLE IF NOT EXISTS table_name (...);
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);
```

### Issue 2: RLS Policy Too Restrictive

**Symptom:**
```
Error: new row violates row-level security policy for table "table_name"
```

**Debugging:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'table_name';

-- List all policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Test policy as specific user
SET request.jwt.claim.sub = 'user-id';
INSERT INTO table_name (...) VALUES (...);
RESET request.jwt.claim.sub;
```

**Solution:**
```sql
-- Add WITH CHECK clause for INSERT/UPDATE
CREATE POLICY "Users can insert own data"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);  -- Must include this!
```

### Issue 3: Foreign Key Constraint Violation

**Symptom:**
```
Error: insert or update on table violates foreign key constraint
```

**Debugging:**
```sql
-- Check if referenced row exists
SELECT * FROM parent_table WHERE id = 'parent-id';

-- Check constraint definition
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='your_table';
```

**Solution:**
```sql
-- Ensure parent row exists before inserting child
-- Or make foreign key nullable if optional
ALTER TABLE child_table
  ALTER COLUMN parent_id DROP NOT NULL;
```

### Issue 4: Type Generation Errors

**Symptom:**
```
TypeError: Cannot read property 'Tables' of undefined
```

**Solution:**
```bash
# Regenerate types after schema changes
supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts

# Or for local
supabase gen types typescript --local > types/supabase.ts

# Check import path
import type { Database } from '@/types/supabase';  # Correct
import type { Database } from '@/types/database';  # Wrong
```

### Issue 5: Slow Queries (Missing Indexes)

**Symptom:**
```
Query takes several seconds
```

**Debugging:**
```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM table_name WHERE column = 'value';

-- Look for "Seq Scan" (bad) instead of "Index Scan" (good)
```

**Solution:**
```sql
-- Add index for frequently queried columns
CREATE INDEX idx_table_column ON table_name(column);

-- For composite queries
CREATE INDEX idx_table_multi ON table_name(column1, column2);

-- Analyze table after creating index
ANALYZE table_name;
```

### Issue 6: Unique Constraint Violation

**Symptom:**
```
Error: duplicate key value violates unique constraint
```

**Debugging:**
```sql
-- Find duplicates
SELECT column, COUNT(*)
FROM table_name
GROUP BY column
HAVING COUNT(*) > 1;

-- Check existing constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'your_table';
```

**Solution:**
```sql
-- Remove duplicates before adding constraint
DELETE FROM table_name a USING (
  SELECT MIN(ctid) as ctid, column
  FROM table_name
  GROUP BY column HAVING COUNT(*) > 1
) b
WHERE a.column = b.column
AND a.ctid <> b.ctid;

-- Then add constraint
ALTER TABLE table_name ADD CONSTRAINT unique_column UNIQUE(column);
```

### Issue 7: Cannot Drop Table (Dependencies)

**Symptom:**
```
Error: cannot drop table because other objects depend on it
```

**Debugging:**
```sql
-- Find dependencies
SELECT
  dependent_ns.nspname as dependent_schema,
  dependent_view.relname as dependent_view,
  source_ns.nspname as source_schema,
  source_table.relname as source_table
FROM pg_depend
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'your_table';
```

**Solution:**
```sql
-- Drop with CASCADE (careful!)
DROP TABLE table_name CASCADE;

-- Or drop dependencies first
DROP VIEW dependent_view;
DROP TABLE table_name;
```

---

## Quick Reference Checklist

When adding a new table, ensure you've completed:

- [ ] Planned schema with brand-agnostic naming
- [ ] Created migration file with `supabase migration new`
- [ ] Written CREATE TABLE with IF NOT EXISTS
- [ ] Added all necessary columns with appropriate types
- [ ] Set default values for non-required columns
- [ ] Added CHECK constraints for data validation
- [ ] Defined foreign keys with ON DELETE behavior
- [ ] Added UNIQUE constraints where needed
- [ ] Enabled RLS with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] Created RLS policies for SELECT, INSERT, UPDATE, DELETE
- [ ] Added indexes for foreign keys
- [ ] Added indexes for frequently queried columns
- [ ] Added composite indexes for multi-column queries
- [ ] Added table and column comments
- [ ] Tested migration locally with `supabase db reset`
- [ ] Verified RLS policies work as expected
- [ ] Generated TypeScript types
- [ ] Created service layer for data access
- [ ] Written unit tests for service layer
- [ ] Updated 09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md documentation
- [ ] Reviewed for performance implications
- [ ] Checked for brand-agnostic compliance

## Further Reading

- **Supabase Documentation**: https://supabase.com/docs/guides/database
- **PostgreSQL Data Types**: https://www.postgresql.org/docs/current/datatype.html
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Database Design Best Practices**: https://www.postgresql.org/docs/current/ddl.html
- **Indexing Strategies**: https://www.postgresql.org/docs/current/indexes.html

---

**Document Version**: 1.0
**Last Updated**: 2024-10-24
**Maintainer**: Development Team
