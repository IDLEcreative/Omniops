# Production Deployment Checklist - Week 2 Metadata System

**Date:** 2025-10-27
**Version:** Week 2 - Variant B (62.5% pass rate)
**Status:** Ready for Production ✅

---

## Pre-Deployment Checklist

### Code Quality ✅
- [x] **Build:** Production build successful (7.0s)
- [x] **Tests:** 98/98 tests passing (100%)
- [x] **TypeScript:** Zero errors in metadata system
- [x] **ESLint:** Zero warnings in metadata system
- [x] **File Sizes:** All under 300 LOC limit

### Feature Validation ✅
- [x] **Baseline:** 50% → 62.5% (+12.5% improvement)
- [x] **Natural Language:** Pronoun resolution fixed (major UX win)
- [x] **Context Size:** Reduced 50% (1,793 → 850 chars)
- [x] **Regressions:** Zero (4 tests still passing)
- [x] **Performance:** <25ms overhead

### Git Status ✅
- [x] **Commits:** Week 1 + Week 2 committed
  - `d86556a` - Week 1: Metadata infrastructure
  - `8ae04e2` - Week 1: E2E validation
  - `81d69eb` - Week 2: Variant B implementation
  - `4e074e6` - Fix: System prompts tests
  - `81a1f61` - Fix: Feature flag enabled permanently
- [x] **Documentation:** WEEK_1_COMPLETION_SUMMARY.md, WEEK_2_COMPLETION_SUMMARY.md
- [x] **Ready to push:** All changes committed

---

## Deployment Steps

### Step 1: Push to Remote Repository

```bash
# Verify local commits
git log --oneline -5

# Push to origin/main
git push origin main

# Verify push succeeded
git status
```

**Expected:** 5 commits pushed to remote

---

### Step 2: Environment Configuration

**Production Environment Variables:**

```bash
# Required (already in production)
OPENAI_API_KEY=<your-key>
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>

# New/Updated for Week 2
USE_ENHANCED_METADATA_CONTEXT=true  # ← Enables Variant B prompts
USE_GPT5_MINI=true                  # ← Using GPT-4o mini (cost-effective)

# Optional
REDIS_URL=<redis-url>               # For job queue (optional)
```

**Verification:**
```bash
# Check environment variables are set
echo $USE_ENHANCED_METADATA_CONTEXT  # Should output: true
echo $USE_GPT5_MINI                  # Should output: true
```

---

### Step 3: Staging Deployment (Recommended)

**If you have a staging environment:**

1. **Deploy to staging:**
   ```bash
   # Your deployment command (example)
   vercel deploy --prod=false
   # OR
   git push staging main
   ```

2. **Smoke Test (5 minutes):**
   ```bash
   # Test basic conversation
   curl -X POST https://staging.yourapp.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Do you have hydraulic pumps?",
       "session_id": "test-session",
       "domain": "thompsonseparts.co.uk"
     }'
   ```

3. **Verify Response:**
   - ✅ Response contains product information
   - ✅ Natural language (not robotic)
   - ✅ Response time <3 seconds
   - ✅ No errors in logs

---

### Step 4: Production Deployment

**Gradual Rollout (Recommended):**

#### Phase 1: 10% Traffic (Day 1-2)

```bash
# Deploy to production
git push production main
# OR
vercel deploy --prod

# Configure 10% rollout
# (Method depends on your infrastructure)
# - Vercel: Environment variable groups
# - Custom: Load balancer rules
# - Feature flags: LaunchDarkly, etc.
```

**Monitor for 24-48 hours:**
- Response times
- Error rates
- User feedback
- Conversation quality

#### Phase 2: 50% Traffic (Day 3-4)

```bash
# If Phase 1 stable, scale to 50%
# Update traffic split configuration
```

**Monitor for 24 hours:**
- Same metrics as Phase 1
- Compare 10% vs 50% performance
- Check for any scale-related issues

#### Phase 3: 100% Traffic (Day 5+)

```bash
# If Phase 2 stable, scale to 100%
# Full production rollout
```

**Continue monitoring:**
- Ongoing performance tracking
- User satisfaction metrics
- Weekly competency spot checks

---

### Step 5: Instant Deployment (All-at-Once)

**If gradual rollout not possible:**

```bash
# Deploy directly to production
git push production main

# Verify deployment
curl https://yourapp.com/api/health
```

**Immediately after:**
- Monitor error logs
- Check response times
- Watch user feedback channels
- Be ready for instant rollback

---

## Monitoring & Validation

### Key Metrics to Track

**Performance:**
- [ ] API response time: Target <3s
- [ ] Metadata overhead: Expect <25ms
- [ ] Database query time: Monitor for spikes
- [ ] Memory usage: Should remain stable

**Quality:**
- [ ] Natural language responses (subjective check)
- [ ] Topic switching accuracy
- [ ] Pronoun resolution working
- [ ] No robotic "Referring to..." patterns

**Business:**
- [ ] User satisfaction (surveys/feedback)
- [ ] Conversation completion rates
- [ ] Support ticket volume
- [ ] Conversion rates (if applicable)

### Monitoring Tools

```bash
# Application logs
tail -f /var/log/app/production.log

# Database queries
# Check Supabase dashboard for slow queries

# Error tracking
# Check Sentry/Rollbar/etc for new errors

# Analytics
# Check Google Analytics/Mixpanel for user behavior
```

---

## Rollback Procedures

### Instant Rollback (If Issues Arise)

**Method 1: Environment Variable (Fastest)**

```bash
# Disable enhanced metadata context
export USE_ENHANCED_METADATA_CONTEXT=false

# Restart application
pm2 restart all
# OR
vercel redeploy
```

**Recovery Time:** <1 minute
**Effect:** Reverts to Week 1 behavior (metadata tracks but doesn't inject context)

**Method 2: Git Revert**

```bash
# Revert to pre-Week-2 commit
git revert 81a1f61  # Revert feature flag commit
git revert 4e074e6  # Revert test updates
git revert 81d69eb  # Revert Variant B

# Push reverted changes
git push origin main
git push production main
```

**Recovery Time:** 5-10 minutes
**Effect:** Complete rollback to baseline state

### When to Rollback

**Immediate Rollback Triggers:**
- ❌ Error rate >5% increase
- ❌ Response time >50% slower
- ❌ User complaints about conversation quality
- ❌ Production incident affecting users
- ❌ Database performance degradation

**Investigate First (No Immediate Rollback):**
- ⚠️ Minor performance variation (<10%)
- ⚠️ Individual edge case failures
- ⚠️ Non-critical warnings in logs

---

## Post-Deployment Validation

### Day 1: Initial Validation

**Within 2 Hours:**
- [ ] Verify deployment successful
- [ ] Check error logs (should be clean)
- [ ] Test 3-5 sample conversations manually
- [ ] Verify natural language responses
- [ ] Check performance dashboard

**Within 24 Hours:**
- [ ] Review full day of logs
- [ ] Check user feedback channels
- [ ] Compare metrics to baseline
- [ ] Document any issues

### Week 1: Ongoing Monitoring

**Daily Tasks:**
- [ ] Check error rate (morning)
- [ ] Review user feedback
- [ ] Spot check 2-3 conversations
- [ ] Monitor performance metrics

**Weekly Review:**
- [ ] Calculate average response time
- [ ] Measure conversation quality
- [ ] Collect user satisfaction data
- [ ] Plan Week 3 optimizations (if needed)

---

## Week 3 Planning (Optional)

**If real-world data shows need for further improvement:**

### Scenarios for Week 3

**Scenario 1: Everything Great (No Action Needed)**
- Metrics stable
- Users happy
- No major issues
- → Continue monitoring

**Scenario 2: Minor Improvements Needed**
- 1-2 specific issues identified
- Overall positive feedback
- → Small targeted fixes

**Scenario 3: Push for 75% Target**
- Real data shows benefit from higher accuracy
- Time available for iteration
- → Create Variant D, continue optimization

### Week 3 Triggers

**Proceed with Week 3 if:**
- ✅ Real user feedback requests improvements
- ✅ Specific edge cases identified
- ✅ Business value in reaching 75%+ target
- ✅ Team has bandwidth for iteration

**Skip Week 3 if:**
- ✅ Users satisfied with current quality
- ✅ No major issues identified
- ✅ ROI doesn't justify further optimization
- ✅ Other priorities take precedence

---

## Success Criteria

### Week 2 Deployment Considered Successful If:

**Technical:**
- ✅ Zero production incidents
- ✅ Performance within acceptable range (<3s response)
- ✅ Error rate unchanged or improved
- ✅ No rollbacks required

**User Experience:**
- ✅ Natural language responses confirmed
- ✅ No user complaints about "robotic" responses
- ✅ Conversation completion rates maintained
- ✅ Positive feedback on improvements

**Business:**
- ✅ Support ticket volume stable or decreased
- ✅ Conversation metrics improved
- ✅ No negative impact on conversion

---

## Troubleshooting Guide

### Common Issues & Solutions

**Issue 1: "Metadata not tracking"**
```bash
# Check feature flag
echo $USE_ENHANCED_METADATA_CONTEXT

# Check database
psql -c "SELECT metadata FROM conversations LIMIT 1;"

# Verify: Should see JSONB data, not empty {}
```

**Issue 2: "Still seeing robotic responses"**
```typescript
// Verify Variant B is active in system-prompts.ts
// Line 115 should say: "Week 2 Optimization: Variant B"
```

**Issue 3: "Performance degraded"**
```sql
-- Check metadata size
SELECT
  AVG(LENGTH(metadata::text)) as avg_metadata_size,
  MAX(LENGTH(metadata::text)) as max_metadata_size
FROM conversations
WHERE metadata IS NOT NULL;

-- If >2000 chars average, may need pruning
```

**Issue 4: "Feature flag not working"**
```bash
# Restart application to pick up env var
pm2 restart all

# Verify env var is set
printenv | grep USE_ENHANCED_METADATA_CONTEXT
```

---

## Contacts & Resources

**Documentation:**
- Week 1 Summary: `WEEK_1_COMPLETION_SUMMARY.md`
- Week 2 Summary: `WEEK_2_COMPLETION_SUMMARY.md`
- Tech Debt: `TECH_DEBT.md`

**Test Results:**
- Component Tests: `npm test __tests__/lib/chat/`
- Competency Tests: `/tmp/variant-b-test-results.txt`
- E2E Tests: `test-metadata-system-e2e.ts`

**Commit History:**
```bash
git log --oneline --grep="metadata\|Week"
```

---

## Sign-Off

### Pre-Deployment Review

- [ ] Technical lead approved
- [ ] QA validated staging
- [ ] Product manager notified
- [ ] Rollback plan reviewed
- [ ] Monitoring dashboard ready
- [ ] Team briefed on deployment

### Post-Deployment Confirmation

- [ ] Deployment successful
- [ ] Smoke tests passed
- [ ] Monitoring active
- [ ] No immediate issues
- [ ] Team notified of completion

**Deployment Date:** _____________
**Deployed By:** _____________
**Status:** _____________

---

## Next Steps After Successful Deployment

1. **Day 1:** Monitor closely, be ready for rollback
2. **Week 1:** Collect user feedback and metrics
3. **Week 2:** Analyze data, plan improvements
4. **Week 3+:** Iterate based on real-world usage

**Remember:** Synthetic test scores are proxies. Real user satisfaction is the true measure of success.

---

**Version:** 1.0
**Last Updated:** 2025-10-27
**Status:** ✅ Ready for Production Deployment
