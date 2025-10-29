# Production Deployment Checklist

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 81 minutes

## Purpose
> **Comprehensive Guide for Deploying Omniops to Production** > **Version**: 2.0 > **Last Updated**: October 2025

## Quick Links
- [Table of Contents](#table-of-contents)
- [1. Pre-Deployment Checklist](#1-pre-deployment-checklist)
- [2. Environment Setup](#2-environment-setup)
- [3. Database Migration](#3-database-migration)
- [4. Deployment Process](#4-deployment-process)

## Keywords
checklist, commands, compliance, contacts, contents, database, deployment, documentation, emergency, environment

---


> **Comprehensive Guide for Deploying Omniops to Production**
> **Version**: 2.0
> **Last Updated**: October 2025
> **Estimated Time**: 8-12 hours (first deployment)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Deployment Process](#deployment-process)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring Setup](#monitoring-setup)
8. [Security Checklist](#security-checklist)
9. [Performance Checklist](#performance-checklist)
10. [Compliance Checklist](#compliance-checklist)

---

## 1. Pre-Deployment Checklist

### Code Quality & Testing

**Estimated Time**: 2-3 hours
**Risk Level**: HIGH

- [ ] ⚠️ **All tests passing**
  ```bash
  npm run test           # Run all tests
  npm run test:unit      # Unit tests only
  npm run test:integration  # Integration tests
  ```
- [ ] **Type checking clean**
  ```bash
  npx tsc --noEmit
  ```
- [ ] **Linting clean**
  ```bash
  npm run lint
  ```
- [ ] **Code review completed** - All PRs approved and merged
- [ ] **Documentation updated** - README, API docs, architecture diagrams
- [ ] **CHANGELOG updated** - Document all changes since last deployment
- [ ] **Breaking changes documented** - List any API or schema changes

### Development Environment Verification

- [ ] **Development build successful**
  ```bash
  npm run build
  ```
- [ ] **Local testing completed**
  ```bash
  npm run dev
  # Test critical flows manually
  ```
- [ ] **Bundle size acceptable**
  ```bash
  npx @next/bundle-analyzer
  # Verify no unexpected size increases
  ```
- [ ] **Dependencies up to date**
  ```bash
  npm audit
  npm run check:deps
  ```

### Version Control

- [ ] **Create release branch**
  ```bash
  git checkout -b release/v1.0.0
  ```
- [ ] **Tag release**
  ```bash
  git tag -a v1.0.0 -m "Production Release v1.0.0"
  git push origin v1.0.0
  ```
- [ ] **Backup current production** (if applicable)

---

## 2. Environment Setup

### First-Time Deployment

**Estimated Time**: 3-4 hours
**Risk Level**: CRITICAL

#### Supabase Project Creation

- [ ] ⚠️ **Create Supabase project** at [supabase.com](https://supabase.com)
- [ ] **Configure project settings**
  - Project name: `omniops-production`
  - Database password: Strong, stored in password manager
  - Region: Closest to primary users
- [ ] **Enable required extensions**
  ```sql
  -- Run in Supabase SQL Editor
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS btree_gin;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  ```
- [ ] **Copy project credentials**
  - Project URL: `https://[PROJECT_REF].supabase.co`
  - Anon (public) key
  - Service role (secret) key
  - Database URL (for migrations)

#### Environment Variables Configuration

- [ ] ⚠️ **Create `.env.production` file** (DO NOT commit to git!)
  ```bash
  # Copy from template
  cp .env.example .env.production
  ```
- [ ] **Configure core variables**:

```bash
# ======================
# Supabase Configuration
# ======================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ======================
# OpenAI Configuration
# ======================
OPENAI_API_KEY=sk-...

# ======================
# Security
# ======================
# Generate: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_string_here
CRON_SECRET=your_random_cron_secret_here

# ======================
# Application
# ======================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# ======================
# Redis (Optional)
# ======================
REDIS_URL=redis://localhost:6379
# Or for production with auth:
# REDIS_URL=redis://user:password@redis-host:6379

# ======================
# Monitoring (Optional)
# ======================
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=info
```

- [ ] **Set OpenAI spending limits** in OpenAI dashboard
- [ ] **Verify `.env.production` is in `.gitignore`**

#### SSL Certificates

- [ ] ⚠️ **Obtain SSL certificate** for domain
  ```bash
  # Using Let's Encrypt with certbot
  sudo certbot certonly --webroot \
    -w /var/www/html \
    -d yourdomain.com \
    -d www.yourdomain.com
  ```
- [ ] **Configure auto-renewal**
  ```bash
  # Add to crontab
  0 0,12 * * * certbot renew --quiet
  ```
- [ ] **Verify certificate validity**
  ```bash
  openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
  ```

#### Domain Configuration

- [ ] **Configure DNS records**
  ```
  Type    Name    Value               TTL
  A       @       your.server.ip      3600
  A       www     your.server.ip      3600
  CNAME   api     yourdomain.com      3600
  ```
- [ ] **Verify DNS propagation**
  ```bash
  dig yourdomain.com
  nslookup yourdomain.com
  ```
- [ ] **Configure reverse proxy** (Nginx/Apache)

**Example Nginx Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Platform-Specific Setup

#### Option A: Vercel Deployment

- [ ] **Connect GitHub repository**
- [ ] **Configure project settings**
  - Framework Preset: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] **Add environment variables** in Vercel dashboard
  - Add all variables from `.env.production`
  - Mark sensitive variables as "Sensitive"
- [ ] **Configure domains**
  - Add custom domain
  - Configure DNS as instructed
  - Enable automatic HTTPS

#### Option B: Docker Deployment

- [ ] **Build Docker image**
  ```bash
  DOCKER_BUILDKIT=1 docker build -t omniops:v1.0.0 .
  ```
- [ ] **Tag for registry**
  ```bash
  docker tag omniops:v1.0.0 your-registry/omniops:v1.0.0
  docker tag omniops:v1.0.0 your-registry/omniops:latest
  ```
- [ ] **Push to registry**
  ```bash
  docker push your-registry/omniops:v1.0.0
  docker push your-registry/omniops:latest
  ```
- [ ] **Configure docker-compose for production**
  ```yaml
  # docker-compose.prod.yml
  version: '3.8'
  services:
    app:
      image: your-registry/omniops:v1.0.0
      ports:
        - "3000:3000"
      environment:
        - NODE_ENV=production
      env_file:
        - .env.production
      restart: unless-stopped
      deploy:
        resources:
          limits:
            cpus: '4'
            memory: 8G
          reservations:
            cpus: '2'
            memory: 4G

    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - redis_data:/data
      command: redis-server --appendonly yes
      restart: unless-stopped

  volumes:
    redis_data:
  ```

#### Option C: Self-Hosted (VPS/Dedicated)

- [ ] **Server requirements verified**
  - Ubuntu 22.04 LTS or similar
  - 4+ vCPUs (8+ recommended for production)
  - 8GB+ RAM (16GB recommended)
  - 100GB+ SSD storage
  - 1Gbps network connection
- [ ] **Install dependencies**
  ```bash
  # Node.js 18+
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # PM2 process manager
  sudo npm install -g pm2

  # Nginx
  sudo apt-get install -y nginx

  # Certbot for SSL
  sudo apt-get install -y certbot python3-certbot-nginx
  ```
- [ ] **Configure firewall**
  ```bash
  sudo ufw allow 22/tcp   # SSH
  sudo ufw allow 80/tcp   # HTTP
  sudo ufw allow 443/tcp  # HTTPS
  sudo ufw enable
  ```

---

## 3. Database Migration

### Backup Current State

**Estimated Time**: 30 minutes
**Risk Level**: CRITICAL

- [ ] ⚠️ **Backup existing database** (if upgrading)
  ```bash
  # Via Supabase CLI
  supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

  # Or via pg_dump
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] **Store backup securely**
  - Upload to S3/Google Cloud Storage
  - Keep local copy
  - Document backup location
- [ ] **Test backup restoration** (on staging if possible)
  ```bash
  psql $STAGING_DATABASE_URL < backup_20251024_120000.sql
  ```

### Run Migrations

- [ ] ⚠️ **Review all migration files**
  ```bash
  ls -la supabase/migrations/
  ```
- [ ] **Test migrations on staging first**
  ```bash
  supabase db push --db-url $STAGING_DATABASE_URL
  ```
- [ ] **Run production migrations**
  ```bash
  supabase db push --db-url $PRODUCTION_DATABASE_URL
  ```
- [ ] **Verify pgvector extension**
  ```sql
  SELECT * FROM pg_extension WHERE extname = 'vector';
  ```

### Create Required Indexes

- [ ] ⚠️ **Create performance indexes**
  ```sql
  -- Critical indexes for production performance

  -- Messages and conversations
  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_conversations_domain
    ON conversations(domain, created_at DESC);

  -- Scraped content
  CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain
    ON scraped_pages(domain, last_scraped DESC);

  CREATE INDEX IF NOT EXISTS idx_content_url
    ON website_content(url);

  -- Text search
  CREATE INDEX IF NOT EXISTS idx_content_search
    ON website_content USING gin(to_tsvector('english', content));

  -- Embeddings
  CREATE INDEX IF NOT EXISTS idx_embeddings_domain
    ON page_embeddings(domain);

  -- Vector search (IVFFlat for performance)
  CREATE INDEX IF NOT EXISTS idx_embeddings_vector
    ON page_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

  -- Customer configs
  CREATE INDEX IF NOT EXISTS idx_customer_configs_domain
    ON customer_configs(domain);

  -- Query cache
  CREATE INDEX IF NOT EXISTS idx_query_cache_lookup
    ON query_cache(domain, query_hash, expires_at);
  ```

- [ ] **Analyze tables for query optimization**
  ```sql
  VACUUM ANALYZE;
  ```

### Verify Schema

- [ ] **Check all tables created**
  ```sql
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
  ```
- [ ] **Verify Row Level Security enabled**
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
  ```
- [ ] **Generate TypeScript types**
  ```bash
  supabase gen types typescript --db-url $DATABASE_URL > types/supabase.ts
  ```

---

## 4. Deployment Process

### Build & Test

**Estimated Time**: 1-2 hours
**Risk Level**: HIGH

- [ ] ⚠️ **Final test suite run**
  ```bash
  npm run test:all
  ```
- [ ] **Build production bundle**
  ```bash
  npm run build
  ```
- [ ] **Verify build output**
  - Check build logs for errors
  - Verify bundle size acceptable
  - Check for missing dependencies
- [ ] **Test production build locally**
  ```bash
  npm run start
  # Verify application runs
  ```

### Deploy Application

#### Vercel Deployment

- [ ] **Trigger deployment**
  ```bash
  vercel --prod
  ```
- [ ] **Monitor deployment logs**
- [ ] **Verify deployment success**
  ```bash
  curl https://yourdomain.com/api/health
  ```

#### Docker Deployment

- [ ] **Deploy containers**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```
- [ ] **Verify containers running**
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
- [ ] **Check container logs**
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f app
  ```

#### Self-Hosted Deployment

- [ ] **Deploy application**
  ```bash
  # Upload code to server
  rsync -avz --exclude node_modules . user@server:/opt/omniops/

  # Install dependencies
  ssh user@server "cd /opt/omniops && npm ci --production"

  # Build
  ssh user@server "cd /opt/omniops && npm run build"

  # Start with PM2
  ssh user@server "cd /opt/omniops && pm2 start ecosystem.config.js"
  ```
- [ ] **Configure PM2 startup**
  ```bash
  pm2 startup
  pm2 save
  ```

### Deploy Workers (if using background jobs)

- [ ] **Start worker containers/processes**
  ```bash
  # Docker
  docker-compose -f docker-compose.workers.yml up -d

  # Or PM2
  pm2 start ecosystem.workers.config.js
  ```
- [ ] **Verify workers processing**
  ```bash
  # Check queue status
  npm run queue:stats
  ```

### Clear & Warm Caches

- [ ] **Clear Redis cache** (if doing major update)
  ```bash
  redis-cli FLUSHDB
  ```
- [ ] **Clear query cache**
  ```sql
  TRUNCATE query_cache;
  ```
- [ ] **Warm up cache** (optional)
  ```bash
  curl -X POST https://yourdomain.com/api/cache/warm
  ```

---

## 5. Post-Deployment Verification

### Smoke Tests

**Estimated Time**: 30-60 minutes
**Risk Level**: CRITICAL

- [ ] ⚠️ **Health check endpoint**
  ```bash
  curl https://yourdomain.com/api/health
  # Expected: {"status":"ok","timestamp":...}
  ```

- [ ] ⚠️ **Comprehensive health check**
  ```bash
  curl https://yourdomain.com/api/health/comprehensive?verbose=true
  # Check all services: database, redis, workers
  ```

- [ ] **Chat functionality**
  ```bash
  curl -X POST https://yourdomain.com/api/chat \
    -H "Content-Type: application/json" \
    -d '{
      "message": "Hello, how can you help?",
      "domain": "yourdomain.com"
    }'
  # Should return AI response
  ```

- [ ] **Widget loading**
  - Create test HTML page
  - Add embed script: `<script src="https://yourdomain.com/embed.js"></script>`
  - Verify widget appears and functions

- [ ] **Admin dashboard** (if applicable)
  - Navigate to `/admin`
  - Verify configuration loads
  - Test saving settings

- [ ] **Scraping functionality**
  - Navigate to `/admin/scraping`
  - Trigger test scrape
  - Verify pages are indexed

- [ ] **WooCommerce/Shopify integration** (if configured)
  ```bash
  curl https://yourdomain.com/api/woocommerce/test
  # Verify connection successful
  ```

### Performance Benchmarks

- [ ] **Measure API response times**
  ```bash
  # Run 100 requests and calculate average
  for i in {1..100}; do
    curl -w "%{time_total}\n" -o /dev/null -s https://yourdomain.com/api/health
  done | awk '{sum+=$1} END {print "Average:", sum/NR "s"}'
  # Target: <100ms
  ```

- [ ] **Check memory usage**
  ```bash
  # Docker
  docker stats --no-stream

  # PM2
  pm2 status
  ```

- [ ] **Monitor CPU utilization**
  - Should be <70% under normal load

- [ ] **Verify cache hit rates**
  ```bash
  redis-cli INFO stats | grep keyspace_hits
  # Target: >80% hit rate
  ```

- [ ] **Document baseline metrics**
  ```markdown
  Production Baseline (2025-10-24):
  - P50 Response Time: 85ms
  - P95 Response Time: 420ms
  - P99 Response Time: 850ms
  - Error Rate: 0.05%
  - Cache Hit Rate: 87%
  - Memory Usage: 3.2GB / 8GB
  - CPU Usage: 45%
  ```

### Functional Verification

- [ ] **User flows work end-to-end**
  - [ ] Chat conversation completes
  - [ ] Messages persist to database
  - [ ] Scraping job completes
  - [ ] Embeddings generate correctly
  - [ ] Product search returns results
  - [ ] GDPR export works
  - [ ] GDPR deletion works

- [ ] **Database connectivity verified**
  ```sql
  SELECT COUNT(*) FROM pg_stat_activity;
  # Verify connections healthy
  ```

- [ ] **Queue processing working**
  ```bash
  npm run queue:stats
  # Verify jobs processing
  ```

### Error Monitoring

- [ ] **Check application logs** (first 30 minutes)
  ```bash
  # Docker
  docker logs -f omniops-app 2>&1 | grep ERROR

  # PM2
  pm2 logs --err

  # System
  tail -f /var/log/omniops/error.log
  ```

- [ ] **Verify error tracking** (Sentry/Rollbar)
  - Trigger test error
  - Verify appears in dashboard
  - Verify alerting works

- [ ] **Monitor error rates**
  - Target: <0.1% of requests
  - Alert if >1% for 5 minutes

---

## 6. Rollback Procedures

### Rollback Triggers

**ROLLBACK IMMEDIATELY IF:**

- Error rate > 5% for 10 minutes
- Critical functionality broken (chat not working)
- Database connection failures
- Data corruption detected
- Security vulnerability discovered
- Response time P95 > 3 seconds sustained

### Rollback Steps

#### Vercel Rollback

- [ ] **Rollback via dashboard**
  1. Go to Vercel dashboard
  2. Select previous deployment
  3. Click "Promote to Production"
  4. Monitor for 15 minutes

- [ ] **Or via CLI**
  ```bash
  vercel rollback
  ```

#### Docker Rollback

- [ ] **Rollback containers**
  ```bash
  # Tag previous version
  PREVIOUS_VERSION=$(docker images omniops --format "{{.Tag}}" | head -2 | tail -1)

  # Stop current
  docker-compose -f docker-compose.prod.yml down

  # Deploy previous
  docker tag omniops:$PREVIOUS_VERSION omniops:latest
  docker-compose -f docker-compose.prod.yml up -d
  ```

#### Self-Hosted Rollback

- [ ] **Revert code**
  ```bash
  git checkout v0.9.0  # Previous stable version
  npm ci --production
  npm run build
  pm2 reload ecosystem.config.js
  ```

### Database Rollback (if needed)

- [ ] ⚠️ **ONLY if database migration caused issue**
  ```bash
  # Restore from backup
  psql $DATABASE_URL < backup_20251024_120000.sql
  ```
- [ ] **Verify data integrity**
  ```sql
  SELECT COUNT(*) FROM critical_table;
  -- Compare to expected counts
  ```

### Post-Rollback Verification

- [ ] **Run smoke tests again**
- [ ] **Verify error rate normalized**
- [ ] **Check system stability** (30 minutes)
- [ ] **Document incident**
  - What went wrong
  - When detected
  - What was rolled back
  - Impact assessment
- [ ] **Schedule post-mortem**

---

## 7. Monitoring Setup

### Health Monitoring

**Estimated Time**: 1-2 hours
**Risk Level**: MEDIUM

- [ ] **Configure uptime monitoring** (UptimeRobot/Pingdom)
  - Monitor: `https://yourdomain.com/api/health`
  - Interval: Every 60 seconds
  - Alerts: Email + SMS on downtime
  - Locations: Multiple geographic regions

- [ ] **Set up synthetic monitoring**
  - Monitor critical user flows
  - Chat widget loading
  - API response times
  - Product search functionality

### Log Aggregation

- [ ] **Configure centralized logging**
  ```javascript
  // lib/logger.ts
  import winston from 'winston';

  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'omniops' },
    transports: [
      new winston.transports.File({
        filename: 'error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'combined.log'
      }),
    ],
  });
  ```

- [ ] **Set up log rotation**
  ```bash
  # /etc/logrotate.d/omniops
  /var/log/omniops/*.log {
      daily
      rotate 14
      compress
      delaycompress
      notifempty
      create 0640 www-data www-data
      sharedscripts
      postrotate
          pm2 reloadLogs
      endscript
  }
  ```

- [ ] **Configure log shipping** (optional)
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Datadog
  - CloudWatch
  - Splunk

### Error Tracking

- [ ] ⚠️ **Set up Sentry** (or similar)
  ```typescript
  // app/instrumentation.ts
  import * as Sentry from '@sentry/nextjs';

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,

    // Performance monitoring
    integrations: [
      new Sentry.BrowserTracing(),
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors from bots
      if (event.request?.headers?.['user-agent']?.includes('bot')) {
        return null;
      }
      return event;
    },
  });
  ```

- [ ] **Configure error alerting rules**
  - Critical errors → PagerDuty
  - High volume errors → Slack
  - New error types → Email

- [ ] **Test error reporting**
  ```bash
  curl -X POST https://yourdomain.com/api/test-error
  # Verify appears in Sentry
  ```

### Performance Monitoring

- [ ] **Set up APM** (Application Performance Monitoring)
  - New Relic, DataDog, or similar
  - Track API response times
  - Database query performance
  - External API calls

- [ ] **Configure custom metrics**
  ```typescript
  // Track business metrics
  metrics.increment('chat.requests', { domain });
  metrics.histogram('scrape.duration', duration, { domain });
  metrics.gauge('queue.depth', queueSize);
  ```

- [ ] **Create dashboards**
  - API response times (P50, P95, P99)
  - Error rates by endpoint
  - Database query times
  - Redis cache hit rates
  - Queue depths
  - Worker processing rates

### Alert Configuration

- [ ] **Configure critical alerts**
  ```yaml
  alerts:
    - name: High Error Rate
      condition: error_rate > 1%
      duration: 5 minutes
      severity: critical
      notify: [pagerduty, slack]

    - name: Database Connection Failed
      condition: db_status != 'connected'
      duration: 1 minute
      severity: critical
      notify: [pagerduty]

    - name: Slow Response Times
      condition: p95_response_time > 1000ms
      duration: 10 minutes
      severity: warning
      notify: [slack]

    - name: Queue Backup
      condition: queue_depth > 1000
      duration: 10 minutes
      severity: warning
      notify: [email]

    - name: High Memory Usage
      condition: memory_usage > 90%
      duration: 5 minutes
      severity: warning
      notify: [slack]

    - name: Disk Space Low
      condition: disk_free < 10GB
      duration: 1 minute
      severity: critical
      notify: [pagerduty, email]
  ```

- [ ] **Test alert delivery**
  - Trigger test alert
  - Verify delivery to all channels
  - Verify escalation policies

---

## 8. Security Checklist

### Access Control & Authentication

**Estimated Time**: 2-3 hours
**Risk Level**: CRITICAL

- [ ] ⚠️ **API authentication configured**
  - All admin endpoints require auth
  - Customer API endpoints rate-limited
  - Service-to-service auth secured

- [ ] **Row Level Security enabled**
  ```sql
  -- Verify RLS on all tables
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;
  -- Should return no rows
  ```

- [ ] **API key rotation schedule**
  - Document rotation procedure
  - Set calendar reminder (quarterly)
  - Test rotation process

### Secrets Management

- [ ] ⚠️ **All secrets in environment variables**
  - No hardcoded credentials in code
  - No secrets in version control
  - `.env` files in `.gitignore`

- [ ] **Encryption key generated securely**
  ```bash
  openssl rand -hex 32
  # Store securely, never commit
  ```

- [ ] **Database credentials secured**
  - Strong passwords (20+ characters)
  - Stored in password manager
  - Limited to necessary IPs

- [ ] **API keys secured**
  - Separate keys for staging/production
  - Spending limits configured (OpenAI)
  - Monitoring enabled

- [ ] **Test encrypted storage**
  ```bash
  # Verify WooCommerce credentials encrypted
  node -e "
    const { encrypt, decrypt } = require('./lib/encryption');
    const test = 'sensitive_data';
    const enc = encrypt(test);
    console.log('Encrypted:', enc);
    console.log('Decrypted:', decrypt(enc));
    console.log('Match:', decrypt(enc) === test);
  "
  ```

### Network Security

- [ ] ⚠️ **SSL/TLS configured**
  - SSL certificate valid
  - TLS 1.2+ enforced
  - HSTS header enabled
  - SSL Labs rating A+

- [ ] **CORS properly configured**
  ```typescript
  // middleware.ts
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Only add trusted domains
  ];

  // NO wildcards in production!
  ```

- [ ] **Security headers configured**
  ```javascript
  // next.config.js
  const securityHeaders = [
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN'
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block'
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin'
    },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=()'
    },
    {
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://embed.yourdomain.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://yourdomain.com;"
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubDomains; preload'
    }
  ];
  ```

- [ ] **Verify security headers**
  ```bash
  curl -I https://yourdomain.com | grep -E "(X-Frame|X-Content|X-XSS|CSP|Strict-Transport)"
  ```

### Rate Limiting

- [ ] ⚠️ **Configure rate limiting**
  ```typescript
  // lib/rate-limit.ts
  const limits = {
    chat: {
      requests: 100,
      window: '15m',
      skipSuccessfulRequests: false
    },
    scrape: {
      requests: 10,
      window: '1h'
    },
    embed: {
      requests: 1000,
      window: '1h'
    },
    admin: {
      requests: 50,
      window: '15m'
    }
  };
  ```

- [ ] **DDoS protection enabled**
  - Cloudflare/AWS Shield configured
  - Rate limiting at load balancer
  - IP-based blocking available

### Input Validation & Sanitization

- [ ] **All user inputs validated**
  - Zod schemas for API validation
  - SQL injection protection (parameterized queries)
  - XSS protection (sanitized outputs)

- [ ] **File upload security** (if applicable)
  - File type validation
  - File size limits
  - Virus scanning
  - Secure storage

### Security Audit

- [ ] **Run security scan**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Check for vulnerabilities**
  ```bash
  npx snyk test
  ```

- [ ] **Review dependencies**
  - Remove unused dependencies
  - Update to latest secure versions
  - Check for known vulnerabilities

---

## 9. Performance Checklist

### Caching Strategy

**Estimated Time**: 1-2 hours
**Risk Level**: MEDIUM

- [ ] **Redis caching configured**
  ```typescript
  const CACHE_DURATIONS = {
    embeddings: 3600,      // 1 hour
    scrapeResults: 1800,   // 30 minutes
    wooProducts: 300,      // 5 minutes
    userSessions: 86400,   // 24 hours
  };
  ```

- [ ] **Database query caching**
  ```sql
  -- Enable shared_preload_libraries
  ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

  -- Configure cache settings
  ALTER SYSTEM SET work_mem = '256MB';
  ALTER SYSTEM SET maintenance_work_mem = '512MB';
  ```

- [ ] **Next.js ISR configured**
  ```typescript
  // Incremental Static Regeneration
  export const revalidate = 3600; // Revalidate every hour
  ```

- [ ] **Browser caching headers**
  ```nginx
  # Nginx config
  location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
      expires 30d;
      add_header Cache-Control "public, immutable";
  }
  ```

### CDN Configuration

- [ ] **CDN setup** (Cloudflare/CloudFront)
  - Static assets cached
  - Edge caching enabled
  - Cache rules configured
  - Purge webhooks ready

- [ ] **Cache rules optimized**
  ```json
  {
    "rules": [
      { "path": "/_next/static/*", "ttl": 31536000 },
      { "path": "/public/*", "ttl": 86400 },
      { "path": "/embed.js", "ttl": 3600 },
      { "path": "/api/*", "ttl": 0 }
    ]
  }
  ```

### Database Optimization

- [ ] ⚠️ **Indexes created** (see Database Migration section)

- [ ] **Connection pooling configured**
  ```typescript
  // Supabase automatically pools, but verify limits
  // For direct connections:
  const pool = new Pool({
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  ```

- [ ] **Query optimization**
  ```sql
  -- Analyze slow queries
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
  ```

- [ ] **Regular maintenance scheduled**
  ```sql
  -- Weekly VACUUM ANALYZE
  -- Add to cron: 0 2 * * 0
  VACUUM ANALYZE;
  ```

### Bundle Optimization

- [ ] **Production build optimized**
  ```bash
  npm run build
  npx @next/bundle-analyzer
  ```

- [ ] **Code splitting enabled**
  ```typescript
  // Use dynamic imports for heavy components
  import dynamic from 'next/dynamic';

  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <Skeleton />,
    ssr: false
  });
  ```

- [ ] **Image optimization**
  ```javascript
  // next.config.js
  module.exports = {
    images: {
      domains: ['yourdomain.com', 'cdn.yourdomain.com'],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60,
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    }
  }
  ```

- [ ] **Remove unused code**
  ```bash
  npx depcheck
  # Remove unused dependencies
  ```

### Load Testing

- [ ] **Run load tests**
  ```bash
  # Using k6
  k6 run --vus 100 --duration 5m load-test.js
  ```

- [ ] **Stress testing**
  ```javascript
  // k6-stress-test.js
  export const options = {
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.1'],
    },
  };
  ```

- [ ] **Document capacity limits**
  ```markdown
  Performance Capacity:
  - Max concurrent users: 500
  - Max requests/second: 1000
  - Database connections: 100
  - Redis memory: 2GB
  - Worker capacity: 50 jobs/min
  ```

---

## 10. Compliance Checklist

### GDPR Compliance

**Estimated Time**: 1-2 hours
**Risk Level**: HIGH (legal requirement)

- [ ] **Privacy policy published**
  - Navigate to `/privacy`
  - Verify complete and accurate
  - Last updated date current

- [ ] **Data export endpoint working**
  ```bash
  curl -X POST https://yourdomain.com/api/gdpr/export \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com"}'
  # Should return user data in JSON format
  ```

- [ ] **Data deletion endpoint working**
  ```bash
  curl -X DELETE https://yourdomain.com/api/gdpr/delete \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com"}'
  # Should delete user data
  ```

- [ ] **Cookie consent banner** (if needed)
  - Banner displays on first visit
  - Respects user choice
  - Stored in localStorage

- [ ] **Data retention policy configured**
  ```sql
  -- Auto-delete old conversations
  DELETE FROM conversations
  WHERE created_at < NOW() - INTERVAL '90 days';
  ```

- [ ] **Audit logging enabled**
  - Log all data access
  - Log data exports
  - Log data deletions

### CCPA Compliance

- [ ] **"Do Not Sell" option available**
- [ ] **Data disclosure requirements met**
- [ ] **California residents can opt-out**

### Terms of Service

- [ ] **Terms published**
  - Navigate to `/terms`
  - Verify complete
  - Acceptance mechanism in place

### Accessibility

- [ ] **WCAG 2.1 AA compliance**
  - Run accessibility audit
  - Fix critical issues
  - Document exceptions

- [ ] **Accessibility statement published**
  - Navigate to `/accessibility`
  - Contact info for issues

---

## Platform-Specific Guides

### Vercel Production Checklist

- [ ] Environment variables configured
- [ ] Custom domain added and verified
- [ ] SSL certificate auto-renewed
- [ ] Deployment protection enabled (if needed)
- [ ] Analytics enabled
- [ ] Web Vitals monitoring active
- [ ] Build & deployment logs reviewed

### Docker Production Checklist

- [ ] Docker images optimized (multi-stage builds)
- [ ] Health checks configured in Compose
- [ ] Resource limits set
- [ ] Logging driver configured
- [ ] Volumes for persistent data
- [ ] Network isolation configured
- [ ] Secrets managed securely
- [ ] Auto-restart policies set

### Self-Hosted Checklist

- [ ] Server hardened (firewall, SSH keys, etc.)
- [ ] Reverse proxy configured (Nginx/Apache)
- [ ] Process manager configured (PM2/systemd)
- [ ] Automated backups scheduled
- [ ] Monitoring agents installed
- [ ] Log rotation configured
- [ ] Security updates automated
- [ ] Disaster recovery plan documented

---

## Post-Deployment Tasks

### First 2 Hours (Critical Monitoring)

- [ ] **Monitor error rates continuously**
  - Watch application logs
  - Check error tracking dashboard
  - Respond to alerts immediately

- [ ] **Verify all services healthy**
  ```bash
  curl https://yourdomain.com/api/health/comprehensive
  ```

- [ ] **Check database performance**
  ```sql
  SELECT * FROM pg_stat_activity;
  ```

- [ ] **Monitor memory/CPU**
  - Should be stable
  - No memory leaks
  - CPU <70%

### First 24 Hours

- [ ] **Review performance metrics**
  - Response times acceptable
  - Cache hit rates healthy
  - No bottlenecks identified

- [ ] **Check queue processing**
  - Jobs processing normally
  - No backup/deadlocks

- [ ] **Gather user feedback**
  - No major complaints
  - Critical flows working

- [ ] **Monitor costs**
  - OpenAI API usage
  - Infrastructure costs
  - Database storage

### First Week

- [ ] **Performance optimization**
  - Identify slow queries
  - Optimize based on data
  - Adjust cache TTLs

- [ ] **Address issues**
  - Fix bugs found
  - Deploy patches if needed

- [ ] **Update documentation**
  - Document issues encountered
  - Update runbooks

### Team Communication

- [ ] **Pre-deployment notification** (T-24h)
  ```
  Subject: Production Deployment - [Date] [Time]

  The Omniops application will be deployed to production:
  - Date: October 24, 2025
  - Time: 3:00 AM UTC
  - Expected downtime: 0 minutes (blue-green)
  - Rollback window: 1 hour

  On-call: [Name] ([Contact])
  Status page: [URL]
  ```

- [ ] **Deployment complete notification**
  ```
  Subject: Deployment Complete - Success

  Deployment completed successfully at 4:15 AM UTC.

  Results:
  - All systems operational
  - 0 errors detected
  - Performance within SLA
  - Monitoring active

  Dashboard: [URL]
  ```

- [ ] **Schedule post-deployment review**
  - 1 week after deployment
  - Review metrics
  - Document learnings
  - Plan improvements

---

## Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|-------------|
| Deployment Lead | [Name] | [Email/Phone] | 24/7 |
| DevOps On-Call | [Name] | [Email/Phone] | 24/7 |
| Database Admin | [Name] | [Email/Phone] | Business hours |
| Security Lead | [Name] | [Email/Phone] | On-call |
| Product Manager | [Name] | [Email/Phone] | Business hours |

## Quick Reference Commands

```bash
# Health check
curl https://yourdomain.com/api/health/comprehensive

# View logs (Docker)
docker-compose logs -f --tail=100

# View logs (PM2)
pm2 logs

# Restart services (Docker)
docker-compose restart

# Restart services (PM2)
pm2 reload all

# Emergency rollback (Docker)
docker-compose down && docker-compose up -d --scale app=0
docker tag omniops:previous omniops:latest
docker-compose up -d

# Emergency rollback (Vercel)
vercel rollback

# Queue statistics
npm run queue:stats

# Database connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Redis memory
redis-cli INFO memory

# Clear cache
redis-cli FLUSHDB
```

---

## Sign-Off

**Deployment is considered complete when:**

- [ ] All smoke tests pass
- [ ] Error rate < 0.1%
- [ ] Response time P95 < 500ms
- [ ] All workers processing
- [ ] Monitoring dashboards active
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback procedure tested and ready

**Sign-Off:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Engineering Lead | ____________ | ____________ | ______ |
| DevOps Lead | ____________ | ____________ | ______ |
| Security Lead | ____________ | ____________ | ______ |
| Product Manager | ____________ | ____________ | ______ |

---

**Version**: 2.0
**Maintained By**: Engineering Team
**Next Review**: After next major deployment
**Last Updated**: October 2025

---

## Related Documentation

- [Docker Setup Guide](/docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Database Schema Reference](/docs/SUPABASE_SCHEMA.md)
- [Search Architecture](/docs/SEARCH_ARCHITECTURE.md)
- [Performance Optimization](/docs/PERFORMANCE_OPTIMIZATION.md)
- [Hallucination Prevention](/docs/HALLUCINATION_PREVENTION.md)
