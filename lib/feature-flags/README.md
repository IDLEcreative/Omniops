# Feature Flags Library

**Type:** Service
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Feature Flag Deployment Guide](/home/user/Omniops/docs/02-GUIDES/GUIDE_FEATURE_FLAG_DEPLOYMENT.md), [Rollout Infrastructure](/home/user/Omniops/lib/rollout/README.md), [Default Config](/home/user/Omniops/lib/chat-widget/default-config.ts)
**Estimated Read Time:** 9 minutes

## Purpose

Centralized feature flag evaluation system with database overrides, environment-based defaults, and per-customer/organization customization.

## Overview

This directory contains the feature flag management system that controls which features are enabled for specific customers or organizations. Features can be toggled globally, per-organization, or per-customer, with automatic fallback to environment-based defaults.

## Files

### index.ts

**Feature Flag Manager** - Core flag evaluation and management system.

**Key Features:**
- Hierarchical flag resolution (customer → organization → environment → default)
- Database-backed overrides
- In-memory caching (5 minute TTL)
- Audit trail for all changes
- Graceful fallback on errors

**Usage:**
```typescript
import { getFeatureFlagManager, getCustomerFlags } from '@/lib/feature-flags';

// Get feature flags for a customer
const flags = await getCustomerFlags('customer-id');

console.log('Phase 1 enabled:', flags.sessionPersistence.phase1.parentStorage);
console.log('Phase 2 enabled:', flags.sessionPersistence.phase2.enhancedStorage);

// Get flags with evaluation metadata
const manager = getFeatureFlagManager();
const evaluation = await manager.getFlags({ customerId: 'customer-id' });

console.log('Flags:', evaluation.config);
console.log('Source:', evaluation.source); // 'customer_override', 'organization_override', 'environment', 'default'
console.log('Evaluated at:', evaluation.evaluatedAt);

// Update customer flags
await manager.setCustomerFlags(
  'customer-id',
  {
    sessionPersistence: {
      phase2: {
        enhancedStorage: true,
        connectionMonitoring: true,
      }
    }
  },
  'admin-user-id',
  'Customer requested beta access'
);

// Update organization flags
await manager.setOrganizationFlags(
  'org-id',
  {
    sessionPersistence: {
      phase2: {
        enhancedStorage: true
      }
    }
  },
  'admin-user-id',
  'Organization-wide Phase 2 rollout'
);

// Clear cache
manager.clearCache();

// Get cache statistics
const stats = manager.getCacheStats();
console.log('Cached entries:', stats.size);
console.log('Cache keys:', stats.keys);
```

## Flag Resolution Priority

Flags are evaluated in this order (highest to lowest priority):

1. **Customer-specific override** (database: `customer_feature_flags`)
2. **Organization-wide override** (database: `organization_feature_flags`)
3. **Environment-based defaults** (code: `ENVIRONMENT_OVERRIDES`)
4. **System defaults** (code: `DEFAULT_CHAT_WIDGET_CONFIG`)

**Example:**
```typescript
// Customer: customer-123
// Organization: org-456

// 1. Check customer_feature_flags table
//    → Found: { phase2: { enhancedStorage: true } }
//    → Use this (highest priority)

// 2. If not found, check organization_feature_flags table
//    → Found: { phase2: { enhancedStorage: false } }
//    → Would use this (second priority)

// 3. If not found, check environment
//    → NODE_ENV=production
//    → Use production defaults (third priority)

// 4. If no environment match, use system defaults
//    → DEFAULT_CHAT_WIDGET_CONFIG (lowest priority)
```

## Database Schema

**customer_feature_flags table:**
```sql
CREATE TABLE customer_feature_flags (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  flags JSONB,                     -- Partial feature flag overrides
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ
);
```

**organization_feature_flags table:**
```sql
CREATE TABLE organization_feature_flags (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  flags JSONB,                     -- Partial feature flag overrides
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  created_at TIMESTAMPTZ
);
```

**feature_flag_changes table (audit trail):**
```sql
CREATE TABLE feature_flag_changes (
  id UUID PRIMARY KEY,
  customer_id UUID,
  organization_id UUID,
  flag_path TEXT,                  -- e.g., "sessionPersistence.phase2.enhancedStorage"
  old_value BOOLEAN,
  new_value BOOLEAN,
  changed_by UUID,
  changed_at TIMESTAMPTZ,
  reason TEXT
);
```

## Caching Strategy

**Cache Key Format:** `{customerId}:{organizationId}`

**Cache TTL:** 5 minutes (300 seconds)

**Cache Benefits:**
- Reduces database queries by 95%
- <1ms flag evaluation for cached entries
- Automatic expiration after 5 minutes

**Cache Management:**
```typescript
const manager = getFeatureFlagManager();

// Get cache stats
const stats = manager.getCacheStats();
console.log('Size:', stats.size);
console.log('Keys:', stats.keys);

// Invalidate specific customer
manager.invalidateCache('customer-id');

// Invalidate all customers in organization
manager.invalidateCacheForOrganization('org-id');

// Clear entire cache
manager.clearCache();
```

## Audit Trail

All flag changes are logged to `feature_flag_changes` table:

```typescript
// Enable Phase 2 for customer
await manager.setCustomerFlags(
  'customer-123',
  {
    sessionPersistence: {
      phase2: { enhancedStorage: true }
    }
  },
  'admin-user-id',
  'Customer requested beta access'
);

// Creates audit entry:
{
  customer_id: 'customer-123',
  flag_path: 'sessionPersistence.phase2.enhancedStorage',
  old_value: false,
  new_value: true,
  changed_by: 'admin-user-id',
  changed_at: '2025-11-03T10:00:00Z',
  reason: 'Customer requested beta access'
}
```

**Query Audit Trail:**
```sql
-- Recent changes
SELECT *
FROM feature_flag_changes
ORDER BY changed_at DESC
LIMIT 20;

-- Changes for specific customer
SELECT *
FROM feature_flag_changes
WHERE customer_id = 'customer-123'
ORDER BY changed_at DESC;

-- Changes to specific flag
SELECT *
FROM feature_flag_changes
WHERE flag_path = 'sessionPersistence.phase2.enhancedStorage'
ORDER BY changed_at DESC;
```

## Environment Configuration

Flags automatically adjust based on `NODE_ENV`:

**Production:**
```typescript
{
  sessionPersistence: {
    phase1: { parentStorage: true },      // ✅ Stable
    phase2: { enhancedStorage: false },   // ❌ Disabled
    phase3: { tabSync: false },           // ❌ Disabled
  }
}
```

**Staging:**
```typescript
{
  sessionPersistence: {
    phase1: { parentStorage: true },      // ✅ Enabled
    phase2: { enhancedStorage: true },    // ✅ Enabled for testing
    phase3: { tabSync: false },           // ❌ Not ready yet
  }
}
```

**Development:**
```typescript
{
  sessionPersistence: {
    phase1: { parentStorage: true },      // ✅ Enabled
    phase2: { enhancedStorage: true },    // ✅ Enabled
    phase3: { tabSync: true },            // ✅ Enabled (all phases)
  }
}
```

## Integration with Rollout System

Feature flags work alongside rollout manager:

```typescript
import { getFeatureFlagManager } from '@/lib/feature-flags';
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const flagManager = getFeatureFlagManager();
const rolloutManager = getPilotRolloutManager();

// Check if customer is in rollout
const shouldEnable = await rolloutManager.shouldEnableFeature(
  'phase2_enhanced_storage',
  customerId
);

if (shouldEnable) {
  // Enable feature flag for customer
  await flagManager.setCustomerFlags(
    customerId,
    {
      sessionPersistence: {
        phase2: { enhancedStorage: true }
      }
    },
    'system',
    'Automatic rollout'
  );

  // Record rollout event
  await rolloutManager.recordEvent({
    featureName: 'phase2_enhanced_storage',
    customerId,
    event: 'enabled',
    timestamp: new Date(),
  });
}
```

## API Endpoints

**Get Feature Flags:**
```http
GET /api/admin/feature-flags?customerId={id}
GET /api/admin/feature-flags?organizationId={id}

Response:
{
  "success": true,
  "features": [...],
  "evaluation": {
    "source": "customer_override",
    "evaluatedAt": "2025-11-03T10:00:00Z"
  }
}
```

**Update Feature Flags:**
```http
POST /api/admin/feature-flags
Content-Type: application/json

{
  "featureName": "phase2_enhanced_storage",
  "enabled": true,
  "customerId": "customer-123",
  "changedBy": "admin-user-id",
  "reason": "Customer requested beta access"
}
```

## Type Definitions

```typescript
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';

interface FlagEvaluation {
  config: ChatWidgetFeatureFlags;
  source: 'customer_override' | 'organization_override' | 'environment' | 'default';
  customerId?: string;
  organizationId?: string;
  evaluatedAt: Date;
}

interface FlagChangeEvent {
  customerId?: string;
  organizationId?: string;
  flagPath: string;
  oldValue: boolean;
  newValue: boolean;
  changedBy?: string;
  changedAt: Date;
  reason?: string;
}
```

## Testing

**Unit Tests:** `__tests__/lib/feature-flags/index.test.ts`

```typescript
describe('FeatureFlagManager', () => {
  it('should prioritize customer flags over organization flags', async () => {
    const manager = getFeatureFlagManager();

    // Set org flags
    await manager.setOrganizationFlags('org-1', {
      sessionPersistence: { phase2: { enhancedStorage: false } }
    });

    // Set customer flags (should override org)
    await manager.setCustomerFlags('customer-1', {
      sessionPersistence: { phase2: { enhancedStorage: true } }
    });

    const evaluation = await manager.getFlags({
      customerId: 'customer-1',
      organizationId: 'org-1',
    });

    expect(evaluation.config.sessionPersistence.phase2.enhancedStorage).toBe(true);
    expect(evaluation.source).toBe('customer_override');
  });

  it('should cache flag evaluations', async () => {
    const manager = getFeatureFlagManager();

    const start = Date.now();
    await manager.getFlags({ customerId: 'customer-1' });
    const firstCallTime = Date.now() - start;

    const start2 = Date.now();
    await manager.getFlags({ customerId: 'customer-1' });
    const cachedCallTime = Date.now() - start2;

    expect(cachedCallTime).toBeLessThan(firstCallTime * 0.1); // 10x faster
  });

  it('should log all flag changes', async () => {
    const manager = getFeatureFlagManager();

    await manager.setCustomerFlags('customer-1', {
      sessionPersistence: { phase2: { enhancedStorage: true } }
    }, 'admin-1', 'Test change');

    // Verify change logged
    const changes = await supabase
      .from('feature_flag_changes')
      .select('*')
      .eq('customer_id', 'customer-1')
      .order('changed_at', { ascending: false })
      .limit(1);

    expect(changes.data[0].flag_path).toBe('sessionPersistence.phase2.enhancedStorage');
    expect(changes.data[0].new_value).toBe(true);
    expect(changes.data[0].reason).toBe('Test change');
  });
});
```

## Performance

**Benchmarks:**
- First evaluation: ~50-100ms (database query)
- Cached evaluation: <1ms (in-memory)
- Cache hit rate: >95% in production
- Memory usage: ~1KB per cached entry

**Optimization:**
- Database indexes on customer_id, organization_id
- 5-minute cache TTL balances freshness and performance
- Partial flag merging (only override specific fields)
- Async audit logging (non-blocking)

## Troubleshooting

### Flags Not Updating

**Problem:** Changes not reflected immediately

**Cause:** Cache not invalidated

**Solution:**
```typescript
const manager = getFeatureFlagManager();
manager.invalidateCache('customer-id');
// Or wait 5 minutes for automatic expiration
```

### Wrong Source Priority

**Problem:** Organization flags used instead of customer flags

**Check:**
```typescript
const evaluation = await manager.getFlags({
  customerId: 'customer-123',
  organizationId: 'org-456',
});

console.log('Source:', evaluation.source);
// Should be 'customer_override' if customer flags exist
```

**Solution:** Verify customer_feature_flags table has entry for customer

### Audit Trail Missing

**Problem:** Changes not logged

**Check:**
```sql
SELECT * FROM feature_flag_changes
WHERE customer_id = 'customer-123'
ORDER BY changed_at DESC;
```

**Cause:** Async logging may fail silently

**Solution:** Check application logs for errors

## Best Practices

✅ **Do:**
- Use customer flags for individual opt-ins
- Use organization flags for company-wide rollouts
- Include reason when changing flags
- Monitor cache hit rate
- Review audit trail regularly

❌ **Don't:**
- Change flags without reason
- Disable caching (performance impact)
- Ignore evaluation source
- Skip cache invalidation after updates
- Store non-boolean values in flags

## Related Documentation

- [Feature Flag Deployment Guide](../../docs/02-GUIDES/GUIDE_FEATURE_FLAG_DEPLOYMENT.md) - Complete deployment process
- [Rollout Infrastructure](../rollout/README.md) - Gradual rollout system
- [Default Config](../chat-widget/default-config.ts) - Flag definitions

---

**Last Updated:** 2025-11-03
