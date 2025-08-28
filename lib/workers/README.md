# Workers System

Advanced multi-worker system for processing scraping jobs with robust error handling, memory management, and health monitoring.

## Overview

The Workers System provides a scalable, resilient background processing solution built on BullMQ for handling web scraping workloads. It features automatic scaling, memory monitoring, graceful shutdown handling, and comprehensive error recovery.

## Files Structure

```
workers/
├── scraper-worker-service.ts   # Main worker service with multi-worker management
└── README.md                   # This documentation
```

## Core Features

### 🔧 Worker Management
- **Multi-worker Architecture**: Automatically scales based on CPU cores
- **Dynamic Worker Creation**: Creates and manages multiple worker instances
- **Worker Health Monitoring**: Tracks worker status and performance
- **Automatic Restart**: Restarts failed workers automatically
- **Graceful Shutdown**: Handles process termination elegantly

### 📊 Memory Management
- **Memory Monitoring**: Continuous memory usage tracking
- **Memory Thresholds**: Configurable memory usage alerts
- **Garbage Collection**: Automatic GC triggering on high memory
- **Memory Leak Prevention**: Proactive memory cleanup strategies

### ⚡ Job Processing
- **Single Page Scraping**: Handles individual page scraping tasks
- **Multi-page Crawling**: Manages complex crawling operations
- **Progress Tracking**: Real-time job progress updates
- **Error Recovery**: Intelligent retry mechanisms

### 🔄 Health Monitoring
- **Real-time Health Checks**: Continuous system health monitoring
- **Performance Metrics**: Tracks worker performance and throughput
- **Alert System**: Configurable alerts for system issues
- **Status Reporting**: Comprehensive health status reporting

## ScraperWorkerService

### Basic Usage

```typescript
import { ScraperWorkerService } from '@/lib/workers/scraper-worker-service'

// Create worker service with default configuration
const workerService = new ScraperWorkerService()

// Start the service
await workerService.start()

// Get health status
const health = await workerService.getHealthStatus()
console.log(`${health.activeWorkers}/${health.totalWorkers} workers active`)
```

### Advanced Configuration

```typescript
import { ScraperWorkerService } from '@/lib/workers/scraper-worker-service'

const workerService = new ScraperWorkerService({
  concurrency: 3,              // Jobs per worker
  workerCount: 4,              // Number of worker instances
  queueName: 'scrape-queue',   // Queue name
  enableHealthMonitoring: true, // Enable health checks
  memoryThreshold: 0.8,        // Memory usage threshold (80%)
  maxJobDuration: 900000       // Max job duration (15 minutes)
})

// Set up event listeners
workerService.on('started', () => {
  console.log('Worker service started successfully')
})

workerService.on('workerCompleted', ({ workerId, jobId, result }) => {
  console.log(`Worker ${workerId} completed job ${jobId}`)
  console.log(`Pages scraped: ${result.pagesScraped}`)
})

workerService.on('workerFailed', ({ workerId, jobId, error }) => {
  console.error(`Worker ${workerId} failed job ${jobId}: ${error}`)
})

workerService.on('highMemoryUsage', (memoryUsage) => {
  console.warn(`High memory usage: ${(memoryUsage.percentUsed * 100).toFixed(1)}%`)
})

await workerService.start()
```

## Configuration Options

### Worker Configuration

```typescript
interface WorkerOptions {
  concurrency?: number        // Jobs processed simultaneously per worker (default: 2)
  workerCount?: number        // Number of worker instances (default: CPU cores / 2)
  queueName?: string          // BullMQ queue name (default: 'scrape-queue')
  enableHealthMonitoring?: boolean  // Enable health monitoring (default: true)
  memoryThreshold?: number    // Memory usage threshold (default: 0.85)
  maxJobDuration?: number     // Maximum job duration in ms (default: 600000)
}
```

### Environment Variables

```bash
# Worker Configuration
WORKER_CONCURRENCY=2                    # Jobs per worker
WORKER_COUNT=4                          # Number of workers
QUEUE_NAME=scrape-queue                 # Queue name
ENABLE_HEALTH_MONITORING=true           # Enable health monitoring
MEMORY_THRESHOLD=0.85                   # Memory usage threshold
MAX_JOB_DURATION=600000                 # Max job duration (10 minutes)

# Redis Configuration
REDIS_URL=redis://localhost:6379        # Redis connection URL

# Logging Configuration
LOG_LEVEL=info                          # Logging level
```

## Job Processing

### Job Types

The worker service processes different types of scraping jobs:

#### Single Page Jobs

```typescript
// Job data structure for single page scraping
interface SinglePageJobData {
  type: 'single-page'
  url: string
  customerId: string
  turboMode?: boolean
  ecommerceMode?: boolean
  useNewConfig?: boolean
  newConfigPreset?: string
  aiOptimization?: boolean
  metadata?: Record<string, any>
}
```

#### Multi-page Crawl Jobs

```typescript
// Job data structure for multi-page crawling
interface CrawlJobData {
  type: 'full-crawl'
  url: string
  maxPages: number
  customerId: string
  includePaths?: string[]
  excludePaths?: string[]
  turboMode?: boolean
  ownSite?: boolean
  useNewConfig?: boolean
  newConfigPreset?: string
  aiOptimization?: boolean
  metadata?: Record<string, any>
}
```

### Job Results

```typescript
interface ScrapeJobResult {
  jobId: string
  status: 'completed' | 'failed'
  pagesScraped: number
  totalPages: number
  errors: string[]
  startedAt: string
  completedAt: string
  duration: number
  data: any[]
  metadata: {
    memoryUsage: {
      used: number
      total: number
      percentUsed: number
    }
    processingTime: number
    [key: string]: any
  }
}
```

## Event System

### Available Events

```typescript
// Worker service events
workerService.on('started', () => {
  // Service started successfully
})

workerService.on('workerReady', (workerId: string) => {
  // Individual worker is ready
})

workerService.on('workerActive', ({ workerId, jobId }) => {
  // Worker started processing a job
})

workerService.on('workerCompleted', ({ workerId, jobId, result }) => {
  // Worker completed a job successfully
})

workerService.on('workerFailed', ({ workerId, jobId, error }) => {
  // Worker failed to process a job
})

workerService.on('workerError', ({ workerId, error }) => {
  // Worker encountered an error
})

workerService.on('workerStalled', ({ workerId, jobId }) => {
  // Worker job stalled
})

workerService.on('workerClosed', (workerId: string) => {
  // Worker closed
})

workerService.on('highMemoryUsage', (memoryUsage) => {
  // High memory usage detected
})

workerService.on('healthUpdate', (health) => {
  // Health status update
})

workerService.on('shuttingDown', (signal: string) => {
  // Graceful shutdown initiated
})

workerService.on('shutdown', () => {
  // Graceful shutdown completed
})

workerService.on('forceShutdown', () => {
  // Force shutdown completed
})
```

### Event Handler Examples

```typescript
// Log all worker activity
workerService.on('workerActive', ({ workerId, jobId }) => {
  logger.info(`Worker ${workerId} started processing job ${jobId}`)
})

workerService.on('workerCompleted', ({ workerId, jobId, result }) => {
  logger.info(`Worker ${workerId} completed job ${jobId}`, {
    duration: result.duration,
    pagesScraped: result.pagesScraped
  })
})

// Handle memory pressure
workerService.on('highMemoryUsage', (memoryUsage) => {
  if (memoryUsage.percentUsed > 0.9) {
    logger.error('Critical memory usage detected', memoryUsage)
    // Implement emergency measures
  }
})

// Monitor health updates
workerService.on('healthUpdate', (health) => {
  if (!health.healthy) {
    logger.warn('Worker service health degraded', health)
    // Send alerts to monitoring system
  }
})
```

## Health Monitoring

### Health Status

```typescript
interface HealthStatus {
  healthy: boolean
  totalWorkers: number
  activeWorkers: number
  memoryUsage: {
    used: number
    total: number
    percentUsed: number
  }
  redisConnected: boolean
  uptime: number
}

// Get current health status
const health = await workerService.getHealthStatus()

console.log(`System health: ${health.healthy ? 'Healthy' : 'Unhealthy'}`)
console.log(`Workers: ${health.activeWorkers}/${health.totalWorkers}`)
console.log(`Memory: ${(health.memoryUsage.percentUsed * 100).toFixed(1)}%`)
console.log(`Uptime: ${Math.floor(health.uptime / 60)} minutes`)
```

### Memory Monitoring

```typescript
// Memory monitoring is automatic, but you can access current usage
const memoryUsage = workerService.getMemoryUsage()

console.log(`Heap used: ${Math.round(memoryUsage.used / 1024 / 1024)}MB`)
console.log(`Total memory: ${Math.round(memoryUsage.total / 1024 / 1024)}MB`)
console.log(`Percentage used: ${(memoryUsage.percentUsed * 100).toFixed(1)}%`)

// Configure memory thresholds
const workerService = new ScraperWorkerService({
  memoryThreshold: 0.75  // Alert at 75% memory usage
})
```

## Error Handling

### Automatic Error Recovery

```typescript
// Workers automatically restart on errors
workerService.on('workerError', async ({ workerId, error }) => {
  logger.error(`Worker ${workerId} error: ${error}`)
  
  // Worker will automatically restart unless shutting down
  // You can implement additional error handling here
  
  if (error.includes('ENOMEM')) {
    // Handle out-of-memory errors
    await forceGarbageCollection()
  }
})

// Handle job failures with retry logic
workerService.on('workerFailed', ({ workerId, jobId, error }) => {
  logger.error(`Job ${jobId} failed on worker ${workerId}: ${error}`)
  
  // BullMQ will handle retries based on job configuration
  // Additional failure handling can be implemented here
})
```

### Manual Error Recovery

```typescript
// Manually restart a specific worker
async function restartWorker(workerId: string) {
  try {
    await workerService.restartWorker(workerId)
    logger.info(`Worker ${workerId} restarted successfully`)
  } catch (error) {
    logger.error(`Failed to restart worker ${workerId}:`, error)
  }
}

// Stop service on critical errors
workerService.on('workerError', async ({ workerId, error }) => {
  if (error.includes('FATAL')) {
    logger.error('Fatal error detected, shutting down service')
    await workerService.stop()
    process.exit(1)
  }
})
```

## Deployment

### Standalone Worker Process

```typescript
// worker.ts - Standalone worker process
import { startWorkerService } from '@/lib/workers/scraper-worker-service'

async function main() {
  try {
    await startWorkerService()
    console.log('Worker service is running...')
  } catch (error) {
    console.error('Failed to start worker service:', error)
    process.exit(1)
  }
}

main()
```

### Docker Deployment

```dockerfile
# Dockerfile for worker service
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose health check endpoint (if implemented)
EXPOSE 3001

# Start worker service
CMD ["node", "dist/lib/workers/scraper-worker-service.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  worker:
    build: .
    command: node dist/lib/workers/scraper-worker-service.js
    environment:
      - REDIS_URL=redis://redis:6379
      - WORKER_COUNT=4
      - WORKER_CONCURRENCY=2
      - MEMORY_THRESHOLD=0.8
      - LOG_LEVEL=info
    depends_on:
      - redis
    restart: unless-stopped
    deploy:
      replicas: 2  # Run multiple worker services for scalability
      
  redis:
    image: redis:7-alpine
    restart: unless-stopped
```

### Kubernetes Deployment

```yaml
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scraper-workers
spec:
  replicas: 3
  selector:
    matchLabels:
      app: scraper-workers
  template:
    metadata:
      labels:
        app: scraper-workers
    spec:
      containers:
      - name: worker
        image: your-registry/scraper-worker:latest
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: WORKER_COUNT
          value: "4"
        - name: MEMORY_THRESHOLD
          value: "0.8"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command: ["node", "health-check.js"]
          initialDelaySeconds: 30
          periodSeconds: 30
```

## Performance Optimization

### Scaling Guidelines

```typescript
// Calculate optimal worker count based on system resources
function calculateOptimalWorkers() {
  const cpuCount = require('os').cpus().length
  const totalMemoryGB = require('os').totalmem() / 1024 / 1024 / 1024
  
  // Conservative approach: 1 worker per 2 CPU cores
  const cpuBasedWorkers = Math.max(1, Math.floor(cpuCount / 2))
  
  // Memory-based calculation: assume 512MB per worker
  const memoryBasedWorkers = Math.floor(totalMemoryGB * 1024 / 512)
  
  // Use the minimum to avoid resource exhaustion
  return Math.min(cpuBasedWorkers, memoryBasedWorkers, 8) // Cap at 8 workers
}

const optimalWorkers = calculateOptimalWorkers()
const workerService = new ScraperWorkerService({
  workerCount: optimalWorkers,
  concurrency: 2  // Keep concurrency low for memory-intensive scraping
})
```

### Memory Optimization

```typescript
// Configure for memory-efficient operation
const workerService = new ScraperWorkerService({
  memoryThreshold: 0.7,     // Lower threshold for early warnings
  concurrency: 1,           // Reduce concurrency for memory-intensive jobs
  maxJobDuration: 300000    // Shorter timeout to prevent memory leaks
})

// Implement custom memory cleanup
workerService.on('workerCompleted', () => {
  // Force garbage collection after job completion
  if (global.gc) {
    global.gc()
  }
})

// Monitor memory trends
let memoryHistory: number[] = []

workerService.on('healthUpdate', (health) => {
  memoryHistory.push(health.memoryUsage.percentUsed)
  
  // Keep only last 10 readings
  if (memoryHistory.length > 10) {
    memoryHistory = memoryHistory.slice(-10)
  }
  
  // Check for memory leak (increasing trend)
  const trend = calculateTrend(memoryHistory)
  if (trend > 0.05) { // More than 5% increase per check
    logger.warn('Potential memory leak detected', { trend, history: memoryHistory })
  }
})
```

## Testing

### Unit Testing

```typescript
// worker-service.test.ts
import { ScraperWorkerService } from '@/lib/workers/scraper-worker-service'

describe('ScraperWorkerService', () => {
  let workerService: ScraperWorkerService

  beforeEach(() => {
    workerService = new ScraperWorkerService({
      workerCount: 1,
      concurrency: 1,
      enableHealthMonitoring: false
    })
  })

  afterEach(async () => {
    if (workerService) {
      await workerService.stop()
    }
  })

  test('should start successfully', async () => {
    const startPromise = workerService.start()
    
    // Listen for started event
    const startedPromise = new Promise(resolve => {
      workerService.once('started', resolve)
    })

    await Promise.all([startPromise, startedPromise])
    
    const health = await workerService.getHealthStatus()
    expect(health.totalWorkers).toBe(1)
    expect(health.healthy).toBe(true)
  })

  test('should handle worker failures gracefully', async () => {
    await workerService.start()
    
    const errorPromise = new Promise(resolve => {
      workerService.once('workerError', resolve)
    })

    // Simulate worker error
    workerService.emit('workerError', { workerId: 'worker-1', error: 'Test error' })
    
    await errorPromise
    
    // Service should still be healthy after restart
    const health = await workerService.getHealthStatus()
    expect(health.healthy).toBe(true)
  })

  test('should respect memory thresholds', async () => {
    const lowThresholdService = new ScraperWorkerService({
      memoryThreshold: 0.01, // Very low threshold to trigger alerts
      workerCount: 1
    })

    const highMemoryPromise = new Promise(resolve => {
      lowThresholdService.once('highMemoryUsage', resolve)
    })

    await lowThresholdService.start()
    
    // Should trigger high memory usage alert
    await expect(highMemoryPromise).resolves.toBeDefined()
    
    await lowThresholdService.stop()
  })
})
```

### Integration Testing

```typescript
// integration.test.ts
import { ScraperWorkerService } from '@/lib/workers/scraper-worker-service'
import { getQueueManager } from '@/lib/queue'

describe('Worker Integration', () => {
  let workerService: ScraperWorkerService
  let queueManager: any

  beforeAll(async () => {
    queueManager = getQueueManager()
    await queueManager.initialize()
  })

  afterAll(async () => {
    if (workerService) {
      await workerService.stop()
    }
    await queueManager.shutdown()
  })

  test('should process jobs end-to-end', async () => {
    workerService = new ScraperWorkerService({
      workerCount: 1,
      concurrency: 1
    })

    await workerService.start()

    // Add a test job
    const job = await queueManager.addJob({
      type: 'single-page',
      url: 'https://example.com',
      customerId: 'test-customer'
    })

    // Wait for job completion
    const completedPromise = new Promise((resolve) => {
      workerService.once('workerCompleted', resolve)
    })

    const result = await completedPromise
    expect(result.jobId).toBe(job.id)
    expect(result.result.status).toBe('completed')
  })
})
```

### Load Testing

```typescript
// load-test.ts
import { ScraperWorkerService } from '@/lib/workers/scraper-worker-service'
import { getQueueManager } from '@/lib/queue'

async function loadTest() {
  const workerService = new ScraperWorkerService({
    workerCount: 4,
    concurrency: 2
  })
  
  await workerService.start()
  
  const queueManager = getQueueManager()
  await queueManager.initialize()

  // Add multiple jobs
  const jobs = []
  for (let i = 0; i < 100; i++) {
    jobs.push(queueManager.addJob({
      type: 'single-page',
      url: `https://example.com/page-${i}`,
      customerId: 'load-test'
    }))
  }

  await Promise.all(jobs)
  
  let completed = 0
  let failed = 0
  
  workerService.on('workerCompleted', () => {
    completed++
    if (completed + failed >= 100) {
      console.log(`Load test complete: ${completed} completed, ${failed} failed`)
      process.exit(0)
    }
  })
  
  workerService.on('workerFailed', () => {
    failed++
    if (completed + failed >= 100) {
      console.log(`Load test complete: ${completed} completed, ${failed} failed`)
      process.exit(0)
    }
  })
}

loadTest().catch(console.error)
```

## Troubleshooting

### Common Issues

#### 1. Workers Not Starting

```typescript
// Debug worker startup issues
const workerService = new ScraperWorkerService({
  enableHealthMonitoring: true
})

workerService.on('workerError', ({ workerId, error }) => {
  console.error(`Worker ${workerId} failed to start: ${error}`)
  
  // Check common issues
  if (error.includes('Redis')) {
    console.error('Redis connection issue - check REDIS_URL')
  }
  if (error.includes('ECONNREFUSED')) {
    console.error('Cannot connect to Redis server')
  }
})

try {
  await workerService.start()
} catch (error) {
  console.error('Failed to start worker service:', error)
  
  // Check Redis connectivity
  const redis = getResilientRedisClient()
  const canPing = await redis.ping()
  console.log('Redis connectivity:', canPing ? 'OK' : 'Failed')
}
```

#### 2. High Memory Usage

```typescript
// Monitor and debug memory issues
workerService.on('highMemoryUsage', (memoryUsage) => {
  console.warn('High memory usage detected:', {
    used: Math.round(memoryUsage.used / 1024 / 1024) + 'MB',
    percent: (memoryUsage.percentUsed * 100).toFixed(1) + '%'
  })
  
  // Implement emergency measures
  if (memoryUsage.percentUsed > 0.9) {
    console.error('Critical memory usage - implementing emergency measures')
    
    // Force garbage collection
    if (global.gc) {
      global.gc()
      console.log('Garbage collection triggered')
    }
    
    // Reduce worker concurrency temporarily
    console.log('Reducing worker load...')
  }
})
```

#### 3. Jobs Timing Out

```typescript
// Debug job timeout issues
workerService.on('workerStalled', ({ workerId, jobId }) => {
  console.warn(`Job ${jobId} stalled on worker ${workerId}`)
  
  // Log system resources when jobs stall
  const memUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  console.log('System state when job stalled:', {
    memory: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
    cpu: cpuUsage
  })
})

// Increase timeout for problematic jobs
const workerService = new ScraperWorkerService({
  maxJobDuration: 1800000  // 30 minutes instead of 10
})
```

## Related Documentation

- [Queue Management System](../queue/README.md)
- [Monitoring System](../monitoring/README.md)
- [Authentication Utilities](../auth/README.md)
- [Logging System](../logger.ts)
- [System Health Monitoring](../../docs/MONITORING.md)
- [Deployment Guide](../../docs/DEPLOYMENT.md)