# Synonym System - Quick Reference Card

> **TL;DR**: Database-backed synonym management for multi-tenant search enhancement

---

## Import & Use (TypeScript)

```typescript
import { synonymLoader } from '@/lib/synonym-loader';

// Load all synonyms for a domain
const synonyms = await synonymLoader.loadSynonymsForDomain(domainId);
// Returns: Map<string, string[]>

// Get synonyms for specific term
const pumpSyns = await synonymLoader.getSynonymsForTerm(domainId, 'pump');
// Returns: ["hydraulic pump", "fluid pump", "pumping unit"]

// Expand query
const expanded = await synonymLoader.expandQuery(domainId, 'need pump', 3);
// Returns: "need pump hydraulic pump fluid pump pumping unit"

// Cache management
synonymLoader.clearCache(domainId);
const stats = synonymLoader.getCacheStats();
```

---

## API Endpoints

### GET /api/synonyms?domainId=uuid
Retrieve all synonyms for a domain.
```bash
curl "http://localhost:3000/api/synonyms?domainId=abc-123"
```

### POST /api/synonyms
Add/update synonym.
```bash
curl -X POST "http://localhost:3000/api/synonyms" \
  -H "Content-Type: application/json" \
  -d '{"domainId":"abc-123","term":"pizza","synonyms":["pie","za"]}'
```

### DELETE /api/synonyms?domainId=uuid&term=word
Delete synonym.
```bash
curl -X DELETE "http://localhost:3000/api/synonyms?domainId=abc-123&term=pizza"
```

### POST /api/synonyms/expand
Test query expansion.
```bash
curl -X POST "http://localhost:3000/api/synonyms/expand" \
  -H "Content-Type: application/json" \
  -d '{"domainId":"abc-123","query":"need pizza","maxExpansions":3}'
```

---

## Files Reference

| File | Purpose | Size |
|------|---------|------|
| `lib/synonym-loader.ts` | Core service | 4.9K |
| `app/api/synonyms/route.ts` | CRUD API | 3.5K |
| `app/api/synonyms/expand/route.ts` | Expansion API | 1.1K |
| `test-synonym-system.ts` | Test suite | 5.5K |
| `docs/01-ARCHITECTURE/ARCHITECTURE_SYNONYM_SYSTEM.md` | Full documentation | 12K |
| `docs/MIGRATION_HARDCODED_SYNONYMS.md` | Migration guide | 10K |

---

## Database Tables

### domain_synonym_mappings
Per-tenant synonyms. Priority: domain-specific overrides global.
```sql
domain_id (FK) | term      | synonyms (text[])
---------------|-----------|------------------
abc-123        | pump      | ["hydraulic pump", "fluid pump"]
abc-123        | pizza     | ["pie", "za"]
```

### global_synonym_mappings
Universal synonyms (safe for all business types).
```sql
term     | synonyms (text[])         | is_safe_for_all
---------|---------------------------|----------------
product  | ["item", "goods"]         | true
service  | ["offering", "solution"]  | true
```

---

## Common Tasks

### Add Synonym via API
```bash
curl -X POST "http://localhost:3000/api/synonyms" \
  -H "Content-Type: application/json" \
  -d '{
    "domainId": "your-domain-id",
    "term": "burger",
    "synonyms": ["hamburger", "sandwich", "patty"]
  }'
```

### Add Synonym via Database
```sql
INSERT INTO domain_synonym_mappings (domain_id, term, synonyms)
VALUES (
  'your-domain-id',
  'burger',
  ARRAY['hamburger', 'sandwich', 'patty']
)
ON CONFLICT (domain_id, term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms,
  updated_at = NOW();
```

### Test in Code
```typescript
import { synonymLoader } from '@/lib/synonym-loader';

const expanded = await synonymLoader.expandQuery(
  'your-domain-id',
  'need burger',
  3
);
console.log(expanded);
// Output: "need burger hamburger sandwich patty"
```

---

## Run Tests
```bash
# Full test suite
npx tsx test-synonym-system.ts

# Should see:
# ✅ All tests completed successfully!
# ✅ Loaded 80 synonym mappings
```

---

## Troubleshooting

**Issue**: Synonyms not loading
```typescript
// Check cache
synonymLoader.clearCache(domainId);

// Verify database
const supabase = createClient(url, key);
const { data } = await supabase
  .from('domain_synonym_mappings')
  .select('*')
  .eq('domain_id', domainId);
console.log(data);
```

**Issue**: API returns 404
```bash
# Verify server is running
curl http://localhost:3000/api/health

# Check endpoint exists
ls -la app/api/synonyms/
```

**Issue**: Query not expanding
```bash
# Test expansion endpoint
curl -X POST "http://localhost:3000/api/synonyms/expand" \
  -H "Content-Type: application/json" \
  -d '{"domainId":"<uuid>","query":"test","maxExpansions":5}'
```

---

## Performance

- **Cache TTL**: 5 minutes
- **Load Time**: ~700ms (cold), ~1ms (cached)
- **API Response**: ~100-700ms
- **Memory**: ~50KB per domain

---

## Migration from Hardcoded

1. Export synonyms from `lib/synonym-expander.ts`
2. Import to database via API or SQL
3. Update code to use `synonymLoader`
4. Test thoroughly
5. Deprecate old code

See: `docs/MIGRATION_HARDCODED_SYNONYMS.md`

---

## Documentation

- **Full Guide**: `docs/01-ARCHITECTURE/ARCHITECTURE_SYNONYM_SYSTEM.md`
- **Migration**: `docs/MIGRATION_HARDCODED_SYNONYMS.md`
- **Implementation Report**: `SYNONYM_SYSTEM_IMPLEMENTATION_REPORT.md`
- **This Card**: `SYNONYM_QUICK_REFERENCE.md`

---

**Questions?** Check full documentation or run tests.
