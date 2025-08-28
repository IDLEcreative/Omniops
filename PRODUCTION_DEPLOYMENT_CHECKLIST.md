# 🚀 Omniops Production Deployment Checklist

> **Last Updated**: 2025-08-28  
> **Version**: 1.0.0  
> **Critical Path Items**: Marked with ⚠️

## Table of Contents
1. [Pre-Deployment Preparation](#1-pre-deployment-preparation)
2. [Infrastructure Requirements](#2-infrastructure-requirements)
3. [Security Checklist](#3-security-checklist)
4. [Performance Optimization](#4-performance-optimization)
5. [Monitoring Setup](#5-monitoring-setup)
6. [Deployment Process](#6-deployment-process)
7. [Post-Deployment](#7-post-deployment)

---

## 1. Pre-Deployment Preparation

**Estimated Time**: 2-4 hours  
**Risk Level**: HIGH  
**Dependencies**: None (Start Here)

### Environment Variables Setup

- [ ] ⚠️ Create production `.env.production` file from `.env.example`
- [ ] ⚠️ Generate new 32-character `ENCRYPTION_KEY`
  ```bash
  openssl rand -hex 16  # Generates 32-character hex string
  ```
- [ ] ⚠️ Set Supabase production credentials
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] ⚠️ Configure OpenAI production API key
  - [ ] `OPENAI_API_KEY` with appropriate spending limits
  - [ ] Set up usage alerts in OpenAI dashboard
- [ ] Configure Redis production URL
  - [ ] `REDIS_URL` (e.g., `redis://prod-redis:6379`)
- [ ] Generate secure `CRON_SECRET` for automated jobs
  ```bash
  openssl rand -hex 32
  ```
- [ ] Set Node environment
  - [ ] `NODE_ENV=production`
- [ ] Configure optional services
  - [ ] WooCommerce credentials (if needed)
  - [ ] Anthropic API key (if using as fallback)

### SSL Certificates

- [ ] ⚠️ Obtain SSL certificate for main domain
  ```bash
  # Using Let's Encrypt with certbot
  certbot certonly --webroot -w /var/www/html -d yourdomain.com
  ```
- [ ] Configure SSL for widget embedding domain
- [ ] Set up auto-renewal
  ```bash
  # Add to crontab
  0 0,12 * * * certbot renew --quiet
  ```
- [ ] Verify certificate chain validity
  ```bash
  openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
  ```

### Domain Configuration

- [ ] ⚠️ Configure DNS A/AAAA records
- [ ] Set up CNAME for www subdomain
- [ ] Configure CDN endpoints (if using)
- [ ] Set up reverse proxy (Nginx/Apache)
  ```nginx
  # Example Nginx config
  server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }
  }
  ```
- [ ] Test domain resolution
  ```bash
  dig yourdomain.com
  nslookup yourdomain.com
  ```

### Database Migrations

- [ ] ⚠️ Backup existing database
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Review migration files in `supabase/migrations/`
- [ ] Test migrations on staging database
- [ ] Run production migrations
  ```bash
  # Using Supabase CLI
  supabase db push --db-url $PRODUCTION_DATABASE_URL
  ```
- [ ] Verify pgvector extension is enabled
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- [ ] Create required indexes
  ```sql
  -- Performance indexes from migrations
  CREATE INDEX IF NOT EXISTS idx_embeddings_search ON page_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  ```

### Backup Procedures

- [ ] Set up automated database backups
  ```bash
  # Cron job for daily backups
  0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
  ```
- [ ] Configure Redis persistence
  ```conf
  # redis.conf
  save 900 1
  save 300 10
  save 60 10000
  appendonly yes
  ```
- [ ] Set up file system backups for uploaded content
- [ ] Test backup restoration procedure
- [ ] Document recovery time objective (RTO)

**Common Pitfalls**:
- ❌ Using development encryption keys in production
- ❌ Forgetting to set OpenAI spending limits
- ❌ Not testing database migrations on staging first

**Automation Opportunities**:
- ✅ Use infrastructure as code (Terraform/Pulumi) for environment setup
- ✅ Implement secrets management with HashiCorp Vault or AWS Secrets Manager

---

## 2. Infrastructure Requirements

**Estimated Time**: 3-5 hours  
**Risk Level**: HIGH  
**Dependencies**: Cloud provider account, Docker

### Server Specifications

#### Application Server (Main)
- [ ] ⚠️ Minimum 4 vCPUs (recommended 8 for high traffic)
- [ ] ⚠️ 8GB RAM minimum (16GB recommended)
- [ ] 100GB SSD storage
- [ ] Ubuntu 22.04 LTS or similar
- [ ] Network: 1Gbps connection
- [ ] Ports open: 80, 443, 3000

#### Worker Servers (Can be same or separate)
- [ ] 2 vCPUs per worker type
- [ ] 4GB RAM for scraping workers
- [ ] 2GB RAM for embedding workers
- [ ] 50GB SSD storage

### Docker Setup

- [ ] ⚠️ Install Docker Engine (24.0+)
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```
- [ ] Install Docker Compose (2.20+)
  ```bash
  sudo apt-get install docker-compose-plugin
  ```
- [ ] Configure Docker daemon
  ```json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "10m",
      "max-file": "3"
    },
    "storage-driver": "overlay2"
  }
  ```
- [ ] Set up Docker networks
  ```bash
  docker network create app-network
  ```
- [ ] Configure resource limits
  ```yaml
  # docker-compose.yml
  services:
    app:
      deploy:
        resources:
          limits:
            cpus: '4'
            memory: 8G
          reservations:
            cpus: '2'
            memory: 4G
  ```

### Redis Configuration

- [ ] ⚠️ Deploy Redis 7+ with persistence
- [ ] Configure maxmemory policy
  ```conf
  maxmemory 2gb
  maxmemory-policy allkeys-lru
  ```
- [ ] Set up Redis Sentinel for HA (optional)
- [ ] Configure Redis security
  ```conf
  requirepass your_strong_redis_password
  bind 0.0.0.0
  protected-mode yes
  ```
- [ ] Test Redis connectivity
  ```bash
  redis-cli -h redis-host -a password ping
  ```

### Database Setup (Supabase)

- [ ] ⚠️ Provision production Supabase project
- [ ] Configure connection pooling
  ```sql
  -- Set connection limits
  ALTER DATABASE your_db SET max_connections = 100;
  ```
- [ ] Enable required extensions
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE EXTENSION IF NOT EXISTS btree_gin;
  ```
- [ ] Configure Row Level Security (RLS)
- [ ] Set up read replicas for scaling (if needed)

### Load Balancer Configuration

- [ ] Configure health check endpoints
  ```yaml
  healthcheck:
    path: /api/health
    interval: 30s
    timeout: 10s
  ```
- [ ] Set up SSL termination
- [ ] Configure sticky sessions for WebSocket
- [ ] Set up rate limiting at LB level
  ```nginx
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  ```
- [ ] Configure request/response timeouts
  ```nginx
  proxy_connect_timeout 60s;
  proxy_send_timeout 60s;
  proxy_read_timeout 60s;
  ```

**Common Pitfalls**:
- ❌ Undersizing worker memory for Playwright scraping
- ❌ Not configuring Redis persistence
- ❌ Missing pgvector extension installation

**Automation Opportunities**:
- ✅ Use Kubernetes for container orchestration
- ✅ Implement auto-scaling based on queue depth

---

## 3. Security Checklist

**Estimated Time**: 2-3 hours  
**Risk Level**: CRITICAL  
**Dependencies**: Environment variables, SSL certificates

### API Key Rotation

- [ ] ⚠️ Generate new production API keys for all services
- [ ] Implement key rotation schedule (90 days)
- [ ] Set up key expiration alerts
- [ ] Document key rotation procedure
  ```bash
  # Example rotation script
  #!/bin/bash
  OLD_KEY=$OPENAI_API_KEY
  NEW_KEY=$(openai api keys create)
  # Update environment
  sed -i "s/$OLD_KEY/$NEW_KEY/g" .env.production
  # Restart services
  docker-compose restart
  # Revoke old key after verification
  sleep 300 && openai api keys delete $OLD_KEY
  ```

### CORS Settings

- [ ] ⚠️ Configure allowed origins in `middleware.ts`
  ```typescript
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ];
  ```
- [ ] Disable CORS for admin endpoints
- [ ] Set appropriate headers
  ```typescript
  headers: {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Max-Age': '86400'
  }
  ```

### Rate Limiting

- [ ] ⚠️ Configure per-domain rate limits
  ```typescript
  // lib/rate-limit.ts
  const limits = {
    chat: { requests: 100, window: '15m' },
    scrape: { requests: 10, window: '1h' },
    embed: { requests: 1000, window: '1h' }
  };
  ```
- [ ] Implement IP-based rate limiting
- [ ] Set up DDoS protection (Cloudflare/AWS Shield)
- [ ] Configure queue concurrency limits
  ```typescript
  // Worker concurrency
  WORKER_CONCURRENCY = {
    scraping: 5,
    embeddings: 3,
    woocommerce: 2
  }
  ```

### Authentication Setup

- [ ] ⚠️ Configure Supabase Auth settings
- [ ] Enable MFA for admin accounts
- [ ] Set password policies
  ```sql
  -- Enforce password complexity
  ALTER ROLE authenticator SET password_encryption = 'scram-sha-256';
  ```
- [ ] Configure session timeout
  ```typescript
  // 7 days for regular users, 1 hour for admin
  const SESSION_DURATION = isAdmin ? 3600 : 604800;
  ```
- [ ] Implement JWT token validation

### Encryption Verification

- [ ] ⚠️ Verify WooCommerce credentials encryption
  ```bash
  # Test encryption/decryption
  node -e "
    const { encrypt, decrypt } = require('./lib/encryption');
    const test = 'test_string';
    const encrypted = encrypt(test);
    console.log('Encrypted:', encrypted);
    console.log('Decrypted:', decrypt(encrypted));
  "
  ```
- [ ] Verify database encryption at rest
- [ ] Ensure TLS 1.2+ for all connections
- [ ] Validate certificate pinning for API calls

### Security Headers

- [ ] ⚠️ Configure security headers in Next.js
  ```javascript
  // next.config.js
  const securityHeaders = [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Content-Security-Policy', 
      value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://embed.yourdomain.com; style-src 'self' 'unsafe-inline';" 
    },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
  ];
  ```
- [ ] Test headers with security tools
  ```bash
  # Check security headers
  curl -I https://yourdomain.com | grep -E "(X-Frame|X-Content|X-XSS|CSP|Strict-Transport)"
  ```

**Common Pitfalls**:
- ❌ Leaving debug mode enabled in production
- ❌ Using wildcard (*) in CORS origins
- ❌ Not rotating API keys regularly

**Automation Opportunities**:
- ✅ Integrate security scanning in CI/CD (Snyk, OWASP ZAP)
- ✅ Automated secret rotation with AWS Secrets Manager

---

## 4. Performance Optimization

**Estimated Time**: 3-4 hours  
**Risk Level**: MEDIUM  
**Dependencies**: Build process, database setup

### Caching Setup

- [ ] Configure Redis caching layers
  ```typescript
  // lib/api-cache.ts
  const CACHE_DURATIONS = {
    embeddings: 3600,    // 1 hour
    scrapeResults: 1800, // 30 minutes
    wooProducts: 300,    // 5 minutes
  };
  ```
- [ ] Set up Next.js ISR caching
  ```typescript
  export const revalidate = 3600; // Revalidate every hour
  ```
- [ ] Configure browser caching
  ```nginx
  location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
  ```
- [ ] Implement database query caching
  ```sql
  -- Enable query result caching
  SET statement_timeout = 30000;
  SET work_mem = '256MB';
  ```

### CDN Configuration

- [ ] Set up CDN for static assets (Cloudflare/AWS CloudFront)
- [ ] Configure CDN cache rules
  ```json
  {
    "rules": [
      { "path": "/_next/static/*", "ttl": 31536000 },
      { "path": "/public/*", "ttl": 86400 },
      { "path": "/embed.js", "ttl": 3600 }
    ]
  }
  ```
- [ ] Set up image optimization CDN
- [ ] Configure CDN purge webhooks

### Image Optimization

- [ ] Enable Next.js Image Optimization
  ```javascript
  // next.config.js
  module.exports = {
    images: {
      domains: ['yourdomain.com'],
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60,
    }
  }
  ```
- [ ] Compress existing images
  ```bash
  # Using imagemin
  npx imagemin public/images/* --out-dir=public/images
  ```
- [ ] Implement lazy loading for images
- [ ] Set up responsive image serving

### Bundle Optimization

- [ ] ⚠️ Run production build
  ```bash
  npm run build
  ```
- [ ] Analyze bundle size
  ```bash
  npx @next/bundle-analyzer
  ```
- [ ] Enable code splitting
  ```typescript
  // Dynamic imports for heavy components
  const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
    loading: () => <p>Loading...</p>,
    ssr: false
  });
  ```
- [ ] Minify and compress assets
  ```javascript
  // next.config.js
  module.exports = {
    compress: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
  }
  ```
- [ ] Remove unused dependencies
  ```bash
  npx depcheck
  ```

### Database Indexes

- [ ] ⚠️ Create performance indexes
  ```sql
  -- Critical indexes for production
  CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
  CREATE INDEX idx_scraped_pages_domain ON scraped_pages(domain, last_scraped DESC);
  CREATE INDEX idx_embeddings_domain ON page_embeddings(domain);
  CREATE INDEX idx_content_url ON website_content(url);
  
  -- Text search indexes
  CREATE INDEX idx_content_search ON website_content USING gin(to_tsvector('english', content));
  
  -- Vector search optimization
  CREATE INDEX idx_embeddings_vector ON page_embeddings 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  ```
- [ ] Analyze query performance
  ```sql
  EXPLAIN ANALYZE SELECT * FROM your_slow_query;
  ```
- [ ] Set up index maintenance
  ```sql
  -- Regular maintenance
  VACUUM ANALYZE;
  REINDEX DATABASE your_database;
  ```

**Common Pitfalls**:
- ❌ Not testing bundle size before deployment
- ❌ Missing database indexes on foreign keys
- ❌ Over-caching dynamic content

**Automation Opportunities**:
- ✅ Automated performance testing with Lighthouse CI
- ✅ Database index recommendations with pg_stat_statements

---

## 5. Monitoring Setup

**Estimated Time**: 2-3 hours  
**Risk Level**: MEDIUM  
**Dependencies**: Application deployment

### Health Checks

- [ ] ⚠️ Configure basic health endpoint
  ```typescript
  // /api/health
  GET /api/health
  Response: { status: 'ok', timestamp: Date.now() }
  ```
- [ ] Set up comprehensive health check
  ```typescript
  // /api/health/comprehensive
  GET /api/health/comprehensive?verbose=true
  Response: {
    app: { status: 'healthy', version: '1.0.0' },
    database: { status: 'connected', latency: 5 },
    redis: { status: 'connected', memory: '120MB' },
    workers: { scraping: 2, embeddings: 1 },
    queues: { pending: 10, active: 3, completed: 1000 }
  }
  ```
- [ ] Configure uptime monitoring (UptimeRobot/Pingdom)
- [ ] Set up synthetic monitoring for critical flows

### Log Aggregation

- [ ] Configure centralized logging
  ```javascript
  // lib/logger.ts
  const winston = require('winston');
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' }),
    ],
  });
  ```
- [ ] Set up log rotation
  ```bash
  # /etc/logrotate.d/omniops
  /var/log/omniops/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
  }
  ```
- [ ] Implement structured logging
- [ ] Configure log shipping (ELK/Datadog/CloudWatch)

### Error Tracking

- [ ] ⚠️ Set up Sentry/Rollbar
  ```javascript
  // app/instrumentation.ts
  import * as Sentry from '@sentry/nextjs';
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  ```
- [ ] Configure error alerting rules
- [ ] Set up error grouping and deduplication
- [ ] Create error dashboard
- [ ] Test error reporting
  ```bash
  # Trigger test error
  curl -X POST https://yourdomain.com/api/test-error
  ```

### Performance Monitoring

- [ ] Set up APM (New Relic/DataDog)
- [ ] Configure custom metrics
  ```typescript
  // Track key metrics
  metrics.increment('chat.requests');
  metrics.histogram('scrape.duration', duration);
  metrics.gauge('queue.depth', queueSize);
  ```
- [ ] Monitor database query performance
- [ ] Track API response times
- [ ] Set up real user monitoring (RUM)

### Alerting Rules

- [ ] ⚠️ Configure critical alerts
  ```yaml
  alerts:
    - name: high_error_rate
      condition: error_rate > 1%
      duration: 5m
      severity: critical
    
    - name: database_connection_failed
      condition: db_status != 'connected'
      duration: 1m
      severity: critical
    
    - name: queue_backup
      condition: queue_depth > 1000
      duration: 10m
      severity: warning
    
    - name: high_memory_usage
      condition: memory_usage > 90%
      duration: 5m
      severity: warning
  ```
- [ ] Set up escalation policies
- [ ] Configure alert channels (Email/Slack/PagerDuty)
- [ ] Test alert delivery

**Common Pitfalls**:
- ❌ Alert fatigue from too many non-critical alerts
- ❌ Not testing monitoring in staging
- ❌ Missing business metric monitoring

**Automation Opportunities**:
- ✅ Automated incident response with PagerDuty
- ✅ Self-healing with Kubernetes operators

---

## 6. Deployment Process

**Estimated Time**: 1-2 hours  
**Risk Level**: HIGH  
**Dependencies**: All previous steps completed

### Build Steps

- [ ] ⚠️ Run final tests
  ```bash
  npm run test:all
  ```
- [ ] Build production bundle
  ```bash
  npm run build
  ```
- [ ] Build Docker images
  ```bash
  docker build -t omniops-app:latest .
  docker build -t omniops-worker:latest -f Dockerfile.worker .
  ```
- [ ] Tag images with version
  ```bash
  docker tag omniops-app:latest omniops-app:v1.0.0
  docker tag omniops-worker:latest omniops-worker:v1.0.0
  ```
- [ ] Push to container registry
  ```bash
  docker push your-registry/omniops-app:v1.0.0
  docker push your-registry/omniops-worker:v1.0.0
  ```

### Testing Requirements

- [ ] ⚠️ Run integration tests
  ```bash
  npm run test:integration
  ```
- [ ] Verify database migrations
  ```bash
  # Test rollback capability
  npm run db:migrate:down
  npm run db:migrate:up
  ```
- [ ] Load testing
  ```bash
  # Using k6
  k6 run --vus 100 --duration 30s load-test.js
  ```
- [ ] Security scanning
  ```bash
  npm audit
  docker scan omniops-app:latest
  ```
- [ ] Accessibility testing
  ```bash
  npx lighthouse https://staging.yourdomain.com --view
  ```

### Deployment Commands

- [ ] ⚠️ Deploy application
  ```bash
  # Using docker-compose
  docker-compose -f docker-compose.yml up -d
  
  # Or using kubectl
  kubectl apply -f k8s/deployment.yaml
  ```
- [ ] Deploy workers
  ```bash
  docker-compose -f docker-compose.workers.yml up -d
  ```
- [ ] Run database migrations
  ```bash
  npm run db:migrate:production
  ```
- [ ] Clear caches
  ```bash
  redis-cli FLUSHDB
  curl -X POST https://yourdomain.com/api/cache/purge
  ```
- [ ] Warm up cache
  ```bash
  # Pre-generate common embeddings
  curl -X POST https://yourdomain.com/api/cache/warm
  ```

### Rollback Procedures

- [ ] ⚠️ Document rollback triggers
  ```markdown
  Rollback if:
  - Error rate > 5%
  - Response time > 3s (p95)
  - Database connection failures
  - Critical functionality broken
  ```
- [ ] Prepare rollback scripts
  ```bash
  #!/bin/bash
  # rollback.sh
  PREVIOUS_VERSION=$(docker images omniops-app --format "{{.Tag}}" | head -2 | tail -1)
  docker-compose down
  docker tag omniops-app:$PREVIOUS_VERSION omniops-app:latest
  docker-compose up -d
  ```
- [ ] Test rollback procedure
- [ ] Document rollback timeline (RTO < 15 minutes)

### Smoke Tests

- [ ] ⚠️ Test critical endpoints
  ```bash
  # Health check
  curl https://yourdomain.com/api/health
  
  # Chat functionality
  curl -X POST https://yourdomain.com/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello", "domain": "test.com"}'
  
  # Embedding generation
  curl -X POST https://yourdomain.com/api/test-rag
  ```
- [ ] Verify widget loading
  ```javascript
  // Test embed.js
  const script = document.createElement('script');
  script.src = 'https://yourdomain.com/embed.js';
  document.head.appendChild(script);
  ```
- [ ] Test WooCommerce integration
- [ ] Verify worker processing
- [ ] Check monitoring dashboards

**Common Pitfalls**:
- ❌ Not testing rollback procedure
- ❌ Deploying during peak hours
- ❌ Missing smoke tests for critical paths

**Automation Opportunities**:
- ✅ CI/CD pipeline with GitHub Actions/GitLab CI
- ✅ Blue-green deployments with zero downtime

---

## 7. Post-Deployment

**Estimated Time**: 2-3 hours  
**Risk Level**: LOW  
**Dependencies**: Successful deployment

### Verification Steps

- [ ] ⚠️ Monitor error rates for 30 minutes
  ```bash
  # Watch error logs
  docker logs -f omniops-app 2>&1 | grep ERROR
  ```
- [ ] Verify all services are running
  ```bash
  docker-compose ps
  kubectl get pods
  ```
- [ ] Check database connections
  ```sql
  SELECT count(*) FROM pg_stat_activity;
  ```
- [ ] Validate queue processing
  ```bash
  npm run queue:stats
  ```
- [ ] Test customer-facing features
  - [ ] Chat widget loads
  - [ ] Messages are processed
  - [ ] Scraping works
  - [ ] WooCommerce sync functions

### Performance Benchmarks

- [ ] Measure response times
  ```bash
  # API response times
  for i in {1..100}; do
    curl -w "%{time_total}\n" -o /dev/null -s https://yourdomain.com/api/health
  done | awk '{sum+=$1} END {print "Average:", sum/NR "s"}'
  ```
- [ ] Check memory usage
  ```bash
  docker stats --no-stream
  ```
- [ ] Monitor CPU utilization
- [ ] Verify cache hit rates
  ```bash
  redis-cli INFO stats | grep keyspace_hits
  ```
- [ ] Document baseline metrics
  ```markdown
  Production Baseline (Date: YYYY-MM-DD):
  - P50 Response Time: <100ms
  - P95 Response Time: <500ms
  - P99 Response Time: <1s
  - Error Rate: <0.1%
  - Cache Hit Rate: >80%
  ```

### Load Testing

- [ ] Run gradual load test
  ```javascript
  // k6-load-test.js
  import http from 'k6/http';
  import { check } from 'k6';
  
  export const options = {
    stages: [
      { duration: '5m', target: 100 },
      { duration: '10m', target: 100 },
      { duration: '5m', target: 0 },
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.1'],
    },
  };
  
  export default function() {
    const res = http.get('https://yourdomain.com/api/health');
    check(res, { 'status is 200': (r) => r.status === 200 });
  }
  ```
- [ ] Test concurrent chat sessions
- [ ] Verify worker scaling
- [ ] Monitor resource usage under load
- [ ] Document maximum capacity

### Documentation Updates

- [ ] Update README with production URL
- [ ] Document deployment process
- [ ] Create runbook for common issues
  ```markdown
  ## Common Issues & Solutions
  
  ### High Memory Usage
  1. Check for memory leaks: `docker stats`
  2. Restart workers: `docker-compose restart worker-scraping`
  3. Clear Redis cache if needed: `redis-cli FLUSHDB`
  
  ### Slow Response Times
  1. Check database connections: `SELECT * FROM pg_stat_activity`
  2. Verify Redis is running: `redis-cli ping`
  3. Check worker queue depth: `npm run queue:stats`
  ```
- [ ] Update API documentation
- [ ] Record infrastructure diagram

### Team Notifications

- [ ] ⚠️ Send deployment notification
  ```bash
  # Slack notification example
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"✅ Omniops v1.0.0 deployed to production"}' \
    $SLACK_WEBHOOK_URL
  ```
- [ ] Update status page
- [ ] Notify customer success team
- [ ] Schedule post-deployment review
- [ ] Create deployment report
  ```markdown
  ## Deployment Report - v1.0.0
  
  Date: YYYY-MM-DD
  Duration: X hours
  Downtime: 0 minutes
  
  Changes:
  - Feature X added
  - Performance improvements
  - Bug fixes
  
  Issues:
  - None
  
  Next Steps:
  - Monitor for 24 hours
  - Gather user feedback
  ```

**Common Pitfalls**:
- ❌ Not monitoring closely after deployment
- ❌ Forgetting to update documentation
- ❌ Not communicating with stakeholders

**Automation Opportunities**:
- ✅ Automated smoke tests post-deployment
- ✅ Automatic rollback on failure thresholds

---

## Critical Path Summary

The following items MUST be completed in order:

1. **Environment Setup** → 2. **SSL Certificates** → 3. **Database Migration** → 4. **Security Configuration** → 5. **Build & Deploy** → 6. **Smoke Tests** → 7. **Monitoring Verification**

## Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: [Contact Info]
- **On-Call Engineer**: [PagerDuty Rotation]

## Quick Commands Reference

```bash
# Health check
curl https://yourdomain.com/api/health/comprehensive

# View logs
docker-compose logs -f --tail=100

# Restart services
docker-compose restart

# Emergency rollback
./scripts/rollback.sh

# Queue statistics
npm run queue:stats

# Database connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Redis memory
redis-cli INFO memory

# Worker status
docker-compose -f docker-compose.workers.yml ps
```

## Sign-off Checklist

Before marking deployment as complete:

- [ ] All smoke tests pass
- [ ] Error rate < 0.1%
- [ ] Response time P95 < 500ms
- [ ] All workers processing
- [ ] Monitoring dashboards active
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback procedure tested

**Deployment Approved By**: ________________  
**Date**: ________________  
**Version**: ________________

---

*This checklist should be reviewed and updated after each major deployment to incorporate lessons learned.*