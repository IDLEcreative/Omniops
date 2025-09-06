import { logError, ErrorSeverity, ErrorCategory } from './error-logger';

let isShuttingDown = false;
let activeRequests = 0;

/**
 * Track active requests to ensure graceful shutdown
 */
export function trackRequest() {
  activeRequests++;
  return () => {
    activeRequests--;
  };
}

/**
 * Initialize global process error handlers
 */
export function initializeProcessErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error: Error) => {
    console.error('🚨 UNCAUGHT EXCEPTION:', error);
    
    await logError(
      error,
      {
        type: 'uncaughtException',
        pid: process.pid,
        timestamp: new Date().toISOString(),
      },
      ErrorSeverity.CRITICAL,
      ErrorCategory.SYSTEM
    );
    
    // In production, attempt graceful shutdown
    if (process.env.NODE_ENV === 'production') {
      await gracefulShutdown('uncaughtException', 1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason: any, promise: Promise<any>) => {
    console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
    
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    await logError(
      error,
      {
        type: 'unhandledRejection',
        pid: process.pid,
        timestamp: new Date().toISOString(),
      },
      ErrorSeverity.HIGH,
      ErrorCategory.SYSTEM
    );
    
    // In production, don't exit but log severely
    if (process.env.NODE_ENV === 'production') {
      // Optionally restart if too many rejections
      checkHealthAndRestart();
    }
  });

  // Handle warnings
  process.on('warning', (warning: Error) => {
    console.warn('⚠️ Process warning:', warning.name, warning.message);
    
    logError(
      warning,
      {
        type: 'warning',
        pid: process.pid,
      },
      ErrorSeverity.LOW,
      ErrorCategory.SYSTEM
    ).catch(console.error);
  });

  // Handle SIGTERM for graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('📦 SIGTERM received, initiating graceful shutdown...');
    await gracefulShutdown('SIGTERM', 0);
  });

  // Handle SIGINT (Ctrl+C) for graceful shutdown
  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, initiating graceful shutdown...');
    await gracefulShutdown('SIGINT', 0);
  });

  // Monitor memory usage with throttling
  let lastMemoryWarning = 0;
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const now = Date.now();
    
    if (heapUsedPercent > 90) {
      // Only log once every 5 minutes to prevent feedback loop
      if (now - lastMemoryWarning > 300000) {
        console.error(`⚠️ CRITICAL: Memory usage at ${heapUsedPercent.toFixed(1)}%`);
        lastMemoryWarning = now;
        
        // Don't log to database during high memory - just console
        console.error('Memory stats:', {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        });
        
        // Force garbage collection if available
        if (global.gc) {
          console.log('Running garbage collection...');
          global.gc();
        }
      }
    } else if (heapUsedPercent > 70 && now - lastMemoryWarning > 60000) {
      // Throttle warnings to once per minute
      console.warn(`⚠️ Memory usage at ${heapUsedPercent.toFixed(1)}%`);
      lastMemoryWarning = now;
    }
  }, 30000); // Check every 30 seconds

  console.log('✅ Process error handlers initialized');
}

/**
 * Gracefully shutdown the application
 */
async function gracefulShutdown(reason: string, exitCode: number) {
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`Starting graceful shutdown due to: ${reason}`);
  
  // Give active requests time to complete
  const shutdownTimeout = setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(exitCode);
  }, 10000); // 10 second timeout
  
  // Wait for active requests to complete
  let waitTime = 0;
  while (activeRequests > 0 && waitTime < 9000) {
    console.log(`Waiting for ${activeRequests} active requests to complete...`);
    await new Promise(resolve => setTimeout(resolve, 100));
    waitTime += 100;
  }
  
  clearTimeout(shutdownTimeout);
  
  // Cleanup resources
  try {
    // Close database connections
    console.log('Closing database connections...');
    // Add database cleanup here
    
    // Close Redis connections
    console.log('Closing Redis connections...');
    try {
      const { getRedisClient } = await import('./redis');
      const redis = await getRedisClient();
      if (redis && 'quit' in redis && typeof redis.quit === 'function') {
        await redis.quit();
      }
    } catch (error) {
      // Redis might not be available
      console.log('Redis not available for shutdown');
    }
    
    // Flush error logs
    console.log('Flushing error logs...');
    const { errorLogger } = await import('./error-logger');
    errorLogger.destroy();
    
    console.log('Graceful shutdown completed');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  process.exit(exitCode);
}

let unhealthyCount = 0;
const MAX_UNHEALTHY_COUNT = 5;

/**
 * Check application health and restart if necessary
 */
async function checkHealthAndRestart() {
  try {
    // Simple health check
    const response = await fetch('http://localhost:3000/api/health', {
      signal: AbortSignal.timeout(5000),
    });
    
    const health = await response.json();
    
    if (health.status === 'unhealthy') {
      unhealthyCount++;
      console.error(`Application unhealthy (${unhealthyCount}/${MAX_UNHEALTHY_COUNT})`);
      
      if (unhealthyCount >= MAX_UNHEALTHY_COUNT) {
        console.error('Too many unhealthy states, initiating restart...');
        await gracefulShutdown('unhealthy', 1);
      }
    } else {
      unhealthyCount = 0; // Reset counter on healthy state
    }
  } catch (error) {
    console.error('Health check failed:', error);
    unhealthyCount++;
  }
}

// Auto-initialize if this is the main module
if (require.main === module) {
  initializeProcessErrorHandlers();
}