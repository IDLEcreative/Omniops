# Rollback Procedures Runbook

**Type:** Runbook
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Docker, Supabase, Vercel, Git
**Estimated Read Time:** 10 minutes
**Criticality:** HIGH

## Purpose
Step-by-step procedures for rolling back deployments when issues are discovered in production. Covers Docker, database, and cloud provider rollbacks.

## Quick Links
- [Backup Strategy](./RUNBOOK_BACKUP_STRATEGY.md)
- [Disaster Recovery](./RUNBOOK_DISASTER_RECOVERY.md)
- [Docker Setup](../00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)

## Table of Contents
- [When to Rollback](#when-to-rollback)
- [Pre-Rollback Checklist](#pre-rollback-checklist)
- [Docker Rollback Procedure](#docker-rollback-procedure)
- [Database Rollback Procedure](#database-rollback-procedure)
- [Vercel Rollback Procedure](#vercel-rollback-procedure)
- [Verification Steps](#verification-steps)
- [Communication Plan](#communication-plan)
- [Post-Mortem Template](#post-mortem-template)

---

## When to Rollback

### Critical Triggers (Immediate Rollback)
- ❌ Complete service outage (site unreachable)
- ❌ Data corruption or loss
- ❌ Security breach or vulnerability exposed
- ❌ Payment processing failures
- ❌ Critical functionality broken (chat, scraping)
- ❌ Performance degradation >50%

### Warning Triggers (Evaluate Rollback)
- ⚠️ Error rate spike >10%
- ⚠️ Response time increase >30%
- ⚠️ Memory/CPU usage spike >80%
- ⚠️ Non-critical features broken
- ⚠️ UI/UX issues affecting <10% users

## Pre-Rollback Checklist

```bash
# 1. Capture current state for post-mortem
docker-compose logs -t > logs/rollback-$(date +%Y%m%d-%H%M%S).log
docker-compose ps > logs/rollback-state-$(date +%Y%m%d-%H%M%S).txt

# 2. Check database state
echo "SELECT COUNT(*) FROM conversations;" | docker exec -i omniops-postgres psql -U postgres
echo "SELECT version FROM migrations ORDER BY id DESC LIMIT 1;" | docker exec -i omniops-postgres psql -U postgres

# 3. Record current deployment version
git rev-parse HEAD > logs/rollback-from-commit-$(date +%Y%m%d-%H%M%S).txt
docker images | grep omniops >> logs/rollback-from-commit-$(date +%Y%m%d-%H%M%S).txt

# 4. Export current environment variables
docker exec omniops-app env | grep -v "PASSWORD\|KEY\|SECRET" > logs/rollback-env-$(date +%Y%m%d-%H%M%S).txt

# 5. Take screenshot of error (if UI issue)
# Use browser developer tools to capture console errors
```

## Docker Rollback Procedure

### Option 1: Quick Rollback to Previous Image

```bash
# 1. Stop current containers
docker-compose down

# 2. List available images to find previous version
docker images | grep omniops
# Output example:
# omniops-app    latest    abc123    1 hour ago     1.2GB
# omniops-app    v0.0.9    def456    2 days ago     1.2GB

# 3. Tag previous version as latest
docker tag omniops-app:v0.0.9 omniops-app:latest

# 4. Start with previous version
docker-compose up -d

# 5. Verify rollback
docker-compose ps
curl -I http://localhost:3000
docker-compose logs -f app --tail=100
```

### Option 2: Git-Based Rollback

```bash
# 1. Stop current deployment
docker-compose down

# 2. Find last known good commit
git log --oneline -10
# Identify the commit hash of last stable version

# 3. Checkout previous version
git checkout <COMMIT_HASH>

# 4. Rebuild with previous code
DOCKER_BUILDKIT=1 docker-compose build --no-cache

# 5. Start fresh containers
docker-compose up -d

# 6. Verify services
docker-compose ps
curl http://localhost:3000/api/health
```

### Option 3: Volume Restoration (if data issues)

```bash
# 1. Stop all services
docker-compose down

# 2. List volumes
docker volume ls | grep omniops

# 3. Create backup of current volume (for investigation)
docker run --rm -v omniops_postgres_data:/data \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/postgres-rollback-$(date +%Y%m%d-%H%M%S).tar.gz /data

# 4. Restore from backup
docker run --rm -v omniops_postgres_data:/data \
  -v $(pwd)/backup:/backup \
  alpine sh -c "cd /data && tar xzf /backup/postgres-backup-YYYYMMDD.tar.gz --strip 1"

# 5. Restart services
docker-compose up -d
```

## Database Rollback Procedure

### Supabase Migration Rollback

```bash
# 1. Connect to Supabase dashboard
# Navigate to: https://app.supabase.com/project/[PROJECT_REF]/database/migrations

# 2. Via Supabase CLI (if configured)
cd /home/user/Omniops
supabase db reset --local  # For local development
# For production, use dashboard or management API

# 3. Via Management API
export SUPABASE_ACCESS_TOKEN='sbp_...'
export PROJECT_REF='birugqyuqhiahxvxeyqg'

# Get migration history
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"}'

# Rollback specific migration (example)
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "DELETE FROM supabase_migrations.schema_migrations WHERE version = '\''20251118120000'\''; -- Then run down migration SQL"}'
```

### Point-in-Time Recovery (Supabase Pro)

```bash
# For Supabase Pro plans only
# 1. Navigate to dashboard backups section
# 2. Select point-in-time before issue occurred
# 3. Initiate restore (creates new database)
# 4. Update connection strings in .env.local

# Verify restored data
npx tsx scripts/database/verify-restore.ts
```

## Vercel Rollback Procedure

### Via Vercel Dashboard

```bash
# 1. Navigate to Vercel dashboard
open https://vercel.com/[TEAM]/omniops/deployments

# 2. Find last successful deployment
# Look for green checkmark, before current broken deployment

# 3. Click "..." menu → "Promote to Production"
# This instantly switches production traffic

# 4. Verify rollback
curl -I https://omniops.vercel.app
curl https://omniops.vercel.app/api/health
```

### Via Vercel CLI

```bash
# 1. Install Vercel CLI if not present
npm i -g vercel

# 2. List recent deployments
vercel list --count 10

# 3. Find deployment URL of last good version
# Example: omniops-abc123def.vercel.app

# 4. Promote previous deployment
vercel promote omniops-abc123def.vercel.app

# 5. Verify production updated
vercel inspect omniops.vercel.app
```

## Verification Steps

### After Any Rollback

```bash
# 1. Health checks
curl http://localhost:3000/api/health
curl http://localhost:3000/api/scrape/health
curl http://localhost:3000/api/chat/health

# 2. Database connectivity
npx tsx scripts/database/test-connection.ts

# 3. Redis connectivity
docker exec omniops-redis redis-cli ping

# 4. Core functionality tests
npm run test:e2e:critical  # Run critical path tests

# 5. Monitor logs (separate terminals)
docker-compose logs -f app
docker-compose logs -f redis
tail -f logs/application.log

# 6. Check error rates
# Monitor for 15 minutes post-rollback
watch -n 60 'docker-compose logs app | grep -c ERROR'

# 7. Performance metrics
npx tsx scripts/monitoring/check-performance.ts
```

### Smoke Tests

```bash
# Widget loading
curl http://localhost:3000/embed.js | head -20

# Chat functionality
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "domain": "test.com"}'

# Scraping status
curl http://localhost:3000/api/scrape/status?domain=test.com
```

## Communication Plan

### Internal Communication

```markdown
**ROLLBACK INITIATED**
Time: [TIMESTAMP]
Reason: [Brief description]
Impact: [User impact]
ETA: [Expected resolution time]

Actions taken:
- [ ] Production rolled back to [VERSION]
- [ ] Monitoring increased
- [ ] Root cause investigation started

Next update in: 30 minutes
```

### Customer Communication

```markdown
**Service Notification**

We're experiencing technical difficulties with [FEATURE].
Our team is actively working on a resolution.

Current Status: Investigating
Impact: [Minimal/Partial/Full]
Workaround: [If available]

We'll update this status every 30 minutes.
Last updated: [TIMESTAMP]
```

### Status Page Update

```bash
# Update status page (if using Statuspage.io or similar)
curl -X POST https://api.statuspage.io/v1/pages/[PAGE_ID]/incidents \
  -H "Authorization: OAuth [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "Service degradation",
      "status": "investigating",
      "impact_override": "minor",
      "body": "We are investigating issues with the application."
    }
  }'
```

## Post-Mortem Template

### Document: `ARCHIVE/incidents/YYYY-MM-DD-incident-name.md`

```markdown
# Incident Post-Mortem: [TITLE]

**Date:** YYYY-MM-DD
**Duration:** HH:MM (from XX:XX to XX:XX UTC)
**Severity:** Critical/High/Medium/Low
**Customer Impact:** [Number affected, features impacted]

## Timeline
- **HH:MM** - Issue detected via [monitoring/customer report]
- **HH:MM** - Investigation started
- **HH:MM** - Root cause identified
- **HH:MM** - Rollback decision made
- **HH:MM** - Rollback initiated
- **HH:MM** - Service restored
- **HH:MM** - Monitoring confirmed stability

## Root Cause
[Detailed technical explanation]

## Impact
- Customers affected: X
- Revenue impact: $X
- Features affected: [List]
- Data loss: None/[Details]

## What Went Well
- [Quick detection]
- [Smooth rollback process]
- [Team communication]

## What Went Wrong
- [Testing gap]
- [Monitoring blind spot]
- [Process failure]

## Action Items
- [ ] [Preventive measure 1] - Owner: @person - Due: DATE
- [ ] [Preventive measure 2] - Owner: @person - Due: DATE
- [ ] [Process improvement] - Owner: @person - Due: DATE

## Lessons Learned
[Key takeaways for the team]
```

## Rollback Decision Matrix

| Severity | User Impact | Business Impact | Response Time | Rollback? |
|----------|-------------|-----------------|---------------|-----------|
| Critical | >50% users | Revenue loss | <5 min | ✅ YES |
| High | 10-50% users | Feature broken | <15 min | ✅ YES |
| Medium | <10% users | Degraded UX | <30 min | ⚠️ EVALUATE |
| Low | <1% users | Minor issues | <1 hour | ❌ FIX FORWARD |

## Recovery Time Targets

- **Detection → Decision:** <5 minutes
- **Decision → Rollback Started:** <2 minutes
- **Rollback Started → Service Restored:** <10 minutes
- **Total Recovery Time:** <20 minutes

## Automated Rollback Script

Save as `/home/user/Omniops/scripts/operations/emergency-rollback.sh`:

```bash
#!/bin/bash
# Emergency rollback script
set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Time: $(date)"

# Create incident directory
INCIDENT_DIR="logs/incident-$(date +%Y%m%d-%H%M%S)"
mkdir -p $INCIDENT_DIR

# Capture current state
docker-compose logs -t > $INCIDENT_DIR/docker-logs.txt
docker-compose ps > $INCIDENT_DIR/container-state.txt
git rev-parse HEAD > $INCIDENT_DIR/git-commit.txt

# Stop services
echo "Stopping services..."
docker-compose down

# Rollback to last known good
if [ -f .last-known-good ]; then
    GOOD_COMMIT=$(cat .last-known-good)
    echo "Rolling back to: $GOOD_COMMIT"
    git checkout $GOOD_COMMIT
else
    echo "Rolling back 1 commit"
    git checkout HEAD~1
fi

# Rebuild and restart
echo "Rebuilding..."
DOCKER_BUILDKIT=1 docker-compose build

echo "Starting services..."
docker-compose up -d

# Verify
sleep 10
curl -f http://localhost:3000/api/health || echo "Health check failed!"

echo "✅ Rollback complete. Please verify services."
echo "Logs saved to: $INCIDENT_DIR"
```

Make executable: `chmod +x scripts/operations/emergency-rollback.sh`