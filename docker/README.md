**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Docker Setup Documentation

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Docker Desktop 28.3.2+, Docker Compose v2.38.2+
**Estimated Read Time:** 18 minutes

## Purpose

Comprehensive Docker configuration documentation for containerized Redis services, development workflows, production deployment, and troubleshooting.

## Quick Links

- [Production Docker Setup](/home/user/Omniops/docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Main README](/home/user/Omniops/README.md)
- [CLAUDE.md Development Guide](/home/user/Omniops/CLAUDE.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Service Configurations](#service-configurations)
- [Common Commands](#common-commands)
- [Development Workflow](#development-workflow)
- [Data Persistence](#data-persistence)
- [Health Monitoring](#health-monitoring)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Integration with Application](#integration-with-application)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Advanced Configurations](#advanced-configurations)
- [Maintenance](#maintenance)
- [Support](#support)
- [Related Documentation](#related-documentation)

## Keywords

**Search Terms:** Docker, Redis, containerization, docker-compose, health checks, data persistence, backup, monitoring, production deployment

**Aliases:**
- "Docker setup" (configuration)
- "Redis container" (service)
- "Container orchestration" (docker-compose)
- "Docker volumes" (persistence)

---

This document provides comprehensive information about the Docker configuration for the Customer Service Agent application.

## Overview

The application uses Docker to containerize services for consistent development and deployment. The primary service is Redis, which handles:
- Background job queue management for web scraping
- Cache storage for WooCommerce data
- Rate limiting tracking
- Session management

## Directory Structure

```
docker/
├── docker-compose.yml          # Main production Docker configuration
├── docker-compose.dev.yml      # Development configuration with additional services
├── docker-compose.workers.yml  # Worker services configuration (for future use)
├── Dockerfile                  # Application container definition
├── Dockerfile.worker          # Worker container definition
├── redis.conf                 # Redis configuration file
└── README.md                  # This documentation file
```

## Quick Start

### Prerequisites
- Docker Desktop 28.3.2 or later
- Docker Compose v2.38.2 or later
- 8GB+ RAM allocated to Docker
- Port 6379 available for Redis

### Starting Services

1. **Navigate to the docker directory:**
   ```bash
   cd docker
   ```

2. **Start Redis service:**
   ```bash
   docker-compose -f docker-compose.yml up -d redis
   ```

3. **Verify Redis is running:**
   ```bash
   docker ps | grep redis
   docker exec customer-service-redis redis-cli ping
   # Should return: PONG
   ```

## Service Configurations

### Redis Service

**Container Details:**
- **Image**: redis:7-alpine (lightweight, ~30MB)
- **Container Name**: customer-service-redis
- **Port**: 6379 (host) → 6379 (container)
- **Persistence**: AOF (Append Only File) enabled
- **Volume**: docker_redis-data for data persistence
- **Network**: docker_app-network (bridge)
- **Health Check**: redis-cli ping every 10s

**Features:**
- Automatic restart on failure
- Data persistence across container restarts
- Health monitoring
- Optimized memory usage with Alpine Linux

### Connection Details

**From your Next.js application:**
```javascript
// Default connection (localhost)
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
```

**From other Docker containers:**
```javascript
// Container-to-container connection
const redisUrl = 'redis://redis:6379'
```

**From host machine (testing):**
```bash
redis-cli -h localhost -p 6379
```

## Common Commands

### Docker Compose Commands

```bash
# Start all services
docker-compose -f docker-compose.yml up -d

# Start specific service
docker-compose -f docker-compose.yml up -d redis

# Stop all services
docker-compose -f docker-compose.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.yml down -v

# View logs
docker-compose -f docker-compose.yml logs -f redis

# Check service status
docker-compose -f docker-compose.yml ps
```

### Redis Management

```bash
# Connect to Redis CLI
docker exec -it customer-service-redis redis-cli

# Check Redis info
docker exec customer-service-redis redis-cli INFO

# Monitor Redis commands in real-time
docker exec -it customer-service-redis redis-cli MONITOR

# Flush all data (development only!)
docker exec customer-service-redis redis-cli FLUSHALL

# Check memory usage
docker exec customer-service-redis redis-cli INFO memory

# List all keys
docker exec customer-service-redis redis-cli KEYS "*"
```

### Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop Redis container
docker stop customer-service-redis

# Start Redis container
docker start customer-service-redis

# Restart Redis container
docker restart customer-service-redis

# Remove Redis container (preserves data volume)
docker rm customer-service-redis

# View container logs
docker logs customer-service-redis -f
```

## Development Workflow

### Starting Development Environment

1. **Ensure Docker Desktop is running:**
   ```bash
   docker info  # Should show Docker system information
   ```

2. **Clean up any existing containers (optional):**
   ```bash
   docker ps -a | grep redis
   docker rm customer-service-redis  # If exists
   ```

3. **Start Redis:**
   ```bash
   cd docker
   docker-compose -f docker-compose.yml up -d redis
   ```

4. **Verify Redis is healthy:**
   ```bash
   docker ps | grep redis  # Should show (healthy) status
   ```

5. **Start Next.js development server:**
   ```bash
   cd ..
   npm run dev
   ```

### Stopping Development Environment

```bash
# Stop Redis (preserves data)
docker-compose -f docker-compose.yml stop redis

# Or stop and remove container (preserves volume)
docker-compose -f docker-compose.yml down
```

## Data Persistence

Redis data is persisted in a Docker volume named `docker_redis-data`. This ensures:
- Data survives container restarts
- Background jobs are not lost
- Cache remains available
- Rate limiting state is maintained

### Volume Management

```bash
# List volumes
docker volume ls | grep redis

# Inspect volume details
docker volume inspect docker_redis-data

# Backup Redis data
docker exec customer-service-redis redis-cli BGSAVE
docker cp customer-service-redis:/data/dump.rdb ./redis-backup.rdb

# Remove volume (WARNING: Deletes all data)
docker volume rm docker_redis-data
```

## Health Monitoring

The Redis container includes health checks that run every 10 seconds:

```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Check health status:
```bash
docker inspect customer-service-redis --format='{{.State.Health.Status}}'
```

## Troubleshooting

### Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find process using port 6379
lsof -i :6379

# Kill the process
kill -9 <PID>

# Or stop any Redis containers
docker ps | grep redis
docker stop <container_id>
```

### Container Name Conflict

**Error:** `The container name "/customer-service-redis" is already in use`

**Solution:**
```bash
# Remove the existing container
docker rm customer-service-redis

# Then restart
docker-compose -f docker-compose.yml up -d redis
```

### Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
1. Check if Redis is running:
   ```bash
   docker ps | grep redis
   ```

2. If not running, start it:
   ```bash
   cd docker
   docker-compose -f docker-compose.yml up -d redis
   ```

3. Verify connection:
   ```bash
   redis-cli ping
   ```

### Memory Issues

**Error:** `OOM command not allowed when used memory > 'maxmemory'`

**Solution:**
```bash
# Check memory usage
docker exec customer-service-redis redis-cli INFO memory

# Flush cache if needed (development only)
docker exec customer-service-redis redis-cli FLUSHDB

# Or increase Docker memory allocation in Docker Desktop settings
```

### Docker Desktop Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
```bash
# macOS: Start Docker Desktop
open -a "Docker"

# Wait for Docker to fully start, then verify
docker info
```

## Performance Optimization

### Redis Configuration

The `redis.conf` file includes optimizations for:
- Memory management
- Persistence settings
- Connection handling
- Logging levels

### Resource Limits

To set resource limits, modify `docker-compose.yml`:

```yaml
services:
  redis:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '0.50'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Security Considerations

### Network Isolation

Services run on an isolated bridge network (`docker_app-network`), providing:
- Container-to-container communication
- Isolation from other Docker networks
- No direct internet access for Redis

### Redis Security

For production environments, consider:
1. Setting a Redis password in `redis.conf`
2. Binding to specific IPs only
3. Disabling dangerous commands
4. Using TLS for connections

Example secure configuration:
```bash
# In redis.conf
requirepass your_strong_password_here
bind 127.0.0.1 ::1
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

## Integration with Application

The application automatically connects to Redis using the `REDIS_URL` environment variable:

```javascript
// lib/redis.ts
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
```

Redis is used for:
- **Job Queue**: Managing web scraping jobs
- **Cache**: Storing WooCommerce product/order data
- **Rate Limiting**: Tracking API request limits per domain
- **Sessions**: Managing user sessions and verification states

## Monitoring and Logging

### View Redis Logs
```bash
docker logs customer-service-redis -f --tail 100
```

### Monitor Redis Performance
```bash
# Real-time command monitoring
docker exec -it customer-service-redis redis-cli MONITOR

# Stats overview
docker exec customer-service-redis redis-cli INFO stats

# Connected clients
docker exec customer-service-redis redis-cli CLIENT LIST
```

### Using Redis Insight (Optional)

For a GUI interface, you can enable Redis Insight:

```bash
# Start with monitoring profile
docker-compose -f docker-compose.dev.yml --profile monitoring up -d

# Access at http://localhost:8001
```

## Backup and Recovery

### Manual Backup
```bash
# Trigger background save
docker exec customer-service-redis redis-cli BGSAVE

# Copy backup file
docker cp customer-service-redis:/data/dump.rdb ./backups/redis-backup-$(date +%Y%m%d).rdb
```

### Restore from Backup
```bash
# Stop Redis
docker-compose -f docker-compose.yml stop redis

# Copy backup to container volume
docker cp ./backups/redis-backup.rdb customer-service-redis:/data/dump.rdb

# Start Redis
docker-compose -f docker-compose.yml start redis
```

## Advanced Configurations

### Development with Workers

For running background workers:
```bash
docker-compose -f docker-compose.workers.yml up -d
```

### Production Deployment

For production, use environment-specific configurations:
```bash
# Create production env file
cp .env.example .env.production

# Start with production settings
docker-compose -f docker-compose.yml --env-file .env.production up -d
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check Redis memory usage
2. **Monthly**: Review and rotate logs
3. **Quarterly**: Update Redis image version
4. **As needed**: Clear old job queue data

### Update Redis Version

```bash
# Pull latest image
docker pull redis:7-alpine

# Recreate container with new image
docker-compose -f docker-compose.yml up -d --force-recreate redis
```

## Support

For issues or questions:
1. Check container logs: `docker logs customer-service-redis`
2. Verify health status: `docker ps`
3. Test connection: `redis-cli ping`
4. Review this documentation
5. Check Docker Desktop resource allocation

## Related Documentation

- [Main README](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - AI assistant instructions
- [SUPABASE_SCHEMA.md](../SUPABASE_SCHEMA.md) - Database schema