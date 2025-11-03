# Pilot Rollout Strategy - Quick Reference

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Verified For:** v0.1.0
**Dependencies:**
- [Feature Flag Deployment Guide](GUIDE_FEATURE_FLAG_DEPLOYMENT.md)
- [Widget Session Persistence Guide](GUIDE_WIDGET_SESSION_PERSISTENCE.md)
**Estimated Read Time:** 5 minutes

## Purpose
Quick reference guide for executing pilot rollouts of new features using the tiered rollout system.

---

## Rollout Tiers Summary

| Tier | Name | % | Customers | Duration | Purpose |
|------|------|---|-----------|----------|---------|
| **0** | Disabled | 0% | 0 | Indefinite | Feature off |
| **1** | Internal | 1% | 1-2 | 48+ hours | Team testing |
| **2** | Early Adopters | 10% | ~100 | 1 week | Beta testing |
| **3** | General | 50% | ~500 | 1 week | Stability validation |
| **4** | Full | 100% | All | Ongoing | Production |

---

## Quick Start: New Feature Rollout

### Step 1: Create Rollout (5 minutes)

```typescript
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const rolloutManager = getPilotRolloutManager();

await rolloutManager.createRollout({
  featureName: 'phase2_enhanced_storage',
  whitelistedCustomers: ['your-internal-customer-id'],
  rollbackThreshold: {
    errorRate: 0.05,      // 5%
    timeWindow: 3600000,  // 1 hour
  },
});
```

### Step 2: Start Internal Testing (Tier 1)

```typescript
await rolloutManager.startRollout('phase2_enhanced_storage');
// Status: 1% (internal team only)
```

**Monitor for 48 hours minimum:**
- Error rate <5%
- Success rate >95%
- No critical bugs
- Team approval

### Step 3: Advance to Early Adopters (Tier 2)

```typescript
const stats = await rolloutManager.getRolloutStats('phase2_enhanced_storage');
console.log('Error rate:', stats.errorRate);
console.log('Success rate:', stats.successRate);

if (stats.errorRate < 0.05 && stats.successRate > 0.95) {
  await rolloutManager.advanceRollout('phase2_enhanced_storage');
  // Status: 10% (early adopters)
}
```

**Monitor for 1 week:**
- Daily error rate checks
- Customer feedback
- Support ticket volume

### Step 4: Advance to General (Tier 3)

```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Status: 50% (half of customers)
```

**Monitor for 1 week:**
- Sustained error rate <5%
- Performance metrics stable
- No major issues

### Step 5: Full Rollout (Tier 4)

```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Status: 100% (all customers)
```

**Ongoing monitoring:**
- Continue tracking metrics
- Watch for edge cases
- Collect usage data

---

## Emergency Rollback

**Via API (Fastest):**
```typescript
await rolloutManager.rollbackFeature(
  'phase2_enhanced_storage',
  'Critical bug: [describe issue]'
);
// Status: 0% (disabled immediately)
```

**Via Admin UI:**
1. Navigate to Feature Flag Manager
2. Find the feature
3. Click "Rollback" button
4. Confirm action

**Via Database (Nuclear Option):**
```sql
UPDATE feature_rollouts
SET
  current_tier = 'tier_0_disabled',
  percentage = 0,
  status = 'rolled_back'
WHERE feature_name = 'phase2_enhanced_storage';
```

---

## Advancement Criteria Checklist

Before advancing to next tier, verify:

- [ ] **Error Rate:** <5%
- [ ] **Success Rate:** >95%
- [ ] **Time in Tier:** Minimum duration met
- [ ] **No Critical Bugs:** All P0/P1 issues resolved
- [ ] **Performance:** No degradation
- [ ] **Team Approval:** Product/Engineering sign-off
- [ ] **Customer Feedback:** No major concerns

---

## Monitoring Commands

**Get Current Status:**
```typescript
const config = await rolloutManager.getRolloutConfig('phase2_enhanced_storage');
console.log('Current tier:', config.currentTier);
console.log('Percentage:', config.percentage);
console.log('Status:', config.status);
```

**Get Statistics:**
```typescript
const stats = await rolloutManager.getRolloutStats('phase2_enhanced_storage');
console.log('Enabled customers:', stats.enabledCustomers);
console.log('Error count:', stats.errorCount);
console.log('Error rate:', (stats.errorRate * 100).toFixed(2) + '%');
console.log('Success rate:', (stats.successRate * 100).toFixed(2) + '%');
```

**Check Recent Errors:**
```sql
SELECT *
FROM rollout_events
WHERE feature_name = 'phase2_enhanced_storage'
  AND event = 'error'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

---

## Typical Timeline

**Complete Rollout (0% → 100%):**
- Week 0: Planning and setup
- Week 1: Tier 1 (Internal - 1%)
- Week 2: Tier 2 (Early Adopters - 10%)
- Week 3: Tier 3 (General - 50%)
- Week 4: Tier 4 (Full - 100%)

**Total: 5 weeks**

**Fast-Track Rollout (for low-risk features):**
- Week 1: Tier 1 + Tier 2 (10%)
- Week 2: Tier 3 (50%)
- Week 3: Tier 4 (100%)

**Total: 3 weeks**

---

## Decision Matrix

| Scenario | Action | Timeline |
|----------|--------|----------|
| Error rate 0-2% | ✅ Advance immediately | Next day |
| Error rate 2-5% | ⚠️ Investigate, then advance | Extra 2-3 days |
| Error rate 5-10% | 🛑 Pause, investigate, fix | Resume when fixed |
| Error rate >10% | ❌ Rollback immediately | Fix in dev, restart |
| Success rate >98% | ✅ Fast-track possible | Reduce tier duration |
| Success rate 95-98% | ✅ Continue normally | Standard duration |
| Success rate <95% | 🛑 Pause, investigate | Extend tier duration |

---

## Phase-Specific Rollout Plans

### Phase 2: Enhanced Reliability

**Features:**
- `phase2_enhanced_storage`
- `phase2_connection_monitoring`
- `phase2_retry_logic`

**Rollout Order:**
1. Enhanced storage (core feature)
2. Connection monitoring (supporting feature)
3. Retry logic (supporting feature)

**Timeline:** 4 weeks per feature (sequential)

**Dependencies:**
- Phase 1 must be enabled
- Each feature independent

### Phase 3: Advanced Features

**Features:**
- `phase3_tab_sync`
- `phase3_performance_mode`
- `phase3_analytics`

**Rollout Order:**
1. Performance mode (foundation)
2. Tab sync (depends on performance mode)
3. Analytics (monitoring)

**Timeline:** 4 weeks per feature (sequential)

**Dependencies:**
- Phase 1 and Phase 2 must be enabled
- Performance mode required for tab sync

---

## Common Scenarios

### Scenario 1: Feature Works Great

**Tier 1 (Day 2):**
- Error rate: 0%
- Success rate: 100%
- Team loves it

**Action:** Advance to Tier 2 immediately

### Scenario 2: Minor Issues Found

**Tier 1 (Day 3):**
- Error rate: 3%
- Success rate: 97%
- Non-critical bugs found

**Action:**
1. Fix bugs in dev
2. Deploy fix
3. Monitor for 48 hours
4. Advance if improved

### Scenario 3: Major Issues

**Tier 2 (Day 5):**
- Error rate: 8%
- Success rate: 92%
- Multiple support tickets

**Action:**
1. Pause rollout
2. Investigate root cause
3. Roll back if needed
4. Fix and restart from Tier 1

### Scenario 4: Automatic Rollback Triggered

**System Action:**
- Error rate exceeded 5%
- Automatic rollback to 0%
- All customers disabled

**Your Action:**
1. Check error logs
2. Identify root cause
3. Fix issue
4. Test thoroughly
5. Restart from Tier 1

---

## Integration with Feature Flags

**After advancing rollout, enable flags:**

```typescript
import { getFeatureFlagManager } from '@/lib/feature-flags';
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const flagManager = getFeatureFlagManager();
const rolloutManager = getPilotRolloutManager();

// For each customer in the rollout
const shouldEnable = await rolloutManager.shouldEnableFeature(
  'phase2_enhanced_storage',
  customerId
);

if (shouldEnable) {
  await flagManager.setCustomerFlags(
    customerId,
    {
      sessionPersistence: {
        phase2: { enhancedStorage: true }
      }
    },
    'system',
    'Automatic rollout advancement'
  );
}
```

---

## Best Practices

### ✅ Do:
- Monitor metrics daily during rollout
- Communicate rollout status to team
- Document any issues encountered
- Collect customer feedback proactively
- Test rollback before starting rollout
- Keep whitelist updated with internal customers
- Review error logs regularly

### ❌ Don't:
- Skip tiers (always go in order)
- Advance without meeting criteria
- Ignore error rate warnings
- Roll out multiple features simultaneously
- Forget to monitor after full rollout
- Change rollout config mid-rollout
- Disable automatic rollback

---

## Support Resources

**Documentation:**
- [Complete Deployment Guide](GUIDE_FEATURE_FLAG_DEPLOYMENT.md)
- [Rollout Infrastructure](../../lib/rollout/README.md)
- [Feature Flags System](../../lib/feature-flags/README.md)

**Monitoring:**
- Supabase Dashboard → feature_rollouts table
- Admin UI → Feature Flag Manager
- Application logs → rollout events

**Team:**
- Engineering: Technical issues
- Product: Feature decisions
- Support: Customer feedback
- DevOps: Infrastructure and monitoring

---

## Quick Reference: SQL Queries

**Check Rollout Status:**
```sql
SELECT
  feature_name,
  current_tier,
  percentage,
  status,
  started_at
FROM feature_rollouts
ORDER BY started_at DESC;
```

**Error Rate (Last Hour):**
```sql
SELECT
  feature_name,
  COUNT(*) FILTER (WHERE event = 'error') as errors,
  COUNT(*) FILTER (WHERE event = 'enabled') as enabled,
  ROUND(
    COUNT(*) FILTER (WHERE event = 'error')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event = 'enabled'), 0) * 100,
    2
  ) as error_rate_percent
FROM rollout_events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY feature_name;
```

**Top Errors:**
```sql
SELECT
  feature_name,
  customer_id,
  metadata,
  timestamp
FROM rollout_events
WHERE event = 'error'
ORDER BY timestamp DESC
LIMIT 10;
```

---

**Last Updated:** 2025-11-03
**Next Review:** After first complete rollout cycle
