# Disaster Recovery Plan

**Type:** Runbook
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Supabase, Vercel, Docker, AWS/GCP
**Estimated Read Time:** 12 minutes
**Criticality:** CRITICAL

## Purpose
Comprehensive disaster recovery procedures for various catastrophic scenarios including complete outages, data corruption, security breaches, and regional failures. Provides step-by-step recovery procedures with clear ownership and timelines.

## Quick Links
- [Rollback Procedures](./RUNBOOK_ROLLBACK_PROCEDURES.md)
- [Backup Strategy](./RUNBOOK_BACKUP_STRATEGY.md)
- [Capacity Planning](./GUIDE_CAPACITY_PLANNING.md)

## Table of Contents
- [Disaster Scenarios](#disaster-scenarios)
- [Severity Levels](#severity-levels)
- [Recovery Procedures](#recovery-procedures)
- [Failover Procedures](#failover-procedures)
- [Communication Tree](#communication-tree)
- [Service Restoration](#service-restoration)
- [Data Recovery](#data-recovery)
- [Post-Disaster Testing](#post-disaster-testing)
- [DR Testing Schedule](#dr-testing-schedule)

---

## Disaster Scenarios

### Scenario Classification

| Scenario | Probability | Impact | Priority | Recovery Strategy |
|----------|-------------|--------|----------|-------------------|
| **Complete Outage** | Low | Critical | P0 | Full failover |
| **Data Corruption** | Medium | Critical | P0 | Point-in-time restore |
| **Security Breach** | Medium | Critical | P0 | Isolate & rebuild |
| **Regional Failure** | Low | High | P1 | Cross-region failover |
| **DDoS Attack** | High | Medium | P1 | Traffic filtering |
| **Provider Outage** | Medium | High | P1 | Multi-provider strategy |
| **Human Error** | High | Variable | P2 | Rollback procedures |
| **Hardware Failure** | Medium | Low | P2 | Container restart |

## Severity Levels

### SEV-1: Critical Disaster
**Definition:** Complete service unavailable, data loss risk, security breach
**Response Time:** <5 minutes
**Team:** All hands on deck
**Authority:** Any engineer can initiate DR

### SEV-2: Major Incident
**Definition:** Partial outage, degraded performance, data integrity concerns
**Response Time:** <15 minutes
**Team:** On-call + backup
**Authority:** Senior engineer approval

### SEV-3: Minor Incident
**Definition:** Feature unavailable, slow response, isolated issues
**Response Time:** <1 hour
**Team:** On-call engineer
**Authority:** Standard procedures

## Recovery Procedures

### Scenario 1: Complete Service Outage

```bash
#!/bin/bash
# DISASTER RECOVERY: Complete Outage
# Time to Recovery: 30 minutes

# Phase 1: Assessment (5 minutes)
echo "=== PHASE 1: ASSESSMENT ==="
# Check all services
curl -I https://omniops.vercel.app || echo "Main site DOWN"
curl -I https://app.supabase.com/project/birugqyuqhiahxvxeyqg || echo "Database DOWN"
docker-compose ps || echo "Docker services DOWN"

# Identify root cause
if [ $? -ne 0 ]; then
  echo "CRITICAL: Multiple systems down"
  echo "Initiating full disaster recovery..."
fi

# Phase 2: Immediate Mitigation (5 minutes)
echo "=== PHASE 2: MITIGATION ==="
# Enable maintenance mode
cat > /tmp/maintenance.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Maintenance</title></head>
<body>
  <h1>We'll be back soon!</h1>
  <p>We're performing emergency maintenance. ETA: 30 minutes</p>
</body>
</html>
EOF

# Deploy maintenance page to CDN
aws s3 cp /tmp/maintenance.html s3://omniops-static/index.html
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"

# Phase 3: Failover Activation (10 minutes)
echo "=== PHASE 3: FAILOVER ==="
# Switch to backup region
export BACKUP_REGION="us-west-2"
export PRIMARY_REGION="us-east-1"

# Update DNS to point to backup
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "omniops.co.uk",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "backup.omniops.co.uk",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'

# Deploy backup infrastructure
cd infrastructure/disaster-recovery
terraform apply -auto-approve -var="region=$BACKUP_REGION"

# Phase 4: Service Restoration (10 minutes)
echo "=== PHASE 4: RESTORATION ==="
# Restore database from backup
LATEST_BACKUP=$(aws s3 ls s3://omniops-backups/database/ | tail -1 | awk '{print $4}')
aws s3 cp s3://omniops-backups/database/$LATEST_BACKUP /tmp/restore.sql.gz

# Create new Supabase project (via API)
curl -X POST https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "omniops-dr",
    "region": "us-west-2",
    "plan": "pro"
  }'

# Import data
gunzip /tmp/restore.sql.gz
supabase db push --db-url "postgresql://postgres:password@new-host/postgres"

# Deploy application to backup region
vercel --prod --env SUPABASE_URL=$NEW_SUPABASE_URL

# Phase 5: Validation (5 minutes)
echo "=== PHASE 5: VALIDATION ==="
# Run smoke tests
npm run test:e2e:critical

# Check metrics
curl https://backup.omniops.co.uk/api/health
curl https://backup.omniops.co.uk/api/chat/health

echo "✅ Disaster recovery complete"
echo "Service restored to backup region: $BACKUP_REGION"
```

### Scenario 2: Data Corruption

```bash
#!/bin/bash
# DISASTER RECOVERY: Data Corruption
# Time to Recovery: 45 minutes

# Phase 1: Identify Corruption (10 minutes)
echo "=== IDENTIFYING CORRUPTION ==="

# Check data integrity
npx tsx scripts/database/check-integrity.ts

# Find corruption timestamp
CORRUPTION_TIME=$(psql -c "
  SELECT MIN(updated_at)
  FROM audit_log
  WHERE action LIKE '%corrupt%'
  OR action LIKE '%invalid%'
" | head -3 | tail -1)

echo "Corruption detected at: $CORRUPTION_TIME"

# Phase 2: Isolate Affected Data (5 minutes)
echo "=== ISOLATING CORRUPTION ==="

# Create quarantine tables
psql <<EOF
-- Quarantine corrupted data
CREATE SCHEMA quarantine;
CREATE TABLE quarantine.customer_configs AS
  SELECT * FROM customer_configs
  WHERE updated_at >= '$CORRUPTION_TIME';

-- Remove corrupted records
DELETE FROM customer_configs
WHERE updated_at >= '$CORRUPTION_TIME';
EOF

# Phase 3: Point-in-Time Recovery (20 minutes)
echo "=== POINT-IN-TIME RECOVERY ==="

# Use Supabase PITR (Pro feature)
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/pitr" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recovery_time": "'$CORRUPTION_TIME'",
    "target_database": "omniops_recovery"
  }'

# Wait for recovery
while [ $(check_recovery_status) != "complete" ]; do
  sleep 30
  echo "Recovery in progress..."
done

# Phase 4: Data Reconciliation (10 minutes)
echo "=== DATA RECONCILIATION ==="

# Compare and merge valid data
npx tsx scripts/recovery/reconcile-data.ts \
  --source=omniops_recovery \
  --target=omniops \
  --quarantine=quarantine

# Verify data integrity
npx tsx scripts/database/verify-integrity.ts

echo "✅ Data corruption resolved"
```

### Scenario 3: Security Breach

```bash
#!/bin/bash
# DISASTER RECOVERY: Security Breach
# Time to Recovery: 2 hours

# Phase 1: Immediate Containment (10 minutes)
echo "=== IMMEDIATE CONTAINMENT ==="

# Revoke all access tokens
psql -c "UPDATE auth.users SET confirmed_at = NULL;"
psql -c "DELETE FROM auth.refresh_tokens;"
psql -c "DELETE FROM auth.sessions;"

# Rotate all secrets
echo "Rotating credentials..."
NEW_JWT_SECRET=$(openssl rand -base64 32)
NEW_ANON_KEY=$(openssl rand -base64 32)
NEW_SERVICE_KEY=$(openssl rand -base64 32)

# Update environment variables
vercel env rm SUPABASE_JWT_SECRET --yes
vercel env add SUPABASE_JWT_SECRET --production "$NEW_JWT_SECRET"

# Disable public access
curl -X PATCH \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/settings" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -d '{"public_access_enabled": false}'

# Phase 2: Forensics (30 minutes)
echo "=== FORENSIC ANALYSIS ==="

# Capture evidence
mkdir -p /tmp/incident-$(date +%Y%m%d)
cd /tmp/incident-$(date +%Y%m%d)

# Export audit logs
psql -c "COPY (
  SELECT * FROM audit_log
  WHERE created_at > NOW() - INTERVAL '7 days'
) TO STDOUT CSV HEADER" > audit.csv

# Export access logs
docker-compose logs > docker.log
vercel logs --output raw > vercel.log

# Check for data exfiltration
npx tsx scripts/security/detect-exfiltration.ts > exfiltration.json

# Phase 3: System Rebuild (60 minutes)
echo "=== SYSTEM REBUILD ==="

# Create clean environment
terraform destroy -auto-approve
terraform apply -auto-approve

# Restore from secure backup
SECURE_BACKUP=$(aws s3 ls s3://omniops-secure-backups/ | tail -1)
aws s3 cp s3://omniops-secure-backups/$SECURE_BACKUP /tmp/secure.sql.gz.enc

# Decrypt and restore
openssl enc -d -aes-256-cbc \
  -in /tmp/secure.sql.gz.enc \
  -out /tmp/secure.sql.gz \
  -k "$BACKUP_ENCRYPTION_KEY"

gunzip /tmp/secure.sql.gz
psql < /tmp/secure.sql

# Phase 4: Security Hardening (20 minutes)
echo "=== SECURITY HARDENING ==="

# Enable additional security
psql <<EOF
-- Enable RLS on all tables
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add security policies
CREATE POLICY "Users can only see own data"
  ON customer_configs
  FOR ALL
  USING (auth.uid() = user_id);
EOF

# Enable WAF rules
aws wafv2 put-web-acl \
  --scope REGIONAL \
  --id ACL_ID \
  --lock-token TOKEN \
  --rules file://waf-rules.json

# Phase 5: Controlled Restoration (10 minutes)
echo "=== CONTROLLED RESTORATION ==="

# Gradual service restoration
vercel alias omniops-staging.vercel.app staging.omniops.co.uk

# Monitor for 30 minutes
npm run monitor:security

# If clean, promote to production
vercel promote omniops-staging.vercel.app

echo "✅ Security incident resolved"
echo "📧 Remember to notify affected users"
```

## Failover Procedures

### Regional Failover

```yaml
# Failover Configuration
regions:
  primary:
    name: us-east-1
    provider: AWS
    services:
      - Vercel deployment
      - Supabase project
      - Redis cluster

  secondary:
    name: us-west-2
    provider: AWS
    services:
      - Standby Vercel
      - Replicated Supabase
      - Redis replica

  tertiary:
    name: eu-west-1
    provider: AWS
    services:
      - Cold standby
      - Backup storage
```

### Failover Decision Matrix

| Trigger | Automatic | Manual Approval | Failback |
|---------|-----------|-----------------|----------|
| Region down >5 min | ✅ | ❌ | Manual |
| Database unreachable | ❌ | ✅ | Auto |
| 500 errors >50% | ✅ | ❌ | Manual |
| DDoS attack | ✅ | ❌ | Manual |
| Data corruption | ❌ | ✅ | Manual |

### Automated Failover Script

```typescript
// scripts/disaster-recovery/auto-failover.ts
import { Route53, CloudWatch } from 'aws-sdk';

const route53 = new Route53();
const cloudwatch = new CloudWatch();

async function checkPrimaryHealth(): Promise<boolean> {
  try {
    const response = await fetch('https://omniops.co.uk/api/health');
    return response.status === 200;
  } catch {
    return false;
  }
}

async function triggerFailover() {
  console.log('🚨 TRIGGERING FAILOVER');

  // Update Route53 weighted routing
  await route53.changeResourceRecordSets({
    HostedZoneId: process.env.HOSTED_ZONE_ID,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: 'omniops.co.uk',
            Type: 'A',
            SetIdentifier: 'Primary',
            Weight: 0,  // Disable primary
            AliasTarget: {
              HostedZoneId: 'Z2FDTNDATAQYW2',
              DNSName: 'primary.omniops.co.uk',
              EvaluateTargetHealth: false
            }
          }
        },
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: 'omniops.co.uk',
            Type: 'A',
            SetIdentifier: 'Secondary',
            Weight: 100,  // Enable secondary
            AliasTarget: {
              HostedZoneId: 'Z2FDTNDATAQYW2',
              DNSName: 'secondary.omniops.co.uk',
              EvaluateTargetHealth: false
            }
          }
        }
      ]
    }
  }).promise();

  // Send alerts
  await sendAlert({
    severity: 'CRITICAL',
    message: 'Automatic failover triggered',
    region: 'us-west-2'
  });
}

// Monitor every 30 seconds
setInterval(async () => {
  const isHealthy = await checkPrimaryHealth();
  if (!isHealthy) {
    console.log('Primary unhealthy, checking again...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    const stillUnhealthy = !(await checkPrimaryHealth());
    if (stillUnhealthy) {
      await triggerFailover();
    }
  }
}, 30000);
```

## Communication Tree

### Incident Commander Structure

```mermaid
graph TD
  IC[Incident Commander]
  IC --> TL[Tech Lead - Resolution]
  IC --> CO[Communications Owner]
  IC --> SO[Security Officer]

  TL --> E1[Engineer 1 - Database]
  TL --> E2[Engineer 2 - Application]
  TL --> E3[Engineer 3 - Infrastructure]

  CO --> CS[Customer Success]
  CO --> PR[Public Relations]
  CO --> LG[Legal]

  SO --> AU[Audit Trail]
  SO --> FO[Forensics]
```

### Notification Priorities

| Time | Who | Method | Message Type |
|------|-----|--------|--------------|
| T+0 | On-call | PagerDuty | CRITICAL ALERT |
| T+5min | Tech Lead | Phone | Escalation |
| T+10min | CTO | SMS + Email | Executive brief |
| T+15min | Customer Success | Slack | Customer impact |
| T+30min | All customers | Email + Status | Public update |
| T+1hr | Board | Email | Business impact |

### Communication Templates

#### Internal Alert
```
🚨 DISASTER RECOVERY INITIATED

Scenario: [Complete Outage / Data Corruption / Security Breach]
Started: [TIMESTAMP]
Incident Commander: [NAME]
War Room: [LINK]

Current Status: [Investigating / Mitigating / Recovering]
Customer Impact: [None / Partial / Full]
ETA to Resolution: [TIME]

Join bridge: [PHONE/ZOOM]
Slack: #incident-[ID]
```

#### Customer Notification
```
Subject: Service Disruption Notice

Dear Customer,

We are currently experiencing a service disruption affecting [SERVICES].

Status: [Investigating / Identified / Monitoring]
Impact: [Description of impact]
Start Time: [TIME]
Expected Resolution: [TIME]

What you can do:
- [Workaround if available]
- [Alternative access method]

We apologize for the inconvenience and are working to restore service as quickly as possible.

Updates: https://status.omniops.co.uk

Thank you for your patience.
```

## Service Restoration

### Restoration Order

```yaml
restoration_sequence:
  1_critical_infrastructure:
    - Database (Supabase)
    - Authentication service
    - Core API endpoints

  2_data_services:
    - Redis cache
    - Search indices
    - Embeddings

  3_application_services:
    - Chat functionality
    - Web scraping
    - WooCommerce sync

  4_supporting_services:
    - Analytics
    - Monitoring
    - Logging

  5_optional_features:
    - Reports
    - Exports
    - Batch jobs
```

### Restoration Verification

```bash
#!/bin/bash
# scripts/disaster-recovery/verify-restoration.sh

echo "=== SERVICE RESTORATION VERIFICATION ==="

# Core Services
services=(
  "https://omniops.co.uk/api/health"
  "https://omniops.co.uk/api/chat/health"
  "https://omniops.co.uk/api/scrape/health"
)

for service in "${services[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" $service)
  if [ $response -eq 200 ]; then
    echo "✅ $service - OK"
  else
    echo "❌ $service - FAILED ($response)"
    exit 1
  fi
done

# Database Connectivity
npx tsx scripts/database/test-connection.ts || exit 1

# Redis Connectivity
redis-cli -h redis.omniops.co.uk ping || exit 1

# Run E2E Tests
npm run test:e2e:critical || exit 1

echo "✅ All services restored successfully"
```

## Data Recovery

### Recovery Priority Matrix

| Data Type | Priority | RPO | Recovery Method |
|-----------|----------|-----|-----------------|
| Customer configs | P0 | 1 hour | Automated backup |
| Active sessions | P0 | Real-time | Redis persistence |
| Conversations | P0 | 1 hour | Database backup |
| Scraped content | P1 | 24 hours | Re-scrape if needed |
| Embeddings | P1 | 24 hours | Regenerate |
| Analytics | P2 | 7 days | Aggregate from logs |
| Logs | P2 | Real-time | S3 streaming |

### Data Recovery Procedures

```typescript
// scripts/disaster-recovery/recover-data.ts
import { createClient } from '@supabase/supabase-js';

interface RecoveryPlan {
  table: string;
  priority: number;
  method: 'restore' | 'regenerate' | 'rescrape';
  source?: string;
}

const recoveryPlan: RecoveryPlan[] = [
  { table: 'customer_configs', priority: 0, method: 'restore', source: 'backup' },
  { table: 'users', priority: 0, method: 'restore', source: 'backup' },
  { table: 'conversations', priority: 0, method: 'restore', source: 'backup' },
  { table: 'messages', priority: 0, method: 'restore', source: 'backup' },
  { table: 'scraped_pages', priority: 1, method: 'rescrape' },
  { table: 'page_embeddings', priority: 1, method: 'regenerate' },
];

async function executeRecovery() {
  // Sort by priority
  const sorted = recoveryPlan.sort((a, b) => a.priority - b.priority);

  for (const item of sorted) {
    console.log(`Recovering ${item.table}...`);

    switch (item.method) {
      case 'restore':
        await restoreFromBackup(item.table, item.source!);
        break;
      case 'regenerate':
        await regenerateData(item.table);
        break;
      case 'rescrape':
        await triggerRescrape(item.table);
        break;
    }

    // Verify recovery
    const count = await verifyTableData(item.table);
    console.log(`✅ ${item.table}: ${count} records recovered`);
  }
}
```

## Post-Disaster Testing

### Validation Checklist

```markdown
## Post-Disaster Validation

### Infrastructure
- [ ] All containers running
- [ ] Database accessible
- [ ] Redis operational
- [ ] Network connectivity verified
- [ ] DNS resolution correct
- [ ] SSL certificates valid

### Application
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Chat functionality operational
- [ ] Scraping jobs processing
- [ ] WooCommerce sync active

### Data Integrity
- [ ] Customer configs intact
- [ ] Conversations preserved
- [ ] No orphaned records
- [ ] Relationships valid
- [ ] Checksums match

### Performance
- [ ] Response times <500ms
- [ ] Database queries <100ms
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Error rate <1%

### Security
- [ ] All secrets rotated
- [ ] Access logs clean
- [ ] No suspicious activity
- [ ] RLS policies active
- [ ] Firewall rules applied
```

### Load Testing After Recovery

```bash
#!/bin/bash
# scripts/disaster-recovery/stress-test.sh

echo "Running post-disaster stress test..."

# Use k6 for load testing
k6 run --vus 100 --duration 10m <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function() {
  let response = http.get('https://omniops.co.uk/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

echo "✅ Stress test complete"
```

## DR Testing Schedule

### Testing Calendar

| Test Type | Frequency | Duration | Scope |
|-----------|-----------|----------|-------|
| **Backup Verification** | Daily | 5 min | Automated checks |
| **Restoration Drill** | Weekly | 30 min | Single service |
| **Partial Failover** | Monthly | 2 hours | Non-critical services |
| **Full DR Test** | Quarterly | 4 hours | Complete failover |
| **Regional Failover** | Semi-Annual | 8 hours | Cross-region |
| **Security Breach** | Annual | 2 days | Full simulation |

### Quarterly DR Test Runbook

```bash
#!/bin/bash
# scripts/disaster-recovery/quarterly-dr-test.sh

echo "=== QUARTERLY DR TEST ==="
echo "Date: $(date)"
echo "This is a TEST - No actual disaster"

# Create test environment
TEST_ENV="dr-test-$(date +%Y%m%d)"
mkdir -p tests/$TEST_ENV

# Phase 1: Backup current state
echo "Phase 1: Backing up current state..."
docker-compose exec postgres pg_dump -U postgres > tests/$TEST_ENV/before.sql

# Phase 2: Simulate disaster
echo "Phase 2: Simulating disaster..."
docker-compose stop app

# Phase 3: Execute recovery
echo "Phase 3: Executing recovery procedures..."
./scripts/disaster-recovery/auto-failover.sh --test-mode

# Phase 4: Validate recovery
echo "Phase 4: Validating recovery..."
npm run test:e2e

# Phase 5: Rollback test
echo "Phase 5: Rolling back test..."
docker-compose start app

# Generate report
cat > tests/$TEST_ENV/report.md <<EOF
# DR Test Report

Date: $(date)
Test Type: Quarterly Full DR Test
Result: [PASS/FAIL]

## Metrics
- Time to detect: X minutes
- Time to recover: X minutes
- Data loss: None
- Failures: [List any failures]

## Improvements Needed
- [Item 1]
- [Item 2]
EOF

echo "✅ DR test complete. Report: tests/$TEST_ENV/report.md"
```

## Appendix: Emergency Contacts

### Vendor Support

| Vendor | Service | Support Level | Contact |
|--------|---------|---------------|---------|
| Supabase | Database | Pro | support@supabase.com |
| Vercel | Hosting | Enterprise | enterprise@vercel.com |
| AWS | Infrastructure | Business | AWS Support Center |
| Cloudflare | CDN/DDoS | Pro | support.cloudflare.com |

### Internal Escalation

| Role | Primary | Backup | Escalation |
|------|---------|--------|------------|
| On-Call Engineer | PagerDuty | Rotation | Automatic |
| Tech Lead | [Name] | [Name] | +5 minutes |
| CTO | [Name] | [Name] | +15 minutes |
| CEO | [Name] | - | Major incidents only |