# Database-Driven Synonym System

> **Last Updated**: 2025-10-26
> **Status**: Production Ready
> **Database Tables**: `domain_synonym_mappings`, `global_synonym_mappings`

## Overview

The synonym system enables per-tenant synonym customization via database tables, replacing hardcoded synonym mappings. This allows businesses to define their own terminology and improve search accuracy.

---

## Database Schema

### `domain_synonym_mappings`

Domain-specific synonyms (per tenant).

```sql
Column       | Type         | Description
-------------|--------------|------------------------------------------
id           | uuid         | Primary key
domain_id    | uuid         | FK to customer_configs.id (CASCADE)
term         | text         | Canonical term (e.g., "pump")
synonyms     | text[]       | Array of synonyms (e.g., ["hydraulic pump", "fluid pump"])
priority     | integer      | Priority for disambiguation (0-10, higher = more important)
created_at   | timestamptz  | Creation timestamp
updated_at   | timestamptz  | Last update timestamp

Indexes:
  - UNIQUE(domain_id, term)
  - idx_domain_synonyms_lookup (domain_id, term)

Foreign Keys:
  - domain_id -> customer_configs(id) ON DELETE CASCADE

RLS: 1 policy (domain isolation)
```

### `global_synonym_mappings`

Universal synonyms (apply to all domains unless overridden).

```sql
Column        | Type         | Description
--------------|--------------|------------------------------------------
id            | uuid         | Primary key
term          | text         | Canonical term
synonyms      | text[]       | Array of synonyms
is_safe_for_all | boolean    | Safe for all business types (default: true)
category      | text         | Optional categorization (e.g., "general", "technical")
created_at    | timestamptz  | Creation timestamp
updated_at    | timestamptz  | Last update timestamp

Indexes:
  - UNIQUE(term)
  - idx_global_synonyms_term (term)
  - idx_global_synonyms_safe (PARTIAL WHERE is_safe_for_all = true)

RLS: 4 policies (read-all, write-restricted)
```

---

## Architecture

### Components

1. **`lib/synonym-loader.ts`** - Singleton service for loading/caching synonyms
2. **`app/api/synonyms/route.ts`** - REST API for CRUD operations
3. **`lib/synonym-expander-dynamic.ts`** - Legacy dynamic expander (still functional)
4. **`lib/synonym-expander.ts`** - Legacy hardcoded expander (deprecated)

### Data Flow

```
User Query
    ↓
synonym-loader.loadSynonymsForDomain(domainId)
    ↓
    ├─→ domain_synonym_mappings (domain-specific)
    └─→ global_synonym_mappings (is_safe_for_all = true)
    ↓
In-Memory Cache (5 min TTL)
    ↓
Expanded Query
```

---

## Usage

### 1. Loading Synonyms (TypeScript)

```typescript
import { synonymLoader } from '@/lib/synonym-loader';

// Load all synonyms for a domain
const synonyms = await synonymLoader.loadSynonymsForDomain(domainId);
// Returns: Map<term, [synonyms]>
// Example: Map { "pump" => ["hydraulic pump", "fluid pump"] }

// Get synonyms for a specific term
const pumpSynonyms = await synonymLoader.getSynonymsForTerm(domainId, 'pump');
// Returns: ["hydraulic pump", "fluid pump"]

// Expand a query
const expanded = await synonymLoader.expandQuery(domainId, 'need pump', 3);
// Returns: "need pump hydraulic pump fluid pump pumping unit"
```

### 2. API Endpoints

#### **GET /api/synonyms?domainId=uuid**
Retrieve all synonyms for a domain.

```bash
curl "http://localhost:3000/api/synonyms?domainId=abc-123"
```

**Response:**
```json
{
  "domainId": "abc-123",
  "synonymCount": 25,
  "synonyms": {
    "pump": ["hydraulic pump", "fluid pump"],
    "tank": ["reservoir", "container"],
    "valve": ["control valve", "hydraulic valve"]
  }
}
```

#### **POST /api/synonyms**
Add or update a synonym mapping.

```bash
curl -X POST "http://localhost:3000/api/synonyms" \
  -H "Content-Type: application/json" \
  -d '{
    "domainId": "abc-123",
    "term": "pizza",
    "synonyms": ["pie", "za", "pizza pie"],
    "priority": 8
  }'
```

**Response:**
```json
{
  "success": true,
  "synonym": {
    "id": "xyz-789",
    "domain_id": "abc-123",
    "term": "pizza",
    "synonyms": ["pie", "za", "pizza pie"],
    "priority": 8
  }
}
```

#### **DELETE /api/synonyms?domainId=uuid&term=word**
Delete a synonym mapping.

```bash
curl -X DELETE "http://localhost:3000/api/synonyms?domainId=abc-123&term=pizza"
```

**Response:**
```json
{
  "success": true
}
```

#### **PATCH /api/synonyms/expand**
Test query expansion (for debugging).

```bash
curl -X PATCH "http://localhost:3000/api/synonyms/expand" \
  -H "Content-Type: application/json" \
  -d '{
    "domainId": "abc-123",
    "query": "need pizza",
    "maxExpansions": 3
  }'
```

**Response:**
```json
{
  "original": "need pizza",
  "expanded": "need pizza pie za",
  "addedTerms": ["pie", "za"]
}
```

---

## Integration Examples

### Integrate with Search Pipeline

```typescript
import { synonymLoader } from '@/lib/synonym-loader';

async function enhancedSearch(domainId: string, query: string) {
  // Expand query with synonyms
  const expandedQuery = await synonymLoader.expandQuery(domainId, query, 3);

  // Use expanded query in search
  const results = await searchDatabase(expandedQuery);

  return results;
}
```

### Integrate with Chat System

```typescript
import { synonymLoader } from '@/lib/synonym-loader';

async function processChatMessage(domainId: string, userMessage: string) {
  // Load domain synonyms
  const synonyms = await synonymLoader.loadSynonymsForDomain(domainId);

  // Check if user query contains known terms
  const words = userMessage.toLowerCase().split(/\s+/);
  for (const word of words) {
    const syns = synonyms.get(word);
    if (syns) {
      console.log(`User said "${word}", synonyms: ${syns.join(', ')}`);
    }
  }

  // Process message...
}
```

---

## Administration

### Seeding Common Synonyms

Create a seed script or use the API to add common synonyms:

```typescript
// seed-common-synonyms.ts
import { synonymLoader } from '@/lib/synonym-loader';

const commonSynonyms = [
  { term: "product", synonyms: ["item", "goods", "merchandise"] },
  { term: "service", synonyms: ["offering", "solution"] },
  { term: "price", synonyms: ["cost", "rate", "fee"] },
  { term: "available", synonyms: ["in stock", "available now"] }
];

// Add to global_synonym_mappings via SQL
// Or add to specific domain via API
for (const { term, synonyms } of commonSynonyms) {
  await fetch('/api/synonyms', {
    method: 'POST',
    body: JSON.stringify({
      domainId: 'your-domain-id',
      term,
      synonyms,
      priority: 5
    })
  });
}
```

### Cache Management

```typescript
// Clear cache after bulk updates
synonymLoader.clearCache(); // Clear all domains
synonymLoader.clearCache(domainId); // Clear specific domain

// Get cache stats
const stats = synonymLoader.getCacheStats();
console.log(stats);
// { cachedDomains: 5, domains: [...], totalMappings: 120 }
```

---

## Migration from Hardcoded Synonyms

### Step 1: Export Existing Synonyms

The old `lib/synonym-expander.ts` has hardcoded synonyms. To migrate:

```typescript
// migration-script.ts
import { SynonymExpander } from '@/lib/synonym-expander';

// Access the private synonymMap (for migration purposes)
const hardcodedSynonyms = {
  "pump": ["hydraulic pump", "fluid pump", "pumping unit"],
  "tank": ["reservoir", "container", "vessel"],
  // ... copy from synonym-expander.ts
};

// Insert into database via API
for (const [term, synonyms] of Object.entries(hardcodedSynonyms)) {
  await fetch('/api/synonyms', {
    method: 'POST',
    body: JSON.stringify({
      domainId: 'your-domain-id',
      term,
      synonyms,
      priority: 5
    })
  });
}
```

### Step 2: Update Code to Use New System

```typescript
// OLD (deprecated)
import { SynonymExpander } from '@/lib/synonym-expander';
const expanded = SynonymExpander.expandQuery(query);

// NEW (database-driven)
import { synonymLoader } from '@/lib/synonym-loader';
const expanded = await synonymLoader.expandQuery(domainId, query);
```

### Step 3: Remove Hardcoded Synonyms

Once migrated, remove hardcoded mappings from:
- `lib/synonym-expander.ts` (lines 10-80)
- `lib/synonym-expander-dynamic.ts` (deprecated method at line 286)
- `lib/synonym-auto-learner.ts` (deprecated method at line 219)

---

## Performance Considerations

### Caching Strategy

- **Cache TTL**: 5 minutes (configurable in `synonym-loader.ts`)
- **Cache Scope**: Per-domain
- **Cache Invalidation**: Automatic after POST/DELETE operations

### Database Indexes

```sql
-- Fast lookups by domain + term
CREATE INDEX idx_domain_synonyms_lookup
  ON domain_synonym_mappings(domain_id, term);

-- Fast lookups by term only
CREATE INDEX idx_global_synonyms_term
  ON global_synonym_mappings(term);

-- Partial index for safe global synonyms
CREATE INDEX idx_global_synonyms_safe
  ON global_synonym_mappings(term)
  WHERE is_safe_for_all = true;
```

### Query Optimization

```sql
-- Efficient query to load domain + global synonyms
SELECT term, synonyms, priority
FROM domain_synonym_mappings
WHERE domain_id = $1
ORDER BY priority DESC;

SELECT term, synonyms
FROM global_synonym_mappings
WHERE is_safe_for_all = true;
```

---

## Future Enhancements

### Phase 2: Admin UI (Planned)

- [ ] Dashboard page at `/dashboard/synonyms`
- [ ] CRUD interface for managing synonyms
- [ ] Bulk import/export (CSV/JSON)
- [ ] Synonym testing interface
- [ ] Analytics: most used synonyms, search improvements

### Phase 3: AI-Powered Learning (In Progress)

- [x] `lib/synonym-auto-learner.ts` - Automatic synonym extraction
- [ ] Integration with chat telemetry
- [ ] Confidence scoring for learned synonyms
- [ ] Manual review workflow for AI suggestions

### Phase 4: Advanced Features

- [ ] Multi-language synonyms
- [ ] Context-aware synonyms (different meanings in different contexts)
- [ ] Synonym groups (e.g., brand names)
- [ ] Synonym analytics dashboard

---

## Troubleshooting

### Issue: Synonyms Not Loading

**Check:**
1. Database connection: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set?
2. Table exists: `SELECT * FROM domain_synonym_mappings LIMIT 1;`
3. Cache issue: `synonymLoader.clearCache(domainId);`

### Issue: Performance Degradation

**Check:**
1. Cache hit rate: `synonymLoader.getCacheStats()`
2. Database indexes: `\d domain_synonym_mappings` (should show indexes)
3. Query count: Add logging to `loadSynonymsForDomain()`

### Issue: Synonyms Not Applied in Search

**Check:**
1. Query expansion: Test with `/api/synonyms/expand`
2. Integration: Verify `synonymLoader.expandQuery()` is called in search pipeline
3. Domain ID: Ensure correct `domainId` is passed

---

## Testing

### Unit Tests (TODO)

```typescript
// __tests__/lib/synonym-loader.test.ts
import { synonymLoader } from '@/lib/synonym-loader';

describe('SynonymLoader', () => {
  it('should load domain synonyms', async () => {
    const synonyms = await synonymLoader.loadSynonymsForDomain('test-domain');
    expect(synonyms.size).toBeGreaterThan(0);
  });

  it('should expand queries', async () => {
    const expanded = await synonymLoader.expandQuery('test-domain', 'pump');
    expect(expanded).toContain('hydraulic pump');
  });

  it('should cache results', async () => {
    await synonymLoader.loadSynonymsForDomain('test-domain');
    const stats = synonymLoader.getCacheStats();
    expect(stats.cachedDomains).toBe(1);
  });
});
```

### Integration Tests (TODO)

```bash
# Test API endpoints
npm run test:integration -- synonyms
```

---

## References

- **Database Schema**: [docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#synonym-management)
- **Legacy Code**: `lib/synonym-expander.ts` (deprecated), `lib/synonym-expander-dynamic.ts`
- **Related**: `lib/synonym-auto-learner.ts` (AI-powered learning)

---

**Maintained By**: Omniops Engineering
**Questions?** See [docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) or raise an issue.
