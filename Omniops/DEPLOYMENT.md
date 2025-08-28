# Omniops Deployment Guide

## Architecture Overview

The improved architecture includes:
- **Unified Redis Client**: Resilient Redis client with circuit breaker and fallback
- **Worker Services**: Separated worker containers for different job types
- **Comprehensive Monitoring**: Enhanced health checks and metrics
- **Optimized Queue System**: Namespaced queues with priorities and deduplication

## Quick Start

### Development Environment

```bash
# Start all services (including development tools)
docker-compose -f docker-compose.workers.yml --profile development up -d

# View logs
docker-compose -f docker-compose.workers.yml logs -f

# Scale workers
docker-compose -f docker-compose.workers.yml up -d --scale worker-scraping=3
```

### Production Environment

```bash
# Start production services only
docker-compose -f docker-compose.workers.yml up -d

# Monitor health
curl http://localhost:3000/api/health/comprehensive?verbose=true
```

## Service Configuration

### Main Application (Web)
- Port: 3000
- Health Check: `/api/health` and `/api/health/comprehensive`
- Resources: 2 CPU cores, 2GB memory

### Worker Services

#### Scraping Worker
- Type: `WORKER_TYPE=scraping`
- Concurrency: 5 jobs
- Replicas: 2 (scalable)
- Memory: 1GB per worker

#### Embeddings Worker
- Type: `WORKER_TYPE=embeddings`
- Concurrency: 3 jobs
- Replicas: 1
- Memory: 512MB per worker

#### WooCommerce Worker
- Type: `WORKER_TYPE=woocommerce`
- Concurrency: 2 jobs
- Replicas: 1
- Memory: 512MB per worker

### Redis Configuration
- Persistence: AOF + RDB
- Memory: 512MB max
- Optimized for queue workloads
- Configuration: `redis.conf`

## Monitoring

### Health Endpoints

1. **Basic Health Check**
   ```bash
   GET /api/health
   ```

2. **Comprehensive Health Check**
   ```bash
   GET /api/health/comprehensive?verbose=true
   ```

### Development Tools

1. **Redis Commander** (Port 8081)
   - Web UI for Redis inspection
   - Only in development profile

2. **Queue Dashboard** (Port 8082)
   - BullMQ board for queue monitoring
   - Only in development profile

## Queue Management

### Queue Namespaces

```typescript
QUEUE_NAMESPACES = {
  SCRAPE: {
    HIGH_PRIORITY: 'queue:scrape:high',
    NORMAL: 'queue:scrape:normal',
    LOW_PRIORITY: 'queue:scrape:low',
  },
  WOOCOMMERCE: {
    SYNC: 'queue:woocommerce:sync',
    WEBHOOK: 'queue:woocommerce:webhook',
  },
  EMBEDDINGS: {
    GENERATE: 'queue:embeddings:generate',
    UPDATE: 'queue:embeddings:update',
  }
}
```

### Priority System

Jobs are processed based on priority:
- CRITICAL: 10
- HIGH: 7
- NORMAL: 5
- LOW: 3
- BACKGROUND: 1

### Deduplication

Automatic job deduplication prevents duplicate processing:
- Default window: 1 hour
- Configurable per job type

## Redis Client Features

### Circuit Breaker
- Opens after 5 failed connections
- Timeout: 30 seconds
- Automatic recovery attempts

### Fallback Storage
- In-memory fallback when Redis is unavailable
- Seamless operation continuity
- Data syncs when Redis recovers

### Rate Limiting
- Per-domain scraping limits
- API rate limiting
- Configurable windows and thresholds

## Scaling Guidelines

### Horizontal Scaling

```bash
# Scale scraping workers
docker-compose -f docker-compose.workers.yml up -d --scale worker-scraping=5

# Scale embeddings workers
docker-compose -f docker-compose.workers.yml up -d --scale worker-embeddings=3
```

### Resource Limits

Each service has configured resource limits:
- CPU limits prevent runaway processes
- Memory limits ensure stability
- Health checks restart unhealthy containers

## Troubleshooting

### Check Service Health
```bash
# Overall health
curl http://localhost:3000/api/health/comprehensive

# Worker status
docker-compose -f docker-compose.workers.yml ps

# View logs
docker-compose -f docker-compose.workers.yml logs worker-scraping
```

### Common Issues

1. **Redis Connection Failed**
   - Check Redis container status
   - Verify REDIS_URL environment variable
   - Fallback storage will activate automatically

2. **Worker Not Processing Jobs**
   - Check worker health via comprehensive health endpoint
   - Verify queue has jobs: Redis Commander on port 8081
   - Check worker logs for errors

3. **High Memory Usage**
   - Workers auto-restart when exceeding memory limits
   - Adjust MAX_WORKER_MEMORY environment variable
   - Scale horizontally instead of vertically

## Performance Optimization

### Redis Optimization
- Configured for queue workloads
- IO threading enabled (4 threads)
- Lazy freeing for better performance
- Optimized persistence settings

### Queue Optimization
- Batch processing for large result sets
- Memory-aware job management
- Streaming for large crawls
- Intelligent caching and deduplication

### Worker Optimization
- Concurrency tuned per worker type
- Memory monitoring and auto-restart
- Health checks every 30 seconds
- Graceful shutdown handling

## Security Notes

- Redis is not password protected in default config
- Add `requirepass` in redis.conf for production
- Use environment variables for sensitive data
- Network isolation via Docker networks
- Non-root user in worker containers

## Maintenance

### Backup
```bash
# Backup Redis data
docker exec omniops-redis redis-cli BGSAVE
docker cp omniops-redis:/data/dump.rdb ./backup/
```

### Cleanup Old Data
- Maintenance worker runs cleanup jobs
- Automatic expiry for temporary data
- Configurable TTLs for different data types

### Updates
```bash
# Update and restart services
docker-compose -f docker-compose.workers.yml pull
docker-compose -f docker-compose.workers.yml up -d --force-recreate
```