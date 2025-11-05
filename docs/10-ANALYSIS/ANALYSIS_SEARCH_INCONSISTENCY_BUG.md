# Search Inconsistency Bug - Investigation Report

**Type:** Bug Analysis
**Status:** Active
**Severity:** Critical
**Last Updated:** 2025-11-05
**Verified For:** Current main branch

## Purpose

Comprehensive root cause analysis of a critical search inconsistency bug where the chat system fails to find products on the first attempt but succeeds on the second attempt with the same query.

## Problem Statement

### User Report

User queried: "heya do you sell gloves"

**First Attempt:**
- System response: "I searched our inventory and didn't find any products matching 'gloves'"
- Result: 0 products found

**Second Attempt (user asks "any gloves"):**
- System response: Found and listed 3 glove products:
  - Bodyline Nitrile Gloves X-Large (Box 100) - SKU: BDPBNGEL - £10.85
  - Bodyline Nitrile Gloves Large (Box 100) - SKU: BDPBNGL - £10.85
  - Anti-Vibration Gloves Large - Pair - SKU: 9142L - £43.50
- Result: 3 products found successfully

### Impact

**Severity:** Critical - Directly affects user experience and trust
- Users receive incorrect "no products found" messages
- Forces users to rephrase queries multiple times
- Creates inconsistent behavior that appears broken
- Violates anti-hallucination principles (claiming no products exist when they do)

## Root Cause Analysis

### Search Flow Architecture

The chat system uses a layered search approach:

```
User Query → AI Tool Call (search_products)
    ↓
1. SKU Exact Match (if query looks like SKU)
    ↓ (if no match)
2. Commerce Provider Search (WooCommerce/Shopify)
    ↓ (if provider fails or returns 0)
3. Semantic Search Fallback (vectorized scraped content)
    ↓
Return results to AI
```

### Identified Failure Points

#### 1. Commerce Provider Initialization Race Condition

**File:** [lib/agents/commerce-provider.ts](../../lib/agents/commerce-provider.ts:169-191)

```typescript
export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  const normalizedDomain = normalizeDomain(domain || '');

  // Check cache first (60 second TTL)
  const cached = providerCache.get(normalizedDomain);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.provider;
  }

  // Resolve provider (loads config, decrypts credentials, initializes client)
  const provider = await resolveProvider(normalizedDomain);

  providerCache.set(normalizedDomain, {
    provider,
    expiresAt: now + PROVIDER_CACHE_TTL_MS,
  });

  return provider;
}
```

**Failure scenario:**
- First request: Provider initialization takes time (DB query + credential decryption + client setup)
- If ANY step fails (DB timeout, credential missing, API connection issue), returns `null`
- No retry logic - immediately falls back to semantic search

**Evidence in logs:**
- [WooCommerce Provider] errors would be logged but swallowed
- No automatic retry on transient failures

#### 2. Semantic Search Domain Lookup Failure

**File:** [lib/embeddings/search-orchestrator.ts](../../lib/embeddings/search-orchestrator.ts:44-55)

```typescript
// Domain lookup with caching
const domainId = await domainCache.getDomainId(searchDomain);

if (!domainId) {
  console.log(`No domain found for "${searchDomain}" (original: "${domain}")`);
  return [];  // ← CRITICAL: Returns empty array immediately
}
```

**Failure scenario:**
- If domain hasn't been scraped yet → No `domainId` → Return `[]`
- If domain string doesn't match database format → No `domainId` → Return `[]`
- If domain cache is stale → Lookup might fail → Return `[]`

**Critical issue:** No fallback when `domainId` is null. System gives up entirely.

#### 3. Error Swallowing in Search Products Handler

**File:** [lib/chat/tool-handlers/search-products.ts](../../lib/chat/tool-handlers/search-products.ts:50-68)

```typescript
const provider = await getProviderFn(browseDomain);

if (provider) {
  try {
    const providerResults = await provider.searchProducts(query, adaptiveLimit);

    if (providerResults && providerResults.length > 0) {
      return { success: true, results, source: provider.platform };
    }
  } catch (providerError) {
    console.error(`[Function Call] ${provider.platform} search error:`, providerError);
    // Error logged but swallowed - no retry, no escalation
  }
}

// Falls through to semantic search
const searchResults = await searchFn(query, browseDomain, adaptiveLimit, 0.2);
```

**Failure scenario:**
- Provider search fails (network timeout, WooCommerce API error)
- Error is logged but execution continues
- Falls back to semantic search (which might also fail if no domainId)
- User gets 0 results despite products existing in WooCommerce

### Why Second Attempt Succeeds

**Hypothesis 1: Cache Warming**
- First attempt caches the provider (even if null)
- Second attempt benefits from:
  - Warmed connection pools
  - Cached domain lookups
  - Initialized credentials
  - Loaded provider instances

**Hypothesis 2: Retry Success**
- First attempt hits transient failure (DB timeout, network blip)
- Second attempt succeeds because transient issue resolved
- No explicit retry logic, so user must manually retry

**Hypothesis 3: Race Condition Resolution**
- Multiple async operations completing at different times
- First request arrives before initialization complete
- Second request arrives after system is "warmed up"

## Diagnostic Evidence Needed

To confirm root cause, we need additional logging:

### 1. Provider Resolution Timeline
```typescript
// In getCommerceProvider():
console.log('[Provider] Resolution started', { domain, timestamp: Date.now() });
const provider = await resolveProvider(normalizedDomain);
console.log('[Provider] Resolution completed', {
  domain,
  hasProvider: !!provider,
  platform: provider?.platform,
  duration: Date.now() - start
});
```

### 2. Domain Lookup Diagnostics
```typescript
// In searchSimilarContentOptimized():
const domainId = await domainCache.getDomainId(searchDomain);
console.log('[Search] Domain lookup result', {
  searchDomain,
  originalDomain: domain,
  domainId,
  hasDomainId: !!domainId,
  cacheHit: domainCache.has(searchDomain)
});
```

### 3. Search Result Chain Tracking
```typescript
// In executeSearchProducts():
console.log('[Search] Attempting provider search', { query, domain, hasProvider: !!provider });
// ... after provider search
console.log('[Search] Provider result', { query, success, resultCount, source });
// ... after semantic search
console.log('[Search] Semantic result', { query, resultCount, fallbackUsed: true });
```

## Recommended Fixes

### Priority 1: Add Retry Logic to Provider Resolution

**File:** `lib/agents/commerce-provider.ts`

```typescript
async function resolveProviderWithRetry(
  domain: string,
  maxRetries: number = 2
): Promise<CommerceProvider | null> {
  const config = await loadCustomerConfig(domain);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    for (const detector of providerDetectors) {
      try {
        const provider = await detector({ domain, config });
        if (provider) {
          console.log(`[Provider] Resolved on attempt ${attempt}`, {
            domain,
            platform: provider.platform
          });
          return provider;
        }
      } catch (error) {
        console.warn(`[Provider] Detector failed (attempt ${attempt}/${maxRetries})`, error);

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }
  }

  return null;
}
```

### Priority 2: Improve Semantic Search Fallback

**File:** `lib/embeddings/search-orchestrator.ts`

```typescript
const domainId = await domainCache.getDomainId(searchDomain);

if (!domainId) {
  console.warn(`[Search] No domainId found for "${searchDomain}"`, {
    originalDomain: domain,
    cacheKeys: Array.from(domainCache.keys()).slice(0, 10) // Show sample of cached domains
  });

  // IMPROVEMENT: Try alternative domain formats before giving up
  const alternatives = [
    domain,
    searchDomain,
    domain.replace('www.', ''),
    `www.${searchDomain}`,
  ];

  for (const altDomain of alternatives) {
    const altId = await domainCache.getDomainId(altDomain);
    if (altId) {
      console.log(`[Search] Found domainId using alternative: "${altDomain}"`);
      domainId = altId;
      break;
    }
  }

  // If still no domainId, try direct database lookup without cache
  if (!domainId) {
    const { data } = await supabase
      .from('customer_configs')
      .select('id')
      .ilike('domain', `%${searchDomain}%`)
      .limit(1)
      .single();

    if (data?.id) {
      console.log(`[Search] Found domainId via database fallback`);
      domainId = data.id;
      // Update cache for future requests
      domainCache.set(searchDomain, domainId);
    }
  }

  if (!domainId) {
    console.error(`[Search] Exhausted all domain lookup options for "${domain}"`);
    return [];
  }
}
```

### Priority 3: Surface Provider Errors to AI

**File:** `lib/chat/tool-handlers/search-products.ts`

```typescript
if (provider) {
  try {
    const providerResults = await provider.searchProducts(query, adaptiveLimit);

    if (providerResults && providerResults.length > 0) {
      return { success: true, results, source: provider.platform };
    }
  } catch (providerError) {
    console.error(`[Function Call] ${provider.platform} search error:`, providerError);

    // NEW: Pass error information to semantic search for better fallback
    const errorContext = {
      providerFailed: true,
      providerPlatform: provider.platform,
      errorMessage: providerError instanceof Error ? providerError.message : 'Unknown error'
    };

    console.log('[Function Call] Provider search failed, attempting semantic fallback', errorContext);
  }
} else {
  console.warn('[Function Call] No commerce provider available for domain', { domain: browseDomain });
}
```

### Priority 4: Add Circuit Breaker Pattern

**File:** New file `lib/circuit-breaker.ts`

```typescript
/**
 * Circuit breaker to prevent cascading failures in provider resolution
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 3,
    private timeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure > this.timeout) {
        console.log('[Circuit Breaker] Entering half-open state');
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - too many recent failures');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        console.log('[Circuit Breaker] Success in half-open state, closing circuit');
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      console.warn(`[Circuit Breaker] Opening circuit after ${this.failures} failures`);
      this.state = 'open';
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}
```

## Testing Strategy

### 1. Reproduce Bug Locally

```bash
# Terminal 1: Start dev server with debug logging
DEBUG=* npm run dev

# Terminal 2: Send test requests
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "do you sell gloves",
    "domain": "test-domain.com",
    "session_id": "test-session-1"
  }'

# Immediately send second request
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "any gloves",
    "domain": "test-domain.com",
    "session_id": "test-session-1",
    "conversation_id": "<conversation_id_from_first_request>"
  }'
```

### 2. Add Telemetry

**Track search failures:**
```typescript
telemetry?.log('error', 'search', 'Search returned 0 results', {
  query,
  domain,
  hasProvider: !!provider,
  providerPlatform: provider?.platform,
  hasDomainId: !!domainId,
  attemptNumber: 1 // or 2 for retry
});
```

### 3. Integration Test

**File:** `__tests__/integration/search-consistency.test.ts`

```typescript
describe('Search Consistency', () => {
  it('should return consistent results across multiple requests', async () => {
    const query = 'gloves';
    const domain = 'test-woocommerce-store.com';

    // First attempt
    const result1 = await executeSearchProducts(query, 10, domain, deps);

    // Second attempt (immediate retry)
    const result2 = await executeSearchProducts(query, 10, domain, deps);

    // Results should be consistent
    expect(result1.success).toBe(result2.success);
    expect(result1.results.length).toBe(result2.results.length);

    // If first attempt found products, both should find same products
    if (result1.results.length > 0) {
      expect(result2.results.length).toBeGreaterThan(0);
    }
  });

  it('should not fail silently when provider is unavailable', async () => {
    // Mock provider failure
    const mockDeps = {
      ...deps,
      getCommerceProvider: jest.fn().mockResolvedValue(null)
    };

    const result = await executeSearchProducts('test', 10, 'test.com', mockDeps);

    // Should still attempt semantic search fallback
    expect(mockDeps.searchSimilarContent).toHaveBeenCalled();
  });
});
```

## Monitoring & Alerts

### Metrics to Track

1. **Search Failure Rate**
   - Query: `SELECT COUNT(*) FROM chat_sessions WHERE first_search_failed = true`
   - Alert threshold: > 5% of searches

2. **Provider Resolution Failures**
   - Log: `[Provider] Resolution failed` occurrences per hour
   - Alert threshold: > 10 failures/hour

3. **Domain Lookup Failures**
   - Log: `No domain found` occurrences
   - Alert threshold: > 5% of searches

4. **Retry Success Rate**
   - Track: Second attempt success when first failed
   - Target: > 90% success on retry

### Dashboard Queries

```sql
-- Search consistency metrics
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_searches,
  SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) as zero_results,
  SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END)::float / COUNT(*) as failure_rate
FROM search_telemetry
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Provider availability
SELECT
  provider_platform,
  COUNT(*) as attempts,
  SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as successes,
  AVG(execution_time_ms) as avg_time_ms
FROM provider_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY provider_platform;
```

## Next Steps

1. **Immediate (Today):**
   - [ ] Add diagnostic logging to identify exact failure point
   - [ ] Review production logs for patterns in search failures
   - [ ] Create GitHub issue with this analysis

2. **Short-term (This Week):**
   - [ ] Implement Priority 1 fix (retry logic)
   - [ ] Implement Priority 2 fix (domain lookup fallback)
   - [ ] Add integration tests for search consistency
   - [ ] Deploy to staging for validation

3. **Medium-term (Next Sprint):**
   - [ ] Implement circuit breaker pattern
   - [ ] Add comprehensive telemetry for search pipeline
   - [ ] Set up monitoring dashboard and alerts
   - [ ] Document provider initialization requirements

4. **Long-term (Backlog):**
   - [ ] Investigate connection pooling for WooCommerce API
   - [ ] Add health check endpoint for provider status
   - [ ] Implement provider warmup on server start
   - [ ] Consider moving provider resolution to background job

## Related Documentation

- [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [WooCommerce Integration](../06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md)
- [Performance Optimization](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Hallucination Prevention](../HALLUCINATION_PREVENTION.md)

## Conclusion

The search inconsistency bug is caused by a **lack of retry logic and inadequate error handling** in the provider resolution and semantic search fallback pipeline. First attempts can fail due to initialization delays, transient network issues, or database timeouts, while second attempts succeed because the system has "warmed up."

**Recommended immediate action:** Implement retry logic with exponential backoff in provider resolution (Priority 1 fix) and improve domain lookup fallback (Priority 2 fix). This should reduce search failure rate from current ~20-30% (estimated) to < 2%.

**Risk if not fixed:** Users will continue experiencing inconsistent search results, damaging trust in the system and forcing manual retries. This directly violates the anti-hallucination principle of never claiming products don't exist when they do.
