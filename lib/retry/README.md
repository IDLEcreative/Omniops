**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Retry System

**Purpose:** Adaptive retry strategies with error classification, exponential backoff, and jitter to handle transient failures gracefully.

**Last Updated:** 2025-11-05

## Overview

This module provides intelligent retry logic that adapts based on error types:

- **Error Classification** - Categorizes errors (transient, auth, rate limit, etc.)
- **Adaptive Backoff** - Different strategies per error type (exponential, linear, no retry)
- **Jitter** - Prevents thundering herd with randomized delays
- **Configuration** - Per-category retry policies with circuit breaker support

## Files

- `error-classifier.ts` - Classifies errors into categories (TRANSIENT, AUTH_FAILURE, RATE_LIMIT, etc.)
- `adaptive-backoff.ts` - Calculates retry delays based on error category and attempt number
- `config.ts` - Retry policies per error category (max retries, base delays, jitter)

## Usage

### Basic Error Classification

```typescript
import { classifyError } from '@/lib/retry/error-classifier';

try {
  await fetchData();
} catch (error) {
  const category = classifyError(error);
  // Returns: 'TRANSIENT' | 'AUTH_FAILURE' | 'RATE_LIMIT' | etc.
}
```

### Adaptive Backoff Calculation

```typescript
import { calculateBackoff } from '@/lib/retry/adaptive-backoff';

const errorCategory = classifyError(error);
const delay = calculateBackoff(errorCategory, attemptNumber);

if (delay === null) {
  // Don't retry (AUTH_FAILURE, NOT_FOUND)
  throw error;
}

await new Promise(resolve => setTimeout(resolve, delay));
// Retry with adaptive delay
```

### Complete Retry Loop

```typescript
import { classifyError } from '@/lib/retry/error-classifier';
import { calculateBackoff } from '@/lib/retry/adaptive-backoff';
import { getRetryPolicyForCategory } from '@/lib/retry/config';

async function retryableOperation() {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await riskyOperation();
    } catch (error) {
      const errorCategory = classifyError(error);
      const policy = getRetryPolicyForCategory(errorCategory);

      console.log('[Retry]', {
        errorCategory,
        attempt,
        maxRetries: policy.maxRetries
      });

      const delay = calculateBackoff(errorCategory, attempt);

      if (delay === null || attempt >= policy.maxRetries) {
        throw error; // Don't retry or exhausted retries
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Error Categories

| Category | Description | Retry Strategy | Example Delays |
|----------|-------------|----------------|----------------|
| `TRANSIENT` | Network blips, timeouts | Exponential backoff | 100ms → 200ms → 400ms |
| `RATE_LIMIT` | API rate limits (429) | Long exponential backoff | 1s → 2s → 4s |
| `SERVER_ERROR` | 500, 502, 503 errors | Linear backoff | 500ms → 1000ms → 1500ms |
| `AUTH_FAILURE` | 401, 403, invalid credentials | No retry | N/A |
| `NOT_FOUND` | 404, resource doesn't exist | No retry | N/A |
| `UNKNOWN` | Unclassified errors | Default exponential | 100ms → 200ms → 400ms |

## Retry Policies

Each error category has a configurable policy:

```typescript
{
  maxRetries: 3,              // Max retry attempts
  baseDelay: 100,             // Base delay in ms
  jitterPercent: 20,          // ±20% jitter
  maxDelay: 2000,             // Max delay cap in ms
  circuitBreakerThreshold: 10 // Failures before circuit opens
}
```

## Jitter

All delays include ±20% jitter by default to prevent thundering herd:

```typescript
// Base delay: 100ms
// Actual delay: 80ms - 120ms (randomized)
const delay = applyJitter(100, 20);
```

## Integration with Commerce Provider

The retry system is integrated into provider resolution:

```typescript
// lib/agents/commerce-provider.ts
try {
  const provider = await detector({ domain, config });
  return provider;
} catch (error) {
  const errorCategory = classifyError(error);

  if (!isRetryableError(errorCategory)) {
    throw error; // Don't retry AUTH_FAILURE or NOT_FOUND
  }

  const delay = calculateBackoff(errorCategory, attempt);
  await new Promise(resolve => setTimeout(resolve, delay!));
}
```

## Testing

Tests verify:

- Error classification accuracy
- Backoff calculations per strategy
- Jitter application
- Policy enforcement
- Integration with provider resolution

Run tests:

```bash
npm test -- retry
```

## Performance Impact

**Before Adaptive Retry:**
- Fixed 100ms, 200ms delays for all errors
- Wasted time retrying non-retryable errors
- No protection against thundering herd

**After Adaptive Retry:**
- Faster for transient errors (quick retry)
- Longer backoff for rate limits (respect API limits)
- No retry for auth/not-found (save time)
- Jitter prevents synchronized retries across clients

**Estimated Improvements:**
- 30-50% faster resolution for transient errors
- 70-90% reduction in wasted retries (auth/not-found)
- 20-40% reduction in rate limit violations

## Future Enhancements

- Circuit breaker pattern implementation
- Per-domain retry tracking
- Adaptive max retries based on success rate
- Retry budget enforcement
- Metrics and observability

## Related Documentation

- [Commerce Provider](../agents/README.md) - Provider resolution system
- [Architecture: Error Handling](../../docs/01-ARCHITECTURE/ARCHITECTURE_ERROR_HANDLING.md) - Error handling patterns
