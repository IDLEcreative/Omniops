# Capacity Planning Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Supabase, Redis, Vercel, Docker
**Estimated Read Time:** 10 minutes

## Purpose
Comprehensive guide for planning and managing system capacity including current metrics, growth projections, scaling triggers, and cost optimization strategies for sustainable growth.

## Quick Links
- [Performance Optimization](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Disaster Recovery](./RUNBOOK_DISASTER_RECOVERY.md)

## Table of Contents
- [Current Capacity Metrics](#current-capacity-metrics)
- [Growth Projections](#growth-projections)
- [Scaling Triggers](#scaling-triggers)
- [Database Scaling](#database-scaling)
- [Redis Scaling](#redis-scaling)
- [API Rate Limiting](#api-rate-limiting)
- [Cost Projections](#cost-projections)
- [Monitoring Metrics](#monitoring-metrics)

---

## Current Capacity Metrics

### System Baseline (As of 2025-11-18)

| Component | Current Usage | Max Capacity | Utilization |
|-----------|---------------|--------------|-------------|
| **Database Size** | 10GB | 100GB | 10% |
| **Database Connections** | 20 concurrent | 100 pool | 20% |
| **API Requests** | 10K/day | 100K/day | 10% |
| **Chat Sessions** | 500/day | 5,000/day | 10% |
| **Scraping Jobs** | 50/day | 500/day | 10% |
| **Redis Memory** | 500MB | 2GB | 25% |
| **Redis Connections** | 10 | 100 | 10% |
| **Embeddings Storage** | 5GB | 50GB | 10% |
| **Vector Searches** | 1K/day | 10K/day | 10% |
| **Bandwidth** | 50GB/month | 500GB/month | 10% |

### Performance Benchmarks

```yaml
current_performance:
  api_response_time:
    p50: 150ms
    p95: 400ms
    p99: 800ms

  database_queries:
    simple: 10ms
    complex: 50ms
    vector_search: 100ms

  scraping_speed:
    pages_per_minute: 20
    concurrent_jobs: 5
    max_depth: 10

  chat_processing:
    tokens_per_second: 50
    max_context: 8000
    concurrent_chats: 25
```

## Growth Projections

### User Growth Model

```typescript
// scripts/capacity/growth-projection.ts
interface GrowthScenario {
  name: string;
  monthlyGrowth: number;
  churnRate: number;
  avgRequestsPerUser: number;
}

const scenarios: GrowthScenario[] = [
  {
    name: 'Conservative',
    monthlyGrowth: 0.10,  // 10% monthly
    churnRate: 0.05,      // 5% churn
    avgRequestsPerUser: 100
  },
  {
    name: 'Moderate',
    monthlyGrowth: 0.25,  // 25% monthly
    churnRate: 0.08,      // 8% churn
    avgRequestsPerUser: 150
  },
  {
    name: 'Aggressive',
    monthlyGrowth: 0.50,  // 50% monthly
    churnRate: 0.10,      // 10% churn
    avgRequestsPerUser: 200
  }
];

function projectCapacity(months: number, scenario: GrowthScenario) {
  let users = 100;  // Starting users
  const projections = [];

  for (let month = 1; month <= months; month++) {
    users = users * (1 + scenario.monthlyGrowth - scenario.churnRate);

    projections.push({
      month,
      users: Math.round(users),
      dailyRequests: Math.round(users * scenario.avgRequestsPerUser / 30),
      dbSize: Math.round(users * 100),  // 100MB per user average
      redisMemory: Math.round(users * 10),  // 10MB per user cache
    });
  }

  return projections;
}
```

### 12-Month Projection (Moderate Growth)

| Month | Users | Daily Requests | DB Size | Redis | Monthly Cost |
|-------|-------|---------------|---------|-------|--------------|
| 1 | 117 | 585 | 11.7GB | 1.2GB | $299 |
| 2 | 137 | 685 | 13.7GB | 1.4GB | $349 |
| 3 | 160 | 800 | 16.0GB | 1.6GB | $399 |
| 4 | 188 | 940 | 18.8GB | 1.9GB | $449 |
| 6 | 257 | 1,285 | 25.7GB | 2.6GB | $549 |
| 9 | 413 | 2,065 | 41.3GB | 4.1GB | $799 |
| 12 | 664 | 3,320 | 66.4GB | 6.6GB | $1,299 |

## Scaling Triggers

### Automatic Scaling Rules

```yaml
scaling_triggers:
  database:
    cpu_threshold: 80%
    memory_threshold: 85%
    connection_threshold: 80%
    storage_threshold: 75%
    action: upgrade_tier

  redis:
    memory_threshold: 80%
    connection_threshold: 90%
    eviction_rate: 5%
    action: add_node

  api:
    response_time_p95: 1000ms
    error_rate: 2%
    concurrent_requests: 1000
    action: horizontal_scale

  embeddings:
    query_time_p95: 500ms
    index_size: 10GB
    action: optimize_index
```

### Scaling Decision Matrix

| Metric | Green (<) | Yellow | Red (>) | Action |
|--------|-----------|---------|---------|--------|
| **CPU Usage** | 50% | 50-70% | 70% | Scale up |
| **Memory Usage** | 60% | 60-80% | 80% | Add RAM |
| **DB Connections** | 60% | 60-80% | 80% | Pool expansion |
| **Response Time** | 200ms | 200-500ms | 500ms | Optimize/Scale |
| **Error Rate** | 0.1% | 0.1-1% | 1% | Investigate |
| **Queue Depth** | 100 | 100-1000 | 1000 | Add workers |

### Scaling Automation Script

```bash
#!/bin/bash
# scripts/operations/auto-scale.sh

# Check metrics
CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" omniops-app | cut -d'%' -f1)
MEM=$(docker stats --no-stream --format "{{.MemPerc}}" omniops-app | cut -d'%' -f1)

# Database metrics
DB_CPU=$(curl -s $SUPABASE_API/metrics | jq '.cpu_percent')
DB_CONN=$(curl -s $SUPABASE_API/metrics | jq '.connection_count')

# Scaling decisions
if (( $(echo "$CPU > 70" | bc -l) )); then
  echo "🔴 HIGH CPU: Scaling up application"
  docker-compose scale app=3
fi

if (( $(echo "$DB_CPU > 80" | bc -l) )); then
  echo "🔴 HIGH DB CPU: Upgrading database tier"
  curl -X PATCH $SUPABASE_API/project \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"tier": "pro-large"}'
fi

if (( $(echo "$DB_CONN > 80" | bc -l) )); then
  echo "⚠️ High connection count: Expanding pool"
  # Update connection pool settings
fi
```

## Database Scaling

### Supabase Tier Progression

| Tier | Storage | Transfer | Connections | Price | When to Use |
|------|---------|----------|-------------|-------|-------------|
| **Free** | 500MB | 2GB | 60 | $0 | Development |
| **Pro** | 8GB | 50GB | 200 | $25 | <1000 users |
| **Pro+** | 100GB | 250GB | 500 | $125 | 1K-10K users |
| **Team** | 500GB | 1TB | 1000 | $599 | 10K-50K users |
| **Enterprise** | Custom | Custom | Custom | Custom | 50K+ users |

### Database Optimization Strategies

```sql
-- Index optimization for common queries
CREATE INDEX idx_customer_domain ON customer_configs(domain);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_pages_domain_url ON scraped_pages(domain, url);

-- Partitioning large tables (when >100GB)
CREATE TABLE messages_2025 PARTITION OF messages
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Archive old data
INSERT INTO messages_archive
SELECT * FROM messages
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM messages
WHERE created_at < NOW() - INTERVAL '90 days';

-- Vacuum and analyze
VACUUM ANALYZE messages;
```

### Connection Pool Management

```typescript
// lib/database-pool.ts
import { Pool } from 'pg';

const poolConfig = {
  // Base configuration
  min: 2,
  max: 20,

  // Dynamic scaling based on load
  dynamicMax: () => {
    const hour = new Date().getHours();
    // Peak hours: 9am-5pm
    if (hour >= 9 && hour <= 17) {
      return 50;
    }
    return 20;
  },

  // Connection lifecycle
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,

  // Health checks
  testOnBorrow: true,
  evictionRunIntervalMillis: 60000,
};

const pool = new Pool(poolConfig);

// Monitor pool health
setInterval(() => {
  const stats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };

  if (stats.waiting > 5) {
    console.warn('Pool pressure detected:', stats);
    // Consider scaling
  }
}, 10000);
```

## Redis Scaling

### Redis Capacity Planning

```yaml
redis_scaling:
  current:
    memory: 2GB
    type: single_node
    persistence: RDB

  thresholds:
    memory_usage: 1.6GB  # 80% of 2GB
    ops_per_second: 10000
    connection_count: 100

  scaling_path:
    step1:
      memory: 4GB
      type: single_node
      cost: $40/month

    step2:
      memory: 8GB
      type: master_replica
      replicas: 1
      cost: $120/month

    step3:
      memory: 16GB
      type: cluster
      nodes: 3
      cost: $360/month
```

### Redis Optimization

```typescript
// lib/redis-optimizer.ts
import Redis from 'ioredis';

class RedisOptimizer {
  private redis: Redis;

  async optimizeMemory() {
    // Set appropriate eviction policy
    await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru');

    // Set memory limit
    await this.redis.config('SET', 'maxmemory', '2gb');

    // Enable compression for large values
    await this.redis.config('SET', 'compression', 'yes');

    // Optimize persistence
    await this.redis.config('SET', 'save', '900 1 300 10 60 10000');
  }

  async analyzeKeyPatterns() {
    const scan = this.redis.scanStream({ match: '*', count: 1000 });
    const patterns = new Map<string, number>();

    scan.on('data', (keys) => {
      for (const key of keys) {
        const pattern = key.split(':')[0];
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    });

    scan.on('end', () => {
      console.log('Key distribution:', patterns);
      // Identify optimization opportunities
    });
  }

  async implementCaching() {
    // Tiered caching strategy
    const tiers = {
      hot: 300,     // 5 minutes
      warm: 3600,   // 1 hour
      cold: 86400,  // 1 day
    };

    // Example: Cache frequently accessed data
    const cacheKey = 'customer:123:config';
    const ttl = tiers.hot;
    await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
  }
}
```

## API Rate Limiting

### Rate Limit Tiers

```typescript
// lib/rate-limit-config.ts
export const rateLimitTiers = {
  free: {
    requests_per_minute: 60,
    requests_per_hour: 1000,
    requests_per_day: 10000,
    concurrent_requests: 5,
    burst_allowance: 10,
  },
  pro: {
    requests_per_minute: 300,
    requests_per_hour: 10000,
    requests_per_day: 100000,
    concurrent_requests: 25,
    burst_allowance: 50,
  },
  enterprise: {
    requests_per_minute: 1000,
    requests_per_hour: 50000,
    requests_per_day: 1000000,
    concurrent_requests: 100,
    burst_allowance: 200,
  },
};

// Dynamic rate limiting based on load
export function getDynamicLimit(baseLimit: number): number {
  const currentLoad = getCurrentSystemLoad();

  if (currentLoad > 0.8) {
    return Math.floor(baseLimit * 0.5);  // Reduce by 50%
  } else if (currentLoad > 0.6) {
    return Math.floor(baseLimit * 0.75); // Reduce by 25%
  }

  return baseLimit;
}
```

### API Gateway Configuration

```yaml
# vercel.json rate limiting
{
  "functions": {
    "app/api/chat/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "X-RateLimit-Limit",
          "value": "60"
        },
        {
          "key": "X-RateLimit-Window",
          "value": "60"
        }
      ]
    }
  ]
}
```

## Cost Projections

### Monthly Cost Breakdown

| Service | Current | 6 Months | 12 Months | Optimization |
|---------|---------|----------|-----------|--------------|
| **Supabase** | $25 | $125 | $599 | Pool connections |
| **Vercel** | $20 | $40 | $100 | Edge caching |
| **Redis Cloud** | $10 | $40 | $120 | Tiered caching |
| **OpenAI API** | $100 | $500 | $2000 | Response caching |
| **AWS S3** | $5 | $20 | $50 | Lifecycle policies |
| **CloudFlare** | $20 | $20 | $200 | Pro for DDoS |
| **Monitoring** | $0 | $50 | $100 | DataDog/NewRelic |
| **Total** | $180 | $795 | $3,169 | - |

### Cost Optimization Strategies

```typescript
// scripts/cost/optimize-usage.ts

class CostOptimizer {
  // Cache AI responses to reduce API calls
  async cacheAIResponses() {
    const cacheHitRate = 0.3;  // 30% cache hits
    const apiCostPerRequest = 0.02;
    const monthlyRequests = 100000;

    const savings = monthlyRequests * cacheHitRate * apiCostPerRequest;
    console.log(`Monthly savings from caching: $${savings}`);
  }

  // Optimize database queries
  async optimizeQueries() {
    // Use materialized views for complex queries
    await db.query(`
      CREATE MATERIALIZED VIEW customer_stats AS
      SELECT
        domain,
        COUNT(DISTINCT conversation_id) as total_conversations,
        COUNT(DISTINCT user_id) as unique_users
      FROM messages
      GROUP BY domain;
    `);

    // Refresh periodically instead of real-time
    setInterval(() => {
      db.query('REFRESH MATERIALIZED VIEW customer_stats');
    }, 3600000);  // Every hour
  }

  // Implement tiered storage
  async tieredStorage() {
    // Move old data to cheaper storage
    const threshold = '30 days';

    await s3.copyObject({
      Bucket: 'omniops-archive',
      StorageClass: 'GLACIER',
      CopySource: 'omniops-primary',
      Key: `data-older-than-${threshold}`,
    });
  }
}
```

## Monitoring Metrics

### Key Performance Indicators (KPIs)

```yaml
kpis:
  availability:
    target: 99.9%
    measure: uptime_percentage
    alert_threshold: 99.5%

  performance:
    api_response_p95: <500ms
    database_query_p95: <100ms
    page_load_time: <3s

  capacity:
    cpu_utilization: <70%
    memory_utilization: <80%
    disk_utilization: <75%

  business:
    daily_active_users: track
    requests_per_user: track
    cost_per_user: <$3
```

### Monitoring Dashboard

```typescript
// scripts/monitoring/capacity-dashboard.ts
import { CloudWatch } from 'aws-sdk';

class CapacityDashboard {
  private cloudwatch = new CloudWatch();

  async createDashboard() {
    const dashboard = {
      name: 'OmniopsCapacity',
      body: JSON.stringify({
        widgets: [
          this.cpuWidget(),
          this.memoryWidget(),
          this.databaseWidget(),
          this.apiWidget(),
          this.costWidget(),
          this.projectionWidget(),
        ],
      }),
    };

    await this.cloudwatch.putDashboard(dashboard).promise();
  }

  private cpuWidget() {
    return {
      type: 'metric',
      properties: {
        metrics: [
          ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
          ['.', '.', { stat: 'Maximum' }],
        ],
        period: 300,
        stat: 'Average',
        region: 'us-east-1',
        title: 'CPU Utilization',
        annotations: {
          horizontal: [
            { value: 70, label: 'Scale Trigger' },
          ],
        },
      },
    };
  }

  // Similar widgets for other metrics...
}
```

### Alerting Rules

```yaml
alerts:
  - name: high_cpu_usage
    metric: cpu_utilization
    threshold: 80
    duration: 5m
    action: scale_up

  - name: high_memory_usage
    metric: memory_utilization
    threshold: 85
    duration: 5m
    action: investigate

  - name: database_connection_limit
    metric: connection_count
    threshold: 180  # 90% of 200
    duration: 1m
    action: expand_pool

  - name: api_response_slow
    metric: response_time_p95
    threshold: 1000ms
    duration: 5m
    action: optimize

  - name: cost_spike
    metric: daily_cost
    threshold: 150%  # of average
    duration: 1d
    action: review_usage
```

## Capacity Planning Checklist

### Weekly Review
- [ ] Review capacity metrics dashboard
- [ ] Check growth rate vs projections
- [ ] Analyze cost per user trends
- [ ] Review error rates and performance
- [ ] Update scaling triggers if needed

### Monthly Planning
- [ ] Forecast next month's capacity needs
- [ ] Review and optimize costs
- [ ] Plan any infrastructure upgrades
- [ ] Update disaster recovery capacity
- [ ] Review rate limits and quotas

### Quarterly Assessment
- [ ] Full capacity audit
- [ ] Benchmark against competitors
- [ ] Review architectural decisions
- [ ] Plan major scaling initiatives
- [ ] Update long-term projections

## Capacity Planning Tools

```bash
# Install monitoring tools
npm install -D @datadog/cli
npm install -D newrelic
npm install -D @sentry/node

# Capacity testing tools
npm install -D k6
npm install -D autocannon
npm install -D clinic

# Run capacity tests
k6 run scripts/load-tests/capacity-test.js
autocannon -c 100 -d 60 http://localhost:3000/api/health
clinic doctor -- node app.js
```

## References

- [Supabase Pricing](https://supabase.com/pricing)
- [Vercel Limits](https://vercel.com/docs/concepts/limits/overview)
- [Redis Capacity Planning](https://redis.io/docs/management/optimization/)
- [AWS Auto Scaling](https://aws.amazon.com/autoscaling/)
- [Database Sharding Strategies](https://www.postgresql.org/docs/current/ddl-partitioning.html)