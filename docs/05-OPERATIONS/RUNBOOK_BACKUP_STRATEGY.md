# Backup Strategy Runbook

**Type:** Runbook
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Supabase, Docker, Redis, Git
**Estimated Read Time:** 8 minutes
**Criticality:** HIGH

## Purpose
Comprehensive backup strategy covering database, application state, configurations, and user data. Includes automated and manual backup procedures, retention policies, and restoration testing.

## Quick Links
- [Rollback Procedures](./RUNBOOK_ROLLBACK_PROCEDURES.md)
- [Disaster Recovery](./RUNBOOK_DISASTER_RECOVERY.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Table of Contents
- [What Gets Backed Up](#what-gets-backed-up)
- [Backup Frequency](#backup-frequency)
- [Backup Retention Policy](#backup-retention-policy)
- [Supabase Automatic Backups](#supabase-automatic-backups)
- [Manual Backup Procedures](#manual-backup-procedures)
- [Backup Verification](#backup-verification)
- [Restoration Testing](#restoration-testing)
- [Recovery Objectives](#recovery-objectives)

---

## What Gets Backed Up

### Critical Data (Must Backup)
| Component | Location | Method | Priority |
|-----------|----------|---------|---------|
| **Database** | Supabase PostgreSQL | Automated + Manual | P0 |
| **Customer Configs** | `customer_configs` table | Daily export | P0 |
| **Encrypted Credentials** | `customer_configs.encrypted_*` | Encrypted backup | P0 |
| **Scraped Content** | `scraped_pages`, `website_content` | Weekly export | P1 |
| **Embeddings** | `page_embeddings` vectors | Weekly export | P1 |
| **Conversations** | `conversations`, `messages` | Daily export | P0 |
| **User Accounts** | Auth tables | Daily export | P0 |

### Application Data (Should Backup)
| Component | Location | Method | Priority |
|-----------|----------|---------|---------|
| **Environment Variables** | `.env.local`, `.env.production` | Secure vault | P1 |
| **Docker Images** | Docker Hub / Registry | Tagged versions | P1 |
| **Redis Data** | Redis persistence | RDB snapshots | P2 |
| **Uploaded Files** | Supabase Storage | Bucket replication | P1 |
| **Logs** | `/logs`, container logs | Log aggregation | P2 |

### Code & Configuration (Version Controlled)
| Component | Location | Method | Priority |
|-----------|----------|---------|---------|
| **Source Code** | Git repository | GitHub/GitLab | P0 |
| **Database Migrations** | `/migrations` | Git + Supabase | P0 |
| **Docker Configs** | `docker-compose.yml` | Git | P1 |
| **CI/CD Configs** | `.github/workflows` | Git | P1 |

## Backup Frequency

### Automated Schedule

```yaml
# Backup Schedule Configuration
backups:
  database:
    frequency: daily
    time: "02:00 UTC"
    retention: 30 days
    type: full

  incremental:
    frequency: hourly
    retention: 24 hours
    type: incremental

  weekly:
    frequency: weekly
    day: sunday
    time: "03:00 UTC"
    retention: 12 weeks
    type: full

  monthly:
    frequency: monthly
    day: 1
    time: "04:00 UTC"
    retention: 12 months
    type: full + archive
```

### Manual Backup Triggers

- Before major deployments
- After significant data imports
- Before database migrations
- During incident response
- Monthly verification backup

## Backup Retention Policy

### Retention Schedule

| Backup Type | Frequency | Retention Period | Storage Location |
|-------------|-----------|------------------|------------------|
| **Hourly** | Every hour | 24 hours | Supabase built-in |
| **Daily** | 02:00 UTC | 30 days | Supabase + S3 |
| **Weekly** | Sunday 03:00 UTC | 12 weeks | S3 cold storage |
| **Monthly** | 1st day 04:00 UTC | 12 months | S3 glacier |
| **Yearly** | Jan 1st | 7 years | S3 glacier deep |

### Storage Calculations

```bash
# Estimated storage requirements
Database size: ~10GB
Daily growth: ~100MB
Monthly growth: ~3GB

# Storage needed:
- Daily (30 days): 10GB × 30 = 300GB
- Weekly (12 weeks): 10GB × 12 = 120GB
- Monthly (12 months): 10GB × 12 = 120GB
- Yearly (7 years): 10GB × 7 = 70GB
Total: ~610GB + growth
```

## Supabase Automatic Backups

### Built-in Features (Pro Plan)

```bash
# Supabase Pro provides:
- Daily automatic backups (30 day retention)
- Point-in-time recovery (up to 7 days)
- Backup downloads via dashboard
- Cross-region replication (optional)
```

### Accessing Supabase Backups

```bash
# Via Dashboard
open https://app.supabase.com/project/birugqyuqhiahxvxeyqg/database/backups

# Via Management API
export SUPABASE_ACCESS_TOKEN='sbp_...'
export PROJECT_REF='birugqyuqhiahxvxeyqg'

# List available backups
curl -X GET \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/backups" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}"

# Download backup
curl -X POST \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/backups/download" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"backup_id": "BACKUP_ID"}'
```

### Monitoring Backup Health

```typescript
// scripts/monitoring/check-backup-health.ts
import { createClient } from '@supabase/supabase-js';

const checkBackupHealth = async () => {
  // Check last backup time
  const { data: backups } = await supabase
    .from('pg_stat_bgwriter')
    .select('stats_reset')
    .single();

  const lastBackup = new Date(backups.stats_reset);
  const hoursSinceBackup = (Date.now() - lastBackup.getTime()) / 3600000;

  if (hoursSinceBackup > 25) {
    console.error('⚠️ ALERT: No backup in 25+ hours');
    // Send alert
  }
};
```

## Manual Backup Procedures

### Full Database Backup

```bash
#!/bin/bash
# scripts/backup/backup-database.sh

# Configuration
BACKUP_DIR="/home/user/Omniops/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db-backup-$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Method 1: Via Docker (Local Development)
docker exec omniops-postgres pg_dump \
  -U postgres \
  -d omniops \
  --clean \
  --if-exists \
  --no-owner \
  > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE
echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Method 2: Via Supabase CLI (Production)
supabase db dump \
  --project-ref birugqyuqhiahxvxeyqg \
  > $BACKUP_FILE

# Encrypt sensitive backup
openssl enc -aes-256-cbc \
  -salt \
  -in $BACKUP_FILE \
  -out ${BACKUP_FILE}.enc \
  -k "$BACKUP_ENCRYPTION_KEY"

# Upload to S3
aws s3 cp ${BACKUP_FILE}.enc \
  s3://omniops-backups/database/$TIMESTAMP/ \
  --storage-class STANDARD_IA

# Cleanup local files older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Critical Tables Export

```bash
#!/bin/bash
# scripts/backup/backup-critical-tables.sh

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_DIR="/home/user/Omniops/backups/exports/$TIMESTAMP"
mkdir -p $EXPORT_DIR

# Export critical tables as JSON
tables=(
  "customer_configs"
  "conversations"
  "messages"
  "users"
  "scrape_jobs"
)

for table in "${tables[@]}"; do
  echo "Exporting $table..."

  npx tsx scripts/backup/export-table.ts \
    --table=$table \
    --output=$EXPORT_DIR/$table.json \
    --encrypt=true
done

# Create manifest
cat > $EXPORT_DIR/manifest.json <<EOF
{
  "timestamp": "$TIMESTAMP",
  "tables": ${tables[@]},
  "version": "$(git rev-parse HEAD)",
  "encrypted": true
}
EOF

# Archive and upload
tar czf $EXPORT_DIR.tar.gz $EXPORT_DIR
aws s3 cp $EXPORT_DIR.tar.gz s3://omniops-backups/tables/
```

### Redis Backup

```bash
#!/bin/bash
# scripts/backup/backup-redis.sh

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/home/user/Omniops/backups/redis"
mkdir -p $BACKUP_DIR

# Trigger Redis BGSAVE
docker exec omniops-redis redis-cli BGSAVE

# Wait for save to complete
while [ $(docker exec omniops-redis redis-cli LASTSAVE) -eq $(docker exec omniops-redis redis-cli LASTSAVE) ]; do
  sleep 1
done

# Copy dump file
docker cp omniops-redis:/data/dump.rdb $BACKUP_DIR/redis-$TIMESTAMP.rdb

# Compress and encrypt
gzip $BACKUP_DIR/redis-$TIMESTAMP.rdb
openssl enc -aes-256-cbc \
  -in $BACKUP_DIR/redis-$TIMESTAMP.rdb.gz \
  -out $BACKUP_DIR/redis-$TIMESTAMP.rdb.gz.enc \
  -k "$BACKUP_ENCRYPTION_KEY"

echo "✅ Redis backup: $BACKUP_DIR/redis-$TIMESTAMP.rdb.gz.enc"
```

### Environment Variables Backup

```bash
#!/bin/bash
# scripts/backup/backup-env.sh

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/home/user/Omniops/backups/config"
mkdir -p $BACKUP_DIR

# Backup env files (excluding secrets)
cp .env.local $BACKUP_DIR/env-local-$TIMESTAMP.txt
cp .env.production $BACKUP_DIR/env-prod-$TIMESTAMP.txt

# Redact sensitive values
sed -i 's/\(.*KEY=\).*/\1[REDACTED]/' $BACKUP_DIR/*.txt
sed -i 's/\(.*SECRET=\).*/\1[REDACTED]/' $BACKUP_DIR/*.txt
sed -i 's/\(.*PASSWORD=\).*/\1[REDACTED]/' $BACKUP_DIR/*.txt

# Store in secure vault (HashiCorp Vault example)
vault kv put secret/omniops/env/backup-$TIMESTAMP \
  @.env.local \
  @.env.production

echo "✅ Environment backed up to vault: secret/omniops/env/backup-$TIMESTAMP"
```

## Backup Verification

### Automated Verification Script

```typescript
// scripts/backup/verify-backups.ts
import { promises as fs } from 'fs';
import crypto from 'crypto';

interface BackupVerification {
  file: string;
  size: number;
  checksum: string;
  encrypted: boolean;
  valid: boolean;
  error?: string;
}

async function verifyBackup(filePath: string): Promise<BackupVerification> {
  try {
    const stats = await fs.stat(filePath);
    const data = await fs.readFile(filePath);
    const checksum = crypto.createHash('sha256').update(data).digest('hex');

    // Check minimum size (prevents empty backups)
    if (stats.size < 1024) {
      return {
        file: filePath,
        size: stats.size,
        checksum,
        encrypted: filePath.endsWith('.enc'),
        valid: false,
        error: 'File too small, possibly corrupted'
      };
    }

    // Verify encryption if applicable
    if (filePath.endsWith('.enc')) {
      // Try to decrypt header to verify
      const isValid = await verifyEncryption(filePath);
      if (!isValid) {
        return {
          file: filePath,
          size: stats.size,
          checksum,
          encrypted: true,
          valid: false,
          error: 'Encryption verification failed'
        };
      }
    }

    return {
      file: filePath,
      size: stats.size,
      checksum,
      encrypted: filePath.endsWith('.enc'),
      valid: true
    };
  } catch (error) {
    return {
      file: filePath,
      size: 0,
      checksum: '',
      encrypted: false,
      valid: false,
      error: error.message
    };
  }
}

// Run verification
async function main() {
  const backupDir = '/home/user/Omniops/backups';
  const files = await fs.readdir(backupDir, { recursive: true });

  const results = await Promise.all(
    files
      .filter(f => f.endsWith('.gz') || f.endsWith('.enc'))
      .map(f => verifyBackup(`${backupDir}/${f}`))
  );

  const failed = results.filter(r => !r.valid);
  if (failed.length > 0) {
    console.error('❌ Failed verifications:', failed);
    process.exit(1);
  }

  console.log('✅ All backups verified successfully');
  console.table(results);
}

main();
```

### Verification Checklist

```bash
# Daily verification tasks
- [ ] Check last backup timestamp < 25 hours
- [ ] Verify backup file sizes > minimum threshold
- [ ] Test sample data restoration
- [ ] Validate checksums match
- [ ] Confirm encryption is intact
- [ ] Check available storage space
- [ ] Review backup logs for errors
```

## Restoration Testing

### Monthly Restoration Drill

```bash
#!/bin/bash
# scripts/backup/restoration-drill.sh

echo "🔧 Starting monthly restoration drill..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEST_DB="omniops_restore_test_$TIMESTAMP"

# 1. Create test database
docker exec omniops-postgres createdb -U postgres $TEST_DB

# 2. Get latest backup
LATEST_BACKUP=$(ls -t backups/db-backup-*.sql.gz | head -1)
echo "Using backup: $LATEST_BACKUP"

# 3. Restore to test database
gunzip -c $LATEST_BACKUP | docker exec -i omniops-postgres psql -U postgres -d $TEST_DB

# 4. Run validation queries
echo "Validating restored data..."
docker exec omniops-postgres psql -U postgres -d $TEST_DB <<EOF
-- Check critical tables exist
SELECT COUNT(*) as customer_count FROM customer_configs;
SELECT COUNT(*) as message_count FROM messages;
SELECT COUNT(*) as page_count FROM scraped_pages;

-- Verify data integrity
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN 'PASS'
    ELSE 'FAIL'
  END as customer_data_check
FROM customer_configs
WHERE created_at IS NOT NULL;

-- Check relationships
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL: Orphaned records found'
  END as referential_integrity
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE c.id IS NULL;
EOF

# 5. Test application connectivity
npx tsx scripts/backup/test-restored-db.ts --database=$TEST_DB

# 6. Cleanup test database
docker exec omniops-postgres dropdb -U postgres $TEST_DB

echo "✅ Restoration drill complete"
```

### Recovery Testing Schedule

| Test Type | Frequency | Scope | Duration |
|-----------|-----------|-------|----------|
| **Quick Verify** | Daily | Checksums, sizes | 5 min |
| **Sample Restore** | Weekly | Single table | 15 min |
| **Full Restore** | Monthly | Complete database | 1 hour |
| **Disaster Recovery** | Quarterly | Full stack | 4 hours |
| **Cross-Region** | Yearly | Failover test | 8 hours |

## Recovery Objectives

### RTO (Recovery Time Objective)

| Scenario | Target RTO | Actual RTO | Method |
|----------|------------|------------|---------|
| **Service restart** | 5 min | 3 min | Docker restart |
| **Code rollback** | 15 min | 10 min | Git + rebuild |
| **Database restore** | 30 min | 25 min | Supabase backup |
| **Full recovery** | 2 hours | 1.5 hours | Complete restore |
| **Disaster recovery** | 4 hours | 3 hours | New region setup |

### RPO (Recovery Point Objective)

| Data Type | Target RPO | Actual RPO | Backup Method |
|-----------|------------|------------|---------------|
| **Database** | 1 hour | 1 hour | Hourly incremental |
| **User uploads** | 1 hour | Real-time | S3 replication |
| **Configurations** | 24 hours | On change | Git commits |
| **Logs** | 1 hour | Real-time | Stream to S3 |
| **Redis cache** | 24 hours | Rebuild | Can regenerate |

## Automated Backup Monitoring

```typescript
// scripts/monitoring/backup-monitor.ts
import { CronJob } from 'cron';

// Check backup health every hour
new CronJob('0 * * * *', async () => {
  const checks = [
    checkLastBackupTime(),
    checkBackupSizes(),
    checkStorageSpace(),
    verifyLatestBackup()
  ];

  const results = await Promise.all(checks);
  const failures = results.filter(r => !r.success);

  if (failures.length > 0) {
    await sendAlert({
      severity: 'HIGH',
      message: `Backup issues detected: ${failures.map(f => f.error).join(', ')}`,
      action: 'Check backup system immediately'
    });
  }
}).start();

// Weekly restoration test
new CronJob('0 3 * * 0', async () => {
  console.log('Starting weekly restoration test...');
  const result = await runRestorationTest();

  await sendReport({
    type: 'RESTORATION_TEST',
    result: result.success ? 'PASS' : 'FAIL',
    details: result.details,
    duration: result.duration
  });
}).start();
```

## Backup Cost Optimization

### Storage Tier Strategy

```yaml
# AWS S3 Storage Classes
hot_data:  # < 7 days
  class: STANDARD
  cost: $0.023/GB
  access: Immediate

warm_data:  # 7-30 days
  class: STANDARD_IA
  cost: $0.0125/GB
  access: 12 hour retrieval

cold_data:  # 30-90 days
  class: GLACIER_INSTANT
  cost: $0.004/GB
  access: Minutes

archive:  # > 90 days
  class: GLACIER_DEEP_ARCHIVE
  cost: $0.00099/GB
  access: 12-48 hours
```

### Lifecycle Policy

```json
{
  "Rules": [{
    "Id": "BackupLifecycle",
    "Status": "Enabled",
    "Transitions": [
      {
        "Days": 7,
        "StorageClass": "STANDARD_IA"
      },
      {
        "Days": 30,
        "StorageClass": "GLACIER_INSTANT_RETRIEVAL"
      },
      {
        "Days": 90,
        "StorageClass": "DEEP_ARCHIVE"
      }
    ],
    "Expiration": {
      "Days": 2555
    }
  }]
}
```

## Emergency Contacts

| Role | Name | Contact | Responsibility |
|------|------|---------|---------------|
| **DBA** | On-call | PagerDuty | Database restoration |
| **DevOps** | On-call | PagerDuty | Infrastructure recovery |
| **Security** | Security Team | security@ | Encrypted backup access |
| **Supabase** | Support | support.supabase.com | Platform issues |