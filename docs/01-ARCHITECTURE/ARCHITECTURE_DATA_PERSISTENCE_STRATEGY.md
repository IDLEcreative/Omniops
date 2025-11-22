# Data Persistence Strategy

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-11-22
**Verified For:** v0.1.0
**Dependencies:** [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md), [Supabase Setup](../00-GETTING-STARTED/SETUP_SUPABASE.md)
**Estimated Read Time:** 15 minutes

## Purpose

Defines the comprehensive data persistence strategy for Omniops, detailing what data is stored where, why, and how to maintain data integrity across multiple storage layers (Supabase, Redis, localStorage).

## Quick Links
- [Supabase Integration](ARCHITECTURE_SUPABASE_INTEGRATION.md)
- [Redis Caching Strategy](ARCHITECTURE_REDIS_CACHING.md)
- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Table of Contents
- [Storage Tier Overview](#storage-tier-overview)
- [Permanent Storage (Supabase)](#permanent-storage-supabase)
- [Ephemeral Storage (Redis)](#ephemeral-storage-redis)
- [Client Storage (Browser)](#client-storage-browser)
- [New: Persistent Message Queue](#new-persistent-message-queue)
- [New: Scrape Job Audit Trail](#new-scrape-job-audit-trail)
- [Data Flow Patterns](#data-flow-patterns)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

---

## Storage Tier Overview

Omniops uses a **three-tier storage architecture** to balance performance, cost, and data durability:

| Tier | Technology | Purpose | TTL | Use Cases |
|------|-----------|---------|-----|-----------|
| **Permanent** | Supabase (PostgreSQL) | Source of truth, audit trail | Infinite | User data, conversations, analytics, compliance |
| **Ephemeral** | Redis | Fast cache, job queues | 1-24 hours | Rate limiting, active jobs, search cache |
| **Client** | localStorage/sessionStorage | UI preferences | Session/Infinite | Language, dismissed alerts, temporary state |

### Decision Framework

**When choosing storage tier, ask:**

1. **Must survive server restart?** → Use Supabase (permanent)
2. **Needed for compliance/audit?** → Use Supabase (permanent)
3. **Can be regenerated if lost?** → Use Redis (ephemeral)
4. **Only affects UI appearance?** → Use localStorage (client)
5. **High read/write frequency?** → Use Redis with Supabase sync

---

## Permanent Storage (Supabase)

### What Goes Here

**✅ Store in Supabase:**
- User accounts & authentication
- Customer configurations
- Chat conversations & messages
- Scraped website content & embeddings
- E-commerce orders & cart operations
- Analytics & business intelligence data
- Feature flags & rollout tracking
- GDPR audit logs
- Webhook events
- Subscription & billing data
- **NEW:** Message queue (offline recovery)
- **NEW:** Scrape job audit trail

**❌ Do NOT Store in Supabase:**
- Temporary cache data (use Redis)
- UI preferences (use localStorage)
- Rate limiting counters (use Redis)
- Active job queue state (use Redis)

### Database Tables (31 Total)

See [REFERENCE_DATABASE_SCHEMA.md](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) for complete schema.

**Core Tables:**
- `customers` - Multi-tenant organizations
- `customer_configs` - Encrypted credentials & settings
- `conversations` - Chat sessions
- `messages` - Individual chat messages
- `conversation_metadata` - Accuracy tracking (86%)

**Content Tables:**
- `scraped_pages` - Website metadata
- `website_content` - Full-text searchable content
- `page_embeddings` - Vector embeddings (pgvector)

**Analytics Tables:**
- `conversation_funnel` - Funnel metrics
- `cart_operations` - Cart tracking
- `alert_history` - Alert logging

**NEW: Persistence Tables:**
- `message_queue` - Persistent message queue
- `scrape_jobs` - Job metadata audit trail
- `scrape_job_results` - Page-level scraping results
- `scrape_job_stats` - Aggregated job statistics

### Access Patterns

**Client (Anon Key + RLS):**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase
  .from('conversations')
  .select('*')
  .eq('customer_id', customerId); // RLS enforces multi-tenancy
```

**Server (Service Role - Bypass RLS):**
```typescript
import { createServiceRoleClient } from '@/lib/supabase/server';

const supabase = await createServiceRoleClient();
const { data, error } = await supabase
  .from('scrape_jobs')
  .select('*'); // No RLS - admin access
```

### Data Retention

| Table Category | Retention | Cleanup Method |
|---------------|-----------|----------------|
| **User Data** | Infinite | User-initiated deletion (GDPR) |
| **Conversations** | 90 days (configurable) | Automated cron job |
| **Analytics** | 365 days | Automated cron job |
| **Message Queue** | 24 hours | `cleanup_expired_message_queue()` |
| **Scrape Jobs** | 90 days | `cleanup_old_scrape_jobs(90)` |

---

## Ephemeral Storage (Redis)

### What Goes Here

**✅ Store in Redis:**
- Rate limiting counters (1-minute TTL)
- Active job queue state (1-hour TTL)
- Job results cache (24-hour TTL)
- Search result cache (configurable TTL)
- Session state for cron operations

**❌ Do NOT Store in Redis:**
- User account data
- Historical analytics
- Compliance/audit data
- Anything requiring >24 hour persistence

### Redis Key Patterns

```typescript
// Job management
`crawl:job:${jobId}`           // Job metadata (1h TTL)
`crawl:results:${jobId}`       // Job results (24h TTL)

// Rate limiting
`rate:${domain}`               // Request counter (60s TTL)
`rate:delay:${domain}`         // Adaptive delay (5min TTL)

// Content deduplication
`content:hash:${hash}`         // Hash -> URL mapping (24h TTL)
```

### Fallback Behavior

**If Redis unavailable:**
- Application continues functioning
- Falls back to in-memory storage (session only)
- No crashes or errors exposed to users

```typescript
import { getRedisClientWithFallback } from './redis-fallback';

const redis = getRedisClientWithFallback();
// Returns in-memory client if Redis connection fails
```

### When to Sync to Supabase

**Rule:** If Redis data has business value beyond caching, sync to Supabase.

**Examples:**
- ✅ Scrape job results → Sync to `scrape_job_results`
- ✅ Message queue → Sync to `message_queue`
- ❌ Rate limit counters → Ephemeral only
- ❌ Search cache → Ephemeral only (can regenerate)

---

## Client Storage (Browser)

### What Goes Here

**✅ Store in localStorage:**
- UI language preference
- Dismissed UI alerts
- Cookie consent status
- Domain filter selection (dashboard)
- Intended pricing tier (temporary)

**❌ Do NOT Store in localStorage:**
- User credentials (use Supabase Auth)
- Chat messages (use Supabase)
- Sensitive data (PII, payment info)
- Anything requiring server access

### Safe Storage Wrapper

Always use the safe storage wrapper to handle private browsing, quota exceeded, etc:

```typescript
import { safeLocalStorage } from '@/lib/utils/storage';

// Safe get (returns null if error)
const value = safeLocalStorage.getItem('language');

// Safe set (no throw on quota exceeded)
safeLocalStorage.setItem('language', 'en');

// Safe remove
safeLocalStorage.removeItem('language');
```

### Data Classification

| Storage Type | Use Case | Persistence | Survives Reload? | Survives Browser Close? |
|--------------|----------|-------------|------------------|------------------------|
| **localStorage** | UI preferences | Infinite | ✅ Yes | ✅ Yes |
| **sessionStorage** | Temporary state | Session | ✅ Yes | ❌ No |
| **In-memory** | Active state | Page load | ❌ No | ❌ No |

---

## NEW: Persistent Message Queue

### Problem Solved

**Before:** Messages queued during disconnection were lost on page reload/browser crash.

**After:** Messages persist to Supabase, enabling recovery across sessions.

### Architecture

```
User sends message
    ↓
Add to in-memory queue (fast)
    ↓
Persist to Supabase (backup)
    ↓
On reconnection:
    - Load from Supabase
    - Replay messages
    - Mark as processed
```

### Usage

```typescript
import { PersistentMessageQueue } from '@/lib/chat-widget/storage/persistent-message-queue';

// Create queue with persistence enabled
const queue = new PersistentMessageQueue({
  enablePersistence: true,
  customerId: 'customer-id',
  sessionId: 'session-id',
  conversationId: 'conversation-id',
});

// Enqueue message (automatically persists)
await queue.enqueue({
  type: 'chat',
  key: 'message-1',
  value: 'Hello',
  timestamp: Date.now(),
});

// Load persisted messages on page reload
const messages = await queue.loadPersistedMessages();

// Replay with persistence tracking
await queue.replayWithPersistence(async (message) => {
  await sendMessage(message);
});
```

### Database Schema

**Table:** `message_queue`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `customer_id` | UUID | Multi-tenant isolation |
| `session_id` | TEXT | Browser session identifier |
| `conversation_id` | UUID | Optional conversation link |
| `message_data` | JSONB | Full message object |
| `status` | TEXT | `pending`, `processing`, `completed`, `failed` |
| `retry_count` | INTEGER | Failed attempts |
| `expires_at` | TIMESTAMPTZ | Auto-cleanup (24h) |

**Cleanup:**
```sql
SELECT cleanup_expired_message_queue();
-- Returns: count of deleted messages
```

---

## NEW: Scrape Job Audit Trail

### Problem Solved

**Before:** Redis job data expired after 24 hours, no historical analytics available.

**After:** Complete audit trail with job metadata, results, and statistics.

### Architecture

```
Scrape job starts
    ↓
Create in Redis (fast cache, 1h TTL)
    ↓
Create in Supabase (permanent audit)
    ↓
As pages scrape:
    - Add result to Redis (24h TTL)
    - Add result to Supabase (permanent)
    - Auto-update statistics (trigger)
    ↓
Job completes:
    - Update status in both
    - Stats available for analytics
```

### Usage

```typescript
import { getPersistentJobManager } from '@/lib/persistent-job-manager';

const manager = getPersistentJobManager();

// Create job (persists to both Redis and Supabase)
await manager.createJob('job-123', jobData, {
  jobId: 'job-123',
  customerId: 'customer-id',
  domain: 'example.com',
  jobType: 'full_crawl',
  config: { maxPages: 100 },
});

// Add result (persists to both)
await manager.addJobResult('job-123', pageData, {
  url: 'https://example.com/page',
  status: 'success',
  httpStatus: 200,
  processingTimeMs: 1234,
});

// Get results from Supabase (beyond Redis TTL)
const results = await manager.getJobResultsFromSupabase('job-123');

// Get aggregated statistics
const stats = await manager.getJobStats('job-123');
/*
{
  total_pages: 100,
  successful_pages: 95,
  failed_pages: 5,
  avg_processing_time_ms: 1200,
  pages_per_second: 0.83,
}
*/
```

### Database Schema

**Table:** `scrape_jobs`

| Column | Type | Purpose |
|--------|------|---------|
| `job_id` | TEXT | Unique job identifier |
| `customer_id` | UUID | Multi-tenant isolation |
| `domain` | TEXT | Target domain |
| `job_type` | TEXT | `full_crawl`, `incremental`, etc. |
| `status` | TEXT | `queued`, `running`, `completed`, `failed` |
| `created_at` | TIMESTAMPTZ | Start time |
| `completed_at` | TIMESTAMPTZ | End time |
| `error_message` | TEXT | Failure reason |

**Table:** `scrape_job_results`

| Column | Type | Purpose |
|--------|------|---------|
| `job_id` | TEXT | Links to job |
| `url` | TEXT | Page URL |
| `status` | TEXT | `success`, `failed`, `skipped` |
| `http_status` | INTEGER | HTTP response code |
| `processing_time_ms` | INTEGER | Scrape duration |
| `error_message` | TEXT | Failure reason |

**Table:** `scrape_job_stats` (auto-updated via trigger)

| Column | Type | Purpose |
|--------|------|---------|
| `job_id` | TEXT | Links to job |
| `total_pages` | INTEGER | Pages attempted |
| `successful_pages` | INTEGER | Success count |
| `failed_pages` | INTEGER | Failure count |
| `avg_processing_time_ms` | INTEGER | Average duration |
| `pages_per_second` | DECIMAL | Throughput metric |

**Cleanup:**
```sql
SELECT cleanup_old_scrape_jobs(90);
-- Returns: count of deleted jobs (older than 90 days)
```

---

## Data Flow Patterns

### Pattern 1: Chat Message Flow

```
User → Widget → /api/chat
                  ↓
           Rate limit check (Redis)
                  ↓
           Load config (Supabase)
                  ↓
           Search embeddings (Supabase)
                  ↓
           AI processing (OpenAI)
                  ↓
           Save response (Supabase)
             - conversations
             - messages
             - conversation_metadata
                  ↓
           Broadcast (Supabase Realtime)
```

### Pattern 2: Web Scraping Flow

```
Cron → /api/cron/refresh
           ↓
    Load configs (Supabase)
           ↓
    Queue job (Redis + Supabase)
           ↓
    Execute scraping (Crawlee)
           ↓
    For each page:
      - Cache result (Redis 24h)
      - Store content (Supabase)
      - Generate embedding (Supabase)
      - Log result (Supabase)
           ↓
    Complete job (Redis + Supabase)
```

### Pattern 3: Offline Message Recovery

```
User sends message → Network down
                         ↓
                  Queue message (memory + Supabase)
                         ↓
                  User closes browser
                         ↓
                  User returns next day
                         ↓
                  Load queue (Supabase)
                         ↓
                  Replay messages
                         ↓
                  Mark as processed (Supabase)
```

---

## Migration Guide

### Applying Persistence Migrations

**Step 1: Dry run (test loading)**
```bash
npx tsx scripts/database/apply-persistence-migrations.ts --dry-run
```

**Step 2: Apply migrations**
```bash
npx tsx scripts/database/apply-persistence-migrations.ts
```

**Step 3: Verify tables created**
```bash
# Check in Supabase Dashboard:
# - message_queue
# - scrape_jobs
# - scrape_job_results
# - scrape_job_stats
```

**Step 4: Rollback (if needed)**
```bash
npx tsx scripts/database/apply-persistence-migrations.ts --rollback
```

### Migrating Existing Code

**Before (in-memory only):**
```typescript
import { MessageQueue } from '@/lib/chat-widget/storage/message-queue';

const queue = new MessageQueue();
queue.enqueue(message);
```

**After (with persistence):**
```typescript
import { PersistentMessageQueue } from '@/lib/chat-widget/storage/persistent-message-queue';

const queue = new PersistentMessageQueue({
  enablePersistence: true,
  customerId: 'customer-id',
  sessionId: 'session-id',
});

await queue.enqueue(message); // Now persists to Supabase
```

**Before (Redis only):**
```typescript
import { getJobManager } from '@/lib/redis';

const manager = getJobManager();
await manager.createJob('job-123', data);
```

**After (with persistence):**
```typescript
import { getPersistentJobManager } from '@/lib/persistent-job-manager';

const manager = getPersistentJobManager();
await manager.createJob('job-123', data, {
  jobId: 'job-123',
  customerId: 'customer-id',
  domain: 'example.com',
  jobType: 'full_crawl',
}); // Now persists to Supabase
```

---

## Best Practices

### DO ✅

1. **Use Supabase for source of truth**
   - All business-critical data
   - Anything requiring audit trail
   - User data and compliance

2. **Use Redis as cache layer**
   - High-frequency reads/writes
   - Temporary job state
   - Rate limiting counters

3. **Sync critical Redis data to Supabase**
   - Job results (beyond TTL)
   - Message queues (crash recovery)
   - Analytics events

4. **Handle connection failures gracefully**
   - Fallback to in-memory (Redis)
   - Return null safely (Supabase)
   - Don't crash on missing data

5. **Implement cleanup cron jobs**
   - Expired message queue (daily)
   - Old scrape jobs (weekly)
   - Conversation retention (weekly)

### DON'T ❌

1. **Don't store sensitive data in localStorage**
   - No credentials
   - No PII
   - No payment info

2. **Don't rely on Redis for permanent data**
   - Data can be lost on restart
   - TTLs will expire
   - No durability guarantee

3. **Don't sync everything to Supabase**
   - Rate limit counters (ephemeral)
   - Search cache (can regenerate)
   - Temporary UI state

4. **Don't access Supabase from client without RLS**
   - Always use anon key + RLS
   - Service role server-side only
   - Validate multi-tenancy

5. **Don't forget to clean up old data**
   - Implement retention policies
   - Schedule cleanup cron jobs
   - Monitor storage growth

### Performance Tips

1. **Batch Supabase operations**
   ```typescript
   // ❌ Bad: N queries
   for (const item of items) {
     await supabase.from('table').insert(item);
   }

   // ✅ Good: 1 query
   await supabase.from('table').insert(items);
   ```

2. **Use Redis for high-frequency reads**
   ```typescript
   // Check Redis first
   const cached = await redis.get(key);
   if (cached) return JSON.parse(cached);

   // Fall back to Supabase
   const data = await supabase.from('table').select('*');
   await redis.setex(key, 3600, JSON.stringify(data));
   return data;
   ```

3. **Parallel queries when independent**
   ```typescript
   // ❌ Sequential
   const config = await loadConfig();
   const conversation = await loadConversation();

   // ✅ Parallel
   const [config, conversation] = await Promise.all([
     loadConfig(),
     loadConversation(),
   ]);
   ```

---

## Monitoring & Maintenance

### Daily Tasks
- Run `cleanup_expired_message_queue()` via cron
- Monitor Redis memory usage
- Check Supabase connection pool

### Weekly Tasks
- Run `cleanup_old_scrape_jobs(90)` via cron
- Review storage growth trends
- Check for orphaned data

### Monthly Tasks
- Audit data retention policies
- Review cleanup job effectiveness
- Optimize slow queries

### Alerts to Set Up
- Supabase storage >80% capacity
- Redis memory >80% capacity
- Connection pool exhaustion
- Failed cleanup jobs

---

## Related Documentation

- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Supabase Setup Guide](../00-GETTING-STARTED/SETUP_SUPABASE.md)
- [Redis Configuration](../09-REFERENCE/REFERENCE_REDIS_CONFIG.md)
- [GDPR Compliance](ARCHITECTURE_GDPR_COMPLIANCE.md)

---

**Document Version:** 1.0
**Last Reviewed:** 2025-11-22
**Next Review:** 2026-01-22
