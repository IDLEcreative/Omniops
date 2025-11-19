# Staging Environment Setup

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Supabase, Vercel, Docker, Git
**Estimated Read Time:** 15 minutes

## Purpose
Complete guide for setting up and maintaining a staging environment that mirrors production for testing and validation before production deployments.

## Quick Links
- [Docker Production Setup](./SETUP_DOCKER_PRODUCTION.md)
- [Rollback Procedures](../05-OPERATIONS/RUNBOOK_ROLLBACK_PROCEDURES.md)
- [Capacity Planning](../05-OPERATIONS/GUIDE_CAPACITY_PLANNING.md)

## Table of Contents
- [Staging vs Production Differences](#staging-vs-production-differences)
- [Setting up Staging Supabase](#setting-up-staging-supabase)
- [Setting up Staging Vercel](#setting-up-staging-vercel)
- [Environment Variables](#environment-variables)
- [Testing in Staging](#testing-in-staging)
- [Data Management](#data-management)
- [Promotion to Production](#promotion-to-production)

---

## Staging vs Production Differences

### Resource Allocation

| Component | Staging | Production | Rationale |
|-----------|---------|------------|-----------|
| **Supabase Plan** | Free/Pro | Pro/Team | Cost optimization |
| **Database Size** | 8GB | 100GB+ | Smaller dataset |
| **Database Connections** | 60 | 200+ | Lower concurrency |
| **Vercel Plan** | Hobby/Pro | Pro/Enterprise | Feature parity |
| **Redis** | 1GB Single | 4GB+ Cluster | Basic caching |
| **Rate Limits** | 50% of prod | Full | Testing limits |
| **Monitoring** | Basic | Comprehensive | Cost savings |
| **Backups** | Daily | Hourly + PITR | Less critical |
| **SSL Certificate** | Let's Encrypt | Let's Encrypt/Custom | Same security |

### Feature Differences

```yaml
staging_config:
  features:
    enable_debug_mode: true
    enable_test_endpoints: true
    enable_mock_payments: true
    enable_verbose_logging: true
    enable_performance_profiling: true

  limits:
    max_api_requests_per_minute: 30
    max_scrape_pages: 50
    max_embeddings_per_query: 50
    max_chat_history: 100

  integrations:
    openai_model: "gpt-3.5-turbo"  # Cheaper model
    use_test_api_keys: true
    stripe_test_mode: true
    email_sandbox_mode: true
```

## Setting up Staging Supabase

### 1. Create Staging Project

```bash
# Navigate to Supabase Dashboard
open https://app.supabase.com

# Create new project with naming convention
Project Name: omniops-staging
Database Password: [Generate secure password]
Region: Same as production (us-east-1)
Plan: Free (upgrade if needed)
```

### 2. Configure Database Schema

```bash
# Clone production schema
cd /home/user/Omniops

# Export production schema (without data)
npx supabase db dump \
  --project-ref [PROD_PROJECT_REF] \
  --schema-only \
  > migrations/staging-schema.sql

# Import to staging
npx supabase db push \
  --project-ref [STAGING_PROJECT_REF] \
  --file migrations/staging-schema.sql
```

### 3. Configure Authentication

```sql
-- Set up auth configuration
UPDATE auth.config SET
  site_url = 'https://staging.omniops.co.uk',
  redirect_urls = ARRAY[
    'https://staging.omniops.co.uk/*',
    'http://localhost:3000/*'
  ],
  jwt_expiry = 3600,
  enable_signup = true,
  enable_anonymous_sign_ins = true;

-- Create test users
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES
  ('test@omniops.co.uk', crypt('staging123', gen_salt('bf')), NOW()),
  ('admin@omniops.co.uk', crypt('staging456', gen_salt('bf')), NOW());
```

### 4. Set up Storage Buckets

```javascript
// scripts/setup-staging-storage.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.STAGING_SUPABASE_URL,
  process.env.STAGING_SUPABASE_SERVICE_KEY
);

async function setupStorage() {
  // Create buckets
  const buckets = ['avatars', 'documents', 'exports'];

  for (const bucket of buckets) {
    await supabase.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
  }

  console.log('Storage buckets created');
}

setupStorage();
```

### 5. Apply RLS Policies

```sql
-- Apply same RLS policies as production
-- Run all migration files
npm run migrate:staging
```

## Setting up Staging Vercel

### 1. Create Staging Project

```bash
# Using Vercel CLI
vercel link --project omniops-staging

# Set up Git branch
git checkout -b staging
git push -u origin staging

# Configure Vercel to deploy from staging branch
vercel git --branch staging
```

### 2. Configure Environment Variables

```bash
# Set staging environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL --production=preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY --production=preview
vercel env add SUPABASE_SERVICE_ROLE_KEY --production=preview
vercel env add OPENAI_API_KEY --production=preview
vercel env add NODE_ENV --production=preview

# Set specific staging values
vercel env add NEXT_PUBLIC_APP_URL=https://staging.omniops.co.uk --production=preview
vercel env add ENABLE_DEBUG_MODE=true --production=preview
```

### 3. Configure Domain

```bash
# Add staging subdomain
vercel domains add staging.omniops.co.uk --project omniops-staging

# Verify DNS
vercel domains verify staging.omniops.co.uk
```

### 4. Set Build Configuration

```json
// vercel.json (staging)
{
  "buildCommand": "npm run build:staging",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "env": {
    "NEXT_PUBLIC_ENVIRONMENT": "staging"
  }
}
```

## Environment Variables

### Staging-Specific Variables

```bash
# .env.staging
# Core Configuration
NODE_ENV=staging
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_APP_URL=https://staging.omniops.co.uk

# Supabase (Staging Project)
NEXT_PUBLIC_SUPABASE_URL=https://[STAGING_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[STAGING_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[STAGING_SERVICE_KEY]

# OpenAI (Use cheaper model)
OPENAI_API_KEY=[SAME_OR_DIFFERENT_KEY]
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000

# Redis (Staging Instance)
REDIS_URL=redis://default:[PASSWORD]@staging-redis.omniops.co.uk:6379

# Feature Flags
ENABLE_DEBUG_MODE=true
ENABLE_TEST_ENDPOINTS=true
ENABLE_MOCK_PAYMENTS=true
ENABLE_PERFORMANCE_PROFILING=true
LOG_LEVEL=debug

# Rate Limiting (Reduced)
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_WINDOW=60000

# Monitoring (Optional)
SENTRY_DSN=[STAGING_SENTRY_DSN]
SENTRY_ENVIRONMENT=staging
```

### Environment Variable Management

```bash
#!/bin/bash
# scripts/sync-staging-env.sh

# Sync environment variables to staging
echo "Syncing environment variables to staging..."

# Read from .env.staging and push to Vercel
while IFS='=' read -r key value; do
  if [[ ! -z "$key" && ! "$key" =~ ^# ]]; then
    vercel env add "$key" "$value" --production=preview --force
  fi
done < .env.staging

echo "✅ Environment variables synced"
```

## Testing in Staging

### Automated Testing Pipeline

```yaml
# .github/workflows/staging-tests.yml
name: Staging Tests

on:
  push:
    branches: [staging]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  test:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests against staging
        env:
          BASE_URL: https://staging.omniops.co.uk
        run: |
          npm run test:e2e:staging

      - name: Run API tests
        run: |
          npm run test:api:staging

      - name: Performance testing
        run: |
          npm run test:performance:staging

      - name: Security scanning
        run: |
          npm run security:scan
```

### Manual Testing Checklist

```markdown
## Staging Test Checklist

### Core Functionality
- [ ] User registration and login
- [ ] Chat widget loading and interaction
- [ ] Web scraping initiation and completion
- [ ] Search functionality
- [ ] WooCommerce integration
- [ ] Shopify integration

### API Endpoints
- [ ] GET /api/health
- [ ] POST /api/chat
- [ ] POST /api/scrape
- [ ] GET /api/scrape/status
- [ ] POST /api/search
- [ ] GET /api/privacy/export
- [ ] DELETE /api/privacy/delete

### Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Search results < 1 second
- [ ] No memory leaks after 100 requests

### Security
- [ ] Authentication works correctly
- [ ] Authorization enforced
- [ ] Rate limiting active
- [ ] CORS configured properly
- [ ] CSP headers present

### Integration Tests
- [ ] Supabase connection stable
- [ ] Redis caching working
- [ ] OpenAI API responding
- [ ] File uploads working
- [ ] Email notifications sent
```

### Load Testing Staging

```bash
#!/bin/bash
# scripts/load-test-staging.sh

# Run k6 load test against staging
k6 run - <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
};

export default function() {
  const response = http.get('https://staging.omniops.co.uk/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
EOF

echo "Load test complete"
```

## Data Management

### Seeding Test Data

```typescript
// scripts/seed-staging-data.ts
import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const supabase = createClient(
  process.env.STAGING_SUPABASE_URL!,
  process.env.STAGING_SUPABASE_SERVICE_KEY!
);

async function seedData() {
  // Create test customers
  const customers = Array.from({ length: 10 }, () => ({
    domain: faker.internet.domainName(),
    company_name: faker.company.name(),
    plan: faker.helpers.arrayElement(['free', 'pro', 'enterprise']),
    created_at: faker.date.past(),
  }));

  await supabase.from('customer_configs').insert(customers);

  // Create test conversations
  const conversations = Array.from({ length: 100 }, () => ({
    customer_id: faker.helpers.arrayElement(customers).id,
    session_id: faker.string.uuid(),
    created_at: faker.date.recent(),
  }));

  await supabase.from('conversations').insert(conversations);

  console.log('✅ Staging data seeded');
}

seedData();
```

### Data Sanitization from Production

```bash
#!/bin/bash
# scripts/sanitize-prod-data.sh

# Export production data
pg_dump $PROD_DATABASE_URL \
  --exclude-table=auth.users \
  --exclude-table=auth.refresh_tokens \
  > prod-export.sql

# Sanitize sensitive data
cat prod-export.sql | sed \
  -e "s/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/test@example.com/g" \
  -e "s/sk-[a-zA-Z0-9]{48}/sk-REDACTED/g" \
  -e "s/\"phone\":\"[^\"]*\"/\"phone\":\"555-0100\"/g" \
  > staging-data.sql

# Import to staging
psql $STAGING_DATABASE_URL < staging-data.sql

echo "✅ Production data sanitized and imported to staging"
```

### Backup and Restore

```bash
# Backup staging before major changes
npx supabase db dump \
  --project-ref [STAGING_PROJECT_REF] \
  > backups/staging-$(date +%Y%m%d).sql

# Restore if needed
npx supabase db reset \
  --project-ref [STAGING_PROJECT_REF]

npx supabase db push \
  --project-ref [STAGING_PROJECT_REF] \
  --file backups/staging-20251118.sql
```

## Promotion to Production

### Pre-Promotion Checklist

```markdown
## Ready for Production Checklist

### Code Quality
- [ ] All tests passing in staging
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] ESLint warnings resolved
- [ ] Security scan passed

### Performance
- [ ] Load testing completed successfully
- [ ] Response times meet SLA
- [ ] Memory usage stable
- [ ] No performance regressions

### Database
- [ ] Migrations tested and reversible
- [ ] Indexes optimized
- [ ] No slow queries identified
- [ ] Backup tested

### Documentation
- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] Deployment notes prepared
- [ ] Rollback plan documented

### Approval
- [ ] QA team sign-off
- [ ] Product owner approval
- [ ] Security review completed
- [ ] Change advisory board approval (if required)
```

### Promotion Process

```bash
#!/bin/bash
# scripts/promote-to-production.sh

# Ensure we're on staging branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "staging" ]; then
  echo "❌ Must be on staging branch"
  exit 1
fi

# Run final tests
echo "Running final tests..."
npm run test:all

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Cannot promote to production."
  exit 1
fi

# Create production PR
echo "Creating production PR..."
gh pr create \
  --title "Promote staging to production $(date +%Y%m%d)" \
  --body "$(cat .github/PROMOTION_TEMPLATE.md)" \
  --base main \
  --head staging \
  --label "production-deployment"

echo "✅ Production PR created. Please review and merge."
```

### Post-Promotion Verification

```bash
#!/bin/bash
# scripts/verify-production.sh

# Health checks
echo "Verifying production deployment..."

# Check main site
curl -f https://omniops.co.uk || exit 1

# Check API
curl -f https://omniops.co.uk/api/health || exit 1

# Check critical endpoints
endpoints=(
  "/api/chat/health"
  "/api/scrape/health"
  "/api/search/health"
)

for endpoint in "${endpoints[@]}"; do
  echo "Checking $endpoint..."
  curl -f "https://omniops.co.uk$endpoint" || exit 1
done

# Run smoke tests
npm run test:smoke:production

echo "✅ Production verification complete"
```

## Staging Maintenance

### Weekly Tasks
- Review and clean test data
- Check disk usage
- Review error logs
- Update dependencies
- Sync with production schema

### Monthly Tasks
- Full data refresh from production (sanitized)
- Performance baseline testing
- Security scanning
- Cost review and optimization
- Update staging documentation

### Monitoring

```typescript
// scripts/monitor-staging.ts
import { createClient } from '@supabase/supabase-js';

async function monitorStaging() {
  const checks = [
    checkDatabaseConnection(),
    checkRedisConnection(),
    checkAPIHealth(),
    checkDiskSpace(),
    checkErrorRate(),
  ];

  const results = await Promise.allSettled(checks);

  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    await sendAlert({
      environment: 'staging',
      failures: failures.map(f => f.reason),
    });
  }
}

// Run every 30 minutes
setInterval(monitorStaging, 30 * 60 * 1000);
```

## Troubleshooting

### Common Issues

1. **Database connection issues**
   ```bash
   # Check Supabase status
   curl https://status.supabase.com/api/v2/status.json

   # Test connection
   npx supabase db push --dry-run --project-ref [STAGING_REF]
   ```

2. **Vercel deployment failures**
   ```bash
   # Check build logs
   vercel logs --project omniops-staging

   # Redeploy
   vercel --force --prod
   ```

3. **Environment variable mismatches**
   ```bash
   # List all env vars
   vercel env ls --project omniops-staging

   # Pull to local
   vercel env pull .env.staging.local
   ```

4. **Data inconsistencies**
   ```sql
   -- Check for orphaned records
   SELECT * FROM messages m
   LEFT JOIN conversations c ON m.conversation_id = c.id
   WHERE c.id IS NULL;

   -- Fix referential integrity
   DELETE FROM messages
   WHERE conversation_id NOT IN (SELECT id FROM conversations);
   ```