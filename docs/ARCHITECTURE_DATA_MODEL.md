# Data Model Architecture - Clarified

**Date:** 2025-10-29
**Status:** Authoritative Reference
**Purpose:** Eliminate confusion around customer_id, domain_id, and organization_id

---

## 🎯 Executive Summary

**The Correct Multi-Tenant Architecture:**

```
organizations (tenant/company)
    ↓ has many
domains (websites/configs)
    ↓ has many
conversations (chat sessions)
    ↓ has many
messages (chat messages)
```

**Key Principle:** `organization_id` is the primary tenant identifier. `domain_id` identifies which website config. `customer_id` is **DEPRECATED**.

---

## 📊 Entity Hierarchy

### Level 1: Organizations (Tenant)
**Table:** `organizations`
**Purpose:** Multi-tenant isolation - each company/client is an organization

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT, -- Billing reference
  created_at TIMESTAMPTZ
);
```

**Key Relationships:**
- Has many: organization_members (users)
- Has many: domains (website configs)
- Has many: conversations (via domains)
- Has many: billing_events, invoices

---

### Level 2: Domains (Website Configurations)
**Table:** `domains`
**Purpose:** Each organization can have multiple websites/domains

```sql
CREATE TABLE domains (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  domain TEXT NOT NULL,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ
);
```

**Key Relationships:**
- Belongs to: organization
- Has many: scraped_pages, page_embeddings
- Has many: conversations (chat sessions on this domain)
- Has many: scrape_jobs, structured_extractions

**IMPORTANT:** `domain_id` is the correct way to reference website-specific data!

---

### Level 3: Conversations (Chat Sessions)
**Table:** `conversations`
**Purpose:** Individual chat sessions between users and the AI

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES domains(id),        -- ✅ CORRECT
  organization_id UUID REFERENCES organizations(id),     -- ✅ CORRECT (backfilled)
  customer_id UUID,                                       -- ❌ DEPRECATED (dead column)
  session_id TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  metadata JSONB
);
```

**Architecture:**
- ✅ `domain_id` → Required, identifies which website this chat is on
- ✅ `organization_id` → Denormalized for fast tenant filtering
- ❌ `customer_id` → **DEAD COLUMN** (no FK, always NULL, should be dropped)

---

### Level 4: Messages (Chat Messages)
**Table:** `messages`
**Purpose:** Individual messages within a conversation

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  organization_id UUID REFERENCES organizations(id),    -- ✅ Denormalized
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ
);
```

---

## ⚠️ Common Confusions Clarified

### Confusion 1: "customer_configs" Table Name
**Problem:** The table is named `customer_configs` but doesn't represent customers!

**Reality:**
- `customer_configs` is actually **domain configuration**
- It stores settings for a specific domain
- `customer_configs.id` is the **config ID**, not a customer ID
- It should really be called `domain_configs`

**Schema:**
```sql
CREATE TABLE customer_configs (  -- Misleading name!
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),  -- Owner
  domain TEXT NOT NULL,                               -- Website domain
  business_name TEXT,
  settings JSONB,
  encrypted_credentials JSONB
);
```

**Correct Understanding:**
- One organization → many customer_configs (one per domain)
- `customer_configs` ≈ domain settings
- `customer_configs.id` is a **config ID**, not a customer/user ID

---

### Confusion 2: customer_id in Code
**Problem:** Code references `config.customer_id` - what does it mean?

**Answer:** It depends on context:

#### Context A: API Route Parameters (BAD naming)
```typescript
// app/api/customer/config/get-handler.ts
if (customerId) query = query.eq('customer_id', customerId)
```
**Meaning:** This is querying by `customer_configs.id` (the config ID)
**Should be:** `configId` or `domainConfigId` for clarity

#### Context B: conversations.customer_id (DEPRECATED)
```typescript
// Old schema (DEPRECATED)
conversations.customer_id → customer_configs.id  // No FK, never populated
```
**Status:** ❌ DEAD COLUMN - always NULL, should be dropped

#### Context C: Stripe/WooCommerce (CORRECT)
```typescript
// Stripe billing
organization.stripe_customer_id → Stripe customer ID  ✅ CORRECT

// WooCommerce API
order.customer_id → WooCommerce customer number     ✅ CORRECT
```
**Meaning:** External system IDs, completely separate concept

---

## ✅ Correct Data Access Patterns

### Pattern 1: Get Organization's Data
```typescript
// ✅ CORRECT - Filter by organization_id
const conversations = await supabase
  .from('conversations')
  .select('*')
  .eq('organization_id', orgId);
```

### Pattern 2: Get Domain-Specific Data
```typescript
// ✅ CORRECT - Filter by domain_id
const conversations = await supabase
  .from('conversations')
  .select('*')
  .eq('domain_id', domainId);
```

### Pattern 3: Multi-level Join
```typescript
// ✅ CORRECT - Verify ownership through joins
const conversations = await supabase
  .from('conversations')
  .select(`
    *,
    domains!inner(organization_id)
  `)
  .eq('domains.organization_id', orgId);
```

---

## ❌ Incorrect Patterns (Legacy)

### Anti-Pattern 1: Using conversations.customer_id
```typescript
// ❌ WRONG - This column is dead (always NULL)
const conversations = await supabase
  .from('conversations')
  .select('*')
  .eq('customer_id', customerId);  // NEVER WORKS
```
**Fix:** Use `domain_id` or `organization_id` instead

### Anti-Pattern 2: Confusing customer_configs.id
```typescript
// ❌ CONFUSING - Calling it "customer_id"
function getConfig(customerId: string) {  // Misleading name
  return supabase
    .from('customer_configs')
    .select('*')
    .eq('id', customerId);  // It's really a config ID
}
```
**Fix:** Rename parameter to `configId` or `domainConfigId`

---

## 🔧 Migration Status (Issue #6)

### Phase 1: Add organization_id Columns ✅
- ✅ Added organization_id to 6 tables
- ✅ Created performance indexes
- ✅ Backfilled 100% (8,832 rows)

### Phase 2: Update Code ⏳
**Status:** Partially complete

**What's Done:**
- ✅ Dashboard queries use organization_id
- ✅ Conversations and messages 100% backfilled

**What Remains:**
- ⏳ Clean up confusing parameter names (`customerId` → `configId`)
- ⏳ Remove references to dead conversations.customer_id
- ⏳ Update API documentation

### Phase 3: Drop Dead Columns 🔜
**Future Work:**
- Drop conversations.customer_id (dead column)
- Consider renaming customer_configs → domain_configs
- Add NOT NULL constraints to organization_id

---

## 📝 Naming Recommendations

### Current (Confusing)
```typescript
customer_configs      // Misleading - not about customers
customerId           // Ambiguous - could mean many things
customer_id          // In conversations - dead column
```

### Recommended (Clear)
```typescript
domain_configs       // Clear - configuration for domains
configId             // Unambiguous - refers to config table
organization_id      // Clear - tenant identifier
```

---

## 🎓 Key Takeaways

1. **organization_id** = Tenant identifier (WHO owns the data)
2. **domain_id** = Website identifier (WHICH website the data is for)
3. **customer_id** in conversations = DEPRECATED (dead column, drop it)
4. **customer_configs.id** = Really a "domain config ID" (naming issue)
5. **stripe_customer_id** = Billing identifier (different concept entirely)

---

## 🔗 Foreign Key Map

```
organizations.id
    ← domains.organization_id (FK)
    ← conversations.organization_id (FK)
    ← messages.organization_id (FK)
    ← customer_configs.organization_id (FK)

domains.id
    ← conversations.domain_id (FK, NOT NULL)
    ← scraped_pages.domain_id (FK)
    ← page_embeddings.domain_id (FK)

conversations.id
    ← messages.conversation_id (FK, NOT NULL)

conversations.customer_id  ❌ NO FK (dead column)
```

---

## ✅ Verification Queries

### Check Data Integrity
```sql
-- All conversations should have domain_id and organization_id
SELECT
  COUNT(*) as total,
  COUNT(domain_id) as with_domain,
  COUNT(organization_id) as with_org
FROM conversations;
-- Expected: 100% for both

-- Verify dead column is actually dead
SELECT COUNT(*) FROM conversations WHERE customer_id IS NOT NULL;
-- Expected: 0

-- Check organization relationships
SELECT
  c.id,
  c.domain_id,
  d.organization_id as domain_org,
  c.organization_id as conv_org
FROM conversations c
JOIN domains d ON c.domain_id = d.id
WHERE c.organization_id != d.organization_id;
-- Expected: 0 (they should match)
```

---

## 📚 References

- **Original Issue:** docs/GITHUB_ISSUES_PR4.md Issue #6
- **Migration Report:** ISSUE_6_MIGRATION_COMPLETE.md
- **Database Schema:** docs/SUPABASE_SCHEMA.md
- **Type Definitions:** types/supabase.ts

---

**Document Created:** 2025-10-29
**Last Updated:** 2025-10-29
**Status:** Authoritative
**Maintainer:** Engineering Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
