# Phase 4 Deployment Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Target Version:** v0.2.0
**Dependencies:**
- [Phase 4 Planning](../11-PLANNING/PHASE4_PLANNING.md)
- [Rollout Guide](./GUIDE_ROLLOUT_PHASE4.md)
**Estimated Read Time:** 15 minutes

## Purpose
Complete technical deployment procedures for Phase 4 AI-powered features covering environment setup, configuration management, database migrations, feature flag deployment, monitoring setup, backup procedures, and disaster recovery to ensure reliable production deployment.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Configuration Management](#configuration-management)
3. [Database Migrations](#database-migrations)
4. [Application Deployment](#application-deployment)
5. [Feature Flag Management](#feature-flag-management)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup & Disaster Recovery](#backup--disaster-recovery)

---

## Environment Setup

### Prerequisites

**Required Services**:
- PostgreSQL 15+ (Supabase)
- Redis 7+ (for queue management)
- Node.js 20+ (production runtime)
- Docker 24+ (containerized deployment)
- Kubernetes 1.28+ (orchestration)

**API Keys**:
```bash
# OpenAI API (required)
export OPENAI_API_KEY="sk-proj-..."
export OPENAI_ORGANIZATION="org-..."

# Slack (for escalation notifications)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Email (for alerts)
export SENDGRID_API_KEY="SG...."
export ALERT_EMAIL="alerts@omniops.co.uk"
```

### Infrastructure Provisioning

**1. Database Setup**:
```bash
# Increase connection pool for ML workload
supabase db remote set postgres.max_connections 200
supabase db remote set postgres.work_mem '16MB'

# Enable required extensions
psql $DATABASE_URL << EOF
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOF
```

**2. Redis Configuration**:
```yaml
# redis-config.yaml
maxmemory: 10gb
maxmemory-policy: allkeys-lru
timeout: 300
tcp-keepalive: 60

# Queue-specific settings
save: ""  # Disable persistence for queue data
appendonly: no
```

**3. OpenAI Rate Limits**:
```bash
# Request rate limit increase (do 2 weeks before launch)
curl https://api.openai.com/v1/rate_limit_increase \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "tier": "tier-3",
    "estimated_monthly_spend": 10000,
    "justification": "Production AI customer service platform, 1000+ customers"
  }'
```

---

## Configuration Management

### Environment Variables

**Production `.env` configuration**:
```bash
# === Core Settings ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://omniops.co.uk

# === Database ===
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.birugqyuqhiahxvxeyqg.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://birugqyuqhiahxvxeyqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Redis ===
REDIS_URL=rediss://production-redis.omniops.co.uk:6380
REDIS_PASSWORD=[PASSWORD]

# === OpenAI ===
OPENAI_API_KEY=sk-proj-...
OPENAI_ORGANIZATION=org-...
OPENAI_MODEL_SENTIMENT=gpt-4o-mini-2024-07-18
OPENAI_MODEL_SUGGESTIONS=gpt-4o-mini-2024-07-18
OPENAI_MODEL_PREDICTIONS=gpt-4-turbo-2024-04-09

# === Phase 4 Feature Flags (initially OFF) ===
FEATURE_SENTIMENT_ANALYSIS=false
FEATURE_RESPONSE_SUGGESTIONS=false
FEATURE_AUTO_CATEGORIZATION=false
FEATURE_PREDICTIVE_ANALYTICS=false
FEATURE_AUTO_ESCALATION=false
FEATURE_CONVERSATION_INSIGHTS=false

# === Phase 4 Configuration ===
SENTIMENT_ANALYSIS_ENABLED=true
SENTIMENT_CONFIDENCE_THRESHOLD=0.7
ESCALATION_SENTIMENT_THRESHOLD=0.3
SUGGESTION_GENERATION_TIMEOUT=5000
BATCH_PROCESSING_INTERVAL=300000  # 5 minutes
INSIGHTS_EXTRACTION_SCHEDULE="0 */6 * * *"  # Every 6 hours

# === Monitoring ===
SENTRY_DSN=https://[KEY]@sentry.io/[PROJECT]
DATADOG_API_KEY=[KEY]
LOG_LEVEL=info

# === Alerts ===
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@omniops.co.uk
PAGERDUTY_INTEGRATION_KEY=[KEY]
```

### Feature Flag Configuration

**Gradual Rollout Strategy**:
```typescript
// config/feature-flags.ts
export const PHASE4_ROLLOUT_CONFIG = {
  sentiment_analysis: {
    enabled: true,
    rollout_percentage: 0, // Start at 0%
    beta_customers: [
      'thompson-engineering',
      'techsupport-co',
      'fooddelivery-inc'
    ]
  },
  response_suggestions: {
    enabled: true,
    rollout_percentage: 0,
    requires: ['sentiment_analysis'] // Dependency
  },
  auto_escalation: {
    enabled: true,
    rollout_percentage: 0,
    requires: ['sentiment_analysis']
  }
};
```

---

## Database Migrations

### Migration Sequence

**Step 1: Create Phase 4 Tables** (5 minutes):
```bash
# Run migration
npx supabase migration up

# Verify tables created
psql $DATABASE_URL << EOF
\dt sentiment_analysis
\dt response_suggestions
\dt conversation_categories
\dt prediction_analysis
\dt escalation_rules
\dt escalation_events
\dt conversation_insights
EOF
```

**Migration SQL** (`migrations/20251103_phase4_tables.sql`):
```sql
-- See full schema in PHASE4_PLANNING.md
-- Execute with zero-downtime strategy

BEGIN;

-- 1. Create tables (fast, no data migration)
CREATE TABLE sentiment_analysis (...);
CREATE TABLE response_suggestions (...);
CREATE TABLE conversation_categories (...);
CREATE TABLE prediction_analysis (...);
CREATE TABLE escalation_rules (...);
CREATE TABLE escalation_events (...);
CREATE TABLE conversation_insights (...);

-- 2. Create indexes (may take longer on large tables)
CREATE INDEX idx_sentiment_conversation ON sentiment_analysis(...);
-- ... (see full list in PHASE4_PLANNING.md)

-- 3. Add foreign keys
ALTER TABLE sentiment_analysis
  ADD CONSTRAINT fk_sentiment_message
  FOREIGN KEY (message_id) REFERENCES messages(id)
  ON DELETE CASCADE;

-- 4. Enable RLS
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
-- ... (policies defined separately)

COMMIT;
```

**Step 2: Backfill Historical Data** (optional, 30 minutes):
```bash
# Backfill sentiment analysis for last 7 days
npx tsx scripts/backfill-sentiment-analysis.ts \
  --days=7 \
  --batch-size=100 \
  --dry-run  # Test first

# After verifying dry-run:
npx tsx scripts/backfill-sentiment-analysis.ts --days=7
```

**Step 3: Verify Migration**:
```sql
-- Check row counts
SELECT
  'sentiment_analysis' as table_name,
  COUNT(*) as rows
FROM sentiment_analysis
UNION ALL
SELECT 'response_suggestions', COUNT(*) FROM response_suggestions
UNION ALL
SELECT 'conversation_categories', COUNT(*) FROM conversation_categories;

-- Check foreign key constraints
SELECT
  conname,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND conrelid::regclass::text LIKE '%sentiment%'
     OR conrelid::regclass::text LIKE '%escalation%';
```

---

## Application Deployment

### Build Process

```bash
# 1. Install dependencies
npm ci --production

# 2. Build Next.js application
npm run build

# 3. Run production build tests
npm test -- --coverage

# 4. Type checking
npx tsc --noEmit

# 5. Lint
npm run lint
```

### Docker Deployment

**Dockerfile.phase4**:
```dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/public ./public

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and Push**:
```bash
# Build image
docker build -f Dockerfile.phase4 -t omniops:phase4-v0.2.0 .

# Tag for registry
docker tag omniops:phase4-v0.2.0 \
  registry.digitalocean.com/omniops/app:phase4-v0.2.0

# Push to registry
docker push registry.digitalocean.com/omniops/app:phase4-v0.2.0
```

### Kubernetes Deployment

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: omniops-phase4
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero downtime
  selector:
    matchLabels:
      app: omniops
      version: phase4-v0.2.0
  template:
    metadata:
      labels:
        app: omniops
        version: phase4-v0.2.0
    spec:
      containers:
      - name: omniops
        image: registry.digitalocean.com/omniops/app:phase4-v0.2.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: omniops-secrets
              key: database-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: omniops-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Deploy**:
```bash
# Apply deployment
kubectl apply -f k8s/deployment.yaml

# Monitor rollout
kubectl rollout status deployment/omniops-phase4 -n production

# Check pods
kubectl get pods -n production -l app=omniops

# View logs
kubectl logs -f deployment/omniops-phase4 -n production
```

---

## Feature Flag Management

### LaunchDarkly Integration

**Initialize SDK**:
```typescript
// lib/feature-flags.ts
import { init } from 'launchdarkly-node-server-sdk';

const ldClient = init(process.env.LAUNCHDARKLY_SDK_KEY!);

export async function isFeatureEnabled(
  flagKey: string,
  context: { customerId: string }
): Promise<boolean> {
  await ldClient.waitForInitialization();
  return ldClient.variation(flagKey, context, false);
}
```

**Feature Flag Definitions**:
```json
{
  "sentiment-analysis": {
    "key": "sentiment-analysis",
    "variations": [true, false],
    "rollout": {
      "percentage": 0,
      "whitelist": ["thompson-engineering", "techsupport-co"]
    }
  },
  "response-suggestions": {
    "key": "response-suggestions",
    "variations": [true, false],
    "prerequisites": ["sentiment-analysis"]
  }
}
```

### Gradual Rollout Commands

```bash
# Increase rollout to 10%
curl -X PATCH https://app.launchdarkly.com/api/v2/flags/production/sentiment-analysis \
  -H "Authorization: api-key-xxx" \
  -d '{"rollout": {"percentage": 10}}'

# Enable for specific customer
curl -X PATCH https://app.launchdarkly.com/api/v2/flags/production/sentiment-analysis \
  -H "Authorization: api-key-xxx" \
  -d '{"whitelist": ["customer-id-here"]}'
```

---

## Monitoring Setup

### Datadog Dashboards

**Phase 4 Performance Dashboard**:
```json
{
  "dashboard_id": "phase4-performance",
  "widgets": [
    {
      "title": "Sentiment Analysis Latency",
      "metric": "omniops.sentiment.latency",
      "aggregation": "p95",
      "threshold": 1000
    },
    {
      "title": "ML API Error Rate",
      "metric": "omniops.ml_api.errors",
      "aggregation": "rate",
      "threshold": 0.005
    },
    {
      "title": "Queue Lag",
      "metric": "omniops.queue.lag",
      "aggregation": "max",
      "threshold": 30
    }
  ]
}
```

### Alert Rules

**PagerDuty Integration**:
```yaml
# alerts/phase4-critical.yaml
alerts:
  - name: "Phase 4 Error Rate Critical"
    metric: omniops.phase4.errors
    threshold: 1.0  # 1% error rate
    duration: 5m
    severity: critical
    notification_channels:
      - pagerduty
      - slack

  - name: "ML API Unavailable"
    metric: omniops.ml_api.availability
    threshold: 0.95  # Below 95% uptime
    duration: 2m
    severity: critical
    notification_channels:
      - pagerduty
      - slack

  - name: "Cost Spike"
    metric: omniops.ml_api.cost_daily
    threshold: 1200  # 200% of daily budget
    duration: 1h
    severity: warning
    notification_channels:
      - slack
      - email
```

---

## Backup & Disaster Recovery

### Backup Strategy

**Database Backups**:
```bash
# Full backup before migration (automated)
pg_dump $DATABASE_URL \
  --format=custom \
  --file=backup_pre_phase4_$(date +%Y%m%d_%H%M%S).dump

# Incremental backups (every 6 hours)
pg_basebackup -D /backups/incremental -F tar -z -P

# Verify backup
pg_restore --list backup_pre_phase4_*.dump | head -20
```

**Backup Retention**:
- Pre-migration: Keep forever
- Daily: 30 days
- Weekly: 90 days
- Monthly: 1 year

### Disaster Recovery Procedures

**Scenario 1: Database Corruption**:
```bash
# 1. Stop all writes
kubectl scale deployment/omniops-phase4 --replicas=0

# 2. Restore from backup
pg_restore -d postgres -j 8 \
  --clean --if-exists \
  backup_pre_phase4_20251103_090000.dump

# 3. Verify data integrity
psql $DATABASE_URL < scripts/verify-data-integrity.sql

# 4. Resume traffic
kubectl scale deployment/omniops-phase4 --replicas=3
```

**Scenario 2: Redis Failure**:
```bash
# Redis is stateless for queues - no restore needed
# Just restart service and requeue failed jobs

# 1. Restart Redis
kubectl rollout restart statefulset/redis -n production

# 2. Requeue failed jobs (from database)
npx tsx scripts/requeue-failed-jobs.ts
```

**Recovery Time Objectives**:
- Database restore: < 1 hour (RTO)
- Data loss tolerance: < 15 minutes (RPO)
- Service availability: 99.9% uptime

---

## Deployment Checklist

### Pre-Deployment (Day Before)

- [ ] Database backup completed and verified
- [ ] Staging environment tested with production data clone
- [ ] Load tests passed (5,000 concurrent requests)
- [ ] Feature flags configured (all OFF initially)
- [ ] Monitoring dashboards configured
- [ ] Alert rules tested
- [ ] On-call rotation assigned
- [ ] Communication sent to customers (7-day notice)

### Deployment Day

- [ ] War room scheduled (Zoom link shared)
- [ ] Deploy to production (10 AM GMT)
- [ ] Verify health checks passing
- [ ] Run smoke tests
- [ ] Enable features for internal testing (10:30 AM)
- [ ] Monitor for 2 hours
- [ ] Enable for beta customers (2 PM)
- [ ] Monitor until EOD

### Post-Deployment (Next Day)

- [ ] Review metrics from first 24 hours
- [ ] Check cost reports
- [ ] Collect beta customer feedback
- [ ] Fix any P1/P0 bugs
- [ ] Update documentation with learnings
- [ ] Team retrospective scheduled

---

**Document Status**: ✅ Ready for deployment
**Next Review**: 2025-11-10
**Owner**: DevOps & Engineering Teams
