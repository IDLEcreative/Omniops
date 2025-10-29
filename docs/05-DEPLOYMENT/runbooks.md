# Deployment Runbooks

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 155 minutes

## Purpose
> **Comprehensive operational guides for all deployment scenarios** > **Version**: 1.0 > **Last Updated**: October 2025

## Quick Links
- [Table of Contents](#table-of-contents)
- [Runbook Overview](#runbook-overview)
- [1. Standard Release Deployment](#1-standard-release-deployment)
- [2. Hotfix Deployment](#2-hotfix-deployment)
- [3. Database Migration](#3-database-migration)

## Keywords
cause, contacts, contents, database, deploy, deployment, detection, disaster, emergency, hotfix

---


> **Comprehensive operational guides for all deployment scenarios**
> **Version**: 1.0
> **Last Updated**: October 2025
> **Purpose**: Step-by-step procedures for standard and emergency deployments

---

## Table of Contents

1. [Standard Release Deployment](#standard-release-deployment)
2. [Hotfix Deployment](#hotfix-deployment)
3. [Database Migration](#database-migration)
4. [Emergency Rollback](#emergency-rollback)
5. [First-Time Production Deploy](#first-time-production-deploy)
6. [Scaling Up](#scaling-up)
7. [Disaster Recovery](#disaster-recovery)

---

## Runbook Overview

| Runbook | Duration | Risk Level | Rollback Difficulty | When to Use |
|---------|----------|------------|---------------------|-------------|
| Standard Release | 2-4 hours | Medium | Easy | Regular feature releases |
| Hotfix | 30-60 min | High | Easy | Critical bug fixes |
| Database Migration | 1-3 hours | High | Hard | Schema changes |
| Emergency Rollback | 5-15 min | Critical | N/A | Production incidents |
| First-Time Deploy | 8-12 hours | Critical | Hard | Initial setup |
| Scaling Up | 1-2 hours | Medium | Easy | Traffic increases |
| Disaster Recovery | 2-8 hours | Critical | N/A | Major outages |

---

## 1. Standard Release Deployment

### When to Use
- Regular feature releases
- Non-critical bug fixes
- Performance improvements
- Documentation updates
- Scheduled maintenance releases

### Metadata
- **Estimated Duration**: 2-4 hours
- **Risk Level**: Medium
- **Rollback Difficulty**: Easy
- **Best Time**: Tuesday-Thursday, 2-4 AM UTC
- **Minimum Team Size**: 2 (deployer + on-call)

### Prerequisites Checklist

**Code Quality** (T-48h)
- [ ] All tests passing (`npm run test:all`)
- [ ] Type checking clean (`npx tsc --noEmit`)
- [ ] Linting clean (`npm run lint`)
- [ ] Code review completed
- [ ] PR approved and merged
- [ ] CHANGELOG updated
- [ ] Version bumped in `package.json`

**Infrastructure** (T-24h)
- [ ] Staging environment mirrors production
- [ ] Staging deployment successful
- [ ] Database migrations tested on staging
- [ ] Performance benchmarks acceptable
- [ ] Load tests passed (if significant changes)
- [ ] Rollback plan documented

**Communication** (T-24h)
- [ ] Stakeholders notified
- [ ] Status page updated (maintenance window)
- [ ] On-call engineer confirmed
- [ ] Backup engineer identified
- [ ] Emergency contact list verified

### Before You Start

**Team Readiness**
```markdown
Deployment Team:
- Deployer: [Name] [Contact]
- On-Call Engineer: [Name] [Contact]
- Database Admin (standby): [Name] [Contact]
- Product Manager (notify): [Name] [Contact]

Communication Channels:
- Slack: #deployments
- PagerDuty: On-call rotation active
- Status Page: https://status.yourdomain.com
```

**Environment Check**
```bash
# Verify production credentials
echo "Checking environment variables..."
test -n "$NEXT_PUBLIC_SUPABASE_URL" || echo "Missing SUPABASE_URL"
test -n "$SUPABASE_SERVICE_ROLE_KEY" || echo "Missing SERVICE_ROLE_KEY"
test -n "$OPENAI_API_KEY" || echo "Missing OPENAI_API_KEY"
test -n "$ENCRYPTION_KEY" || echo "Missing ENCRYPTION_KEY"

# Verify services are accessible
curl -f https://api.supabase.com/v1/health || echo "Supabase unreachable"
curl -f https://api.openai.com/v1/models || echo "OpenAI unreachable"
```

**Backup Creation**
```bash
# Backup database
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to secure storage
aws s3 cp ${BACKUP_FILE}.gz s3://omniops-backups/production/
# OR
gsutil cp ${BACKUP_FILE}.gz gs://omniops-backups/production/

# Document backup location
echo "Backup: s3://omniops-backups/production/${BACKUP_FILE}.gz" >> deployment-log.txt
```

### Step-by-Step Procedure

#### Phase 1: Pre-Deployment (T-30min)

**1. Final Verification**
```bash
# Switch to release branch
git checkout main
git pull origin main

# Verify commit hash
DEPLOY_COMMIT=$(git rev-parse HEAD)
echo "Deploying commit: $DEPLOY_COMMIT"

# Tag release
git tag -a v1.2.0 -m "Production release v1.2.0"
git push origin v1.2.0

# Run final tests
npm run test:all
npm run lint
npx tsc --noEmit
```

**Expected Output:**
```
✓ All tests passed (95 passed)
✓ No linting errors
✓ Type checking clean
```

**2. Build and Test Locally**
```bash
# Clean build
rm -rf .next node_modules
npm ci --production=false
npm run build

# Verify build output
ls -lh .next/standalone
du -sh .next

# Test production build
NODE_ENV=production npm run start &
SERVER_PID=$!
sleep 10

# Smoke test
curl -f http://localhost:3000/api/health || echo "Health check failed!"
curl -f http://localhost:3000/api/health/comprehensive || echo "Comprehensive health failed!"

# Stop test server
kill $SERVER_PID
```

**Expected Output:**
```json
{"status":"ok","timestamp":"2025-10-24T12:00:00.000Z","uptime":10.5}
```

**3. Status Communication**
```bash
# Post to Slack
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🚀 Production Deployment Starting",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Production Deployment v1.2.0*\n• Start Time: 02:00 UTC\n• Expected Duration: 2-4 hours\n• Deployer: @deployer\n• Rollback Window: 1 hour"
      }
    }]
  }'
```

#### Phase 2: Database Migration (if needed)

**4. Run Database Migrations**
```bash
# Review migration files
ls -la supabase/migrations/

# Show pending migrations
supabase migration list --db-url $DATABASE_URL

# Dry-run on staging first
supabase db push --db-url $STAGING_DATABASE_URL

# Review staging results
psql $STAGING_DATABASE_URL -c "SELECT version FROM migrations ORDER BY created_at DESC LIMIT 5;"

# If staging successful, run on production
echo "Running production migrations at $(date)"
supabase db push --db-url $PRODUCTION_DATABASE_URL

# Verify migrations applied
psql $PRODUCTION_DATABASE_URL -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"
```

**Expected Output:**
```
Migration 20251024_add_feature.sql applied successfully
All migrations up to date
```

**5. Create Performance Indexes**
```bash
# Run index creation (can run concurrently with no locks)
psql $PRODUCTION_DATABASE_URL << 'EOF'
-- Create indexes without blocking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation
  ON messages(conversation_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector
  ON page_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Analyze tables
VACUUM ANALYZE messages;
VACUUM ANALYZE page_embeddings;
VACUUM ANALYZE conversations;

-- Verify indexes created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('messages', 'page_embeddings', 'conversations')
ORDER BY tablename, indexname;
EOF
```

#### Phase 3: Application Deployment

**6a. Vercel Deployment**
```bash
# Deploy to production
vercel --prod

# Wait for deployment
echo "Waiting for deployment to complete..."
sleep 60

# Get deployment URL
DEPLOY_URL=$(vercel ls --prod | head -2 | tail -1 | awk '{print $1}')
echo "Deployment URL: $DEPLOY_URL"

# Smoke test deployment
curl -f "https://$DEPLOY_URL/api/health"
```

**6b. Docker Deployment**
```bash
# Build production image
DOCKER_BUILDKIT=1 docker build -t omniops:v1.2.0 .
docker tag omniops:v1.2.0 omniops:latest

# Push to registry
docker push registry.example.com/omniops:v1.2.0
docker push registry.example.com/omniops:latest

# Deploy on production server
ssh production "cd /opt/omniops && docker-compose pull && docker-compose up -d --no-deps app"

# Wait for health check
sleep 30
ssh production "docker-compose ps"
```

**6c. Self-Hosted Deployment**
```bash
# Deploy code to server
rsync -avz --exclude node_modules --exclude .next . production:/opt/omniops/

# Install and build on server
ssh production << 'REMOTE'
cd /opt/omniops
npm ci --production
npm run build

# Restart with PM2 (zero-downtime)
pm2 reload ecosystem.config.js --update-env

# Verify processes
pm2 status
pm2 logs --lines 20
REMOTE

# Check health from outside
sleep 20
curl -f https://yourdomain.com/api/health
```

**Expected Output:**
```
[PM2] Reloading omniops-app with zero-downtime
[PM2] ✓ Process reloaded
```

#### Phase 4: Verification (Critical)

**7. Comprehensive Health Checks**
```bash
# Health endpoint
echo "Testing health endpoint..."
curl -f https://yourdomain.com/api/health/comprehensive?verbose=true | jq '.'

# Expected response
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",
#   "workers": "processing",
#   "uptime": 45.2
# }

# Chat functionality
echo "Testing chat endpoint..."
curl -X POST https://yourdomain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, test message",
    "domain": "yourdomain.com",
    "conversationId": null
  }' | jq '.response' | head -c 100

# Scraping API
echo "Testing scraping API..."
curl -X POST https://yourdomain.com/api/scrape/status \
  -H "Content-Type: application/json" \
  -d '{"domain": "yourdomain.com"}' | jq '.'

# WooCommerce integration (if configured)
echo "Testing WooCommerce..."
curl https://yourdomain.com/api/woocommerce/test | jq '.'
```

**8. Performance Verification**
```bash
# Response time test
echo "Testing response times..."
for i in {1..50}; do
  curl -w "%{time_total}\n" -o /dev/null -s https://yourdomain.com/api/health
done | awk '{sum+=$1; count++} END {print "Average: " sum/count "s, Count: " count}'

# Target: < 100ms average

# Memory usage
ssh production "docker stats --no-stream omniops-app" || \
  ssh production "pm2 describe omniops-app | grep memory"

# CPU usage
ssh production "top -bn1 | grep node"

# Database connections
psql $PRODUCTION_DATABASE_URL -c "
SELECT
  count(*) as active_connections,
  max(query_start) as oldest_query
FROM pg_stat_activity
WHERE datname = current_database();
"

# Redis health
redis-cli -h production INFO stats | grep -E "(keyspace_hits|keyspace_misses|used_memory_human)"
```

**Expected Metrics:**
```
Response Time: 75ms average
Memory: 2.8GB / 8GB
CPU: 35%
DB Connections: 12/100
Redis Hit Rate: 89%
```

**9. Functional Verification**
```bash
# Test critical user flows
cat << 'EOF' > verification.sh
#!/bin/bash
set -e

BASE_URL="https://yourdomain.com"

echo "1. Testing chat conversation..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your hours?", "domain": "yourdomain.com"}')
echo "$RESPONSE" | jq -e '.response' > /dev/null || exit 1

echo "2. Testing widget embed..."
curl -f "$BASE_URL/embed.js" > /dev/null || exit 1
curl -f "$BASE_URL/embed?domain=yourdomain.com" > /dev/null || exit 1

echo "3. Testing admin dashboard..."
curl -f "$BASE_URL/admin" > /dev/null || exit 1

echo "4. Testing GDPR export..."
curl -s -X POST "$BASE_URL/api/gdpr/export" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' | jq -e '.data' > /dev/null || exit 1

echo "✓ All critical flows working"
EOF

chmod +x verification.sh
./verification.sh
```

#### Phase 5: Monitoring & Sign-Off

**10. Enable Monitoring**
```bash
# Verify error tracking
curl -X POST https://yourdomain.com/api/test-error || echo "Error tracking test sent"

# Check Sentry/error service
open https://sentry.io/organizations/yourorg/issues/

# Verify logs flowing
ssh production "tail -n 100 /var/log/omniops/combined.log | grep ERROR"

# Alert configuration test
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"incident":{"type":"incident","title":"TEST: Deployment verification","body":{"type":"incident_body","details":"Testing alert system"}}}'
```

**11. Document Deployment**
```bash
cat >> deployment-log.txt << EOF
=================================
Deployment: v1.2.0
Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Commit: $DEPLOY_COMMIT
Deployer: $(whoami)
Duration: [FILL IN]
Status: SUCCESS

Changes:
- Feature X implemented
- Bug Y fixed
- Performance improved by 15%

Metrics:
- Response time P95: 420ms
- Error rate: 0.03%
- Memory usage: 2.8GB
- CPU usage: 35%

Backup Location: s3://omniops-backups/production/$BACKUP_FILE.gz
=================================
EOF
```

**12. Team Communication**
```bash
# Success notification
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "✅ Production Deployment Complete",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Deployment v1.2.0 Complete*\n✅ All systems operational\n✅ Health checks passing\n✅ Performance within SLA\n• Duration: 2.5 hours\n• Deployed: v1.2.0\n• Dashboard: https://yourdomain.com/admin/metrics"
      }
    }]
  }'

# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d "incident[status]=resolved&incident[body]=Deployment completed successfully"
```

### Verification Checklist

After deployment, verify:

- [ ] Health endpoint returns 200 OK
- [ ] Chat functionality working
- [ ] Scraping jobs processing
- [ ] Database queries performing well (< 100ms P95)
- [ ] Redis cache hit rate > 80%
- [ ] Error rate < 0.1%
- [ ] Response time P95 < 500ms
- [ ] Memory usage stable
- [ ] CPU usage < 70%
- [ ] No error spikes in logs
- [ ] Monitoring dashboards updated
- [ ] Status page updated

### Rollback Procedure

**If issues detected within 1 hour:**

```bash
# Immediate rollback
vercel rollback  # For Vercel

# OR for Docker
ssh production "cd /opt/omniops && docker-compose down && docker tag omniops:v1.1.0 omniops:latest && docker-compose up -d"

# OR for Self-hosted
ssh production "cd /opt/omniops && git checkout v1.1.0 && npm ci && npm run build && pm2 reload all"

# Verify rollback successful
curl -f https://yourdomain.com/api/health

# Notify team
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -d '{"text":"⚠️ Deployment rolled back to v1.1.0 - investigating issues"}'
```

### Post-Deployment Tasks

**Immediate (0-2 hours):**
- [ ] Monitor error rates every 15 minutes
- [ ] Watch response time trends
- [ ] Check for memory leaks
- [ ] Verify background jobs processing
- [ ] Review first 100 chat messages

**First Day:**
- [ ] Review performance metrics
- [ ] Gather user feedback
- [ ] Check cost metrics (OpenAI API usage)
- [ ] Verify caching effectiveness
- [ ] Document any issues found

**First Week:**
- [ ] Analyze performance trends
- [ ] Review error patterns
- [ ] Optimize slow queries
- [ ] Update documentation with learnings
- [ ] Schedule retrospective

### Troubleshooting Common Issues

#### Issue: Health Check Failing

**Symptoms:**
```
curl: (7) Failed to connect to yourdomain.com port 443
```

**Resolution:**
```bash
# Check if service is running
ssh production "docker-compose ps" || ssh production "pm2 status"

# Check logs
ssh production "docker-compose logs -f --tail=100 app"

# Check if port is open
telnet yourdomain.com 443

# Restart service if needed
ssh production "docker-compose restart app" || ssh production "pm2 restart omniops-app"
```

#### Issue: High Error Rate

**Symptoms:**
```
Error rate: 5.2% (threshold: 0.1%)
```

**Resolution:**
```bash
# Check error logs
ssh production "tail -n 500 /var/log/omniops/error.log | grep ERROR | head -20"

# Check database connectivity
psql $PRODUCTION_DATABASE_URL -c "SELECT 1"

# Check Redis
redis-cli -h production PING

# If widespread, initiate rollback
./rollback.sh
```

#### Issue: Slow Response Times

**Symptoms:**
```
Response time P95: 2.3s (threshold: 500ms)
```

**Resolution:**
```bash
# Check database slow queries
psql $PRODUCTION_DATABASE_URL -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 5;
"

# Check Redis memory
redis-cli -h production INFO memory

# Check for CPU/memory bottlenecks
ssh production "top -bn1 | head -20"

# Clear cache if needed
redis-cli -h production FLUSHDB
```

---

## 2. Hotfix Deployment

### When to Use
- Critical security vulnerabilities
- Production-breaking bugs
- Data integrity issues
- Major functionality failures
- Security patches

### Metadata
- **Estimated Duration**: 30-60 minutes
- **Risk Level**: High
- **Rollback Difficulty**: Easy
- **Best Time**: ASAP (any time)
- **Minimum Team Size**: 1-2 (deployer + reviewer)

### Prerequisites Checklist

**Critical Assessment** (T-0)
- [ ] Issue confirmed critical (P0/P1)
- [ ] Root cause identified
- [ ] Fix developed and tested locally
- [ ] Senior engineer reviewed code
- [ ] Impact assessment completed
- [ ] Rollback plan ready

**Abbreviated Testing** (T-15min)
- [ ] Unit tests for fix passing
- [ ] Manual testing of fix completed
- [ ] Regression testing of critical paths
- [ ] No new errors introduced

**Communication** (T-0)
- [ ] Stakeholders notified of issue
- [ ] Engineering lead informed
- [ ] Status page updated (if needed)
- [ ] Customer support briefed

### Before You Start

**Severity Assessment**
```markdown
Hotfix Classification:
- P0: Complete outage, deploy immediately
- P1: Critical feature broken, deploy within 1 hour
- P2: Serious bug, can wait for next release window

Current Issue: [P0/P1/P2]
Impact: [Number of users affected]
Downtime: [Yes/No - Duration if yes]
```

**Fast-Track Approval**
```bash
# Document hotfix decision
cat > hotfix-approval.txt << EOF
Hotfix: v1.2.1
Issue: [ISSUE-123] Critical bug causing data loss
Severity: P0
Approved By: [Name] [Time]
Risk: Low - single line fix
Testing: Manual + automated tests pass
Estimated Deploy: 30 minutes
EOF
```

### Step-by-Step Procedure

#### Phase 1: Rapid Development (T-0 to T-15)

**1. Create Hotfix Branch**
```bash
# Branch from production tag
git checkout v1.2.0
git checkout -b hotfix/v1.2.1

# Apply fix
vim lib/critical-file.ts

# Test locally
npm run test:unit
npm run test:integration
npm run build

# Commit
git add lib/critical-file.ts
git commit -m "hotfix: fix critical bug [ISSUE-123]

- Issue: Data loss in edge case
- Root cause: Null check missing
- Fix: Add validation
- Tested: Unit + integration tests
"
```

**2. Fast-Track Review**
```bash
# Push and create PR
git push origin hotfix/v1.2.1

# Create PR (auto-approve if emergency P0)
gh pr create --title "HOTFIX: Critical bug fix" \
  --body "P0 emergency hotfix - deploying immediately" \
  --label "hotfix" \
  --assignee @engineering-lead

# If P0, merge immediately
gh pr merge --admin --squash
```

#### Phase 2: Rapid Deployment (T-15 to T-30)

**3. Deploy to Production**
```bash
# Tag hotfix
git checkout main
git pull origin main
git tag -a v1.2.1 -m "Hotfix: Critical bug fix"
git push origin v1.2.1

# Build (Vercel auto-deploys on tag, or manual)
vercel --prod

# OR Docker
DOCKER_BUILDKIT=1 docker build -t omniops:v1.2.1 .
docker push registry.example.com/omniops:v1.2.1
ssh production "docker-compose pull && docker-compose up -d --no-deps app"

# OR Self-hosted
rsync -avz . production:/opt/omniops/
ssh production "cd /opt/omniops && npm ci && npm run build && pm2 reload all"
```

**4. Immediate Verification**
```bash
# Quick smoke test
curl -f https://yourdomain.com/api/health
curl -X POST https://yourdomain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "domain": "yourdomain.com"}'

# Verify fix applied
curl https://yourdomain.com/api/version
# Should show v1.2.1

# Check error rate (should drop immediately)
watch -n 5 'curl -s https://yourdomain.com/api/health/comprehensive | jq ".errorRate"'
```

#### Phase 3: Validation & Communication (T-30 to T-60)

**5. Monitor Impact**
```bash
# Watch error logs
ssh production "tail -f /var/log/omniops/error.log | grep ERROR"

# Check metrics
curl -s https://yourdomain.com/api/metrics | jq '.errors_last_5min'

# Verify issue resolved
# [Test specific functionality that was broken]
```

**6. Communicate Resolution**
```bash
# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d "incident[status]=resolved&incident[body]=Hotfix deployed successfully"

# Notify team
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -d '{
    "text": "🔥 Hotfix v1.2.1 deployed successfully",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Hotfix Deployed*\n✅ Issue resolved\n✅ Systems stable\n• Duration: 35 minutes\n• Impact: Eliminated"
      }
    }]
  }'
```

### Verification Checklist

- [ ] Health endpoint returning 200
- [ ] Error rate back to normal (< 0.1%)
- [ ] Specific bug no longer reproducing
- [ ] Response times normal
- [ ] No new errors introduced
- [ ] Monitoring shows stable state

### Rollback Procedure

**If hotfix introduces new issues:**

```bash
# Immediate rollback to previous version
vercel rollback  # Vercel
# OR
ssh production "docker tag omniops:v1.2.0 omniops:latest && docker-compose up -d"

# Verify rollback
curl -f https://yourdomain.com/api/health
curl https://yourdomain.com/api/version  # Should show v1.2.0

# Re-assess and redeploy with different fix
```

### Post-Deployment Tasks

**Immediate:**
- [ ] Monitor for 2 hours continuously
- [ ] Verify issue not recurring
- [ ] Document root cause
- [ ] Update issue tracker

**Within 24 hours:**
- [ ] Write post-mortem
- [ ] Add regression tests
- [ ] Update monitoring/alerts
- [ ] Customer communication if needed

### Troubleshooting Common Issues

#### Issue: Hotfix Doesn't Resolve Problem

**Resolution:**
```bash
# Gather more data
ssh production "grep 'ERROR' /var/log/omniops/error.log | tail -100"

# Check if fix actually deployed
curl https://yourdomain.com/api/version
git log --oneline -5

# If deployed but not working, rollback immediately
./rollback.sh

# Re-assess root cause
```

---

## 3. Database Migration

### When to Use
- Schema changes (add/modify/drop columns)
- New tables or indexes
- Data type changes
- Relationship modifications
- Performance optimizations

### Metadata
- **Estimated Duration**: 1-3 hours
- **Risk Level**: High
- **Rollback Difficulty**: Hard (may require data migration)
- **Best Time**: Tuesday-Thursday, 2-4 AM UTC
- **Minimum Team Size**: 2-3 (deployer + DBA + backup)

### Prerequisites Checklist

**Migration Planning** (T-72h)
- [ ] Migration script written and reviewed
- [ ] Backward compatibility verified
- [ ] Data integrity checks created
- [ ] Rollback migration prepared
- [ ] Downtime estimate calculated
- [ ] Stakeholders informed of timing

**Testing** (T-48h)
- [ ] Migration tested on local DB
- [ ] Migration tested on staging (with prod data snapshot)
- [ ] Performance impact measured
- [ ] Rollback tested on staging
- [ ] Data validation queries prepared

**Infrastructure** (T-24h)
- [ ] Database backup verified
- [ ] Sufficient disk space confirmed
- [ ] Lock timeout configured
- [ ] Connection pool adjusted
- [ ] Monitoring alerts configured

### Before You Start

**Database State Assessment**
```bash
# Check database size
psql $PRODUCTION_DATABASE_URL -c "
SELECT
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  (SELECT count(*) FROM pg_stat_activity) as active_connections,
  (SELECT max(query_start) FROM pg_stat_activity) as oldest_query
"

# Check table sizes
psql $PRODUCTION_DATABASE_URL -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
"

# Check for long-running queries
psql $PRODUCTION_DATABASE_URL -c "
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
"
```

**Communication Template**
```markdown
Database Migration Notice

Date: [Date and Time UTC]
Duration: Estimated 2-3 hours
Expected Downtime: None (or X minutes if downtime required)
Impact: Read-only mode during migration (if applicable)

Changes:
- Adding new column to messages table
- Creating performance index on conversations
- Adding foreign key constraint

Rollback Plan: Prepared and tested
Contact: [On-call DBA] [Phone]
Status Updates: #engineering-ops channel
```

### Step-by-Step Procedure

#### Phase 1: Pre-Migration (T-30min)

**1. Final Backup**
```bash
# Create timestamped backup
BACKUP_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pre_migration_${BACKUP_TIME}.sql"

echo "Creating backup at $(date)"
pg_dump $PRODUCTION_DATABASE_URL \
  --format=custom \
  --compress=9 \
  --file=$BACKUP_FILE

# Verify backup
pg_restore --list $BACKUP_FILE | head -20

# Upload to secure storage
aws s3 cp $BACKUP_FILE s3://omniops-backups/migrations/
aws s3 ls s3://omniops-backups/migrations/ | grep $BACKUP_FILE

# Document backup
echo "Migration backup: s3://omniops-backups/migrations/$BACKUP_FILE" >> migration-log.txt
echo "Backup size: $(du -h $BACKUP_FILE)" >> migration-log.txt
```

**2. Enable Maintenance Mode (if downtime required)**
```bash
# Option A: Application-level maintenance
curl -X POST https://yourdomain.com/api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true, "message": "Database maintenance in progress"}'

# Option B: Nginx maintenance page
ssh production "cp /etc/nginx/maintenance.html /var/www/maintenance.html && nginx -s reload"

# Verify maintenance mode
curl https://yourdomain.com/
# Should show maintenance page
```

**3. Drain Active Connections**
```bash
# Set connection limit
psql $PRODUCTION_DATABASE_URL -c "
ALTER DATABASE omniops_production SET connection_limit = 10;
"

# Wait for connections to drain (or kill non-critical ones)
psql $PRODUCTION_DATABASE_URL -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'omniops_production'
  AND pid != pg_backend_pid()
  AND usename != 'supabase_admin'
  AND query NOT LIKE '%pg_stat_activity%';
"

# Verify minimal connections
psql $PRODUCTION_DATABASE_URL -c "
SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
"
```

#### Phase 2: Migration Execution

**4. Run Migration with Timing**
```bash
# Set statement timeout (prevents hung migrations)
psql $PRODUCTION_DATABASE_URL -c "SET statement_timeout = '30min';"

# Execute migration with timing
time psql $PRODUCTION_DATABASE_URL << 'EOF'
\timing on

-- Start transaction
BEGIN;

-- Migration: Add new column with default
ALTER TABLE messages
ADD COLUMN sentiment VARCHAR(20) DEFAULT 'neutral';

-- Migration: Create index concurrently (doesn't lock table)
COMMIT; -- Commit before CONCURRENT operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sentiment
  ON messages(sentiment);
BEGIN;

-- Migration: Add constraint
ALTER TABLE messages
ADD CONSTRAINT check_sentiment
CHECK (sentiment IN ('positive', 'negative', 'neutral'));

-- Verify changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages' AND column_name = 'sentiment';

-- Commit migration
COMMIT;

-- Analyze table for query planner
ANALYZE messages;
EOF
```

**Expected Output:**
```
BEGIN
ALTER TABLE
Time: 1234.567 ms (00:01.235)
CREATE INDEX
Time: 45678.901 ms (00:45.679)
COMMIT
```

**5. Verify Migration Success**
```bash
# Check migration applied
psql $PRODUCTION_DATABASE_URL -c "
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name = 'sentiment';
"

# Verify indexes created
psql $PRODUCTION_DATABASE_URL -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'messages'
  AND indexname LIKE '%sentiment%';
"

# Check constraints
psql $PRODUCTION_DATABASE_URL -c "
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'messages'::regclass
  AND conname LIKE '%sentiment%';
"

# Test insert with new column
psql $PRODUCTION_DATABASE_URL -c "
INSERT INTO messages (conversation_id, content, sender, sentiment)
VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'user', 'positive')
RETURNING id, sentiment;

DELETE FROM messages WHERE content = 'test';
"
```

**6. Update Application Schema Types**
```bash
# Regenerate TypeScript types
supabase gen types typescript \
  --db-url $PRODUCTION_DATABASE_URL \
  --schema public \
  > types/supabase-generated.ts

# Verify types updated
grep 'sentiment' types/supabase-generated.ts

# If using Prisma, update schema
prisma db pull
prisma generate
```

#### Phase 3: Application Deployment

**7. Deploy Updated Application Code**
```bash
# Ensure app code is compatible with new schema
git pull origin main

# Build with new types
npm run build

# Deploy application
vercel --prod  # or docker-compose up -d, etc.

# Verify deployment
curl -f https://yourdomain.com/api/health
```

#### Phase 4: Post-Migration Validation

**8. Data Integrity Checks**
```bash
# Run validation queries
psql $PRODUCTION_DATABASE_URL << 'EOF'
-- Check for null values where not expected
SELECT count(*) as null_sentiments
FROM messages
WHERE sentiment IS NULL;
-- Should be 0

-- Check constraint violations
SELECT count(*) as invalid_sentiments
FROM messages
WHERE sentiment NOT IN ('positive', 'negative', 'neutral');
-- Should be 0

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'messages'
  AND indexname LIKE '%sentiment%';
-- idx_scan should increase over time

-- Check table statistics
SELECT
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE relname = 'messages';
EOF
```

**9. Performance Validation**
```bash
# Test query performance with new index
psql $PRODUCTION_DATABASE_URL -c "
EXPLAIN ANALYZE
SELECT * FROM messages
WHERE sentiment = 'positive'
ORDER BY created_at DESC
LIMIT 100;
"
# Should use new index

# Compare with baseline
# Before: Seq Scan on messages (cost=0.00..1234.56 rows=100)
# After: Index Scan using idx_messages_sentiment (cost=0.43..12.34 rows=100)

# Monitor query performance
psql $PRODUCTION_DATABASE_URL -c "
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%messages%sentiment%'
ORDER BY mean_exec_time DESC
LIMIT 5;
"
```

**10. Re-Enable Normal Operations**
```bash
# Restore connection limit
psql $PRODUCTION_DATABASE_URL -c "
ALTER DATABASE omniops_production RESET connection_limit;
"

# Disable maintenance mode
curl -X POST https://yourdomain.com/api/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}'

# OR
ssh production "rm /var/www/maintenance.html && nginx -s reload"

# Verify application accessible
curl -f https://yourdomain.com/
```

### Verification Checklist

- [ ] Migration completed without errors
- [ ] All tables/columns exist as expected
- [ ] Indexes created and being used
- [ ] Constraints enforced correctly
- [ ] No data loss or corruption
- [ ] Application compatible with new schema
- [ ] Performance metrics acceptable
- [ ] No increase in error rates
- [ ] Database connections healthy
- [ ] Maintenance mode disabled

### Rollback Procedure

**If migration fails or causes issues:**

```bash
# Option 1: Rollback migration (if possible)
psql $PRODUCTION_DATABASE_URL << 'EOF'
BEGIN;

-- Drop new column
ALTER TABLE messages DROP COLUMN sentiment;

-- Drop index
DROP INDEX IF EXISTS idx_messages_sentiment;

COMMIT;
ANALYZE messages;
EOF

# Option 2: Restore from backup (nuclear option)
echo "WARNING: This will restore entire database to pre-migration state"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" = "yes" ]; then
  # Stop application
  ssh production "docker-compose down" || ssh production "pm2 stop all"

  # Restore backup
  pg_restore --clean --if-exists \
    --dbname=$PRODUCTION_DATABASE_URL \
    $BACKUP_FILE

  # Restart application with old code
  git checkout v1.2.0
  npm ci && npm run build
  vercel --prod

  # Verify restoration
  psql $PRODUCTION_DATABASE_URL -c "SELECT count(*) FROM messages;"
fi

# Option 3: Forward fix (if data was modified)
# Write a new migration to fix issues
```

### Post-Deployment Tasks

**Immediate (0-2 hours):**
- [ ] Monitor database performance
- [ ] Watch for slow queries
- [ ] Check error logs for DB errors
- [ ] Verify connection pool healthy
- [ ] Monitor disk usage

**First Day:**
- [ ] Review query performance trends
- [ ] Check index usage statistics
- [ ] Verify no data anomalies
- [ ] Gather user feedback
- [ ] Document lessons learned

**First Week:**
- [ ] Analyze query plan changes
- [ ] Optimize if needed
- [ ] Update documentation
- [ ] Review backup strategy
- [ ] Schedule post-mortem

### Troubleshooting Common Issues

#### Issue: Migration Timeout

**Symptoms:**
```
ERROR: canceling statement due to statement timeout
```

**Resolution:**
```bash
# Increase timeout
psql $PRODUCTION_DATABASE_URL -c "SET statement_timeout = '60min';"

# For large tables, add column first without default
ALTER TABLE large_table ADD COLUMN new_column VARCHAR(20);
-- Then update in batches
UPDATE large_table SET new_column = 'default' WHERE id BETWEEN 1 AND 100000;
-- Repeat in batches
```

#### Issue: Lock Contention

**Symptoms:**
```
ERROR: deadlock detected
```

**Resolution:**
```bash
# Use CONCURRENTLY for index creation (already in example)
CREATE INDEX CONCURRENTLY idx_name ON table(column);

# For DDL, use lock timeout
SET lock_timeout = '5s';
ALTER TABLE table_name ADD COLUMN...;
```

#### Issue: Disk Space Exhaustion

**Symptoms:**
```
ERROR: could not write to disk
```

**Resolution:**
```bash
# Check disk space
df -h

# Clean up if needed
VACUUM FULL;

# Or increase disk size before retrying
# AWS RDS: Modify instance, increase storage
# Supabase: Upgrade plan or contact support
```

---

## 4. Emergency Rollback

### When to Use
- Production incident detected
- Error rate > 5% sustained
- Critical functionality broken
- Data corruption detected
- Security breach identified
- Performance degradation severe

### Metadata
- **Estimated Duration**: 5-15 minutes
- **Risk Level**: Critical (high-stakes decision)
- **Rollback Difficulty**: N/A (this IS the rollback)
- **Best Time**: Immediately upon incident
- **Minimum Team Size**: 1 (must be fast)

### Decision Criteria

**ROLLBACK IMMEDIATELY IF:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | > 5% for 10+ minutes | Rollback |
| Response Time | P95 > 3s for 10+ minutes | Investigate, consider rollback |
| Database Connections | Connection errors | Rollback |
| Critical Feature | Completely broken | Rollback |
| Data Loss | Any data loss detected | Rollback ASAP |
| Security Issue | Vulnerability exploited | Rollback + patch |

**DO NOT ROLLBACK IF:**
- Issue is minor (< 1% error rate)
- Issue is understood and can be hotfixed faster
- Rollback would cause more issues (DB migration)
- Issue is infrastructure, not application

### Prerequisites Checklist

**Immediate Assessment** (T-0, 2 minutes)
- [ ] Incident confirmed and severity assessed
- [ ] Engineering lead notified
- [ ] Root cause unclear OR fix would take > 30 min
- [ ] Previous version known to be stable
- [ ] Rollback authority granted (or self-authorized for P0)

**No formal prerequisites - speed is critical!**

### Before You Start

**Incident Declaration**
```bash
# Send immediate alert
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -d '{
    "text": "🚨 INCIDENT: Initiating emergency rollback",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*EMERGENCY ROLLBACK IN PROGRESS*\n⚠️ Production incident detected\n• Error rate: 8.2%\n• Deployer: @oncall\n• ETA: 10 minutes"
      }
    }]
  }'

# Page on-call team
curl -X POST https://api.pagerduty.com/incidents \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "type": "incident",
      "title": "PRODUCTION: Emergency rollback in progress",
      "service": {"id": "SERVICE_ID", "type": "service_reference"},
      "urgency": "high",
      "body": {
        "type": "incident_body",
        "details": "Rollback initiated due to error rate spike. On-call responding."
      }
    }
  }'
```

**Identify Current and Previous Versions**
```bash
# Check current version
CURRENT_VERSION=$(curl -s https://yourdomain.com/api/version | jq -r '.version')
echo "Current version: $CURRENT_VERSION"

# Identify previous stable version (usually previous tag)
PREVIOUS_VERSION=$(git tag --sort=-v:refname | grep -v $CURRENT_VERSION | head -1)
echo "Rolling back to: $PREVIOUS_VERSION"

# Verify previous version is recent (not too old)
git log --oneline $PREVIOUS_VERSION..$CURRENT_VERSION | wc -l
# If > 100 commits, reconsider - might be too old
```

### Step-by-Step Procedure

#### Phase 1: Immediate Rollback (0-5 minutes)

**1. Vercel Rollback**
```bash
# List recent deployments
vercel ls --prod

# Rollback to previous
vercel rollback

# OR rollback to specific deployment
PREV_DEPLOY=$(vercel ls --prod | grep $PREVIOUS_VERSION | awk '{print $1}' | head -1)
vercel promote $PREV_DEPLOY --prod

# Verify rollback started
curl -s https://yourdomain.com/api/version
# Keep checking until it shows previous version
```

**2. Docker Rollback**
```bash
# SSH to production server
ssh production << 'REMOTE'
cd /opt/omniops

# Stop current containers
docker-compose down --remove-orphans

# Tag previous version as latest
PREVIOUS_TAG=$(docker images omniops --format "{{.Tag}}" | grep -v latest | head -1)
echo "Rolling back to: $PREVIOUS_TAG"
docker tag omniops:$PREVIOUS_TAG omniops:latest

# Start with previous version
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f --tail=50 app
REMOTE

# Verify from outside
sleep 15
curl -f https://yourdomain.com/api/health
```

**3. Self-Hosted Rollback**
```bash
# SSH to production
ssh production << 'REMOTE'
cd /opt/omniops

# Stop application
pm2 stop omniops-app

# Checkout previous version
git fetch --tags
PREVIOUS_TAG=$(git tag --sort=-v:refname | head -2 | tail -1)
echo "Rolling back to: $PREVIOUS_TAG"
git checkout $PREVIOUS_TAG

# Reinstall dependencies (quick check if changed)
npm ci --production

# Rebuild
npm run build

# Restart with PM2
pm2 restart omniops-app

# Check status
pm2 status
pm2 logs --lines 50
REMOTE

# Verify
curl -f https://yourdomain.com/api/health
```

#### Phase 2: Immediate Verification (5-10 minutes)

**4. Quick Smoke Tests**
```bash
# Health check
for i in {1..10}; do
  echo "Attempt $i:"
  curl -f https://yourdomain.com/api/health && echo " ✓" || echo " ✗"
  sleep 2
done

# Test critical endpoints
curl -X POST https://yourdomain.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "domain": "yourdomain.com"}' \
  | jq -e '.response' && echo "✓ Chat working"

# Check error rate
curl -s https://yourdomain.com/api/health/comprehensive | jq '.errorRate'
# Should be dropping rapidly

# Check version
curl -s https://yourdomain.com/api/version
# Should show previous version
```

**5. Monitor Recovery**
```bash
# Watch error rate (should drop immediately)
watch -n 5 'curl -s https://yourdomain.com/api/health/comprehensive | jq ".errorRate, .responseTime"'

# Check logs for errors
ssh production "tail -f /var/log/omniops/error.log"

# Monitor metrics
open https://yourdomain.com/admin/metrics
# Error rate should be declining
```

#### Phase 3: Database Rollback (if needed)

**6. Database Rollback Decision**
```bash
# ONLY rollback database if:
# - Migration was part of the bad deployment
# - Data corruption occurred
# - Application cannot work with new schema

# Check if database migration was part of bad deployment
psql $PRODUCTION_DATABASE_URL -c "
SELECT version, applied_at
FROM supabase_migrations.schema_migrations
ORDER BY applied_at DESC
LIMIT 5;
"

# If migration is causing issues, restore from backup
BACKUP_FILE="pre_migration_$(date -d '1 hour ago' +%Y%m%d_%H)*.sql"
echo "WARNING: Database rollback will restore to 1 hour ago"
read -p "Proceed with DB rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" = "yes" ]; then
  # Stop application first
  ssh production "docker-compose down" || ssh production "pm2 stop all"

  # Restore database
  pg_restore --clean --if-exists --dbname=$PRODUCTION_DATABASE_URL $BACKUP_FILE

  # Verify restoration
  psql $PRODUCTION_DATABASE_URL -c "SELECT version FROM supabase_migrations.schema_migrations ORDER BY applied_at DESC LIMIT 1;"

  # Restart application (already on previous version)
  ssh production "docker-compose up -d" || ssh production "pm2 start all"
fi
```

### Verification Checklist

- [ ] Application responding to requests
- [ ] Error rate returned to normal (< 0.5%)
- [ ] Response times acceptable (< 500ms P95)
- [ ] Critical user flows working
- [ ] Version confirmed rolled back
- [ ] Database stable (if rolled back)
- [ ] No data loss detected
- [ ] Monitoring shows recovery

### Post-Rollback Immediate Actions

**7. Communication (while rollback completes)**
```bash
# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents/INCIDENT_ID" \
  -H "Authorization: OAuth YOUR_TOKEN" \
  -d "incident[status]=monitoring&incident[body]=Rollback completed. Monitoring system stability."

# Notify team
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -d '{
    "text": "✅ Rollback Complete",
    "blocks": [{
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Emergency Rollback Complete*\n✅ Rolled back to v1.2.0\n✅ Error rate normalizing\n✅ Systems stabilizing\n\n⚠️ Monitoring for 30 minutes\n• Root cause: Investigating\n• ETA for fix: TBD"
      }
    }]
  }'

# Email stakeholders (if customer-impacting)
cat > incident-notification.txt << EOF
Subject: Production Incident - Resolved

An issue was detected in production at [TIME] causing [IMPACT].

Actions Taken:
- Incident detected at [TIME]
- Emergency rollback initiated at [TIME]
- Rollback completed at [TIME]
- Systems stable as of [TIME]

Impact:
- Duration: [X] minutes
- Affected users: Estimated [Y]%
- Data loss: None confirmed

Next Steps:
- Root cause analysis in progress
- Fix being developed
- Updates: #engineering-ops or status.yourdomain.com

Contact: [On-call Engineer] [Contact]
EOF
```

**8. Gather Diagnostics**
```bash
# Capture state before rolling forward again
mkdir -p incident-diagnostics/$(date +%Y%m%d_%H%M%S)
cd incident-diagnostics/$(date +%Y%m%d_%H%M%S)

# Application logs
ssh production "docker-compose logs --tail=1000" > docker-logs.txt

# Database state
psql $PRODUCTION_DATABASE_URL -c "
COPY (
  SELECT * FROM pg_stat_activity WHERE state != 'idle'
) TO STDOUT WITH CSV HEADER
" > db-active-queries.csv

# Error logs
ssh production "tail -n 1000 /var/log/omniops/error.log" > error-logs.txt

# Metrics snapshot
curl -s https://yourdomain.com/api/health/comprehensive > health-snapshot.json

# Document timeline
cat > timeline.md << EOF
# Incident Timeline

## Detection
- Time: $(date -u)
- Detected by: Monitoring alert / Manual
- Initial symptom: Error rate spike to 8.2%

## Response
- Rollback initiated: [TIME]
- Rollback completed: [TIME]
- Systems stable: [TIME]

## Impact
- Duration: [X] minutes
- Error rate peak: [Y]%
- Affected requests: ~[Z]

## Root Cause
- Under investigation
- Hypothesis: [FILL IN]
EOF
```

### Post-Rollback Analysis (Next 2-4 hours)

**9. Root Cause Investigation**
```bash
# Compare deployments
git log --oneline $PREVIOUS_VERSION..$CURRENT_VERSION

# Check for obvious issues
git diff $PREVIOUS_VERSION $CURRENT_VERSION -- lib/

# Review logs for error patterns
ssh production "grep ERROR /var/log/omniops/error.log | tail -100 | sort | uniq -c | sort -rn"

# Check database for issues
psql $PRODUCTION_DATABASE_URL -c "
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY total_exec_time DESC
LIMIT 10;
"
```

**10. Develop Fix**
```bash
# Create hotfix branch from working version
git checkout $PREVIOUS_VERSION
git checkout -b hotfix/fix-incident

# Apply fix
# [Make necessary changes]

# Test thoroughly
npm run test:all
npm run build

# Deploy as hotfix (see Hotfix Runbook)
```

### Post-Deployment Tasks

**Immediate (0-30 minutes):**
- [ ] Continuous monitoring of error rates
- [ ] Verify user flows working
- [ ] Check for any data inconsistencies
- [ ] Document incident details
- [ ] Identify root cause

**Within 2 hours:**
- [ ] Write incident report
- [ ] Develop fix or workaround
- [ ] Test fix thoroughly
- [ ] Update monitoring/alerts to catch earlier
- [ ] Customer communication if needed

**Within 24 hours:**
- [ ] Post-mortem meeting scheduled
- [ ] Timeline documented
- [ ] Action items identified
- [ ] Prevent similar issues (tests, alerts)
- [ ] Update runbooks if needed

### Troubleshooting Common Issues

#### Issue: Rollback Completes But Errors Persist

**Cause**: Infrastructure issue, not application issue

**Resolution:**
```bash
# Check infrastructure
curl -f https://api.supabase.com/v1/health
curl -f https://api.openai.com/v1/models

# Check database
psql $PRODUCTION_DATABASE_URL -c "SELECT 1"

# Check Redis
redis-cli -h production PING

# If infra issue, contact providers or restart services
```

#### Issue: Previous Version Also Has Errors

**Cause**: Deployed too far back, or issue is environmental

**Resolution:**
```bash
# Roll forward to most recent working version
WORKING_VERSION=$(git tag --sort=-v:refname | head -3 | tail -1)
git checkout $WORKING_VERSION
# Redeploy

# Or investigate environment/infrastructure
```

---

## 5. First-Time Production Deploy

### When to Use
- Initial production deployment
- New production environment
- Complete infrastructure rebuild
- Migration to new hosting platform

### Metadata
- **Estimated Duration**: 8-12 hours
- **Risk Level**: Critical (no rollback possible)
- **Rollback Difficulty**: Hard (no previous state)
- **Best Time**: Dedicated deployment day
- **Minimum Team Size**: 3-4 (lead, DBA, DevOps, QA)

### Prerequisites Checklist

**Infrastructure** (T-72h)
- [ ] Domain registered and DNS accessible
- [ ] SSL certificates obtained
- [ ] Hosting platform ready (Vercel/AWS/etc)
- [ ] Database provisioned (Supabase account)
- [ ] Redis instance available
- [ ] CDN configured (if used)
- [ ] Monitoring tools ready

**Security** (T-48h)
- [ ] API keys generated (OpenAI, Supabase)
- [ ] Encryption key generated
- [ ] Secrets management solution ready
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates valid
- [ ] Security headers configured

**Application** (T-24h)
- [ ] All tests passing
- [ ] Production build successful
- [ ] Dependencies vetted and up-to-date
- [ ] Documentation complete
- [ ] Environment variables documented
- [ ] Backup strategy defined

### Before You Start

**Team Assembly**
```markdown
First-Time Deployment Team:
- Deployment Lead: [Name] [Contact]
- Database Administrator: [Name] [Contact]
- DevOps Engineer: [Name] [Contact]
- QA Engineer: [Name] [Contact]
- Product Manager: [Name] [Contact]

Meeting Link: [Zoom/Meet URL]
Duration: Reserve full day
Communication: Dedicated Slack channel #production-launch
```

**Infrastructure Checklist**
```bash
# Create infrastructure checklist
cat > infrastructure-checklist.txt << 'EOF'
Infrastructure Readiness Checklist:

[ ] Domain: yourdomain.com registered
[ ] DNS: A records configured
[ ] SSL: Certificate valid (check: openssl s_client -connect yourdomain.com:443)
[ ] Hosting: Vercel project created / Server provisioned
[ ] Database: Supabase project created
[ ] Redis: Instance running (local or cloud)
[ ] Storage: S3/GCS bucket for backups
[ ] Monitoring: Sentry/DataDog account ready
[ ] Status Page: Statuspage.io configured
[ ] Email: Transactional email service ready
EOF

cat infrastructure-checklist.txt
```

### Step-by-Step Procedure

#### Phase 1: Infrastructure Setup (2-3 hours)

**1. Database Initialization**
```bash
# Create Supabase project (via dashboard)
# Project Name: omniops-production
# Region: [Closest to users]
# Pricing Plan: Pro (for production features)

# Store credentials securely
cat > .env.production << 'EOF'
# DO NOT COMMIT THIS FILE

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-...

# Security
ENCRYPTION_KEY=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 16)

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Redis
REDIS_URL=redis://production-redis:6379
EOF

# Verify .env.production not in git
git check-ignore .env.production || echo "WARNING: Add .env.production to .gitignore!"
```

**2. Enable Database Extensions**
```bash
# Run in Supabase SQL Editor
psql $NEXT_PUBLIC_SUPABASE_URL/postgres << 'EOF'
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Verify extensions
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm', 'btree_gin');
EOF
```

**Expected Output:**
```
   extname   | extversion
-------------+------------
uuid-ossp    | 1.1
vector       | 0.5.0
pg_trgm      | 1.6
btree_gin    | 1.3
```

**3. Run Database Migrations**
```bash
# Initialize database schema
supabase db push --db-url $NEXT_PUBLIC_SUPABASE_URL/postgres

# Or run migrations manually
for migration in supabase/migrations/*.sql; do
  echo "Running $migration..."
  psql $NEXT_PUBLIC_SUPABASE_URL/postgres < $migration
done

# Verify tables created
psql $NEXT_PUBLIC_SUPABASE_URL/postgres -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"

# Should see all core tables:
# - customer_configs
# - conversations
# - messages
# - page_embeddings
# - scraped_pages
# - etc.
```

**4. Create Performance Indexes**
```bash
# Run index creation script (see Database Migration runbook for full list)
psql $NEXT_PUBLIC_SUPABASE_URL/postgres << 'EOF'
-- Create all production indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_domain ON conversations(domain, created_at DESC);
CREATE INDEX idx_scraped_pages_domain ON scraped_pages(domain, last_scraped DESC);
CREATE INDEX idx_content_url ON website_content(url);
CREATE INDEX idx_embeddings_domain ON page_embeddings(domain);

-- Vector index (may take time on large datasets)
CREATE INDEX idx_embeddings_vector
  ON page_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Text search indexes
CREATE INDEX idx_content_search
  ON website_content
  USING gin(to_tsvector('english', content));

-- Analyze for optimization
VACUUM ANALYZE;

-- Verify indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
EOF
```

**5. Setup Redis**
```bash
# Option A: Local Redis (development/single-server)
docker run -d \
  --name omniops-redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Option B: Managed Redis (production)
# Use: Redis Cloud, AWS ElastiCache, Google Memorystore, etc.
# Configure and store URL in .env.production

# Verify Redis connection
redis-cli -u $REDIS_URL PING
# Should return: PONG
```

**6. Configure CDN (optional but recommended)**
```bash
# Cloudflare setup
# 1. Add domain to Cloudflare
# 2. Update nameservers at registrar
# 3. Configure DNS records:

# Example DNS records:
# Type  Name        Content              Proxy
# A     @           [server IP]           Yes
# A     www         [server IP]           Yes
# CNAME api         yourdomain.com        Yes

# Enable caching rules
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/pagerules" \
  -H "X-Auth-Email: $CF_EMAIL" \
  -H "X-Auth-Key: $CF_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "targets": [{"target": "url", "constraint": {"operator": "matches", "value": "yourdomain.com/_next/static/*"}}],
    "actions": [{"id": "cache_level", "value": "cache_everything"}, {"id": "edge_cache_ttl", "value": 31536000}],
    "priority": 1,
    "status": "active"
  }'
```

#### Phase 2: Application Deployment (2-3 hours)

**7a. Vercel Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variables via Vercel dashboard
# https://vercel.com/[your-account]/[project]/settings/environment-variables

# Or via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add ENCRYPTION_KEY production
# ... add all variables

# Deploy to production
vercel --prod

# Configure custom domain
vercel domains add yourdomain.com

# Verify deployment
curl -f https://[deployment-url].vercel.app/api/health
```

**7b. Docker Deployment**
```bash
# Build production image
DOCKER_BUILDKIT=1 docker build \
  --tag omniops:v1.0.0 \
  --tag omniops:latest \
  --build-arg NODE_ENV=production \
  .

# Push to registry (if using)
docker tag omniops:v1.0.0 registry.example.com/omniops:v1.0.0
docker push registry.example.com/omniops:v1.0.0

# Create production docker-compose
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

  app:
    image: omniops:v1.0.0
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis-data:
EOF

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Verify
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

**7c. Self-Hosted Deployment**
```bash
# On production server
ssh production << 'REMOTE'
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /opt/omniops
sudo chown $USER:$USER /opt/omniops
REMOTE

# Upload code
rsync -avz --exclude node_modules --exclude .next . production:/opt/omniops/

# Install and build
ssh production << 'REMOTE'
cd /opt/omniops

# Copy environment
cp .env.production .env.local

# Install dependencies
npm ci --production

# Build
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'PM2'
module.exports = {
  apps: [{
    name: 'omniops-app',
    script: 'npm',
    args: 'start',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
PM2

# Start with PM2
pm2 start ecosystem.config.js

# Setup startup script
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs omniops-app --lines 50
REMOTE
```

**8. Configure Reverse Proxy (Nginx)**
```bash
ssh production << 'REMOTE'
# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/omniops << 'NGINX'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;

# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
    location / {
        limit_req zone=general burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static assets caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Enable site
sudo ln -s /etc/nginx/sites-available/omniops /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Reload Nginx
sudo systemctl reload nginx
REMOTE
```

#### Phase 3: Initial Data Setup (1-2 hours)

**9. Seed Initial Data (if needed)**
```bash
# Create first customer config
psql $PRODUCTION_DATABASE_URL << 'EOF'
-- Insert default customer configuration
INSERT INTO customer_configs (
  domain,
  business_name,
  business_description,
  primary_color,
  secondary_color,
  widget_position
) VALUES (
  'yourdomain.com',
  'Your Business Name',
  'Your business description',
  '#1a73e8',
  '#34a853',
  'bottom-right'
);

-- Verify insertion
SELECT id, domain, business_name FROM customer_configs;
EOF
```

**10. Initial Scrape (optional)**
```bash
# Trigger initial website scrape
curl -X POST https://yourdomain.com/api/scrape \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "domain": "yourdomain.com",
    "urls": ["https://yourdomain.com"],
    "maxDepth": 3
  }'

# Monitor scrape progress
watch -n 5 'curl -s https://yourdomain.com/api/scrape/status | jq ".jobsCompleted, .jobsActive"'
```

#### Phase 4: Monitoring & Alerting Setup (1-2 hours)

**11. Configure Error Tracking (Sentry)**
```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard -i nextjs

# Update sentry.server.config.js
cat > sentry.server.config.js << 'EOF'
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      // Don't send network errors from bots
      if (error?.message?.includes('network') &&
          event.request?.headers?.['user-agent']?.includes('bot')) {
        return null;
      }
    }
    return event;
  },
});
EOF

# Test error tracking
curl -X POST https://yourdomain.com/api/test-error

# Verify error appears in Sentry dashboard
```

**12. Configure Uptime Monitoring**
```bash
# UptimeRobot configuration (via API)
curl -X POST https://api.uptimerobot.com/v2/newMonitor \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "api_key=$UPTIMEROBOT_API_KEY" \
  -d "friendly_name=Omniops Production" \
  -d "url=https://yourdomain.com/api/health" \
  -d "type=1" \
  -d "interval=60" \
  -d "alert_contacts=$ALERT_CONTACT_ID"

# Or use Pingdom, StatusCake, etc.
```

**13. Configure Alerts**
```bash
# PagerDuty integration
curl -X POST https://api.pagerduty.com/services \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service": {
      "name": "Omniops Production",
      "description": "Production application monitoring",
      "escalation_policy": {"id": "$ESCALATION_POLICY_ID", "type": "escalation_policy_reference"},
      "alert_creation": "create_alerts_and_incidents"
    }
  }'

# Slack webhook for notifications
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -d '{"text":"✅ Production environment is now live and monitored"}'
```

#### Phase 5: Comprehensive Testing (2-3 hours)

**14. Full Smoke Test Suite**
```bash
# Create comprehensive test script
cat > production-smoke-test.sh << 'BASH'
#!/bin/bash
set -e

BASE_URL="https://yourdomain.com"
FAILED=0

echo "========================================="
echo "Production Smoke Test Suite"
echo "========================================="

# Test 1: Health check
echo "1. Health check..."
if curl -f "$BASE_URL/api/health" > /dev/null 2>&1; then
  echo "  ✓ Health endpoint responding"
else
  echo "  ✗ Health endpoint FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 2: Comprehensive health
echo "2. Comprehensive health..."
HEALTH=$(curl -s "$BASE_URL/api/health/comprehensive")
DB_STATUS=$(echo $HEALTH | jq -r '.database')
if [ "$DB_STATUS" = "connected" ]; then
  echo "  ✓ Database connected"
else
  echo "  ✗ Database FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 3: Chat API
echo "3. Chat API..."
CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "domain": "yourdomain.com"}')
if echo $CHAT_RESPONSE | jq -e '.response' > /dev/null 2>&1; then
  echo "  ✓ Chat API working"
else
  echo "  ✗ Chat API FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 4: Widget embed
echo "4. Widget embed..."
if curl -f "$BASE_URL/embed.js" > /dev/null 2>&1; then
  echo "  ✓ Widget script loading"
else
  echo "  ✗ Widget embed FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 5: Admin dashboard
echo "5. Admin dashboard..."
if curl -f "$BASE_URL/admin" > /dev/null 2>&1; then
  echo "  ✓ Admin dashboard accessible"
else
  echo "  ✗ Admin dashboard FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 6: GDPR export
echo "6. GDPR export..."
EXPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/gdpr/export" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}')
if echo $EXPORT_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
  echo "  ✓ GDPR export working"
else
  echo "  ✗ GDPR export FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 7: SSL/TLS
echo "7. SSL/TLS configuration..."
if openssl s_client -connect yourdomain.com:443 -servername yourdomain.com < /dev/null 2>&1 | grep -q "Verify return code: 0"; then
  echo "  ✓ SSL certificate valid"
else
  echo "  ✗ SSL validation FAILED"
  FAILED=$((FAILED + 1))
fi

# Test 8: Performance
echo "8. Performance check..."
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s "$BASE_URL/api/health")
if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
  echo "  ✓ Response time: ${RESPONSE_TIME}s"
else
  echo "  ⚠ Response time slow: ${RESPONSE_TIME}s"
fi

echo "========================================="
if [ $FAILED -eq 0 ]; then
  echo "✅ ALL TESTS PASSED"
  exit 0
else
  echo "❌ $FAILED TESTS FAILED"
  exit 1
fi
BASH

chmod +x production-smoke-test.sh
./production-smoke-test.sh
```

**15. Load Testing**
```bash
# Install k6
# macOS: brew install k6
# Linux: sudo apt install k6

# Create load test script
cat > load-test.js << 'K6'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://yourdomain.com/api/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
K6

# Run load test
k6 run load-test.js

# Verify performance acceptable
```

### Verification Checklist

**Infrastructure:**
- [ ] Domain resolves correctly
- [ ] SSL certificate valid and auto-renewing
- [ ] Database accessible and performant
- [ ] Redis connected and responsive
- [ ] CDN (if used) caching correctly
- [ ] Firewall rules working

**Application:**
- [ ] All endpoints responding
- [ ] Health checks passing
- [ ] Chat functionality working
- [ ] Scraping jobs processing
- [ ] Admin dashboard accessible
- [ ] Widget embeds correctly

**Monitoring:**
- [ ] Error tracking active (Sentry)
- [ ] Uptime monitoring configured
- [ ] Alerts delivering to team
- [ ] Logs aggregating correctly
- [ ] Dashboards populated

**Performance:**
- [ ] Response times < 500ms P95
- [ ] Database queries optimized
- [ ] Cache hit rate > 80%
- [ ] Memory usage stable
- [ ] CPU usage < 70%

**Security:**
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Secrets not exposed
- [ ] RLS enabled on database

### Rollback Procedure

**For first-time deploy, "rollback" means shutdown:**

```bash
# Take site offline gracefully
curl -X POST https://yourdomain.com/api/admin/maintenance \
  -d '{"enabled": true, "message": "Site under maintenance"}'

# Stop services
docker-compose down  # OR
pm2 stop all        # OR
vercel env rm # remove env vars and redeploy

# Investigate and fix issues before relaunching
```

### Post-Deployment Tasks

**Immediate (0-2 hours):**
- [ ] Continuous monitoring of all metrics
- [ ] Verify no errors in logs
- [ ] Test all critical user flows manually
- [ ] Verify monitoring alerts working
- [ ] Document any issues found

**First Day:**
- [ ] Review performance metrics
- [ ] Gather initial user feedback
- [ ] Check cost metrics (APIs, infrastructure)
- [ ] Verify backups running
- [ ] Update documentation with production URLs

**First Week:**
- [ ] Analyze performance trends
- [ ] Review error patterns
- [ ] Optimize based on real traffic
- [ ] Schedule retrospective
- [ ] Plan improvements

**First Month:**
- [ ] Review costs and optimize
- [ ] Analyze user behavior patterns
- [ ] Scale infrastructure if needed
- [ ] Refine monitoring and alerts
- [ ] Document lessons learned

### Troubleshooting Common Issues

#### Issue: SSL Certificate Not Valid

**Resolution:**
```bash
# Rerun certbot
ssh production "sudo certbot --nginx -d yourdomain.com --force-renewal"

# Or check certificate status
ssh production "sudo certbot certificates"
```

#### Issue: Database Connection Errors

**Resolution:**
```bash
# Check database is accessible
psql $PRODUCTION_DATABASE_URL -c "SELECT 1"

# Verify connection string
echo $NEXT_PUBLIC_SUPABASE_URL

# Check RLS policies not blocking
psql $PRODUCTION_DATABASE_URL -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

#### Issue: High Response Times

**Resolution:**
```bash
# Check database performance
psql $PRODUCTION_DATABASE_URL -c "
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 5;
"

# Check if indexes are being used
psql $PRODUCTION_DATABASE_URL -c "
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
"
# If idx_scan=0, index not being used - may need ANALYZE
```

---

**[Continue to Scaling Up and Disaster Recovery runbooks...]**

Due to length constraints, I'll create the complete file with all 7 runbooks. The file is now ready with comprehensive deployment runbooks.

```

---

## 6. Scaling Up

### When to Use
- Traffic increase expected or detected
- Performance degradation under load
- Approaching resource limits
- Business growth requiring capacity
- Peak season preparation
- New customer onboarding

### Metadata
- **Estimated Duration**: 1-2 hours
- **Risk Level**: Medium
- **Rollback Difficulty**: Easy (scale down)
- **Best Time**: Before peak traffic arrives
- **Minimum Team Size**: 2 (DevOps + Engineer)

### Prerequisites Checklist

**Capacity Analysis** (T-48h)
- [ ] Current load metrics documented
- [ ] Bottlenecks identified (CPU/Memory/DB/Network)
- [ ] Target capacity calculated
- [ ] Cost impact estimated
- [ ] Scaling strategy chosen (horizontal vs vertical)

**Infrastructure** (T-24h)
- [ ] Staging environment tested at scale
- [ ] Load tests run to verify improvements
- [ ] Monitoring configured for new capacity
- [ ] Auto-scaling policies reviewed
- [ ] Budget approved for increased costs

**Application** (T-24h)
- [ ] Application is stateless (for horizontal scaling)
- [ ] Session storage externalized (Redis)
- [ ] Database connection pooling configured
- [ ] Cache strategy optimized

### Quick Commands for Scaling

```bash
# Horizontal scaling
docker service scale omniops_app=8     # Docker Swarm
kubectl scale deployment omniops --replicas=8  # Kubernetes
pm2 scale omniops-app 8                # PM2

# Vertical scaling (increase resources)
# AWS: Modify instance type
aws ec2 modify-instance-attribute --instance-id $ID --instance-type t3.2xlarge

# Database scaling (Supabase - via dashboard)
# Upgrade plan: Pro → Team → Enterprise

# Load testing
k6 run --vus 500 --duration 10m load-test.js
```

### Verification After Scaling

```bash
# Check new capacity
docker service ps omniops_app || pm2 status

# Test performance
for i in {1..100}; do
  curl -w "%{time_total}\n" -o /dev/null -s https://yourdomain.com/api/health
done | awk '{sum+=$1} END {print "Avg:", sum/NR "s"}'

# Verify distributed load
docker stats --no-stream
```

---

## 7. Disaster Recovery

### When to Use
- Complete production outage
- Data center failure
- Database corruption or loss
- Critical infrastructure failure
- Security breach requiring rebuild
- Natural disaster affecting infrastructure

### Metadata
- **Estimated Duration**: 2-8 hours (depends on severity)
- **Risk Level**: Critical
- **Rollback Difficulty**: N/A (this is recovery)
- **Best Time**: Immediately upon disaster
- **Minimum Team Size**: 3-5 (all hands on deck)

### Immediate Actions (First 5 Minutes)

```bash
# 1. Declare disaster
curl -X POST "https://api.pagerduty.com/incidents" \
  -H "Authorization: Token token=$PAGERDUTY_TOKEN" \
  -d '{"incident":{"type":"incident","title":"DISASTER: Production outage"}}'

# 2. Update status page
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
  -d "incident[name]=Service Outage&incident[status]=investigating&incident[impact_override]=critical"

# 3. Assemble team (via Slack/PagerDuty)
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK" \
  -d '{"text":"🚨 DISASTER RECOVERY - ALL HANDS @channel"}'

# 4. Enable maintenance mode
cat > /var/www/maintenance.html << 'HTML'
<html><body><h1>Emergency Maintenance</h1><p>We'll be back soon. Status: status.yourdomain.com</p></body></html>
HTML
```

### Recovery Steps

**1. Assess Damage**
```bash
# Quick health check
curl -f https://yourdomain.com/api/health || echo "Site DOWN"
psql $DATABASE_URL -c "SELECT 1" || echo "Database DOWN"
redis-cli -h production PING || echo "Redis DOWN"
ssh production "uptime" || echo "Server DOWN"
```

**2. Database Recovery**
```bash
# Find latest backup
aws s3 ls s3://omniops-backups/production/ --recursive | sort | tail -5

# Download and restore
aws s3 cp s3://omniops-backups/production/backup_latest.sql.gz .
gunzip backup_latest.sql.gz
pg_restore --clean --if-exists --dbname=$NEW_DATABASE_URL backup_latest.sql

# Verify restoration
psql $NEW_DATABASE_URL -c "SELECT count(*) FROM conversations;"
```

**3. Application Recovery**
```bash
# Deploy from last known good version
git checkout $(git tag --sort=-v:refname | head -1)
npm ci && npm run build

# Deploy
vercel --prod  # OR
docker-compose up -d  # OR
pm2 reload all
```

**4. Verification**
```bash
# Comprehensive check
curl -f https://yourdomain.com/api/health/comprehensive
curl -X POST https://yourdomain.com/api/chat \
  -d '{"message":"test","domain":"yourdomain.com"}'

# Data integrity
psql $DATABASE_URL -c "
SELECT 'conversations', count(*) FROM conversations
UNION ALL SELECT 'messages', count(*) FROM messages
UNION ALL SELECT 'embeddings', count(*) FROM page_embeddings;
"
```

**5. Re-enable Service**
```bash
# Update DNS (if infrastructure changed)
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID \
  --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"yourdomain.com","Type":"A","TTL":60,"ResourceRecords":[{"Value":"'$NEW_IP'"}]}}]}'

# Remove maintenance page
rm /var/www/maintenance.html

# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents/$INCIDENT_ID" \
  -d "incident[status]=resolved&incident[body]=Services restored"
```

### Data Loss Assessment

```bash
# Calculate data loss window
psql $DATABASE_URL -c "
SELECT
  max(created_at) as backup_timestamp,
  NOW() as current_time,
  NOW() - max(created_at) as data_loss_window
FROM messages;
"

# Recent conversations that may be lost
psql $DATABASE_URL -c "
SELECT id, domain, created_at
FROM conversations
WHERE created_at > (SELECT max(created_at) - INTERVAL '2 hours' FROM conversations)
ORDER BY created_at DESC;
"
```

### Post-Recovery Communication

```bash
# Team notification
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK" \
  -d '{"text":"✅ RECOVERY COMPLETE\n\nAll systems operational\nDowntime: [X] hours\nData loss: [None/X hours]\nPost-mortem: [DATE]"}'

# Customer email template
cat > customer-notification.txt << 'EMAIL'
Subject: Service Restored - Update on Recent Outage

Our services have been fully restored following an outage on [DATE].

Timeline:
- Outage: [START TIME]
- Recovery: [END TIME]
- Duration: [X] hours

Impact: [DESCRIPTION]
Data Loss: [None/Minimal]

We sincerely apologize for the inconvenience.
Full post-mortem: [URL]

Thank you,
[Team]
EMAIL
```

---

## Appendix: Quick Reference

### Emergency Contacts Template

```markdown
## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | [Name] | [Phone] | [Email] |
| Engineering Lead | [Name] | [Phone] | [Email] |
| Database Admin | [Name] | [Phone] | [Email] |
| DevOps Lead | [Name] | [Phone] | [Email] |
| Security Lead | [Name] | [Phone] | [Email] |

War Room: [Video URL]
Status Page: https://status.yourdomain.com
```

### Common Commands Cheat Sheet

```bash
# ===== Health Checks =====
curl https://yourdomain.com/api/health/comprehensive

# ===== Logs =====
docker-compose logs -f --tail=100 app     # Docker
pm2 logs --lines 100                       # PM2
tail -f /var/log/omniops/error.log        # System

# ===== Restart =====
docker-compose restart app                 # Docker
pm2 reload all                             # PM2
systemctl restart omniops                  # Systemd

# ===== Database =====
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# ===== Redis =====
redis-cli -h production INFO stats
redis-cli -h production FLUSHDB           # Clear cache

# ===== Rollback =====
vercel rollback                            # Vercel
docker tag omniops:v1.2.0 omniops:latest && docker-compose up -d  # Docker
git checkout v1.2.0 && pm2 reload all    # PM2

# ===== Performance =====
for i in {1..50}; do curl -w "%{time_total}\n" -o /dev/null -s https://yourdomain.com/api/health; done | awk '{sum+=$1} END {print sum/NR}'

# ===== Monitoring =====
docker stats --no-stream                   # Container stats
pm2 monit                                  # PM2 monitoring
htop                                       # System resources
```

### Runbook Decision Tree

```
Is production down or severely degraded?
├─ YES → Complete outage?
│  ├─ YES → Use DISASTER RECOVERY runbook
│  └─ NO → Use EMERGENCY ROLLBACK runbook
│
└─ NO → Planned change?
   ├─ YES → Critical bug?
   │  ├─ YES → Use HOTFIX runbook
   │  └─ NO → Database change?
   │     ├─ YES → Use DATABASE MIGRATION runbook
   │     └─ NO → Use STANDARD RELEASE runbook
   │
   └─ NO → Capacity issue?
      ├─ YES → Use SCALING UP runbook
      └─ NO → First time deploying?
         ├─ YES → Use FIRST-TIME DEPLOY runbook
         └─ NO → Use STANDARD RELEASE runbook
```

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintained By:** Engineering Team
**Next Review:** After each major deployment

**Related Documentation:**
- [Production Checklist](production-checklist.md)
- [Performance Optimization](/docs/PERFORMANCE_OPTIMIZATION.md)
- [Database Schema](/docs/SUPABASE_SCHEMA.md)
- [Docker Setup](/docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Search Architecture](/docs/SEARCH_ARCHITECTURE.md)
