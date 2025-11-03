# Feature Flag Deployment Checklist

**Date:** 2025-11-03
**Status:** Ready for Deployment
**Deployment Type:** Production Configuration and Rollout Infrastructure

---

## Pre-Deployment Checklist

### 1. Code Review

- [x] **Default Configuration** (`lib/chat-widget/default-config.ts`)
  - Phase 1 enabled by default
  - Phase 2 disabled (opt-in)
  - Phase 3 disabled (opt-in)
  - Environment overrides configured
  - Validation functions implemented

- [x] **Feature Flag Manager** (`lib/feature-flags/index.ts`)
  - Hierarchical flag resolution
  - Database integration
  - Caching with 5-minute TTL
  - Audit trail logging
  - Error handling with fallbacks

- [x] **Pilot Rollout Manager** (`lib/rollout/pilot-manager.ts`)
  - Five-tier rollout system
  - Deterministic customer hashing
  - Automatic rollback on errors
  - Event tracking
  - Statistics calculation

- [x] **Admin UI Component** (`components/admin/FeatureFlagManager.tsx`)
  - Feature list by phase
  - Toggle switches
  - Rollout controls
  - Statistics display
  - Error handling

- [x] **API Routes**
  - `app/api/admin/feature-flags/route.ts` (GET/POST)
  - `app/api/admin/rollout/advance/route.ts`
  - `app/api/admin/rollout/rollback/route.ts`

- [x] **Database Migration** (`supabase/migrations/20251103000000_create_feature_flags_tables.sql`)
  - 5 tables created
  - Indexes configured
  - RLS policies applied
  - Comments added

### 2. Documentation

- [x] **Deployment Guide** (`docs/02-GUIDES/GUIDE_FEATURE_FLAG_DEPLOYMENT.md`)
  - Phase overview
  - Deployment steps
  - Pilot rollout strategy
  - Admin UI usage
  - Troubleshooting

- [x] **README Files**
  - `lib/rollout/README.md`
  - `lib/feature-flags/README.md`
  - `lib/chat-widget/README.md` (updated)

### 3. Testing Requirements

- [ ] **Unit Tests**
  - Feature flag manager tests
  - Rollout manager tests
  - Configuration validation tests
  - API route tests

- [ ] **Integration Tests**
  - Database integration
  - Cache behavior
  - Audit trail
  - Rollback functionality

- [ ] **E2E Tests**
  - Admin UI workflow
  - Feature flag toggle
  - Rollout advancement
  - Error scenarios

---

## Deployment Steps

### Step 1: Database Migration

**Command:**
```bash
cd /Users/jamesguy/Omniops
npx supabase db push
```

**Or via Dashboard:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: `supabase/migrations/20251103000000_create_feature_flags_tables.sql`

**Verification:**
```sql
-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%feature%'
ORDER BY table_name;

-- Expected results:
-- customer_feature_flags
-- feature_flag_changes
-- feature_rollouts
-- organization_feature_flags
-- rollout_events
```

**Status:** [ ] COMPLETE

### Step 2: Environment Variables

**Update `.env.production`:**
```bash
# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS_ENABLED=true
NODE_ENV=production
```

**Verify:**
```bash
echo $NODE_ENV
# Should output: production
```

**Status:** [ ] COMPLETE

### Step 3: Build and Deploy

**Build:**
```bash
npm run build
```

**Type Check:**
```bash
npx tsc --noEmit
```

**Tests:**
```bash
npm test
```

**Deploy:**
```bash
vercel --prod
# Or your deployment command
```

**Status:** [ ] COMPLETE

### Step 4: Initialize Rollout Configurations

**Create rollout configs for Phase 2 features:**

```typescript
// Run in production console or via script
import { getPilotRolloutManager } from '@/lib/rollout/pilot-manager';

const rolloutManager = getPilotRolloutManager();

// Phase 2 features
await rolloutManager.createRollout({
  featureName: 'phase2_enhanced_storage',
  whitelistedCustomers: ['YOUR_INTERNAL_CUSTOMER_ID'],
  rollbackThreshold: {
    errorRate: 0.05,
    timeWindow: 3600000,
  },
});

await rolloutManager.createRollout({
  featureName: 'phase2_connection_monitoring',
  whitelistedCustomers: ['YOUR_INTERNAL_CUSTOMER_ID'],
});

await rolloutManager.createRollout({
  featureName: 'phase2_retry_logic',
  whitelistedCustomers: ['YOUR_INTERNAL_CUSTOMER_ID'],
});

// Phase 3 features
await rolloutManager.createRollout({
  featureName: 'phase3_tab_sync',
  whitelistedCustomers: ['YOUR_INTERNAL_CUSTOMER_ID'],
});

await rolloutManager.createRollout({
  featureName: 'phase3_performance_mode',
  whitelistedCustomers: ['YOUR_INTERNAL_CUSTOMER_ID'],
});

await rolloutManager.createRollout({
  featureName: 'phase3_analytics',
  whitelistedCustomers: ['YOUR_INTERNAL_CUSTOMER_ID'],
});
```

**Verification:**
```sql
SELECT feature_name, current_tier, percentage, status
FROM feature_rollouts
ORDER BY feature_name;

-- Expected: 6 rows (phase2_*, phase3_*)
-- All with current_tier = 'tier_0_disabled'
-- All with percentage = 0
-- All with status = 'planned'
```

**Status:** [ ] COMPLETE

### Step 5: Verify Phase 1 Enabled

**Test widget config endpoint:**
```bash
curl https://YOUR_DOMAIN/api/widget/config

# Should include:
# "sessionPersistence": {
#   "phase1": {
#     "parentStorage": true,
#     "crossDomainMessaging": true,
#     "autoRestore": true
#   }
# }
```

**Test admin UI:**
1. Navigate to `/dashboard/admin/feature-flags`
2. Verify Phase 1 section shows features enabled
3. Verify Phase 2/3 sections show features disabled

**Status:** [ ] COMPLETE

---

## Post-Deployment Verification

### Functionality Tests

- [ ] **Phase 1 Features (Should Work)**
  - Open chat widget on test site
  - Send message
  - Refresh page
  - Verify conversation restored
  - Check localStorage for `chat_conversation_id`

- [ ] **Phase 2 Features (Should Not Work)**
  - Verify enhanced storage not active
  - Verify connection monitoring not active
  - Admin UI shows Phase 2 disabled

- [ ] **Phase 3 Features (Should Not Work)**
  - Verify tab sync not active
  - Verify performance mode not active
  - Admin UI shows Phase 3 disabled

### Database Tests

- [ ] **Feature Flag Tables**
  ```sql
  -- Check RLS policies
  SELECT tablename, policyname
  FROM pg_policies
  WHERE tablename LIKE '%feature%'
  ORDER BY tablename, policyname;
  ```

- [ ] **Indexes**
  ```sql
  -- Check indexes created
  SELECT tablename, indexname
  FROM pg_indexes
  WHERE tablename LIKE '%feature%'
  ORDER BY tablename, indexname;
  ```

### Performance Tests

- [ ] **Widget Load Time**
  - Target: <500ms
  - With Phase 1: Should be ~50ms overhead
  - Test on 5 different pages

- [ ] **Feature Flag Evaluation**
  - First call: ~50-100ms (database)
  - Cached call: <1ms
  - Test with 10 customers

- [ ] **Admin UI Load**
  - Target: <2 seconds
  - Test with 100 features
  - Verify statistics load

---

## Rollout Plan

### Week 1: Internal Testing (Tier 1)

**Phase 2 - Enhanced Storage:**
```typescript
await rolloutManager.startRollout('phase2_enhanced_storage');
// Status: 1% (internal team only)
```

**Monitoring:**
- [ ] Check error rate daily
- [ ] Verify enhanced storage working
- [ ] Test compression ratios
- [ ] Monitor performance impact

**Success Criteria:**
- Error rate <5%
- Success rate >95%
- No critical bugs
- Team approval

**Status:** [ ] STARTED [ ] COMPLETED

### Week 2: Early Adopters (Tier 2)

**Advance if Week 1 successful:**
```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
// Status: 10% (early adopters)
```

**Monitoring:**
- [ ] Daily error rate checks
- [ ] Customer feedback
- [ ] Performance metrics
- [ ] Support ticket volume

**Success Criteria:**
- Error rate <5%
- Success rate >95%
- Positive feedback
- No major issues

**Status:** [ ] STARTED [ ] COMPLETED

### Week 3-4: General and Full Rollout

**Tier 3 (50%):**
```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
```

**Tier 4 (100%):**
```typescript
await rolloutManager.advanceRollout('phase2_enhanced_storage');
```

**Status:** [ ] TIER 3 COMPLETE [ ] TIER 4 COMPLETE

---

## Emergency Procedures

### Rollback Plan

**If critical issue discovered:**

1. **Via Admin UI:**
   - Navigate to Feature Flag Manager
   - Find affected feature
   - Click "Rollback" button
   - Confirm action

2. **Via API:**
   ```bash
   curl -X POST https://YOUR_DOMAIN/api/admin/rollout/rollback \
     -H "Content-Type: application/json" \
     -d '{
       "featureName": "phase2_enhanced_storage",
       "reason": "Critical bug: [describe issue]"
     }'
   ```

3. **Via Database (Emergency):**
   ```sql
   -- Immediate disable
   UPDATE feature_rollouts
   SET
     current_tier = 'tier_0_disabled',
     percentage = 0,
     status = 'rolled_back'
   WHERE feature_name = 'phase2_enhanced_storage';

   -- Clear cache
   -- Restart application or wait 5 minutes
   ```

### Monitoring Alerts

**Set up alerts for:**
- Error rate >5%
- Success rate <95%
- Widget load time >1 second
- Database query time >100ms
- Cache miss rate >20%

---

## Success Metrics

### Technical Metrics

- [ ] **Phase 1 Adoption:** 100% (all customers)
- [ ] **Widget Load Time:** <500ms (95th percentile)
- [ ] **Session Restore Time:** <300ms (95th percentile)
- [ ] **Error Rate:** <1%
- [ ] **Cache Hit Rate:** >95%

### Business Metrics

- [ ] **Customer Satisfaction:** >90%
- [ ] **Support Tickets:** No increase
- [ ] **Feature Usage:** >80% restore sessions
- [ ] **Conversation Continuity:** >95%

---

## Files Modified/Created

### New Files (17)

**Library Files (6):**
- `lib/chat-widget/default-config.ts`
- `lib/feature-flags/index.ts`
- `lib/rollout/pilot-manager.ts`
- `lib/feature-flags/README.md`
- `lib/rollout/README.md`
- `lib/chat-widget/README.md` (updated)

**API Routes (3):**
- `app/api/admin/feature-flags/route.ts`
- `app/api/admin/rollout/advance/route.ts`
- `app/api/admin/rollout/rollback/route.ts`

**Components (1):**
- `components/admin/FeatureFlagManager.tsx`

**Database (1):**
- `supabase/migrations/20251103000000_create_feature_flags_tables.sql`

**Documentation (6):**
- `docs/02-GUIDES/GUIDE_FEATURE_FLAG_DEPLOYMENT.md`
- `docs/ARCHIVE/completion-reports-2025-11/FEATURE_FLAG_DEPLOYMENT_CHECKLIST.md`
- Plus 4 README updates

---

## Deployment Timeline

**Preparation:** 1 day
- Review checklist
- Run tests
- Prepare monitoring

**Initial Deployment:** 2 hours
- Database migration (15 minutes)
- Code deployment (30 minutes)
- Verification (1 hour)
- Initialize rollouts (15 minutes)

**Rollout Timeline:** 4 weeks
- Week 1: Internal testing (Tier 1)
- Week 2: Early adopters (Tier 2)
- Week 3: General rollout (Tier 3)
- Week 4: Full rollout (Tier 4)

**Total:** ~5 weeks from start to 100% rollout

---

## Sign-Off

### Pre-Deployment

- [ ] **Developer:** Code reviewed and tested
- [ ] **Tech Lead:** Architecture approved
- [ ] **DevOps:** Deployment plan reviewed
- [ ] **QA:** Test plan approved

### Post-Deployment

- [ ] **Developer:** Deployment completed successfully
- [ ] **Tech Lead:** Verification tests passed
- [ ] **DevOps:** Monitoring configured
- [ ] **Product:** Ready for rollout

---

## Notes

**Critical Success Factors:**
1. Phase 1 must be 100% stable (production-ready)
2. Rollout must be gradual (minimum 48 hours per tier)
3. Monitoring must be active during rollout
4. Rollback must be tested before rollout
5. Team must be trained on admin UI

**Risk Mitigation:**
- Automatic rollback on high error rate
- Manual rollback available via UI/API/Database
- Cache invalidation for immediate updates
- Audit trail for all changes
- Comprehensive monitoring and alerting

**Communication Plan:**
- Announce Phase 1 deployment to all customers
- Email beta testers about Phase 2 opt-in
- Weekly rollout status updates to team
- Post-mortem after full rollout

---

**Last Updated:** 2025-11-03
**Next Review:** After Tier 1 completion (Week 1)
