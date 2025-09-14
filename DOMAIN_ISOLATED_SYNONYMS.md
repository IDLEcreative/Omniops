# Domain-Isolated Synonym System

## Problem Solved

**Critical Issue:** The original hardcoded synonym system would contaminate results across different customer domains. For example:
- Medical equipment company: "pump" → "hydraulic pump" ❌ Wrong context!
- Fashion retailer: "CAT" → "Caterpillar" ❌ Wrong brand!
- Restaurant: "tank" → "hydraulic tank" ❌ Completely wrong!

## Solution: Database-Driven Domain Isolation

### Architecture

```
┌─────────────────────────────────────────┐
│         User Query from Domain X         │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Dynamic Synonym Expander           │
│  ┌─────────────────────────────────┐   │
│  │ 1. Load Domain-Specific Synonyms │   │
│  │    FROM domain_synonym_mappings  │   │
│  │    WHERE domain_id = X           │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 2. Add Safe Global Synonyms      │   │
│  │    FROM global_synonym_mappings  │   │
│  │    WHERE is_safe_for_all = true  │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│        Expanded Query (Isolated)         │
└─────────────────────────────────────────┘
```

### Database Schema

#### 1. `domain_synonym_mappings` Table
- **Purpose**: Store customer-specific synonyms
- **Isolation**: Each domain_id has its own synonym space
- **Example**: Thompson's "hydraulic" → ["hyd", "fluid power"]

#### 2. `global_synonym_mappings` Table  
- **Purpose**: Safe, generic synonyms for all domains
- **Filter**: `is_safe_for_all = true`
- **Examples**: 
  - "buy" → ["purchase", "order"]
  - "price" → ["cost", "how much"]
  - "shipping" → ["delivery", "freight"]

### Key Features

1. **Complete Domain Isolation**
   - Each customer's synonyms are stored separately
   - No cross-contamination between domains
   - Thompson's "CAT → Caterpillar" doesn't affect other customers

2. **Two-Tier System**
   - **Domain-specific**: High priority, customer-specific terms
   - **Global safe**: Generic terms that work everywhere

3. **Learning Capability**
   ```sql
   -- Learns from successful queries
   CALL learn_domain_synonym(
     domain_id, 
     'original_term',
     'matched_term', 
     confidence
   );
   ```

4. **Caching Strategy**
   - 5-minute cache per domain
   - Clears on domain switch
   - Reduces database queries

### Implementation Files

1. **Database Migration**
   - `supabase/migrations/20250114_domain_synonym_mappings.sql`
   - Creates tables, functions, and RLS policies

2. **Dynamic Expander**
   - `lib/synonym-expander-dynamic.ts`
   - Database-driven, async, domain-aware

3. **Integration**
   - `lib/chat-context-enhancer.ts`
   - Uses domain ID for expansion

### Usage Example

```typescript
// Each domain gets its own synonyms
const medicalDomain = "medical-supplies.com";
const expanded1 = await synonymExpander.expandQuery(
  "pump for surgery", 
  medicalDomain
);
// Result: "pump for surgery" (no hydraulic expansion)

const thompsonsDomain = "thompsonseparts.co.uk";
const expanded2 = await synonymExpander.expandQuery(
  "pump for excavator",
  thompsonsDomain  
);
// Result: "pump hydraulic pump fluid pump for excavator digger earthmover"
```

### Thompson's eParts Specific Synonyms

Now safely isolated to their domain only:
- forest equipment → forestry, logging equipment
- hydraulic → hyd, fluid power
- chainsaw → chain saw, cutting tool
- CAT → Caterpillar
- JD → John Deere
- excavator → digger, earthmover
- tough → extreme, harsh, severe

### Benefits

1. **Multi-Tenant Safety** ✅
   - No contamination between customers
   - Each domain has isolated synonym space

2. **Scalability** ✅
   - Add new customers without code changes
   - Manage synonyms via database/API

3. **Learning** ✅
   - Track successful queries
   - Build domain-specific knowledge

4. **Performance** ✅
   - Cached for 5 minutes
   - Async loading
   - Minimal overhead

### Management

Future API endpoints will allow:
```javascript
// Add domain synonym
POST /api/admin/synonyms
{
  "domainId": "...",
  "term": "forklift",
  "synonyms": ["lift truck", "fork truck"]
}

// Get domain synonyms
GET /api/admin/synonyms?domainId=...

// Delete synonym
DELETE /api/admin/synonyms?domainId=...&term=forklift
```

## Summary

The domain-isolated synonym system ensures that:
- **Thompson's eParts** gets heavy equipment synonyms
- **Medical suppliers** get medical terminology
- **Fashion retailers** get clothing terms
- **All domains** share safe, generic synonyms

No more contamination. Each customer gets exactly the synonyms relevant to their business.

---

*Implementation completed: January 14, 2025*  
*Multi-tenant safe synonym expansion ready for production*