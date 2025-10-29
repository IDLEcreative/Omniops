# Vercel Redis Setup Guide

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v2.1.0
**Dependencies:**
- [lib/redis-unified.ts](../../lib/redis-unified.ts)
- [lib/redis-enhanced.ts](../../lib/redis-enhanced.ts)
- [lib/redis-fallback.ts](../../lib/redis-fallback.ts)
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md)
**Estimated Read Time:** 6 minutes

## Purpose
Production Redis configuration guide covering Vercel Redis setup, REDIS_URL environment variable configuration, automatic in-memory fallback system, ResilientRedis client with circuit breaker pattern, job queue architecture for web scraping, rate limiting implementation (10 req/min scraping, 100 req/min API), content deduplication, health monitoring endpoint (/api/health/comprehensive), and troubleshooting with 60-second TTL cleanup automation.

## Quick Links
- [Current Status](#current-status)
- [Setting Up Vercel Redis](#setting-up-vercel-redis)
- [How Redis is Used in Your Application](#how-redis-is-used-in-your-application)
- [Architecture Overview](#architecture-overview)
- [Key Files](#key-files)
- [Monitoring Redis Health](#monitoring-redis-health)
- [Troubleshooting](#troubleshooting)

## Keywords
Vercel Redis, REDIS_URL configuration, redis-unified.ts, ResilientRedis client, in-memory fallback, circuit breaker pattern, job queue, rate limiting, content deduplication, caching layer, ioredis package, InMemoryStore, health monitoring, production Redis, automatic fallback, TTL cleanup, redis://localhost:6379, Vercel CLI, vercel env add

## Aliases
- "ResilientRedis" (also known as: Redis client, unified Redis, enhanced Redis)
- "InMemoryStore" (also known as: fallback storage, in-memory cache, local storage)
- "circuit breaker" (also known as: resilience pattern, failure protection, fault tolerance)
- "job queue" (also known as: task queue, background jobs, async processing)
- "REDIS_URL" (also known as: Redis connection string, Redis endpoint, cache URL)
- "redis-unified.ts" (also known as: main Redis client, unified client, primary Redis interface)

---


## Current Status
✅ **Local Development**: Redis is working perfectly at `redis://localhost:6379`
✅ **Fallback System**: In-memory fallback is implemented for when Redis is unavailable
✅ **Dependencies**: Both `ioredis` and `redis` packages are installed

## Setting Up Vercel Redis

### 1. Get Your Redis URL from Vercel
From your Vercel Redis dashboard, you should see a `REDIS_URL` that looks like:
```
redis://default:YOUR_PASSWORD@YOUR_HOST.redis.vercel-storage.com:YOUR_PORT
```

### 2. Add to Vercel Environment Variables

#### Option A: Using Vercel Dashboard (Recommended)
1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variable:
   - **Name**: `REDIS_URL`
   - **Value**: Your Vercel Redis URL (copy from the Redis dashboard)
   - **Environment**: Select `Production`, `Preview`, and/or `Development` as needed

#### Option B: Using Vercel CLI
```bash
vercel env add REDIS_URL production
# Paste your Redis URL when prompted
```

### 3. Test Your Vercel Redis Connection
Once you have the URL, test it locally:
```bash
node test-redis.js "redis://default:YOUR_PASSWORD@YOUR_HOST.redis.vercel-storage.com:YOUR_PORT"
```

### 4. Deploy and Verify
After adding the environment variable:
```bash
vercel --prod
```

Then check the deployment logs to ensure Redis connects successfully.

## How Redis is Used in Your Application

### Primary Uses
1. **Web Scraping Job Queue**: Managing crawl jobs and results
2. **Rate Limiting**: Preventing API abuse
3. **Content Deduplication**: Avoiding duplicate content processing
4. **Caching**: Temporary storage for frequently accessed data

### Fallback Behavior
When Redis is unavailable, the application automatically falls back to in-memory storage:
- ✅ Application remains functional
- ⚠️ Data is not persisted between restarts
- ⚠️ No data sharing between multiple instances
- ℹ️ Suitable for development and testing

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  API Routes │────▶│ redis-unified.ts │────▶│ ResilientRedis  │
└─────────────┘     └──────────────────┘     └─────────────────┘
                             │                         │
                             ▼                         ▼
                    ┌─────────────────┐      ┌─────────────────┐
                    │  InMemoryStore  │      │   Vercel Redis  │
                    │   (Fallback)     │      │   (Production)  │
                    └─────────────────┘      └─────────────────┘
```

## Key Files

- **`lib/redis-unified.ts`**: Main Redis client with automatic fallback
- **`lib/redis-enhanced.ts`**: Enhanced Redis client with circuit breaker pattern
- **`lib/redis-fallback.ts`**: In-memory fallback implementation
- **`lib/redis.ts`**: Legacy Redis functions (being phased out)

## Monitoring Redis Health

Check Redis status at: `/api/health/comprehensive?verbose=true`

This endpoint shows:
- Redis connection status
- Circuit breaker state
- Fallback usage
- Queue metrics
- Performance statistics

## Troubleshooting

### Redis Not Connecting in Production
1. Verify `REDIS_URL` is set in Vercel environment variables
2. Check the URL format is correct
3. Ensure Redis instance is active in Vercel dashboard

### High Memory Usage
The in-memory fallback has automatic cleanup:
- Expired items are removed every 60 seconds
- TTL is respected for cached items

### Rate Limiting Issues
Default limits:
- Scraping: 10 requests/minute per domain
- API: 100 requests/minute per client
- Embeddings: 60 requests/minute

## Best Practices

1. **Always use `redis-unified.ts`** for new Redis operations
2. **Set appropriate TTLs** for cached data
3. **Monitor memory usage** when using fallback mode
4. **Use rate limiting** to protect against abuse
5. **Implement proper error handling** for Redis operations

## Next Steps

1. Copy your Vercel Redis URL from the dashboard
2. Add it to your Vercel environment variables
3. Deploy your application
4. Monitor the health endpoint to ensure proper connection

---

*Note: The Redis URL contains sensitive credentials. Never commit it to version control.*
