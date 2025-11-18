**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Rollout Infrastructure

**Purpose:** Gradual feature rollout system with percentage-based targeting, A/B testing capabilities, and automatic rollback on errors.

**Last Updated:** 2025-11-03
**Status:** Active
**Related:** [Feature Flag Deployment Guide](../../docs/02-GUIDES/GUIDE_FEATURE_FLAG_DEPLOYMENT.md)

## Overview

This directory contains the pilot rollout management system that enables safe, gradual deployment of new features to customers. Features can be rolled out to increasing percentages of users across five tiers, with automatic rollback if error thresholds are exceeded.

## Files

### pilot-manager.ts

**Pilot Rollout Manager** - Core rollout orchestration system.

**Key Features:**
- Five-tier rollout system (0% → 1% → 10% → 50% → 100%)
- Deterministic customer hashing for consistent targeting
- Whitelist/blacklist support
- Automatic rollback on high error rates
- Real-time statistics and monitoring
- Event tracking for analytics

**Usage:**
```typescript
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const rolloutManager = getPilotRolloutManager();

// Create new rollout
await rolloutManager.createRollout({
  featureName: 'phase2_enhanced_storage',
  whitelistedCustomers: ['internal-customer-id'],
  rollbackThreshold: {
    errorRate: 0.05,      // 5% error rate triggers rollback
    timeWindow: 3600000,  // 1 hour
  },
});

// Start rollout (Tier 1: 1%)
await rolloutManager.startRollout('phase2_enhanced_storage');

// Check if feature should be enabled for customer
const shouldEnable = await rolloutManager.shouldEnableFeature(
  'phase2_enhanced_storage',
  customerId
);

// Get rollout statistics
const stats = await rolloutManager.getRolloutStats('phase2_enhanced_storage');
console.log('Enabled customers:', stats.enabledCustomers);
console.log('Error rate:', stats.errorRate);
console.log('Success rate:', stats.successRate);

// Advance to next tier if metrics look good
if (stats.errorRate < 0.05 && stats.successRate > 0.95) {
  await rolloutManager.advanceRollout('phase2_enhanced_storage');
  // Now at Tier 2: 10%
}

// Record events
await rolloutManager.recordEvent({
  featureName: 'phase2_enhanced_storage',
  customerId: 'customer-123',
  event: 'enabled',
  timestamp: new Date(),
  metadata: { version: '1.0.0' },
});

// Emergency rollback
await rolloutManager.rollbackFeature(
  'phase2_enhanced_storage',
  'Critical bug discovered'
);
```

## Rollout Tiers

| Tier | Name | Percentage | Use Case |
|------|------|------------|----------|
| **0** | Disabled | 0% | Feature off for all customers |
| **1** | Internal | 1-2 customers | Internal testing only |
| **2** | Early Adopters | 10% | Beta testers and volunteers |
| **3** | General | 50% | Proven stability, wider testing |
| **4** | Full | 100% | Production-ready, all customers |

## Automatic Rollback

Features automatically rollback when:
- Error rate exceeds threshold (default: 5%)
- Within configured time window (default: 1 hour)
- Automatically disables for all customers
- Logs rollback event with reason

**Configuration:**
```typescript
rollbackThreshold: {
  errorRate: 0.05,    // 5% of enabled customers report errors
  timeWindow: 3600000 // Check errors in last hour
}
```

## Deterministic Hashing

Customer targeting uses deterministic hashing to ensure:
- Same customer always gets same result
- No randomness between page loads
- Consistent experience per customer
- Predictable rollout percentages

**Algorithm:**
```typescript
// Hash customer ID + feature name
hash = hashFunction(customerId + featureName)

// Convert to 0-100 range
percentage = abs(hash % 100)

// Enable if below rollout percentage
enabled = percentage < rolloutPercentage
```

## Database Schema

**feature_rollouts table:**
```sql
CREATE TABLE feature_rollouts (
  id UUID PRIMARY KEY,
  feature_name TEXT UNIQUE,
  current_tier TEXT,               -- tier_0_disabled through tier_4_full
  target_tier TEXT,
  percentage INTEGER,              -- 0-100
  status TEXT,                     -- planned, in_progress, paused, completed, rolled_back
  whitelisted_customers TEXT[],   -- Always included
  blacklisted_customers TEXT[],   -- Always excluded
  rollback_threshold JSONB,        -- {errorRate, timeWindow}
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**rollout_events table:**
```sql
CREATE TABLE rollout_events (
  id UUID PRIMARY KEY,
  feature_name TEXT,
  customer_id UUID,
  event TEXT,                      -- enabled, disabled, error, rollback
  timestamp TIMESTAMPTZ,
  metadata JSONB
);
```

## Statistics and Monitoring

**Get Real-Time Stats:**
```typescript
const stats = await rolloutManager.getRolloutStats('feature_name');

// Returns:
{
  featureName: 'phase2_enhanced_storage',
  totalCustomers: 1000,
  enabledCustomers: 100,           // 10% rollout
  errorCount: 3,
  errorRate: 0.03,                 // 3% error rate
  successRate: 0.97,               // 97% success rate
}
```

**Query Events:**
```sql
-- Recent errors
SELECT *
FROM rollout_events
WHERE feature_name = 'phase2_enhanced_storage'
  AND event = 'error'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Rollout progress
SELECT
  feature_name,
  current_tier,
  percentage,
  COUNT(DISTINCT customer_id) as enabled_count
FROM rollout_events
WHERE event = 'enabled'
GROUP BY feature_name, current_tier, percentage;
```

## Integration with Feature Flags

Rollout system works alongside feature flag manager:

```typescript
import { getFeatureFlagManager } from '@/lib/feature-flags';
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const flagManager = getFeatureFlagManager();
const rolloutManager = getPilotRolloutManager();

// Check if customer should get feature
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
    }
  );
}
```

## Example: Complete Rollout Flow

**Week 1: Internal Testing (Tier 1)**
```typescript
// Create and start rollout
await rolloutManager.createRollout({
  featureName: 'phase2_enhanced_storage',
  whitelistedCustomers: ['internal-customer-1', 'internal-customer-2'],
});

await rolloutManager.startRollout('phase2_enhanced_storage');
// Status: 1% (internal team only)

// Monitor for 48 hours
const stats = await rolloutManager.getRolloutStats('phase2_enhanced_storage');
// Check: errorRate < 0.05, successRate > 0.95
```

**Week 2: Early Adopters (Tier 2)**
```typescript
// Advance to 10%
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Status: 10% (early adopters)

// Monitor for 1 week
```

**Week 3: General Rollout (Tier 3)**
```typescript
// Advance to 50%
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Status: 50% (half of customers)

// Monitor for 1 week
```

**Week 4: Full Rollout (Tier 4)**
```typescript
// Advance to 100%
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Status: 100% (all customers)

// Feature is now standard
```

**Emergency Rollback:**
```typescript
// If error rate spikes
await rolloutManager.rollbackFeature(
  'phase2_enhanced_storage',
  'Error rate exceeded threshold: 7.2%'
);
// Status: 0% (disabled for all)
```

## API Endpoints

**Advance Rollout:**
```http
POST /api/admin/rollout/advance
Content-Type: application/json

{
  "featureName": "phase2_enhanced_storage"
}
```

**Rollback Feature:**
```http
POST /api/admin/rollout/rollback
Content-Type: application/json

{
  "featureName": "phase2_enhanced_storage",
  "reason": "High error rate detected"
}
```

## Testing

**Unit Tests:** `__tests__/lib/rollout/pilot-manager.test.ts`

```typescript
describe('PilotRolloutManager', () => {
  it('should use deterministic hashing', async () => {
    const manager = getPilotRolloutManager();

    // Same customer always gets same result
    const result1 = await manager.shouldEnableFeature('feature', 'customer-123');
    const result2 = await manager.shouldEnableFeature('feature', 'customer-123');

    expect(result1).toBe(result2);
  });

  it('should respect whitelist', async () => {
    const manager = getPilotRolloutManager();

    await manager.createRollout({
      featureName: 'test_feature',
      whitelistedCustomers: ['customer-123'],
    });

    // Even at 0% rollout, whitelisted customer gets feature
    const shouldEnable = await manager.shouldEnableFeature('test_feature', 'customer-123');
    expect(shouldEnable).toBe(true);
  });

  it('should auto-rollback on high error rate', async () => {
    // Test automatic rollback when error threshold exceeded
  });
});
```

## Troubleshooting

### Rollout Not Advancing

**Problem:** Cannot advance to next tier

**Checks:**
1. Current error rate
2. Current success rate
3. Time in current tier
4. Rollout status (not paused)

**Solution:**
```sql
-- Check status
SELECT * FROM feature_rollouts WHERE feature_name = 'phase2_enhanced_storage';

-- Check recent errors
SELECT COUNT(*) FROM rollout_events
WHERE feature_name = 'phase2_enhanced_storage'
  AND event = 'error'
  AND timestamp > NOW() - INTERVAL '1 hour';
```

### Customer Not Getting Feature

**Problem:** Feature enabled but customer not seeing it

**Checks:**
1. Customer in blacklist?
2. Rollout percentage too low?
3. Hash falling outside percentage?

**Solution:**
```typescript
// Check if customer should get feature
const shouldEnable = await rolloutManager.shouldEnableFeature(
  'phase2_enhanced_storage',
  customerId
);
console.log('Should enable:', shouldEnable);

// Add to whitelist if needed
await supabase
  .from('feature_rollouts')
  .update({
    whitelisted_customers: [...existingWhitelist, customerId]
  })
  .eq('feature_name', 'phase2_enhanced_storage');
```

## Best Practices

✅ **Do:**
- Start with small percentages (1%)
- Monitor metrics closely during rollout
- Wait 48+ hours between tier advances
- Use whitelist for internal testing
- Test rollback procedures regularly

❌ **Don't:**
- Advance too quickly (<24 hours)
- Ignore error rate thresholds
- Skip tier levels
- Roll out to 100% immediately
- Forget to monitor after full rollout

## Performance

**Optimization:**
- Deterministic hashing: O(1) lookup
- Database indexes on feature_name, customer_id
- Rollout config cached (5 minute TTL)
- Event recording async (non-blocking)

**Scalability:**
- Supports 100,000+ customers
- Event table partitioning recommended at scale
- Archive old events periodically

## Related Documentation

- [Feature Flag Deployment Guide](../../docs/02-GUIDES/GUIDE_FEATURE_FLAG_DEPLOYMENT.md) - Complete deployment process
- [Feature Flags Library](../feature-flags/README.md) - Feature flag management
- [Database Schema](../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Table structures

---

**Last Updated:** 2025-11-03
