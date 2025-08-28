# Customer Service Agent - Background Worker System

A production-ready background web scraping system with automatic job queuing, worker management, and comprehensive monitoring.

## 🚀 Features

- **BullMQ Job Queue**: Reliable job processing with Redis backend
- **Scalable Workers**: Multiple concurrent workers with automatic scaling
- **Health Monitoring**: Comprehensive system health checks and alerting
- **Memory Management**: Automatic memory cleanup and leak prevention
- **Docker Support**: Full containerization with development and production modes
- **Rate Limiting**: Intelligent request throttling and exponential backoff
- **Retry Logic**: Automatic job retries with exponential backoff
- **Real-time Monitoring**: Queue metrics, worker status, and system health

## 📦 Architecture

```
├── lib/
│   ├── queue/
│   │   └── scrape-queue.ts          # BullMQ queue management
│   ├── workers/
│   │   └── scraper-worker-service.ts # Standalone worker service
│   ├── monitoring/
│   │   └── scrape-monitor.ts        # Health monitoring system
│   ├── scraper-api.ts               # Core scraping functionality
│   ├── redis-enhanced.ts            # Enhanced Redis client
│   └── logger.ts                    # Centralized logging
├── docker-compose.dev.yml           # Development environment
├── Dockerfile.worker                # Worker container configuration
├── redis.conf                       # Redis configuration
└── package.json                     # Dependencies and scripts
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- Redis 7.0+
- Docker & Docker Compose (optional)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### Development Setup

#### Option 1: Docker Compose (Recommended)

```bash
# Start Redis and worker services
npm run docker:up

# Or start in detached mode
npm run docker:up:detached

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

#### Option 2: Local Development

```bash
# Start Redis (if not using Docker)
npm run redis:start

# Start worker in development mode
npm run worker:dev

# Or start production worker
npm run worker:start

# Start multiple workers (cluster mode)
npm run worker:cluster
```

### Production Deployment

```bash
# Build Docker images
npm run docker:build

# Start with monitoring
npm run docker:monitoring

# Start with scaling (2 workers)
npm run docker:scaling
```

## 🎮 Usage

### Adding Jobs to Queue

```typescript
import { createScrapeJob, getQueueManager } from './lib/queue/scrape-queue';

// Simple job
const job = await createScrapeJob('https://example.com');

// Advanced job with options
const manager = getQueueManager();
await manager.addJob('scrape', {
  url: 'https://example.com',
  maxPages: 100,
  turboMode: true,
  ownSite: false,
  customerId: 'customer123',
  aiOptimization: {
    enabled: true,
    level: 'standard',
    tokenTarget: 2000,
    preserveContent: ['h1', 'h2', '.important'],
    cacheEnabled: true,
    precomputeMetadata: true,
    deduplicationEnabled: true,
  },
  priority: 10,
  retries: 3,
});
```

### Monitoring System Health

```bash
# Check system health
npm run monitor:health

# Check worker status
npm run monitor:workers

# View queue metrics
npm run queue:stats
```

### Queue Management

```bash
# Pause queue processing
npm run queue:pause

# Resume queue processing
npm run queue:resume

# Clean up old jobs
npm run queue:clean

# View queue dashboard (if running)
npm run queue:dashboard
```

## 🔧 Configuration

### Worker Configuration

Configure workers via environment variables:

```env
WORKER_CONCURRENCY=2          # Jobs per worker
WORKER_COUNT=2                # Number of worker processes
QUEUE_NAME=scrape-queue       # Queue name
ENABLE_HEALTH_MONITORING=true # Enable health monitoring
MEMORY_THRESHOLD=0.85         # Memory usage alert threshold
MAX_JOB_DURATION=600000       # Max job duration (10 minutes)
```

### Queue Configuration

```typescript
const queueManager = new ScrapeQueueManager('custom-queue', {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

### Monitoring Configuration

```typescript
const monitor = new ScrapeMonitor({
  checkInterval: 30000,  // 30 seconds
  alertThresholds: {
    memory: { warning: 0.75, critical: 0.9 },
    queue: { warning: 100, critical: 500 },
    responseTime: { warning: 5000, critical: 10000 },
  },
});
```

## 📊 Monitoring & Dashboards

### Built-in Monitoring

- **System Health**: `/api/health` endpoint
- **Queue Metrics**: Real-time job statistics
- **Worker Status**: Worker performance and health
- **Memory Usage**: Automatic memory monitoring
- **Alert System**: Configurable alerts and notifications

### Optional Dashboards

Start with monitoring profile to access:

- **BullMQ Dashboard**: `http://localhost:3001` (admin/admin123)
- **Redis Insight**: `http://localhost:8001`
- **Grafana**: `http://localhost:3000` (admin/admin123)
- **Prometheus**: `http://localhost:9090`

```bash
npm run docker:monitoring
```

## 🔍 Debugging

### View Logs

```bash
# Real-time logs
npm run docker:logs

# Worker logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log
```

### Debug Queue Issues

```bash
# Check Redis connection
npm run redis:cli
127.0.0.1:6379> PING

# View queue keys
127.0.0.1:6379> KEYS "bull:*"

# Monitor Redis operations
npm run redis:monitor
```

### Memory Issues

```bash
# Check memory usage
npm run monitor:health

# Force garbage collection (if enabled)
node --expose-gc lib/workers/scraper-worker-service.js
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Test with coverage
npm run test:coverage
```

## 🚀 Scaling

### Horizontal Scaling

```bash
# Start multiple worker containers
docker-compose -f docker-compose.dev.yml up --scale scraper-worker=4

# Or use the scaling profile
npm run docker:scaling
```

### Vertical Scaling

Adjust worker concurrency:

```env
WORKER_CONCURRENCY=4  # Increase concurrent jobs per worker
```

### Load Balancing

Use multiple Redis instances or Redis Cluster for high-throughput scenarios.

## 🔒 Security

- Workers run as non-root users in containers
- Redis protected mode enabled
- Dangerous Redis commands disabled
- Rate limiting prevents abuse
- Memory limits prevent resource exhaustion

## 🐛 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis status
   npm run redis:cli
   # Restart Redis
   docker-compose restart redis
   ```

2. **Workers Not Processing Jobs**
   ```bash
   # Check worker status
   npm run monitor:workers
   # Restart workers
   docker-compose restart scraper-worker
   ```

3. **High Memory Usage**
   ```bash
   # Check memory metrics
   npm run monitor:health
   # Reduce worker concurrency
   export WORKER_CONCURRENCY=1
   ```

4. **Queue Backed Up**
   ```bash
   # Check queue stats
   npm run queue:stats
   # Add more workers
   docker-compose up --scale scraper-worker=4
   ```

### Log Analysis

```bash
# Search for errors
grep -i "error" logs/combined.log

# Monitor queue operations
grep "queue" logs/combined.log

# Check worker performance
grep "worker" logs/combined.log
```

## 📚 API Reference

### Queue Manager

```typescript
// Initialize queue
const manager = await initializeQueue('my-queue');

// Add job
const job = await manager.addJob('scrape', data, options);

// Bulk operations
await manager.addBulk([...jobs]);

// Create worker
await manager.createWorker('worker-1', processorFn, options);

// Health check
const health = await manager.getHealthStatus();
```

### Monitor

```typescript
// Start monitoring
const monitor = await startMonitoring(config);

// Get health status
const health = await monitor.getSystemHealth();

// Get metrics
const metrics = await monitor.getMetrics();

// Get alerts
const alerts = monitor.getActiveAlerts();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Documentation: See `/docs` directory
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

Built with ❤️ using BullMQ, Redis, and Node.js