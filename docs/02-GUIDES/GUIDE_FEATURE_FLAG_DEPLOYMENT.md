# Feature Flag Deployment Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Verified For:** v0.1.0
**Dependencies:**
- [Widget Session Persistence Guide](GUIDE_WIDGET_SESSION_PERSISTENCE.md)
- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Read Time:** 15 minutes

## Purpose
Complete deployment guide for the chat widget feature flag system, enabling Phase 1 features by default and establishing pilot rollout infrastructure for Phases 2 and 3.

## Quick Links
- [Phase Overview](#phase-overview)
- [Deployment Steps](#deployment-steps)
- [Pilot Rollout Strategy](#pilot-rollout-strategy)
- [Admin UI Usage](#admin-ui-usage)
- [Troubleshooting](#troubleshooting)

## Keywords
feature flags, deployment, rollout, phase 1, phase 2, phase 3, pilot testing, gradual rollout, A/B testing, configuration management

---

## Phase Overview

### Phase 1: Parent Storage (STABLE - Production Ready)

**Status:** ✅ Enabled by Default

**Features:**
- Parent window localStorage for session persistence
- Cross-domain iframe-parent messaging
- Automatic session restoration on page reload

**Production Readiness:**
- Tested across all major browsers
- 100% backward compatible
- Zero breaking changes
- Performance impact: <50ms on widget load

**Target Users:** All customers (100%)

### Phase 2: Enhanced Reliability (BETA - Opt-In)

**Status:** 🔧 Opt-In for Beta Testing

**Features:**
- Advanced storage with compression and versioning
- Connection health monitoring and auto-reconnection
- Retry logic with exponential backoff
- Offline mode support

**Rollout Strategy:**
- Tier 1: Internal testing (1-2 customers)
- Tier 2: Early adopters (10% of customers)
- Tier 3: General rollout (50% of customers)
- Tier 4: Full rollout (100% of customers)

**Target Users:** Beta testers initially, gradually expanding

### Phase 3: Advanced Features (EXPERIMENTAL - Opt-In)

**Status:** 🧪 Experimental

**Features:**
- Multi-tab synchronization via BroadcastChannel
- Performance optimization for 500+ messages
- Session analytics and tracking
- Memory management and virtual scrolling

**Rollout Strategy:**
- Limited internal testing only
- Requires Phase 2 to be enabled
- Gradual expansion based on feedback

**Target Users:** Internal testing and select early adopters

---

## Deployment Steps

### Step 1: Database Migration

Apply the feature flags migration to create required tables:

```bash
# Connect to Supabase
cd /path/to/project

# Apply migration
npx supabase db push

# Or apply directly via Supabase Dashboard
# SQL Editor → Run migration file:
# supabase/migrations/20251103000000_create_feature_flags_tables.sql
```

**Tables Created:**
- `customer_feature_flags` - Per-customer flag overrides
- `organization_feature_flags` - Organization-wide flags
- `feature_rollouts` - Rollout configuration and status
- `rollout_events` - Event tracking and analytics
- `feature_flag_changes` - Audit trail

**Verification:**
```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%feature%';

-- Should return:
-- customer_feature_flags
-- organization_feature_flags
-- feature_rollouts
-- rollout_events
-- feature_flag_changes
```

### Step 2: Environment Configuration

Update environment variables in `.env.production`:

```bash
# Feature Flag Configuration
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true

# Environment (affects default flags)
NODE_ENV=production  # Uses production defaults (Phase 1 only)

# For staging environment
NODE_ENV=staging     # Includes Phase 2 beta features
```

**Environment Defaults:**

| Environment | Phase 1 | Phase 2 | Phase 3 |
|-------------|---------|---------|---------|
| Production  | ✅ Enabled | ❌ Disabled | ❌ Disabled |
| Staging     | ✅ Enabled | ✅ Enabled | ❌ Disabled |
| Development | ✅ Enabled | ✅ Enabled | ✅ Enabled |

### Step 3: Deploy Application Code

Deploy the new code with feature flag infrastructure:

```bash
# Build application
npm run build

# Verify TypeScript compilation
npx tsc --noEmit

# Run tests
npm test

# Deploy to Vercel (or your hosting provider)
vercel --prod
```

**Files Deployed:**
- `lib/chat-widget/default-config.ts` - Configuration defaults
- `lib/feature-flags/index.ts` - Feature flag manager
- `lib/rollout/pilot-manager.ts` - Rollout management
- `components/admin/FeatureFlagManager.tsx` - Admin UI
- `app/api/admin/feature-flags/route.ts` - API endpoints
- `app/api/admin/rollout/*/route.ts` - Rollout APIs

### Step 4: Initialize Feature Rollouts

Create rollout configurations for Phase 2 and 3 features:

```typescript
// Run this script once after deployment
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const rolloutManager = getPilotRolloutManager();

// Create Phase 2 rollouts
await rolloutManager.createRollout({
  featureName: 'phase2_enhanced_storage',
  whitelistedCustomers: ['internal-test-customer-id'],
  rollbackThreshold: {
    errorRate: 0.05, // 5% error rate triggers rollback
    timeWindow: 3600000, // 1 hour
  },
});

await rolloutManager.createRollout({
  featureName: 'phase2_connection_monitoring',
  whitelistedCustomers: ['internal-test-customer-id'],
});

// Create Phase 3 rollouts
await rolloutManager.createRollout({
  featureName: 'phase3_tab_sync',
  whitelistedCustomers: ['internal-test-customer-id'],
});
```

**Verification:**
```sql
-- Check rollouts created
SELECT feature_name, current_tier, percentage, status
FROM feature_rollouts
ORDER BY feature_name;
```

### Step 5: Verify Deployment

Test that Phase 1 is active for all customers:

```bash
# Test widget embed code
curl https://your-domain.com/api/widget/config

# Should include:
# "sessionPersistence": {
#   "phase1": {
#     "parentStorage": true,
#     "crossDomainMessaging": true,
#     "autoRestore": true
#   }
# }

# Test feature flag API
curl https://your-domain.com/api/admin/feature-flags

# Should return all features with Phase 1 enabled
```

---

## Pilot Rollout Strategy

### Rollout Tiers

**Tier 0: Disabled (0%)**
- Feature is off for all customers
- Default state for new features

**Tier 1: Internal Testing (1-2 customers)**
- Limited to whitelisted customers only
- Internal team testing
- Close monitoring of errors

**Tier 2: Early Adopters (10%)**
- Expand to 10% of customer base
- Includes volunteer beta testers
- Monitor metrics closely

**Tier 3: General Rollout (50%)**
- Half of all customers
- Proven stability from early testing
- Prepare for full rollout

**Tier 4: Full Rollout (100%)**
- All customers
- Feature becomes standard
- Monitor for issues

### Advancement Criteria

Before advancing to next tier, verify:

✅ **Error Rate:** <5% (automatic rollback if exceeded)
✅ **Success Rate:** >95% for current tier
✅ **Performance:** No degradation in load times
✅ **User Feedback:** No critical issues reported
✅ **Time in Tier:** Minimum 48 hours per tier

### Example: Phase 2 Enhanced Storage Rollout

**Week 1: Tier 1 (Internal)**
```typescript
await rolloutManager.startRollout('phase2_enhanced_storage');
// Now at 1% (internal team only)

// Monitor for 48 hours
const stats = await rolloutManager.getRolloutStats('phase2_enhanced_storage');
// Check: errorRate < 0.05, successRate > 0.95
```

**Week 2: Tier 2 (Early Adopters)**
```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Now at 10% (early adopters)

// Monitor for 1 week
```

**Week 3: Tier 3 (General)**
```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Now at 50% (general rollout)

// Monitor for 1 week
```

**Week 4: Tier 4 (Full)**
```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Now at 100% (all customers)
```

---

## Admin UI Usage

### Accessing Feature Flag Manager

Navigate to: `/dashboard/admin/feature-flags`

**Requirements:**
- Admin or Owner role
- Organization access permissions

### UI Components

**Feature List:**
- Grouped by phase (1, 2, 3)
- Toggle switches for enable/disable
- Rollout percentage indicators
- Error rate and success metrics

**Rollout Controls:**
- "Advance Rollout" button (when <100%)
- "Rollback" button (emergency stop)
- Real-time statistics

**Statistics Panel:**
- Total customers enabled
- Error count and rate
- Success rate percentage
- Current rollout tier

### Common Operations

**Enable Feature for Specific Customer:**
```typescript
// Via Admin UI or API
POST /api/admin/feature-flags
{
  "featureName": "phase2_enhanced_storage",
  "enabled": true,
  "customerId": "customer-uuid",
  "changedBy": "admin-user-id",
  "reason": "Customer requested beta access"
}
```

**Advance Rollout:**
```typescript
POST /api/admin/rollout/advance
{
  "featureName": "phase2_enhanced_storage"
}
```

**Emergency Rollback:**
```typescript
POST /api/admin/rollout/rollback
{
  "featureName": "phase2_enhanced_storage",
  "reason": "High error rate detected"
}
```

---

## Testing Strategy

### Pre-Deployment Testing

**Unit Tests:**
```bash
npm test lib/feature-flags
npm test lib/rollout
```

**Integration Tests:**
```bash
npm test __tests__/integration/feature-flags
```

**E2E Tests:**
```bash
npm run test:e2e feature-flags
```

### Post-Deployment Verification

**Phase 1 Verification:**
```javascript
// Test in browser console
localStorage.setItem('chat_conversation_id', 'test-conv-id');
// Refresh page
// Verify conversation restored
```

**Phase 2 Verification (if enabled):**
```javascript
// Check enhanced storage
const storage = window.ChatWidget.storage;
console.log(storage.getCompressionRatio());
```

**Phase 3 Verification (if enabled):**
```javascript
// Open multiple tabs
// Send message in tab 1
// Verify appears in tab 2 within 50ms
```

---

## Monitoring and Analytics

### Key Metrics to Track

**Feature Adoption:**
- Number of customers with feature enabled
- Percentage rollout progress
- Time to full rollout

**Performance:**
- Widget load time (target: <500ms)
- Session restore time (target: <300ms)
- Memory usage (target: <50MB)

**Reliability:**
- Error rate per feature (target: <5%)
- Success rate per feature (target: >95%)
- Rollback frequency

**User Impact:**
- Support tickets related to features
- User feedback scores
- Feature usage statistics

### Monitoring Tools

**Supabase Dashboard:**
```sql
-- Feature rollout status
SELECT
  feature_name,
  current_tier,
  percentage,
  status,
  started_at
FROM feature_rollouts
ORDER BY started_at DESC;

-- Recent errors
SELECT
  feature_name,
  COUNT(*) as error_count,
  MAX(timestamp) as last_error
FROM rollout_events
WHERE event = 'error'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY feature_name
ORDER BY error_count DESC;

-- Feature flag changes (audit)
SELECT
  flag_path,
  old_value,
  new_value,
  changed_at,
  reason
FROM feature_flag_changes
ORDER BY changed_at DESC
LIMIT 20;
```

**Application Logs:**
```typescript
// Feature flag manager logs all changes
// Check logs for:
// - "Feature flag evaluated: [feature] -> [enabled/disabled]"
// - "Rollout advanced: [feature] -> [tier]"
// - "Feature rolled back: [feature] - [reason]"
```

---

## Rollback Procedures

### Automatic Rollback

Feature flags include automatic rollback when:
- Error rate exceeds threshold (default: 5%)
- Within time window (default: 1 hour)

**Configuration:**
```typescript
rollbackThreshold: {
  errorRate: 0.05,    // 5%
  timeWindow: 3600000 // 1 hour in ms
}
```

### Manual Rollback

**Via Admin UI:**
1. Navigate to Feature Flag Manager
2. Find the feature
3. Click "Rollback" button
4. Confirm rollback

**Via API:**
```bash
curl -X POST https://your-domain.com/api/admin/rollout/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "featureName": "phase2_enhanced_storage",
    "reason": "Critical bug discovered"
  }'
```

**Via Database (Emergency):**
```sql
-- Immediate disable for all customers
UPDATE feature_rollouts
SET
  current_tier = 'tier_0_disabled',
  percentage = 0,
  status = 'rolled_back'
WHERE feature_name = 'phase2_enhanced_storage';

-- Clear cache
-- Restart application or wait for cache TTL (5 minutes)
```

---

## Troubleshooting

### Feature Not Enabling

**Symptom:** Feature flag enabled but not working

**Checks:**
1. Verify database migration applied
2. Check feature flag cache (5 minute TTL)
3. Verify customer/organization ID correct
4. Check rollout percentage and tier
5. Review RLS policies

**Solution:**
```typescript
// Clear cache
const manager = getFeatureFlagManager();
manager.clearCache();

// Check evaluation
const flags = await manager.getFlags({ customerId: 'xxx' });
console.log('Feature flags:', flags);
```

### Rollout Stuck

**Symptom:** Cannot advance rollout

**Possible Causes:**
- Error rate too high
- Already at maximum tier
- Rollout paused

**Solution:**
```sql
-- Check rollout status
SELECT * FROM feature_rollouts
WHERE feature_name = 'phase2_enhanced_storage';

-- Check recent errors
SELECT * FROM rollout_events
WHERE feature_name = 'phase2_enhanced_storage'
  AND event = 'error'
ORDER BY timestamp DESC
LIMIT 10;

-- Force advance (use with caution)
UPDATE feature_rollouts
SET current_tier = 'tier_2_early_adopters',
    percentage = 10
WHERE feature_name = 'phase2_enhanced_storage';
```

### High Error Rate

**Symptom:** Error rate >5%, automatic rollback triggered

**Investigation:**
```sql
-- Find error details
SELECT
  customer_id,
  metadata,
  timestamp
FROM rollout_events
WHERE feature_name = 'phase2_enhanced_storage'
  AND event = 'error'
ORDER BY timestamp DESC;
```

**Actions:**
1. Review error logs
2. Identify root cause
3. Fix bug in code
4. Reset rollout to Tier 1
5. Test thoroughly before re-advancing

---

## Best Practices

### Development

✅ **Do:**
- Test features in dev environment with all phases enabled
- Use feature flags for gradual rollout
- Monitor metrics closely during rollout
- Document rollback procedures
- Keep rollout tiers small initially

❌ **Don't:**
- Deploy features without testing
- Advance rollouts too quickly
- Ignore error rate thresholds
- Skip monitoring during rollout
- Enable experimental features in production

### Operations

✅ **Do:**
- Review metrics before advancing tiers
- Keep whitelist/blacklist up to date
- Document reasons for flag changes
- Test rollback procedures regularly
- Communicate rollout status to team

❌ **Don't:**
- Advance without meeting criteria
- Ignore user feedback
- Skip rollback testing
- Enable for all customers at once
- Forget to monitor after full rollout

---

## Related Documentation

- [Widget Session Persistence Guide](GUIDE_WIDGET_SESSION_PERSISTENCE.md) - Phase 1 features
- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Table structures
- [API Documentation](../09-REFERENCE/REFERENCE_API_ENDPOINTS.md) - Feature flag APIs
- [Performance Optimization](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Phase 3 optimizations

---

## Support

For issues with feature flags:
1. Check [Troubleshooting](#troubleshooting) section
2. Review application logs
3. Check Supabase dashboard for errors
4. Open GitHub issue with details
5. Contact DevOps team for emergency rollback

---

**Last Updated:** 2025-11-03
**Next Review:** 2025-11-10 (after first rollout cycle)
