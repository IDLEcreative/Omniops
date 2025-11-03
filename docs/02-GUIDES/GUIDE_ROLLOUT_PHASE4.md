# Phase 4 Rollout Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Target Version:** v0.2.0
**Dependencies:**
- [Phase 4 Planning](../11-PLANNING/PHASE4_PLANNING.md) - Feature specifications
- [Deployment Guide](./GUIDE_DEPLOYMENT_PHASE4.md) - Technical deployment steps
**Estimated Read Time:** 20 minutes

## Purpose
Step-by-step rollout procedures for Phase 4 AI-powered features including pre-rollout checklist, phased deployment strategy, monitoring procedures, rollback procedures, troubleshooting guide, customer communication templates, and success criteria to ensure smooth production launch.

## Table of Contents

1. [Pre-Rollout Checklist](#pre-rollout-checklist)
2. [Phased Rollout Strategy](#phased-rollout-strategy)
3. [Monitoring & Observability](#monitoring--observability)
4. [Rollback Procedures](#rollback-procedures)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Customer Communication](#customer-communication)
7. [Success Criteria](#success-criteria)

---

## Pre-Rollout Checklist

### 1. Technical Readiness

**Database** (2 hours before rollout):
- [ ] Run database migration on staging environment
- [ ] Verify all 7 new tables created successfully
- [ ] Check foreign key constraints and indexes
- [ ] Validate RLS policies applied correctly
- [ ] Run data integrity checks
- [ ] Backup production database
- [ ] Run migration on production with zero downtime strategy

**Infrastructure** (4 hours before rollout):
- [ ] Redis queue capacity increased by 50%
- [ ] OpenAI API rate limits confirmed ($10k/month)
- [ ] Monitoring dashboards configured for new metrics
- [ ] Log aggregation set up for ML API calls
- [ ] Circuit breakers tested and configured
- [ ] Load balancer health checks updated

**Application Code**:
- [ ] All Phase 4 feature flags set to OFF initially
- [ ] Gradual rollout configuration verified
- [ ] API versioning confirmed (v2 endpoints)
- [ ] Backward compatibility tested with existing clients
- [ ] Error handling for ML API failures validated
- [ ] Caching strategy implemented and tested

**Testing**:
- [ ] Unit tests: 100% coverage on new features
- [ ] Integration tests: All Phase 4 APIs passing
- [ ] E2E tests: Critical paths validated
- [ ] Load tests: 5,000 requests/minute sustained
- [ ] Chaos engineering: ML API failure scenarios tested
- [ ] Security audit: Sentiment data privacy validated

### 2. Documentation Readiness

- [ ] API documentation published (v2 endpoints)
- [ ] Customer onboarding guide finalized
- [ ] Internal runbook for support team
- [ ] Escalation playbook created
- [ ] FAQ document prepared
- [ ] Video demos recorded (sentiment, suggestions, insights)

### 3. Team Readiness

**Engineering**:
- [ ] On-call rotation assigned for rollout week
- [ ] Rollback procedures reviewed and practiced
- [ ] Monitoring dashboards reviewed by entire team
- [ ] War room scheduled for rollout day
- [ ] Communication channels established (Slack #phase4-rollout)

**Customer Success**:
- [ ] Beta customer feedback reviewed
- [ ] Customer communication templates approved
- [ ] Training completed on Phase 4 features
- [ ] Support ticket templates created
- [ ] Escalation paths defined

**Product & Marketing**:
- [ ] Launch announcement drafted
- [ ] Feature release notes finalized
- [ ] Blog post scheduled
- [ ] Demo videos ready for social media
- [ ] Customer case studies prepared

### 4. Business Readiness

- [ ] Pricing tier updates confirmed (Pro tier at $199/month)
- [ ] Billing system tested with new tiers
- [ ] Legal review completed (privacy policy updates)
- [ ] Contracts updated with new terms
- [ ] Support SLA adjusted for Pro tier

---

## Phased Rollout Strategy

### Phase 4.1: Internal Testing (Day 1)

**Goal**: Validate in production with internal traffic only

**Actions**:
1. Deploy Phase 4 code to production (feature flags OFF)
2. Enable features for 3 internal test domains
3. Run full test suite on production environment
4. Monitor for 4 hours

**Success Criteria**:
- Zero errors in application logs
- ML API latency < 1 second (p95)
- Queue processing lag < 5 seconds
- No database connection issues

**Go/No-Go Decision**: If any critical error, roll back immediately

---

### Phase 4.2: Beta Customers (Days 2-7)

**Goal**: Validate with 3 pilot customers

**Customers**:
1. Thompson's Engineering (high volume, e-commerce)
2. TechSupport Co (service business)
3. FoodDelivery Inc (restaurant vertical)

**Rollout Schedule**:
- Day 2 (Monday): Thompson's Engineering only
- Day 3 (Tuesday): Add TechSupport Co
- Day 4 (Wednesday): Add FoodDelivery Inc
- Days 5-7 (Thu-Sat): Monitoring & feedback collection

**Monitoring Focus**:
- Sentiment accuracy (manual review of 100 messages/customer)
- Escalation precision (false positive rate < 10%)
- Response suggestion adoption rate
- Customer satisfaction (NPS survey on Day 7)

**Daily Check-ins**:
- 9 AM: Review overnight metrics
- 12 PM: Beta customer sync call
- 5 PM: Team retrospective

**Success Criteria**:
- NPS from beta customers > 50
- Zero P0 bugs reported
- < 5 P1 bugs (must be fixed before next phase)
- Feature activation rate > 60%

**Go/No-Go Decision**: Product Manager approval required to proceed

---

### Phase 4.3: 10% Rollout (Days 8-14)

**Goal**: Expand to 10% of total customers

**Selection Strategy**:
- Random sample of active customers (excluding high-volume)
- Stratified by vertical (e-commerce, services, other)
- Exclude customers with custom contracts (manual rollout later)

**Gradual Rollout**:
- Day 8: 5% (50 customers)
- Day 10: 7% (70 customers)
- Day 12: 10% (100 customers)

**Monitoring**:
- Automated alerts for:
  - Error rate > 0.5%
  - ML API latency > 2 seconds (p95)
  - Queue lag > 30 seconds
  - Escalation false positive rate > 15%
- Manual checks:
  - Sentiment accuracy review (50 random samples/day)
  - Customer support tickets related to Phase 4
  - Cost monitoring (OpenAI API spend)

**Communication**:
- Email announcement to 10% cohort on Day 8
- In-app notification for new features
- Weekly digest email with tips and insights

**Success Criteria**:
- Error rate < 0.1%
- Customer complaints < 5
- Support ticket volume unchanged or decreased
- Upgrade rate to Pro tier > 5%

---

### Phase 4.4: 50% Rollout (Days 15-21)

**Goal**: Expand to 50% of customers

**Gradual Rollout**:
- Day 15: 25% (250 customers)
- Day 18: 40% (400 customers)
- Day 21: 50% (500 customers)

**Load Testing**:
- Simulate 5,000 concurrent conversations
- Validate auto-scaling triggers
- Confirm circuit breakers activate correctly
- Test ML API quota limits

**Monitoring Focus**:
- Infrastructure costs (should be linear with usage)
- Database query performance (new indexes holding up?)
- Redis queue throughput
- OpenAI API rate limiting

**Success Criteria**:
- System stable under 5x current load
- Cost per conversation < $0.05
- No customer-facing outages
- Upgrade rate to Pro tier > 10%

---

### Phase 4.5: 100% Rollout (Days 22-30)

**Goal**: General availability for all customers

**Gradual Rollout**:
- Day 22: 70% (700 customers)
- Day 25: 85% (850 customers)
- Day 28: 95% (950 customers)
- Day 30: 100% (1,000 customers)

**Final Validation**:
- Full system load test at 100% capacity
- Financial audit of ML API costs vs projections
- Customer feedback survey (NPS, feature satisfaction)
- Marketing launch announcement

**Celebration**:
- Team retrospective
- Case study publication
- Customer success stories
- Internal launch party

---

## Monitoring & Observability

### Key Metrics Dashboard

**Real-Time Metrics** (refresh every 10 seconds):
```
┌─────────────────────────────────────────────────────────┐
│ Phase 4 Health Dashboard                                │
├─────────────────────────────────────────────────────────┤
│ Request Rate:          847 req/min  ✅ < 1000           │
│ Error Rate:            0.03%        ✅ < 0.5%            │
│ ML API Latency (p95):  1.2s         ✅ < 2s              │
│ Queue Lag:             8s           ✅ < 30s             │
│ Escalation Precision:  92%          ✅ > 90%             │
│ Sentiment Accuracy:    87%          ✅ > 85%             │
└─────────────────────────────────────────────────────────┘
```

### Automated Alerts

**Critical (Page immediately)**:
- Error rate > 1% sustained for 5 minutes
- ML API unavailable (5xx errors)
- Database connection pool exhausted
- Queue backlog > 1,000 messages

**Warning (Slack notification)**:
- Error rate > 0.5% sustained for 10 minutes
- ML API latency > 3 seconds (p95)
- Queue lag > 60 seconds
- Cost spike > 200% of daily average

**Info (Email digest)**:
- Feature activation rate below 50%
- Customer complaints about Phase 4
- Unusual usage patterns

### Log Monitoring

**Key Log Patterns to Watch**:
```bash
# Sentiment analysis failures
grep "Sentiment analysis failed" logs/phase4/*.log | wc -l

# ML API timeouts
grep "OpenAI API timeout" logs/phase4/*.log | wc -l

# Escalation false positives
grep "Escalation reversed" logs/phase4/*.log | wc -l

# Response suggestion errors
grep "Suggestion generation failed" logs/phase4/*.log | wc -l
```

### Cost Monitoring

**Daily Cost Report** (automated at 9 AM):
```
Date: 2025-11-15
Total ML API Costs: $487
Breakdown:
  - Sentiment Analysis:    $123 (4,300 calls)
  - Response Suggestions:  $198 (3,200 calls)
  - Categorization:        $87 (2,900 calls)
  - Predictions:           $79 (850 calls)

Budget Status: 81% of daily budget ($600)
Projected Monthly: $14,610 (vs $20,000 budget) ✅
```

---

## Rollback Procedures

### Scenario 1: Feature-Level Rollback (Low Risk)

**When to Use**:
- Single feature causing issues (e.g., sentiment analysis inaccurate)
- Non-critical bug affecting user experience

**Steps**:
1. Disable feature flag via admin dashboard
   ```typescript
   await updateFeatureFlag('sentiment_analysis', false);
   ```
2. Verify feature disabled within 60 seconds (check metrics)
3. Notify customers via in-app banner: "Feature temporarily unavailable"
4. Investigate root cause in staging
5. Fix and re-enable when ready

**Time to Execute**: 2 minutes

---

### Scenario 2: Version Rollback (Medium Risk)

**When to Use**:
- Multiple features broken
- Database query performance issues
- ML API integration failures

**Steps**:
1. Revert to previous version via deployment script:
   ```bash
   ./scripts/rollback-version.sh v0.1.9
   ```
2. Verify health checks pass on all instances
3. Monitor for 15 minutes to confirm stability
4. Notify customers of temporary service interruption
5. Post-mortem scheduled for next day

**Time to Execute**: 10 minutes

---

### Scenario 3: Database Rollback (High Risk)

**When to Use**:
- Data corruption detected
- Migration caused critical issues
- Performance degradation due to new schema

**Steps**:
1. **STOP ALL WRITES** to affected tables (read-only mode)
2. Restore database from backup (taken 2 hours before migration)
   ```bash
   pg_restore -d production -j 8 backup_pre_phase4.dump
   ```
3. Revert application code to pre-Phase 4 version
4. Verify data integrity with test queries
5. Re-enable writes
6. Post-incident report required

**Time to Execute**: 30-60 minutes

**⚠️ WARNING**: Only execute with CTO approval

---

### Rollback Decision Matrix

| Symptom | Severity | Action | Time |
|---------|----------|--------|------|
| Single feature not working | Low | Feature flag OFF | 2 min |
| Error rate 0.5-1% | Medium | Investigate, consider version rollback | 10 min |
| Error rate > 1% | High | Immediate version rollback | 5 min |
| ML API unavailable | Medium | Enable fallback mode | 2 min |
| Database queries slow | High | Disable Phase 4, investigate | 10 min |
| Data corruption | Critical | Database rollback | 60 min |

---

## Troubleshooting Guide

### Issue 1: High Sentiment Analysis Error Rate

**Symptoms**:
- `sentiment_analysis` table not populating
- Logs show "OpenAI API error 429" (rate limiting)

**Root Cause**: OpenAI API rate limit exceeded

**Solution**:
1. Check current rate limit status:
   ```bash
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/usage
   ```
2. If rate limited:
   - Enable queueing for sentiment analysis (delay non-critical)
   - Request rate limit increase from OpenAI support
   - Temporarily reduce sentiment analysis frequency
3. Monitor recovery

**Prevention**:
- Implement request throttling
- Set up rate limit monitoring
- Have backup API key ready

---

### Issue 2: Response Suggestions Not Appearing

**Symptoms**:
- Agents report missing suggestions in UI
- `/api/conversations/:id/suggest-responses` returns 500

**Root Cause**: Context too large for GPT-4o-mini (8k token limit)

**Solution**:
1. Check conversation length:
   ```sql
   SELECT conversation_id, COUNT(*) as message_count
   FROM messages
   WHERE conversation_id = 'xxx'
   GROUP BY conversation_id;
   ```
2. If > 50 messages:
   - Implement conversation summarization
   - Truncate history to last 20 messages
   - Provide warning to agent: "Conversation too long for suggestions"

**Prevention**:
- Add token counting before API call
- Implement sliding window summarization
- Upgrade to GPT-4 for long conversations

---

### Issue 3: Escalations Not Triggering

**Symptoms**:
- Frustrated customers not being escalated
- `escalation_events` table empty

**Root Cause**: Escalation rules not evaluated on every message

**Solution**:
1. Check queue processing:
   ```bash
   redis-cli -h production-redis LLEN escalation_queue
   ```
2. If queue backlogged:
   - Increase worker count
   - Reduce message retention in queue
3. If rules not matching:
   - Review sentiment thresholds (may be too strict)
   - Test with sample frustrated messages

**Prevention**:
- Add escalation evaluation to message processing pipeline
- Set up alerts for queue backlog
- Regular review of escalation rule effectiveness

---

### Issue 4: Insights Not Updating

**Symptoms**:
- `/api/insights` returns stale data
- Last extraction timestamp is > 1 hour old

**Root Cause**: Batch processing cron job failed

**Solution**:
1. Check cron job status:
   ```bash
   kubectl get cronjobs -n production
   ```
2. If failed:
   - Check logs for error messages
   - Manually trigger job:
     ```bash
     kubectl create job --from=cronjob/insights-extraction \
       insights-extraction-manual
     ```
3. Monitor job completion

**Prevention**:
- Add cron job monitoring
- Set up retry logic for failed jobs
- Implement health check endpoint for batch jobs

---

## Customer Communication

### Template 1: Pre-Launch Announcement (7 days before)

**Subject**: 🚀 Coming Soon: AI-Powered Features to Transform Your Customer Support

**Body**:
```
Hi [Customer Name],

We're excited to announce that on [Launch Date], we're rolling out
Phase 4 of Omniops - a suite of AI-powered features designed to make
your customer support faster, smarter, and more proactive.

What's New:
✨ Sentiment Analysis - Understand customer emotions in real-time
🤖 AI Response Suggestions - Get smart reply recommendations for your agents
📊 Smart Categorization - Automatically tag and organize conversations
🔮 Predictive Analytics - Identify at-risk customers before they churn
⚡ Auto-Escalation - Route urgent issues to the right agents automatically
💡 Conversation Insights - Discover patterns and actionable trends

Your Upgrade Path:
- Phase 4 features will be available on our new Pro tier ($199/month)
- Current customers get 30 days free to try all features
- No action required - features will activate automatically on [Launch Date]

Stay Tuned:
We'll send a detailed guide and video demo on launch day. Get ready
to experience the future of customer support!

Questions? Reply to this email or contact success@omniops.co.uk

Best,
The Omniops Team
```

---

### Template 2: Launch Day Announcement

**Subject**: 🎉 Phase 4 is Live! Your AI-Powered Support Tools Are Ready

**Body**:
```
Hi [Customer Name],

It's here! Phase 4 features are now live in your Omniops dashboard.

🚀 Get Started in 3 Steps:

1. Log in to your dashboard: [Dashboard URL]
2. Enable Sentiment Analysis: Settings → Phase 4 Features → Toggle ON
3. Configure Escalation Rules: Settings → Escalation → Add Rule

📹 Watch Our 3-Minute Demo:
[Video Link] - See Phase 4 features in action

📚 Read the Full Guide:
[Guide Link] - Learn best practices and tips

💰 Pricing Reminder:
- 30-day free trial starts today (no credit card changes)
- After trial: Upgrade to Pro tier ($199/month) or features auto-disable
- Cancel anytime during trial with no charges

🎁 Limited-Time Bonus:
Upgrade to Pro within 7 days and get 20% off for 3 months!

Need Help?
- Live chat support: Available 9 AM - 5 PM GMT
- Email: success@omniops.co.uk
- Documentation: docs.omniops.co.uk/phase4

We can't wait to see how Phase 4 transforms your customer support!

Best,
The Omniops Team

P.S. Have feedback? We'd love to hear it: [Feedback Form Link]
```

---

### Template 3: Issue Notification

**Subject**: [Action Required] Temporary Service Interruption - Phase 4 Features

**Body**:
```
Hi [Customer Name],

We detected an issue with Phase 4 sentiment analysis features at
[Time] GMT. Here's what you need to know:

🚨 Impact:
- Sentiment analysis temporarily unavailable
- Response suggestions may be slower
- All other features working normally

✅ What We're Doing:
- Issue identified: OpenAI API rate limiting
- Fix in progress: Implementing request queueing
- Expected resolution: Within 2 hours

📊 Your Data:
- All conversation data is safe and secure
- No data loss occurred
- Historical sentiment data remains accessible

💬 What You Should Do:
- Continue using Omniops normally
- Escalation rules still active (rule-based, not sentiment-based)
- We'll notify you when fully restored

Status Updates:
Follow along: [Status Page URL]

We apologize for any inconvenience and appreciate your patience.

Best,
The Omniops Engineering Team
```

---

### Template 4: Issue Resolved

**Subject**: ✅ Resolved: Phase 4 Features Fully Restored

**Body**:
```
Hi [Customer Name],

Good news! The issue with Phase 4 sentiment analysis features has
been fully resolved as of [Time] GMT.

✅ What Was Fixed:
- OpenAI API rate limit increased
- Request queueing implemented
- All sentiment analysis now processing normally

📊 Impact Summary:
- Duration: 1 hour 23 minutes
- Conversations affected: 47
- Sentiment data backfilled automatically

🛠️ What We Did:
- Coordinated with OpenAI for immediate rate limit increase
- Deployed request throttling to prevent future issues
- Added monitoring alerts for rate limit warnings

🎁 Apology Offer:
As a thank you for your patience, we're extending your Phase 4 trial
by an additional 7 days (no action needed on your end).

Questions or Concerns?
We're here to help: success@omniops.co.uk

Best,
The Omniops Team
```

---

## Success Criteria

### Go-Live Criteria (Must achieve ALL before 100% rollout)

**Technical**:
- [ ] Error rate < 0.1% sustained for 48 hours
- [ ] ML API latency < 1.5 seconds (p95)
- [ ] Queue processing lag < 10 seconds (p99)
- [ ] Database query performance within 20% of baseline
- [ ] Zero critical bugs in production

**Product**:
- [ ] Feature activation rate > 70%
- [ ] Response suggestion adoption > 30%
- [ ] Escalation precision > 85%
- [ ] Sentiment accuracy > 80% (manual review)
- [ ] Category accuracy > 85%

**Business**:
- [ ] Customer NPS > 50
- [ ] Support ticket volume unchanged or decreased
- [ ] Upgrade rate to Pro tier > 15%
- [ ] Zero customer cancellations due to Phase 4

**Cost**:
- [ ] Daily ML API costs within budget ($600/day target)
- [ ] Cost per conversation < $0.05
- [ ] Infrastructure costs linear with usage

### Post-Launch Success (30 days after 100% rollout)

**Product Adoption**:
- 80% of customers using ≥ 1 Phase 4 feature
- 50% of customers using ≥ 3 Phase 4 features
- 30% of customers upgraded to Pro tier

**Business Impact**:
- +$30,000 MRR from Pro tier upgrades
- Customer retention +5%
- Average revenue per customer +20%

**Operational Efficiency**:
- Agent response time reduced by 30%
- Conversation resolution rate +10%
- Support cost per conversation -20%

**Customer Satisfaction**:
- Overall NPS +10 points
- Phase 4 feature NPS > 60
- 5+ customer case studies published

---

## Appendix: Command Reference

### Feature Flag Controls

```bash
# Enable sentiment analysis for specific customer
./scripts/feature-flags.sh enable sentiment_analysis customer_id_here

# Disable globally
./scripts/feature-flags.sh disable sentiment_analysis --global

# Check status
./scripts/feature-flags.sh status sentiment_analysis
```

### Database Health Checks

```sql
-- Check Phase 4 table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE tablename IN (
  'sentiment_analysis', 'response_suggestions', 'conversation_categories',
  'prediction_analysis', 'escalation_events', 'conversation_insights'
);

-- Check sentiment analysis coverage
SELECT
  COUNT(DISTINCT m.id) as total_messages,
  COUNT(DISTINCT sa.message_id) as analyzed_messages,
  ROUND(COUNT(DISTINCT sa.message_id)::numeric / COUNT(DISTINCT m.id) * 100, 2) as coverage_pct
FROM messages m
LEFT JOIN sentiment_analysis sa ON sa.message_id = m.id
WHERE m.created_at > NOW() - INTERVAL '24 hours';
```

### Queue Monitoring

```bash
# Check queue depths
redis-cli -h production-redis INFO | grep "db0:keys"

# Check sentiment analysis queue
redis-cli -h production-redis LLEN sentiment_queue

# Drain stuck queue (emergency only)
redis-cli -h production-redis DEL sentiment_queue
```

---

**Document Status**: ✅ Ready for Phase 4 rollout
**Next Review**: 2025-11-10 (after team review)
**Owner**: Engineering & DevOps Teams
