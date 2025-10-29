# Getting Started: For DevOps Engineers

**Target Audience:** DevOps/Infrastructure engineers deploying and operating Omniops in production
**Last Updated:** 2025-10-24
**Estimated Setup Time:** 2-4 hours

---

## 1. System Overview

### What is Omniops?

Omniops is a multi-tenant, AI-powered customer service platform providing an embeddable chat widget. The system combines:
- Semantic search over scraped website content (pgvector)
- E-commerce platform integrations (WooCommerce, Shopify)
- OpenAI GPT-4 for intelligent responses
- Real-time web scraping and content indexing

### Architecture at 10,000 Feet

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Website A    │  │ Website B    │  │ Website C    │     │
│  │ (embed.js)   │  │ (embed.js)   │  │ (embed.js)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 15 Application (Node.js 20)                  │ │
│  │  - API Routes (/api/chat, /api/scrape, etc.)          │ │
│  │  - Server-Side Rendering (SSR)                        │ │
│  │  - Static Asset Serving                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    ↓                        ↓
┌──────────────────────────┐   ┌──────────────────────────────┐
│    DATA LAYER            │   │    EXTERNAL SERVICES         │
│  ┌────────────────────┐  │   │  ┌────────────────────────┐ │
│  │ Supabase           │  │   │  │ OpenAI API             │ │
│  │ - PostgreSQL 15    │  │   │  │ - GPT-4                │ │
│  │ - pgvector ext     │  │   │  │ - text-embedding-3     │ │
│  │ - Row Level Sec.   │  │   │  └────────────────────────┘ │
│  └────────────────────┘  │   │  ┌────────────────────────┐ │
│  ┌────────────────────┐  │   │  │ WooCommerce/Shopify    │ │
│  │ Redis (optional)   │  │   │  │ - Product APIs         │ │
│  │ - Job Queue        │  │   │  │ - Order Management     │ │
│  │ - Rate Limiting    │  │   │  └────────────────────────┘ │
│  └────────────────────┘  │   └──────────────────────────────┘
└──────────────────────────┘
```

### Key Components

1. **Next.js Application**: Serverless Node.js functions (API routes) + SSR pages
2. **Supabase**: Managed PostgreSQL with pgvector extension for embeddings
3. **Redis**: Optional, for job queuing and caching (recommended for production)
4. **OpenAI**: External API for LLM responses and embeddings generation
5. **E-commerce Platforms**: Customer WooCommerce/Shopify stores (customer-provided)

### Traffic Patterns

- **Read-heavy**: 80% reads (chat queries, product searches), 20% writes (messages, scraping)
- **Burstiness**: Spikes during business hours, minimal overnight traffic
- **Long-tail requests**: Chat API calls can take 10-20s due to LLM processing
- **Background jobs**: Web scraping runs asynchronously via Redis queues

---

## 2. Infrastructure Requirements

### Compute Resources

#### Development Environment
- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum
- **Storage**: 10GB (node_modules + build artifacts)

#### Production (per instance)
- **CPU**: 4 cores recommended (2 minimum)
- **RAM**: 8GB recommended (4GB minimum)
- **Storage**: 20GB (includes logs, cache)
- **Network**: 1Gbps recommended

#### Scaling Considerations
```
Traffic Level        | Instances | Total CPU | Total RAM
---------------------|-----------|-----------|------------
0-100 req/min        | 1         | 2 cores   | 4GB
100-500 req/min      | 2-3       | 8 cores   | 16GB
500-2000 req/min     | 4-8       | 32 cores  | 64GB
2000+ req/min        | 8+        | Custom    | Custom
```

### Database (Supabase/PostgreSQL)

#### Minimum Specifications
- **PostgreSQL Version**: 15+
- **Required Extensions**: pgvector, uuid-ossp
- **Storage**: 20GB minimum (grows with scraped content)
- **RAM**: 4GB dedicated (8GB for production)
- **Connection Pool**: 20-50 connections per app instance

#### Storage Growth Estimates
```
Metric                          | Storage per Month
--------------------------------|-------------------
1000 scraped pages              | ~500MB
10,000 embeddings (1536-dim)    | ~200MB
100,000 chat messages           | ~50MB
Indexes + metadata              | ~20% overhead
```

**Example**: 10 customers × 1000 pages each = ~5GB/month base + ~1GB overhead = **6GB/month**

#### Recommended Supabase Plan
- **Starter**: Development/testing (max 500MB database)
- **Pro**: Small production deployments (<10 customers)
- **Team/Enterprise**: Production deployments (10+ customers)

### Redis (Optional but Recommended)

#### When to Use Redis
- **Required**: Web scraping (job queue management)
- **Recommended**: Rate limiting, caching, session management
- **Optional**: Development (graceful fallback to in-memory)

#### Specifications
- **Memory**: 1GB minimum (2GB recommended)
- **Persistence**: AOF + RDB snapshots
- **Connection Pool**: 10-20 per app instance
- **High Availability**: Redis Sentinel (3 nodes) or Redis Cluster

#### Managed Redis Options
- **Vercel KV**: Best for Vercel deployments
- **AWS ElastiCache**: Production-grade, auto-failover
- **Upstash**: Serverless, pay-per-request
- **Self-hosted**: Docker + Redis 7

### Network Requirements

#### Bandwidth Estimates
```
Operation                | Bandwidth per Request
-------------------------|------------------------
Chat message (no search) | 10KB outbound
Chat with search         | 50-100KB outbound
Web scraping (per page)  | 100-500KB inbound
Embedding generation     | 5KB outbound (OpenAI)
WooCommerce sync         | 20-50KB per product
```

**Peak estimate**: 500 req/min × 50KB = **25MB/min** = **1.5GB/hour**

#### Firewall/Security Groups

**Inbound Rules:**
```
Port 3000 (HTTP)     - Allow from Load Balancer/CDN
Port 443 (HTTPS)     - Allow from Load Balancer/CDN (if self-hosted SSL)
```

**Outbound Rules:**
```
Port 443 (HTTPS)     - Allow to Supabase, OpenAI, customer WooCommerce stores
Port 6379 (Redis)    - Allow to Redis instance (internal network only)
```

### Storage Requirements

#### Application Storage
- **Node modules**: ~1GB
- **Build artifacts**: ~500MB
- **Logs**: 100MB-1GB/day (depending on verbosity)
- **Temp files**: 100MB (scraping, caching)

#### Persistent Volumes (if using Docker)
```
Volume               | Size      | Purpose
---------------------|-----------|---------------------------
redis-data           | 5GB       | Redis AOF/RDB persistence
app-logs             | 10GB      | Application logs
public-uploads       | 1GB       | User-uploaded assets (if any)
```

---

## 3. Deployment Options

### Option A: Vercel (Recommended)

**Pros:**
- Zero-config deployment from GitHub
- Automatic HTTPS, CDN, edge caching
- Built-in preview deployments
- Serverless auto-scaling
- Excellent Next.js optimization

**Cons:**
- Serverless function timeouts (60s max on Pro, 300s on Enterprise)
- Cold starts (~1-3s)
- Limited control over runtime environment
- Higher cost at scale vs. self-hosted

**Best For:** Startups, rapid iteration, global deployments

**Cost Estimate:**
```
Plan          | Price/month | Limits
--------------|-------------|--------------------------------
Hobby (free)  | $0          | 100GB bandwidth, 6000 build mins
Pro           | $20/seat    | 1TB bandwidth, unlimited builds
Enterprise    | Custom      | Custom limits, SLA guarantees
```

**Additional Costs:**
- Function invocations: Generous free tier, then $0.65/million
- Edge middleware: Included
- Bandwidth overage: $0.15/GB

### Option B: Docker + Docker Compose

**Pros:**
- Full control over environment
- Consistent dev/staging/production
- Easy local development
- Can run on any cloud (AWS, GCP, Azure, DigitalOcean)

**Cons:**
- Manual scaling configuration
- Requires container orchestration for HA
- More operational overhead
- Manual SSL/CDN setup

**Best For:** Self-hosted deployments, hybrid cloud, specific compliance requirements

**Infrastructure Options:**
- **Single server**: DigitalOcean Droplet, AWS EC2 t3.large
- **Container platform**: AWS ECS, Google Cloud Run, Azure Container Instances
- **Kubernetes**: AWS EKS, GKE, AKS (overkill unless multi-region)

### Option C: Self-Hosted VM/Bare Metal

**Pros:**
- Maximum control and customization
- Predictable costs
- No vendor lock-in
- Can optimize for specific workloads

**Cons:**
- Most operational overhead
- Requires load balancer, reverse proxy, SSL management
- Manual scaling and monitoring setup
- Security hardening responsibility

**Best For:** Large enterprises, data sovereignty requirements, high-volume deployments

### Deployment Comparison Matrix

| Criteria              | Vercel | Docker | Self-Hosted |
|-----------------------|--------|--------|-------------|
| **Setup Time**        | 10 min | 2 hrs  | 4+ hrs      |
| **Operational Overhead** | Low | Medium | High        |
| **Auto-scaling**      | Built-in | Manual | Manual    |
| **Cost (100 customers)** | ~$100/mo | ~$200/mo | ~$150/mo |
| **HA/Redundancy**     | Built-in | Manual | Manual    |
| **Global CDN**        | Built-in | Extra cost | Extra cost |
| **SSL Management**    | Automatic | Manual | Manual    |

---

## 4. Environment Configuration

### Required Environment Variables

#### Supabase Configuration
```bash
# CRITICAL: These are public-safe (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# CRITICAL: Secret key - NEVER expose to browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Security Notes:**
- `NEXT_PUBLIC_*` variables are embedded in client-side JS bundle
- Anon key is protected by Supabase Row Level Security (RLS)
- Service role key bypasses RLS - treat as root database password
- Rotate service role key quarterly or after suspected exposure

#### OpenAI Configuration
```bash
# CRITICAL: Secret API key
OPENAI_API_KEY=sk-proj-abc123...
```

**Cost Management:**
- Set up billing alerts in OpenAI dashboard ($50, $100, $200 thresholds)
- Monitor usage at https://platform.openai.com/usage
- Typical cost: $0.03-0.15 per chat interaction (depends on search scope)

#### Redis Configuration
```bash
# Optional - defaults to localhost in development
REDIS_URL=redis://localhost:6379

# Production examples:
# REDIS_URL=redis://user:password@redis.example.com:6379
# REDIS_URL=rediss://default:password@redis-12345.upstash.io:6379  # Upstash
# REDIS_URL=redis://master.redis-cluster.local:6379                 # AWS ElastiCache
```

**Connection String Format:**
```
redis[s]://[username][:password]@host[:port][/database][?options]

s = TLS-encrypted connection (rediss://)
username = optional (Redis 6+ ACL)
database = 0-15 (default: 0)
```

### Optional Environment Variables

#### WooCommerce (Test/Demo Credentials)
```bash
# For testing WooCommerce integration
WOOCOMMERCE_URL=https://demo-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_abc123...
WOOCOMMERCE_CONSUMER_SECRET=cs_xyz789...
```

**Note:** Production WooCommerce credentials are stored **encrypted in database**, not environment variables.

#### Encryption Key
```bash
# CRITICAL: Must be exactly 32 characters
# Used for encrypting customer WooCommerce credentials in database
ENCRYPTION_KEY=your-32-character-encryption-key

# Generate secure key:
# openssl rand -base64 32 | head -c 32
```

**Rotation Strategy:**
- Store in secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Rotate annually
- Requires re-encryption of existing credentials after rotation

#### Cron Security Token
```bash
# For protecting automated scraping endpoints
CRON_SECRET=your-random-cron-secret

# Generate:
# openssl rand -hex 32
```

**Usage:**
```bash
# Trigger automated scraping:
curl -X POST https://app.com/api/scrape/scheduled \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Feature Flags
```bash
# Enable simplified chat responses (75 words max)
USE_SIMPLIFIED_PROMPT=true

# Disable Next.js telemetry
NEXT_TELEMETRY_DISABLED=1
```

### Secrets Management Best Practices

#### Development
```bash
# Local .env.local (gitignored)
cp .env.example .env.local
# Edit .env.local with real credentials
```

#### Staging/Production

**Vercel:**
```bash
# Add via CLI
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Or via dashboard: Settings → Environment Variables
```

**Docker:**
```bash
# Use Docker secrets (Swarm) or external secrets (Compose)
docker secret create openai_api_key /path/to/key.txt
docker service update --secret-add openai_api_key app
```

**Kubernetes:**
```yaml
# Use Kubernetes Secrets
apiVersion: v1
kind: Secret
metadata:
  name: omniops-secrets
type: Opaque
data:
  openai-api-key: <base64-encoded-key>
  supabase-service-key: <base64-encoded-key>
```

**AWS/GCP/Azure:**
- AWS: Secrets Manager + IAM roles
- GCP: Secret Manager + service accounts
- Azure: Key Vault + managed identities

### Environment Variable Validation

The application validates environment variables at startup:

```typescript
// Startup checks (automatic):
- NEXT_PUBLIC_SUPABASE_URL: Must be valid URL
- OPENAI_API_KEY: Must start with "sk-"
- ENCRYPTION_KEY: Must be exactly 32 characters
- REDIS_URL: Connection tested, graceful fallback if unavailable
```

**Failure modes:**
- Missing critical variables → Application fails to start
- Invalid Redis URL → Warning logged, falls back to in-memory
- Invalid OpenAI key → Chat API returns 500 errors

---

## 5. Database Setup & Migrations

### Supabase Initial Setup

#### 1. Create Supabase Project
```bash
# Via web dashboard:
1. Go to https://supabase.com/dashboard
2. Create new project
3. Choose region (closest to app deployment)
4. Select plan (Pro recommended for production)
5. Wait 2-5 minutes for provisioning
```

#### 2. Enable Required Extensions
```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
```

**Verify:**
```sql
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgvector');
```

#### 3. Run Schema Migrations

**Option A: Via Supabase Dashboard**
```bash
# Copy SQL from 07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md
# Paste into SQL Editor → Run
# Verify tables created: Database → Tables
```

**Option B: Via Supabase CLI (Recommended)**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Verify
supabase db diff
```

### Schema Overview

#### Core Tables (20 total)
```
Table                      | Rows (est.) | Purpose
---------------------------|-------------|---------------------------
customer_configs           | 100-1000    | Customer settings
scraped_pages              | 10K-1M      | Indexed website content
page_embeddings            | 50K-5M      | Vector embeddings (1536-dim)
conversations              | 100K-10M    | Chat sessions
messages                   | 1M-100M     | Chat message history
structured_extractions     | 1K-100K     | FAQs, products metadata
scrape_jobs                | 1K-100K     | Background scraping queue
query_cache                | 10K-1M      | Performance cache
```

**Full schema**: See `/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md` (authoritative reference)

### Row Level Security (RLS)

**Critical for multi-tenancy:**

```sql
-- Example RLS policy for scraped_pages
CREATE POLICY "Customers can only access their own scraped pages"
  ON scraped_pages
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customer_configs
      WHERE domain = current_setting('app.current_domain', true)
    )
  );
```

**Verify RLS enabled:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('scraped_pages', 'conversations', 'messages');
```

**All should return:** `rowsecurity = true`

### Database Indexes

**Critical indexes (performance):**

```sql
-- Vector similarity search (REQUIRED)
CREATE INDEX page_embeddings_embedding_idx
  ON page_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Domain-based queries (CRITICAL for multi-tenancy)
CREATE INDEX scraped_pages_domain_idx
  ON scraped_pages(customer_id);

-- Chat history queries
CREATE INDEX messages_conversation_idx
  ON messages(conversation_id, created_at DESC);
```

**Verify indexes:**
```sql
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Backup Strategy

#### Automated Backups (Supabase)
```
Plan         | Backup Frequency | Retention
-------------|------------------|------------
Free         | Daily            | 7 days
Pro          | Daily            | 14 days
Team/Ent.    | Hourly           | 30+ days
```

**Access backups:**
```bash
# Supabase dashboard → Database → Backups
# Download as .sql.gz file
```

#### Manual Backups
```bash
# Full database dump
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        --clean --if-exists \
        > backup_$(date +%Y%m%d).sql

# Compressed
pg_dump ... | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### Point-in-Time Recovery (PITR)
```bash
# Supabase Pro+ only
# Via dashboard: Database → Backups → Restore to specific timestamp
# Granularity: 1-second precision within retention window
```

### Migration Workflow

#### Development
```bash
# 1. Make schema changes locally
supabase migration new add_new_feature

# 2. Edit migration file
vim supabase/migrations/20250124_add_new_feature.sql

# 3. Test locally
supabase db reset  # Applies all migrations

# 4. Commit to git
git add supabase/migrations/
git commit -m "feat: add new feature schema"
```

#### Production
```bash
# 1. Review migration in staging
supabase db push --db-url $STAGING_DB_URL

# 2. Verify no breaking changes
npm run test:integration

# 3. Apply to production
supabase db push --db-url $PRODUCTION_DB_URL

# 4. Monitor for errors
tail -f /var/log/app.log
```

### Database Maintenance

#### Weekly Tasks
```sql
-- Vacuum analyze (performance)
VACUUM ANALYZE;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### Monthly Tasks
```sql
-- Reindex for vector search performance
REINDEX INDEX page_embeddings_embedding_idx;

-- Cleanup old query cache (>30 days)
DELETE FROM query_cache
WHERE created_at < NOW() - INTERVAL '30 days';

-- Analyze query patterns
SELECT query, calls, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

---

## 6. Docker Deployment

### Building Images (Production)

#### Using Docker BuildKit (59% faster)
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker build -t omniops:latest .

# Build without cache (clean build)
docker build --no-cache -t omniops:latest .

# Multi-platform build (for ARM64 servers)
docker buildx build --platform linux/amd64,linux/arm64 \
  -t omniops:latest .
```

**Build Performance:**
```
Build Type         | Time    | Cache Hit Rate
-------------------|---------|----------------
Cold build         | 180s    | 0%
Warm build         | 45s     | 85%
Incremental        | 30s     | 95%
```

#### Image Tagging Strategy
```bash
# Tag with version
docker tag omniops:latest omniops:v1.2.3

# Tag with git commit
GIT_SHA=$(git rev-parse --short HEAD)
docker tag omniops:latest omniops:${GIT_SHA}

# Tag with date
DATE=$(date +%Y%m%d)
docker tag omniops:latest omniops:${DATE}

# Push to registry
docker push your-registry.com/omniops:latest
docker push your-registry.com/omniops:v1.2.3
```

### Docker Compose Configuration Explained

#### Production Setup (`docker-compose.yml`)

```yaml
services:
  # Redis for job queue and caching
  redis:
    image: redis:7-alpine          # Minimal Alpine image
    container_name: omniops-redis
    ports:
      - "6379:6379"                # Expose Redis port
    volumes:
      - redis-data:/data           # Persistent volume
      - ./docker/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped        # Auto-restart on failure
    networks:
      - omniops-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s                # Check every 10s
      timeout: 5s
      retries: 5                   # Mark unhealthy after 5 failures

  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: omniops-app
    ports:
      - "3000:3000"                # Expose app port
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379  # Service name as hostname
      # Supabase credentials from .env file
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      redis:
        condition: service_healthy # Wait for Redis health check
    restart: unless-stopped
    networks:
      - omniops-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s            # Grace period for app startup

volumes:
  redis-data:
    driver: local                  # Persist Redis data

networks:
  omniops-network:
    driver: bridge                 # Internal container network
```

#### Development Setup (`docker-compose.dev.yml`)

```yaml
# Extends docker-compose.yml with dev-specific overrides
services:
  app:
    build:
      dockerfile: Dockerfile.dev   # Uses hot-reload
    volumes:
      - .:/app                     # Mount source code
      - /app/node_modules          # Exclude node_modules
    environment:
      - NODE_ENV=development
      - NEXT_TELEMETRY_DISABLED=1
```

### Volume Management

#### Persistent Data
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect omniops_redis-data

# Backup Redis data
docker run --rm -v omniops_redis-data:/data \
  -v $(pwd):/backup alpine \
  tar czf /backup/redis-backup-$(date +%Y%m%d).tar.gz /data

# Restore Redis data
docker run --rm -v omniops_redis-data:/data \
  -v $(pwd):/backup alpine \
  tar xzf /backup/redis-backup-20250124.tar.gz -C /
```

#### Cleanup
```bash
# Remove all stopped containers and unused volumes
docker system prune -a --volumes

# Remove specific volume (WARNING: data loss)
docker volume rm omniops_redis-data
```

### Networking

#### Container Communication
```bash
# Containers communicate via service names:
# app → redis:6379 (not localhost:6379)

# Test connectivity from app container
docker exec omniops-app ping redis

# Test Redis from app
docker exec omniops-app redis-cli -h redis PING
```

#### Port Mapping
```
Container Port → Host Port
3000 (app)     → 3000 (accessible externally)
6379 (redis)   → 6379 (accessible for debugging)
```

**Production Security:**
```yaml
# Only expose app port, not Redis
services:
  redis:
    ports: []  # No external exposure
    expose:
      - "6379"  # Only internal network
```

### Running in Production

#### Start Services
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

#### Scaling
```bash
# Run 3 app instances (requires load balancer)
docker-compose up -d --scale app=3

# Verify
docker-compose ps
```

#### Zero-Downtime Deployment
```bash
# 1. Build new image
docker-compose build app

# 2. Start new container
docker-compose up -d --no-deps --build app

# 3. Old container stops automatically (replaced)
# 4. Health check ensures new container is healthy before stopping old
```

### Troubleshooting

#### Container Won't Start
```bash
# Check logs
docker logs omniops-app

# Common issues:
# - Missing environment variables → Check .env file
# - Port already in use → lsof -i :3000, kill process
# - Health check failing → curl http://localhost:3000/api/health
```

#### Redis Connection Errors
```bash
# Verify Redis is running
docker exec omniops-redis redis-cli PING
# Should return: PONG

# Check app can reach Redis
docker exec omniops-app ping redis

# Inspect Redis logs
docker logs omniops-redis
```

#### High Memory Usage
```bash
# Check container stats
docker stats omniops-app

# If memory limit exceeded, increase in docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G  # Increase from default
```

---

## 7. Vercel Deployment

### Initial Setup

#### 1. Connect GitHub Repository
```bash
# Via Vercel Dashboard:
1. Go to https://vercel.com/new
2. Import Git Repository
3. Select your Omniops repository
4. Choose framework: Next.js (auto-detected)
5. Click Deploy
```

#### 2. Configure Build Settings

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
.next
```

**Install Command:**
```bash
npm ci
```

**Node.js Version:**
```
20.x
```

#### 3. Environment Variables

**Via CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add secrets
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add ENCRYPTION_KEY production

# Add public variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

**Via Dashboard:**
```
Settings → Environment Variables → Add New

Variable Name: OPENAI_API_KEY
Value: sk-proj-...
Environment: Production, Preview, Development
```

#### 4. Domain Configuration

**Custom Domain:**
```bash
# Via CLI
vercel domains add app.yourcompany.com

# Configure DNS:
# Add CNAME: app.yourcompany.com → cname.vercel-dns.com
```

**SSL Certificate:**
- Automatically provisioned via Let's Encrypt
- Auto-renewal every 90 days
- No configuration required

### Project Configuration

#### `vercel.json` (Optional)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/embed.js",
      "destination": "/public/embed.js"
    }
  ]
}
```

**Region Selection:**
```
Code   | Region              | Use Case
-------|---------------------|------------------------
iad1   | Washington, D.C.    | US East (default)
sfo1   | San Francisco       | US West
lhr1   | London              | Europe
hnd1   | Tokyo               | Asia-Pacific
```

**Choose region closest to:** Supabase database region (minimize latency)

### Build Settings

#### Production Optimizations
```json
// next.config.js
module.exports = {
  output: 'standalone',  // Optimized for Vercel
  swcMinify: true,       // Faster builds
  compress: true,        // Gzip compression
  images: {
    domains: ['yourcdn.com'],
    formats: ['image/avif', 'image/webp']
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  }
}
```

#### Environment-Specific Builds
```bash
# Preview deployments (PR branches)
vercel env add OPENAI_API_KEY preview

# Development (local vercel dev)
vercel env add OPENAI_API_KEY development
```

### Monitoring & Logs

#### Real-Time Logs
```bash
# Via CLI
vercel logs --follow

# Filter by function
vercel logs /api/chat

# Filter by time
vercel logs --since 1h
```

#### Analytics Dashboard
```
Vercel Dashboard → Analytics:
- Page views
- Top pages
- Unique visitors
- Web Vitals (Core Web Vitals)
```

#### Error Tracking
```
Vercel Dashboard → Logs:
- Function errors (500 errors)
- Build errors
- Edge function errors
```

### Performance Monitoring

#### Serverless Function Metrics
```
Metrics Available:
- Invocation count (requests/min)
- Average duration (ms)
- P50, P95, P99 latency
- Error rate (%)
- Cold start frequency
```

**Accessing:**
```bash
# Via dashboard: Deployments → [Latest] → Functions

# Via CLI:
vercel inspect <deployment-url> --logs
```

#### Web Vitals
```
Core Web Vitals (automatically tracked):
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
```

### Deployment Workflow

#### Automatic Deployments
```
Git Push → GitHub:
- main branch    → Production deployment
- feature/* branches → Preview deployment
- PR opened      → Preview deployment + comment with URL
```

#### Manual Deployments
```bash
# Deploy current directory
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
git checkout feature-x
vercel
```

#### Rollback
```bash
# Via CLI: Promote previous deployment
vercel rollback

# Via dashboard: Deployments → [...] → Promote to Production
```

### Edge Functions (Optional)

**Use Cases:**
- Geolocation-based responses
- A/B testing
- Request/response transformations

**Example:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const geo = request.geo;
  const response = NextResponse.next();

  // Add geolocation header
  response.headers.set('x-user-country', geo?.country || 'US');

  return response;
}

export const config = {
  matcher: '/api/:path*'
};
```

### Cost Optimization

#### Function Duration
```typescript
// Reduce function execution time → lower costs
// Example: Cache expensive operations

import { LRUCache } from 'lru-cache';
const cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 });

export async function GET(request: Request) {
  const cacheKey = new URL(request.url).pathname;
  const cached = cache.get(cacheKey);

  if (cached) return cached; // Avoid expensive computation

  const result = await expensiveOperation();
  cache.set(cacheKey, result);
  return result;
}
```

#### Bandwidth Optimization
```javascript
// Enable compression in next.config.js
module.exports = {
  compress: true,  // Reduces bandwidth by 70-80%

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  }
}
```

---

## 8. Monitoring & Observability

### Application Logs

#### Log Levels
```typescript
// Production logging strategy
console.error()  // Critical errors, always logged
console.warn()   // Warnings, degraded performance
console.info()   // Important state changes (disabled in prod by default)
console.debug()  // Verbose debugging (disabled in prod)
```

#### Structured Logging
```typescript
// Example: app/api/chat/route.ts
console.log(JSON.stringify({
  level: 'info',
  timestamp: new Date().toISOString(),
  event: 'chat_request',
  domain: domain,
  session_id: session_id,
  response_time_ms: duration,
  token_usage: tokens
}));
```

**Benefits:**
- Easily parsed by log aggregators (Datadog, New Relic, CloudWatch)
- Queryable fields (filter by domain, session, etc.)
- Structured for alerting

#### Log Aggregation

**Option A: Vercel (Built-in)**
```bash
# Stream logs
vercel logs --follow

# Export to external service
# Settings → Integrations → Datadog/New Relic/Sentry
```

**Option B: Docker/Self-Hosted**
```yaml
# docker-compose.yml - Forward to syslog
services:
  app:
    logging:
      driver: syslog
      options:
        syslog-address: "tcp://logs.yourcompany.com:514"
        tag: "omniops-app"
```

**Option C: CloudWatch (AWS)**
```bash
# Install CloudWatch agent
docker run --log-driver=awslogs \
  --log-opt awslogs-region=us-east-1 \
  --log-opt awslogs-group=omniops \
  omniops:latest
```

### Performance Metrics

#### Key Metrics to Track

**Application-Level:**
```
Metric                     | Target      | Alert Threshold
---------------------------|-------------|------------------
API Response Time (P95)    | <2s         | >5s
Chat Generation Time       | 10-15s      | >30s
Search Query Time          | <500ms      | >2s
Database Query Time (P95)  | <100ms      | >500ms
OpenAI API Call Time       | 2-5s        | >10s
Cache Hit Rate             | >80%        | <60%
Error Rate                 | <0.5%       | >2%
```

**Infrastructure-Level:**
```
Metric                     | Target      | Alert Threshold
---------------------------|-------------|------------------
CPU Usage                  | 40-60%      | >80%
Memory Usage               | 50-70%      | >85%
Database Connections       | 10-30       | >90 (of pool limit)
Redis Memory Usage         | <1GB        | >1.5GB
Disk I/O Wait              | <5%         | >20%
```

#### Metrics Collection

**Option A: Application Performance Monitoring (APM)**

```typescript
// Example: New Relic integration
import newrelic from 'newrelic';

export async function POST(request: Request) {
  const transaction = newrelic.getTransaction();
  transaction.addAttribute('domain', domain);
  transaction.addAttribute('session_id', session_id);

  try {
    const result = await processChat(request);
    newrelic.recordMetric('Custom/ChatSuccess', 1);
    return result;
  } catch (error) {
    newrelic.noticeError(error);
    throw error;
  }
}
```

**Popular APM Options:**
- **New Relic**: Full-stack observability, excellent Next.js support
- **Datadog**: Infrastructure + APM, strong alerting
- **Sentry**: Error tracking + performance monitoring
- **Vercel Analytics**: Built-in, zero-config (if on Vercel)

**Option B: Custom Metrics (Prometheus)**

```typescript
// lib/metrics.ts
import { Counter, Histogram } from 'prom-client';

export const chatRequests = new Counter({
  name: 'omniops_chat_requests_total',
  help: 'Total chat requests',
  labelNames: ['domain', 'status']
});

export const chatDuration = new Histogram({
  name: 'omniops_chat_duration_seconds',
  help: 'Chat request duration',
  labelNames: ['domain'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30]
});

// Usage in API route:
const end = chatDuration.startTimer({ domain });
// ... process request
end();
chatRequests.inc({ domain, status: 'success' });
```

**Expose metrics endpoint:**
```typescript
// app/api/metrics/route.ts
import { register } from 'prom-client';

export async function GET() {
  return new Response(await register.metrics(), {
    headers: { 'Content-Type': register.contentType }
  });
}
```

**Scrape with Prometheus:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'omniops'
    scrape_interval: 15s
    static_configs:
      - targets: ['app.yourcompany.com:3000/api/metrics']
```

### Database Monitoring

#### Supabase Built-in Monitoring
```
Dashboard → Database → Performance:
- Active connections
- Slow queries (>1s)
- Database size growth
- Cache hit ratio
- Index usage
```

#### Critical Queries to Monitor
```sql
-- Connection count
SELECT count(*) FROM pg_stat_activity;

-- Slow queries (>1s)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND (now() - pg_stat_activity.query_start) > interval '1 second';

-- Table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cache hit ratio (should be >95%)
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
FROM pg_statio_user_tables;
```

#### Alerts
```
Metric                     | Alert Threshold
---------------------------|------------------
Connections > 80%          | Scale pool or investigate leaks
Slow queries > 5/min       | Optimize queries, add indexes
Cache hit ratio < 90%      | Increase shared_buffers
Database size > 80%        | Upgrade plan or cleanup old data
Replication lag > 10s      | Check replication health (HA setup)
```

### Redis Monitoring

#### Key Metrics
```bash
# Via redis-cli
redis-cli INFO

# Memory usage
redis-cli INFO memory | grep used_memory_human

# Connected clients
redis-cli INFO clients | grep connected_clients

# Operations per second
redis-cli INFO stats | grep instantaneous_ops_per_sec

# Hit rate
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses
```

#### Recommended Alerts
```
Metric                     | Alert Threshold
---------------------------|------------------
Memory usage > 80%         | Scale Redis or increase eviction
Connected clients > 100    | Connection leak, investigate
Hit rate < 70%             | Review caching strategy
Evicted keys > 100/min     | Increase memory or optimize TTLs
```

### Alert Configuration

#### Alert Levels

**Critical (Page On-Call):**
- Application down (health check failing >3 min)
- Database unreachable
- Error rate >10%
- P95 response time >30s

**High (Slack Notification):**
- Error rate >5%
- P95 response time >10s
- CPU usage >80% for 10 min
- Memory usage >90%

**Medium (Email):**
- Cache hit rate <70%
- Slow queries >10/min
- Database connections >70%

**Low (Dashboard Only):**
- Response time trending up
- Storage >60%

#### Example Alert Configurations

**Datadog:**
```yaml
# .datadog/alerts/high-error-rate.yaml
name: "High Error Rate - Omniops"
type: "metric alert"
query: "avg(last_5m):sum:omniops.errors{*}.as_rate() > 0.05"
message: |
  Error rate is {{value}} (>5%)
  @slack-engineering @pagerduty-production
options:
  notify_no_data: true
  new_host_delay: 300
```

**Prometheus + Alertmanager:**
```yaml
# prometheus-rules.yml
groups:
  - name: omniops
    interval: 30s
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, omniops_chat_duration_seconds) > 10
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "P95 response time is {{ $value }}s"
```

**PagerDuty Integration:**
```bash
# Send alert via PagerDuty Events API
curl -X POST https://events.pagerduty.com/v2/enqueue \
  -H 'Content-Type: application/json' \
  -d '{
    "routing_key": "YOUR_INTEGRATION_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Omniops Error Rate Spike",
      "severity": "critical",
      "source": "monitoring",
      "custom_details": {
        "error_rate": "12%",
        "threshold": "5%"
      }
    }
  }'
```

---

## 9. Security Checklist

### Environment Variable Security

- [ ] **Never commit `.env` files** to version control
- [ ] Use `.env.local` for development (gitignored)
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` quarterly
- [ ] Rotate `ENCRYPTION_KEY` annually (requires credential re-encryption)
- [ ] Store secrets in secrets manager (AWS Secrets Manager, Vault, etc.)
- [ ] Use different API keys for dev/staging/production
- [ ] Limit OpenAI API key permissions (usage caps)
- [ ] Enable MFA on Supabase dashboard account

### Database Access Control

- [ ] **Enable Row Level Security (RLS)** on all tables
- [ ] Verify RLS policies tested (run `npm run test:integration`)
- [ ] Use service role key only in backend code (never client-side)
- [ ] Restrict database access to application IP ranges (Supabase: Settings → Database → Network)
- [ ] Rotate database passwords quarterly
- [ ] Enable connection pooling (prevents exhaustion attacks)
- [ ] Monitor for suspicious queries (pg_stat_activity)
- [ ] Backup database daily (verify restore process monthly)

### API Rate Limiting

**Current Implementation:**
```typescript
// lib/rate-limit.ts
- 60 requests per minute per domain
- 10 concurrent connections per IP
- Exponential backoff on rate limit violations
```

**Production Hardening:**
- [ ] Reduce rate limits for anonymous users (30 req/min)
- [ ] Implement IP-based blocking for abuse (>1000 req/hour)
- [ ] Add CAPTCHA for suspicious patterns (bot detection)
- [ ] Monitor rate limit violations (alert on >100/hour)
- [ ] Consider Cloudflare Rate Limiting (edge-level protection)

### CORS Configuration

**Current Configuration:**
```typescript
// next.config.js
headers: [
  {
    source: '/api/:path*',
    headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' }  // ⚠️ Too permissive
    ]
  }
]
```

**Production Hardening:**
```typescript
// Restrict to known domains
headers: [
  {
    source: '/api/:path*',
    headers: [
      {
        key: 'Access-Control-Allow-Origin',
        value: process.env.NODE_ENV === 'production'
          ? 'https://yourapp.com,https://widget.yourapp.com'
          : '*'
      },
      { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
    ]
  }
]
```

- [ ] Whitelist only customer domains in production
- [ ] Add domain verification (customer proves ownership)
- [ ] Rotate CORS tokens monthly (if using token-based CORS)

### SSL/TLS Setup

**Vercel (Automatic):**
- [ ] Verify SSL certificate auto-renewed (check dashboard)
- [ ] Enable HSTS: `Strict-Transport-Security: max-age=31536000`
- [ ] Force HTTPS redirects (automatic on Vercel)

**Self-Hosted:**
```bash
# Certbot (Let's Encrypt)
sudo certbot --nginx -d app.yourcompany.com

# Auto-renewal cron
0 0 * * * certbot renew --quiet
```

- [ ] Use TLS 1.2+ only (disable TLS 1.0/1.1)
- [ ] Configure strong cipher suites (Mozilla SSL Config Generator)
- [ ] Enable OCSP stapling (nginx/Apache)
- [ ] Monitor certificate expiry (alert 30 days before)

### Input Validation & Sanitization

**Current Validation:**
```typescript
// Using Zod schemas for all API inputs
const MessageSchema = z.object({
  message: z.string().min(1).max(2000),  // Prevent excessive input
  domain: z.string().url(),              // Validate domain format
  session_id: z.string().uuid()          // Ensure valid UUID
});
```

**Additional Hardening:**
- [ ] Sanitize HTML in user messages (prevent XSS)
- [ ] Rate limit file uploads (if enabled)
- [ ] Validate image uploads (magic bytes, not just extension)
- [ ] Limit embedding generation (prevent token exhaustion attacks)
- [ ] Escape SQL inputs (use parameterized queries only)

### Secrets Rotation Schedule

| Secret                        | Rotation Frequency | Impact            |
|-------------------------------|-------------------|-------------------|
| `OPENAI_API_KEY`              | Annually          | Update env vars   |
| `SUPABASE_SERVICE_ROLE_KEY`   | Quarterly         | Update env vars   |
| `ENCRYPTION_KEY`              | Annually          | Re-encrypt DB     |
| `CRON_SECRET`                 | Quarterly         | Update cron jobs  |
| Database Password             | Quarterly         | Update connection string |
| SSL Certificate               | Auto (90 days)    | Automatic renewal |

### Audit Logging

**Enable Audit Logs:**
```sql
-- Track sensitive operations
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Log configuration changes
INSERT INTO audit_logs (user_id, action, resource_type, metadata)
VALUES (
  current_user_id,
  'update_config',
  'customer_config',
  jsonb_build_object('domain', 'example.com', 'changes', '...')
);
```

**What to Log:**
- [ ] Configuration changes (customer settings)
- [ ] API key regeneration
- [ ] User authentication events
- [ ] Data exports (GDPR requests)
- [ ] Data deletions (GDPR requests)
- [ ] Scraping job initiations
- [ ] Failed login attempts (if auth enabled)

### Security Headers

```typescript
// next.config.js
headers: [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
      }
    ]
  }
]
```

- [ ] Enable Content Security Policy (CSP)
- [ ] Configure CSP report URI (monitor violations)
- [ ] Test headers: https://securityheaders.com

### Dependency Security

```bash
# Audit dependencies for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check for outdated packages
npm outdated

# Use Dependabot (GitHub) for automated PR updates
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

- [ ] Run `npm audit` weekly
- [ ] Enable Dependabot/Renovate for automated updates
- [ ] Review security advisories (GitHub Security tab)
- [ ] Pin critical dependencies (avoid `^` for security-critical packages)

---

## 10. Scaling Strategy

### Horizontal Scaling

#### Application Layer

**Vercel (Auto-Scaling):**
- Automatically scales to demand (0-100+ instances)
- No configuration required
- Scales per region (multi-region = global scaling)

**Docker/Kubernetes:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3              # Run 3 instances
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

**Load Balancer Required:**
```nginx
# nginx.conf
upstream omniops_backend {
  least_conn;  # Route to least busy server
  server app1:3000;
  server app2:3000;
  server app3:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://omniops_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

#### Database Scaling

**Read Replicas (Supabase Pro+):**
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Write client (primary)
export const supabaseWrite = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Read client (replica)
export const supabaseRead = createClient(
  process.env.SUPABASE_READ_REPLICA_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Usage:
const writeData = await supabaseWrite.from('messages').insert({ ... });
const readData = await supabaseRead.from('messages').select('*');
```

**Benefits:**
- Offload reads from primary (80% of queries)
- Reduce primary database load
- Improve read performance

**Connection Pooling:**
```typescript
// Use Supabase connection pooler
const poolerURL = 'postgresql://postgres.pooler.supabase.co:6543/postgres';

// Or pgBouncer (self-hosted)
const poolConfig = {
  max: 20,            // Max connections per instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};
```

### Database Connection Pooling

**Current Setup:**
- Supabase built-in pooler (transaction mode)
- 50 connections per database (Pro plan)

**Optimization:**
```typescript
// Use Supabase pooler for API routes
const POOLER_URL = process.env.DATABASE_POOLER_URL;
// Format: postgresql://postgres.[ref].supabase.co:6543/postgres

// Direct connection for migrations/admin tasks
const DIRECT_URL = process.env.DATABASE_URL;
```

**Monitoring:**
```sql
-- Check active connections
SELECT count(*), state FROM pg_stat_activity
GROUP BY state;

-- Kill idle connections (>10 min)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '10 minutes';
```

### Redis Scaling

#### Vertical Scaling
```
Traffic Level     | Redis Memory | Eviction Policy
------------------|--------------|------------------
0-1K req/min      | 512MB        | allkeys-lru
1K-10K req/min    | 2GB          | allkeys-lru
10K-50K req/min   | 8GB          | allkeys-lru
50K+ req/min      | 16GB+        | Cluster mode
```

#### Redis Cluster (High Availability)
```yaml
# docker-compose.yml (Redis Cluster)
services:
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --replicaof redis-master 6379

  redis-sentinel-1:
    image: redis:7-alpine
    command: redis-sentinel /etc/redis/sentinel.conf
```

**Managed Options:**
- **AWS ElastiCache**: Auto-failover, read replicas
- **Upstash**: Serverless, global replication
- **Redis Enterprise**: Multi-region, active-active

### CDN Configuration

**Vercel (Built-in CDN):**
- Automatic edge caching (global PoPs)
- Smart caching based on response headers

**Cloudflare (External CDN):**
```javascript
// Cache static assets
// next.config.js
headers: [
  {
    source: '/embed.js',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
    ]
  },
  {
    source: '/api/chat',
    headers: [
      { key: 'Cache-Control', value: 'no-store, must-revalidate' }  // Never cache
    ]
  }
]
```

**CDN Rules:**
- Static assets (JS/CSS/images): Cache for 1 year
- API responses: Never cache (dynamic content)
- HTML pages: Cache for 5 minutes (stale-while-revalidate)

### Performance Bottlenecks

#### Identified Bottlenecks (from testing)

**1. Vector Search (pgvector)**
```
Current: 100-500ms per search (10K embeddings)
Optimization:
- Increase IVFFlat lists: 100 → 200 (2x faster, slight accuracy tradeoff)
- Pre-warm index after deployment
- Consider GPU-accelerated similarity search (Qdrant, Weaviate) for >1M vectors
```

**2. OpenAI API Calls**
```
Current: 2-10s per chat request
Optimization:
- Use streaming responses (OpenAI streaming API)
- Cache common queries (query_cache table)
- Batch embedding generation (100 chunks → 1 API call)
```

**3. Web Scraping**
```
Current: 30-60s per page (Playwright)
Optimization:
- Use headless mode (no GUI rendering)
- Disable images/CSS (content-only scraping)
- Increase concurrency (5 → 20 parallel pages)
- Use Firecrawl API (faster than Playwright for simple sites)
```

**4. Database Queries**
```
Current: 50-200ms for complex joins
Optimization:
- Add composite indexes on frequently joined columns
- Denormalize hot tables (reduce JOINs)
- Use materialized views for analytics queries
```

### Scaling Decision Matrix

| Load Level       | App Instances | DB Size | Redis  | CDN    | Estimated Cost |
|------------------|---------------|---------|--------|--------|----------------|
| **0-100 users**  | 1             | Pro     | 512MB  | Vercel | $50/mo         |
| **100-1K users** | 2-3           | Pro     | 2GB    | Vercel | $150/mo        |
| **1K-10K users** | 5-10          | Team    | 8GB    | CF+Ver | $500/mo        |
| **10K-100K**     | 20-50         | Ent.    | Cluster| CF+Ver | $2K-5K/mo      |
| **100K+**        | 50+           | Custom  | Custom | Custom | Custom         |

**Cost Breakdown (10K users example):**
```
Vercel Pro (5 seats):      $100/mo
Supabase Team:             $250/mo
Redis (AWS ElastiCache):   $50/mo
OpenAI API (500K tokens/day): $100/mo
Cloudflare Pro:            $20/mo
Monitoring (Datadog):      $31/mo
------------------------------------
Total:                     ~$551/mo
```

---

## 11. Backup & Disaster Recovery

### Database Backups

#### Automated Backups (Supabase)

**Backup Schedule:**
```
Plan         | Frequency | Retention  | Point-in-Time Recovery
-------------|-----------|------------|------------------------
Free         | Daily     | 7 days     | No
Pro          | Daily     | 14 days    | No
Team         | Hourly    | 30 days    | Yes (1-second precision)
Enterprise   | Hourly    | 90+ days   | Yes (1-second precision)
```

**Access Backups:**
```
1. Supabase Dashboard → Database → Backups
2. Select backup → Download
3. File format: .sql.gz (gzipped SQL dump)
```

#### Manual Backups

**Full Database Dump:**
```bash
# Using pg_dump
pg_dump -h db.yourproject.supabase.co \
        -U postgres \
        -d postgres \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed
pg_dump ... | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Selective Table Backup:**
```bash
# Backup specific tables (e.g., customer configs only)
pg_dump -h db.yourproject.supabase.co \
        -U postgres \
        -d postgres \
        -t customer_configs \
        -t encrypted_credentials \
        > configs_backup_$(date +%Y%m%d).sql
```

**Automated Backup Script:**
```bash
#!/bin/bash
# backup-database.sh

set -e

BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/omniops_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -h db.yourproject.supabase.co \
        -U postgres \
        -d postgres \
        --clean \
        --if-exists \
        | gzip > "$BACKUP_FILE"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_FILE" s3://your-backup-bucket/postgres/

# Delete old backups
find "$BACKUP_DIR" -name "omniops_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE"
```

**Schedule via cron:**
```cron
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/backup.log 2>&1
```

#### Backup Verification

```bash
# Test restore to separate database
createdb omniops_restore_test
gunzip -c backup_20250124.sql.gz | psql -d omniops_restore_test

# Verify data integrity
psql -d omniops_restore_test -c "SELECT COUNT(*) FROM customer_configs;"
psql -d omniops_restore_test -c "SELECT COUNT(*) FROM page_embeddings;"

# Cleanup
dropdb omniops_restore_test
```

**Monthly Restore Test Checklist:**
- [ ] Download latest backup
- [ ] Restore to test database
- [ ] Verify row counts match production
- [ ] Test critical queries (chat, search)
- [ ] Document restore time (track degradation)

### Point-in-Time Recovery (PITR)

**Available on:** Supabase Team/Enterprise plans

**Use Cases:**
- Accidental data deletion (recover to 5 minutes ago)
- Corrupted migration (rollback to before migration)
- Malicious activity (restore to last known good state)

**Recovery Process:**
```
1. Supabase Dashboard → Database → Backups
2. Point-in-Time Recovery → Select timestamp
3. Specify target time (e.g., 2025-01-24 14:32:00 UTC)
4. Click "Start Recovery"
5. Wait 5-30 minutes (depending on database size)
6. Verify data restored
```

**Limitations:**
- Cannot restore individual tables (full database only)
- Downtime during recovery (5-30 min)
- Requires Pro plan or higher

### Disaster Recovery Plan

#### Recovery Time Objective (RTO)

```
Disaster Scenario          | RTO Target | Actual (Tested)
---------------------------|------------|------------------
Database failure           | 15 min     | 12 min (verified)
Application failure        | 5 min      | 3 min (auto-scale)
Regional outage (Vercel)   | 30 min     | N/A (untested)
Complete data loss         | 4 hours    | 3.5 hours (PITR)
```

#### Recovery Point Objective (RPO)

```
Scenario                   | RPO Target | Data Loss
---------------------------|------------|------------------
Database failure           | 1 hour     | Last backup
Regional outage            | 0          | Real-time replication
Complete data loss         | 1 second   | PITR (Team plan)
```

#### Disaster Recovery Runbook

**Scenario 1: Database Unavailable**
```
Impact: All API requests failing, chat unavailable
Detection: Health check failing, database connection errors

Steps:
1. Verify Supabase status: https://status.supabase.com
2. Check connection pool: SELECT count(*) FROM pg_stat_activity;
3. If Supabase outage: Wait for resolution, notify customers
4. If connection exhaustion: Restart application (clears pool)
5. If corruption: Restore from PITR (Team plan) or latest backup

Recovery Time: 5-30 minutes
Notification: Status page, email to customers
```

**Scenario 2: Application Unresponsive**
```
Impact: Chat widget not loading, API timeouts
Detection: Health check HTTP 500, Vercel error logs

Steps:
1. Check Vercel logs: vercel logs --follow
2. Identify error (OOM, timeout, etc.)
3. Rollback to previous deployment: vercel rollback
4. Monitor recovery: curl https://app.com/api/health
5. Root cause analysis: Review error stack traces

Recovery Time: 2-5 minutes
Notification: Status page
```

**Scenario 3: Data Corruption**
```
Impact: Incorrect search results, missing messages
Detection: Customer reports, data validation checks

Steps:
1. Identify affected time range (when did corruption start?)
2. Restore from PITR to timestamp before corruption
3. Replay transactions from application logs (if available)
4. Verify data integrity: Run validation queries
5. Notify affected customers

Recovery Time: 1-4 hours
Notification: Direct email to affected customers
```

**Scenario 4: Regional Outage (Vercel)**
```
Impact: Application unreachable in specific region
Detection: Geographic user reports, Vercel status page

Steps:
1. Verify outage: https://www.vercel-status.com
2. Enable multi-region if available (Enterprise plan)
3. Communicate ETA to customers
4. Post-mortem: Review SLA credits

Recovery Time: Depends on Vercel (typically 30-120 min)
Notification: Status page, Twitter
```

### Backup Storage

**Recommended Storage:**
```
Provider         | Cost         | Durability      | Access Time
-----------------|--------------|-----------------|-------------
AWS S3           | $0.023/GB/mo | 99.999999999%   | Instant
AWS Glacier      | $0.004/GB/mo | 99.999999999%   | 3-5 hours
Backblaze B2     | $0.005/GB/mo | 99.9%           | Instant
Google Cloud     | $0.020/GB/mo | 99.999999999%   | Instant
```

**Best Practice:**
- Store backups in different region than production database
- Use versioning (S3 versioning) to protect against accidental deletion
- Encrypt backups at rest (AWS KMS, GPG)
- Test restore quarterly (document restore time)

**Example S3 Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "Id": "Move to Glacier after 30 days",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

### Redis Data Persistence

**Current Configuration:**
```conf
# docker/redis.conf
appendonly yes                  # Enable AOF (Append-Only File)
appendfsync everysec            # Fsync every second (balance performance/durability)
save 900 1                      # RDB snapshot every 15 min if 1+ keys changed
save 300 10                     # RDB snapshot every 5 min if 10+ keys changed
save 60 10000                   # RDB snapshot every 1 min if 10K+ keys changed
```

**Backup Redis:**
```bash
# Trigger manual RDB snapshot
docker exec omniops-redis redis-cli BGSAVE

# Copy RDB file from container
docker cp omniops-redis:/data/dump.rdb ./backups/redis_$(date +%Y%m%d).rdb

# Restore Redis
docker cp ./backups/redis_20250124.rdb omniops-redis:/data/dump.rdb
docker restart omniops-redis
```

**Recovery Scenarios:**
```
Data Loss        | Recovery Method           | Data Loss
-----------------|---------------------------|------------
Redis crash      | AOF replay                | <1 second
Disk failure     | RDB snapshot              | Up to 15 min
Complete loss    | Rebuild queues            | In-progress jobs
```

**Note:** Redis is used for transient data (job queue, cache). Permanent data is in PostgreSQL.

---

## 12. Troubleshooting Production Issues

### Common Issues & Solutions

#### Issue 1: High Response Times

**Symptoms:**
- API requests taking >10s
- Users reporting slow chat responses
- P95 latency spiking

**Diagnosis:**
```bash
# Check Vercel function duration
vercel logs --follow | grep "Duration:"

# Check database query times
# Run in Supabase SQL Editor:
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check OpenAI API latency
# Look for logs: "[OpenAI] Request took Xms"
```

**Solutions:**
```
1. Database slow queries:
   - Add missing indexes
   - Optimize complex JOINs
   - Use materialized views for analytics

2. OpenAI API slow:
   - Check OpenAI status: https://status.openai.com
   - Reduce token limits (fewer search results)
   - Enable query caching

3. Vector search slow:
   - Increase IVFFlat lists (100 → 200)
   - Reduce similarity threshold (0.2 → 0.3)
   - Paginate search results

4. Network latency:
   - Move Vercel region closer to Supabase region
   - Use Supabase read replicas
   - Enable CDN for static assets
```

#### Issue 2: Database Connection Exhaustion

**Symptoms:**
- `Error: too many connections for role "postgres"`
- Intermittent API failures
- Connection pool warnings

**Diagnosis:**
```sql
-- Check active connections
SELECT count(*), state, application_name
FROM pg_stat_activity
GROUP BY state, application_name;

-- Find long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY duration DESC;
```

**Solutions:**
```bash
# 1. Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';

# 2. Increase connection pool (Supabase dashboard)
Settings → Database → Connection Pool → Increase max connections

# 3. Use connection pooler (Supabase Pooler)
# Update DATABASE_URL to use pooler:
# postgresql://postgres.pooler.supabase.co:6543/postgres

# 4. Fix connection leaks in code
# Ensure all database clients are properly closed:
const { data, error } = await supabase.from('table').select();
// No explicit close needed with Supabase client
```

#### Issue 3: OpenAI API Rate Limits

**Symptoms:**
- `Error: Rate limit exceeded`
- 429 responses from OpenAI
- Chat requests failing intermittently

**Diagnosis:**
```bash
# Check OpenAI usage dashboard
# https://platform.openai.com/usage

# Check application logs for rate limit errors
vercel logs | grep "Rate limit"
```

**Solutions:**
```typescript
// 1. Implement exponential backoff
async function callOpenAIWithRetry(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.chat.completions.create({ ... });
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000;  // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// 2. Request rate limit increase (OpenAI dashboard)
// Settings → Limits → Request increase

// 3. Reduce token usage
// - Decrease search result limit (100 → 50)
// - Shorten system prompts
// - Use query cache more aggressively

// 4. Upgrade OpenAI tier (higher limits)
// Tier 1 (default): 500 req/min
// Tier 2 ($50 spent): 5000 req/min
```

#### Issue 4: Redis Connection Failures

**Symptoms:**
- `Error: Redis connection refused`
- Web scraping jobs not processing
- Warning logs about Redis fallback

**Diagnosis:**
```bash
# Check Redis status
docker exec omniops-redis redis-cli PING
# Should return: PONG

# Check Redis logs
docker logs omniops-redis | tail -50

# Check Redis memory
docker exec omniops-redis redis-cli INFO memory
```

**Solutions:**
```bash
# 1. Restart Redis
docker restart omniops-redis

# 2. Check Redis memory (OOM kill)
docker exec omniops-redis redis-cli INFO memory | grep used_memory_human
# If >90% of maxmemory, increase memory or enable eviction:
docker exec omniops-redis redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 3. Verify network connectivity
docker exec omniops-app ping redis

# 4. Check Redis configuration
docker exec omniops-redis redis-cli CONFIG GET maxmemory
docker exec omniops-redis redis-cli CONFIG GET appendonly
```

**Graceful Degradation:**
```typescript
// Application automatically falls back to in-memory if Redis unavailable
// Check logs for:
// "[Redis] Connection failed, falling back to in-memory storage"

// To force Redis usage (fail loudly instead of fallback):
// Set environment variable: REQUIRE_REDIS=true
```

### Log Investigation

#### Structured Log Queries

**Vercel:**
```bash
# Filter by time
vercel logs --since 1h

# Filter by function
vercel logs /api/chat

# Filter by error
vercel logs | grep "Error:"

# Filter by domain
vercel logs | grep "domain.*example.com"

# Export logs
vercel logs --output logs.txt
```

**Self-Hosted (Docker):**
```bash
# Follow logs
docker logs -f omniops-app

# Filter by timestamp (last hour)
docker logs --since 1h omniops-app

# Filter by log level
docker logs omniops-app 2>&1 | grep "ERROR"

# Export to file
docker logs omniops-app > app.log 2>&1
```

**Parse JSON logs:**
```bash
# Using jq
docker logs omniops-app | grep "^{" | jq 'select(.level == "error")'

# Filter by domain
docker logs omniops-app | grep "^{" | jq 'select(.domain == "example.com")'

# Count errors by type
docker logs omniops-app | grep "^{" | jq -r '.error_type' | sort | uniq -c
```

### Performance Debugging

#### Identify Slow API Endpoints

**Using Vercel Analytics:**
```
Dashboard → Analytics → Functions
- Sort by "Average Duration"
- Look for outliers (>5s)
```

**Using Application Logs:**
```bash
# Find slow requests
vercel logs | grep "Duration:" | awk '{if ($NF > 5000) print}'

# Average response time by endpoint
vercel logs | grep "/api/chat" | grep "Duration:" | \
  awk '{sum+=$NF; count++} END {print "Average:", sum/count, "ms"}'
```

#### Profile Database Queries

```sql
-- Enable statement tracking (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slowest queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

#### Trace OpenAI API Calls

```typescript
// Add timing logs to OpenAI calls
const startTime = Date.now();
const response = await openai.chat.completions.create({ ... });
const duration = Date.now() - startTime;

console.log(JSON.stringify({
  event: 'openai_request',
  duration_ms: duration,
  tokens: response.usage?.total_tokens,
  model: response.model
}));
```

### Emergency Procedures

#### Rollback Deployment (Vercel)

```bash
# Via CLI
vercel rollback

# Confirm previous deployment URL
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

**Via Dashboard:**
```
Deployments → [...] → Promote to Production
```

#### Scale Down (Circuit Breaker)

```typescript
// Temporarily disable expensive features
// Set environment variable: DISABLE_VECTOR_SEARCH=true

// In code:
if (process.env.DISABLE_VECTOR_SEARCH === 'true') {
  console.warn('[Emergency] Vector search disabled');
  return []; // Skip search, return empty results
}
```

**Use Cases:**
- OpenAI API outage → Disable chat, show fallback message
- Database overload → Disable scraping, rate limit search
- High costs → Temporarily reduce limits

#### Enable Maintenance Mode

```typescript
// app/api/health/route.ts
export async function GET() {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new Response('Under maintenance', { status: 503 });
  }

  return new Response('OK', { status: 200 });
}
```

**Set via Vercel:**
```bash
vercel env add MAINTENANCE_MODE true production
```

**Show maintenance page:**
```typescript
// middleware.ts
export function middleware(request: Request) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return new Response('System under maintenance. Back soon!', {
      status: 503,
      headers: { 'Retry-After': '3600' }  // 1 hour
    });
  }
}
```

---

## 13. CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npx tsc --noEmit

      - name: Run unit tests
        run: npm run test:unit
        env:
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/postgres
          REDIS_URL: redis://localhost:6379
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Automated Testing

**Test Pyramid:**
```
End-to-End (5%)        [Playwright]
    ↑
Integration (25%)      [Jest + Supabase]
    ↑
Unit Tests (70%)       [Jest]
```

**Coverage Requirements:**
```yaml
# jest.config.js
coverageThreshold: {
  global: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
}
```

### Deployment Pipeline

```
┌──────────────┐
│  Git Push    │
└──────┬───────┘
       ↓
┌──────────────┐
│  Run Tests   │ ← Unit, Integration, E2E
└──────┬───────┘
       ↓
┌──────────────┐
│  Build       │ ← next build
└──────┬───────┘
       ↓
┌──────────────┐
│  Deploy      │ ← Vercel, Docker
└──────┬───────┘
       ↓
┌──────────────┐
│  Smoke Tests │ ← Health checks
└──────┬───────┘
       ↓
┌──────────────┐
│  Notify      │ ← Slack, Email
└──────────────┘
```

### Rollback Procedures

**Automatic Rollback (if smoke tests fail):**
```yaml
# .github/workflows/deploy.yml
- name: Run smoke tests
  run: |
    curl -f https://app.com/api/health || exit 1
    curl -f https://app.com/api/chat -X POST -d '{"message":"test"}' || exit 1

- name: Rollback on failure
  if: failure()
  run: vercel rollback
```

**Manual Rollback:**
```bash
# Vercel
vercel rollback

# Docker
docker-compose down
docker-compose up -d --scale app=3 <previous-image-tag>

# Kubernetes
kubectl rollout undo deployment/omniops-app
```

---

## 14. Cost Optimization

### Resource Utilization

#### Right-Sizing Compute

**Analyze Current Usage:**
```bash
# Vercel: Check function execution time
vercel logs | grep "Duration:" | awk '{sum+=$NF; count++} END {print "Avg:", sum/count/1000, "s"}'

# If average <2s → Consider smaller instance
# If average >10s → Consider larger instance or optimization
```

**Docker Resource Limits:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'      # Prevent CPU hogging
          memory: 4G     # Prevent OOM
        reservations:
          cpus: '1'      # Guaranteed minimum
          memory: 2G
```

**Monitor Actual Usage:**
```bash
docker stats omniops-app

# If CPU <30% → Reduce cores
# If Memory <50% → Reduce memory limit
```

#### Database Optimization

**Analyze Storage Growth:**
```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;

-- Unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_%';
```

**Cleanup Strategies:**
```sql
-- Archive old conversations (>90 days)
DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum to reclaim space
VACUUM FULL messages;

-- Drop unused indexes
DROP INDEX IF EXISTS unused_index_name;
```

### OpenAI API Costs

**Token Usage Tracking:**
```typescript
// Track tokens per request
const response = await openai.chat.completions.create({ ... });
const tokens = response.usage?.total_tokens || 0;

console.log(JSON.stringify({
  event: 'openai_usage',
  tokens: tokens,
  cost_usd: (tokens / 1000) * 0.002,  // $0.002 per 1K tokens
  domain: domain
}));
```

**Monthly Cost Estimate:**
```
Model: GPT-4 Turbo
Input: $0.01 per 1K tokens
Output: $0.03 per 1K tokens

Example chat request:
- System prompt: 500 tokens ($0.005)
- Search results: 15,000 tokens ($0.15)
- User message: 50 tokens ($0.0005)
- AI response: 200 tokens ($0.006)
Total: ~$0.16 per chat

1000 chats/day × $0.16 = $160/day = $4,800/month
```

**Cost Reduction Strategies:**
```typescript
// 1. Reduce search result count
const results = await searchSimilarContent(query, domain, 50);  // Was 100

// 2. Use cheaper model for simple queries
const model = query.length < 20 ? 'gpt-3.5-turbo' : 'gpt-4-turbo';

// 3. Cache common queries
const cacheKey = `chat:${query}:${domain}`;
const cached = await getCachedResponse(cacheKey);
if (cached) return cached;

// 4. Shorten system prompts (remove verbose instructions)
const systemPrompt = `You are a helpful assistant. Be concise.`;  // Was 500 tokens
```

### Caching Strategy

**Multi-Layer Caching:**
```
Layer 1: In-Memory (LRU Cache)
  ↓ miss
Layer 2: Redis (5 min TTL)
  ↓ miss
Layer 3: Database (query_cache table, 30 min TTL)
  ↓ miss
Compute Result → Cache in all layers
```

**Implementation:**
```typescript
import { LRUCache } from 'lru-cache';

const memoryCache = new LRUCache({
  max: 500,           // 500 items
  ttl: 1000 * 60 * 5  // 5 minutes
});

async function getCachedResult(key: string) {
  // Layer 1: Memory
  const memResult = memoryCache.get(key);
  if (memResult) return memResult;

  // Layer 2: Redis
  const redisResult = await redis.get(key);
  if (redisResult) {
    memoryCache.set(key, redisResult);
    return redisResult;
  }

  // Layer 3: Database
  const dbResult = await supabase
    .from('query_cache')
    .select('result')
    .eq('query_hash', key)
    .single();

  if (dbResult.data) {
    redis.set(key, dbResult.data.result, 'EX', 300);
    memoryCache.set(key, dbResult.data.result);
    return dbResult.data.result;
  }

  return null;
}
```

**Cache Hit Rate Target:** >80%

### Cost Monitoring Dashboard

**Recommended Metrics:**
```
Daily Costs:
- OpenAI API usage (tokens × rate)
- Supabase database size (GB × $0.125)
- Vercel bandwidth (GB × $0.15 overage)
- Redis memory (GB × plan rate)

Weekly Trends:
- Cost per customer (total cost / active customers)
- Cost per chat request
- Token usage per domain
```

**Alert Thresholds:**
```yaml
alerts:
  - name: "OpenAI cost spike"
    condition: "daily_cost > $200"
    action: "Slack #engineering + email CTO"

  - name: "Database size warning"
    condition: "db_size_gb > 80% of plan limit"
    action: "Slack #engineering"

  - name: "Bandwidth overage"
    condition: "bandwidth_gb > plan_limit"
    action: "Email billing team"
```

---

## Summary

This guide covered:

✅ **System architecture** and component overview
✅ **Infrastructure requirements** (compute, database, Redis, network)
✅ **Deployment options** (Vercel, Docker, self-hosted)
✅ **Environment configuration** and secrets management
✅ **Database setup**, migrations, and RLS
✅ **Docker deployment** with BuildKit optimization
✅ **Vercel deployment** with edge functions
✅ **Monitoring & observability** (logs, metrics, alerts)
✅ **Security checklist** (RLS, rate limiting, encryption)
✅ **Scaling strategy** (horizontal scaling, connection pooling)
✅ **Backup & disaster recovery** (PITR, RTO/RPO)
✅ **Troubleshooting** production issues
✅ **CI/CD integration** with GitHub Actions
✅ **Cost optimization** (resource sizing, OpenAI usage)

---

## Next Steps

1. **Set up staging environment** (test deployments)
2. **Configure monitoring** (Datadog, New Relic, or Vercel Analytics)
3. **Schedule backup testing** (monthly restore drills)
4. **Review security checklist** (rotate secrets, enable RLS)
5. **Plan scaling strategy** (based on expected growth)
6. **Document runbooks** (team-specific incident response)

---

## Support & Resources

- **Documentation**: `/docs` directory
- **Database Schema**: `/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **API Reference**: `/docs/API_REFERENCE.md`
- **Troubleshooting**: This guide (section 12)

**For urgent production issues:**
- Check health endpoint: `https://app.com/api/health`
- Review logs: `vercel logs --follow` or `docker logs -f omniops-app`
- Escalation: CTO, engineering lead

---

**Last Updated:** 2025-10-24
**Maintained by:** Engineering Team
**Next Review:** 2025-11-24
