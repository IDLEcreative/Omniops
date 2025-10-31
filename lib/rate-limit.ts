// Simple in-memory rate limiter
// In production, use Redis or similar

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Deterministic cleanup configuration
const CLEANUP_THRESHOLD = 100; // Clean up every 100 checks
let checkCount = 0;

// Cleanup interval to prevent memory leaks (runs every 30s)
let cleanupInterval: NodeJS.Timeout | null = null;

// Start cleanup interval if not already started
if (typeof window === 'undefined' && !cleanupInterval) {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Rate limiter cleanup: removed ${cleaned} expired entries`);
    }
    
    // Log memory usage in development
    if (process.env.NODE_ENV === 'development' && rateLimitMap.size > 1000) {
      console.warn(`Rate limiter warning: ${rateLimitMap.size} entries in memory`);
    }
  }, 30000); // Clean up every 30 seconds
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 50,
  windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Deterministic cleanup every 100 checks (no more Math.random!)
  checkCount++;
  if (checkCount >= CLEANUP_THRESHOLD) {
    let cleaned = 0;
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key);
        cleaned++;
      }
    }
    checkCount = 0;

    if (process.env.NODE_ENV === 'development' && cleaned > 0) {
      console.log(`[Rate Limit] Cleaned up ${cleaned} expired entries`);
    }
  }

  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

// Domain-based rate limiting
export function checkDomainRateLimit(domain: string) {
  // Different limits for different domains (could be stored in DB)
  const limits = {
    default: { requests: 100, window: 60 * 1000 }, // 100 per minute
    premium: { requests: 500, window: 60 * 1000 }, // 500 per minute
  };

  const limit = limits.default; // In production, check customer tier
  return checkRateLimit(`domain:${domain}`, limit.requests, limit.window);
}

// Rate limiting for expensive operations (scraping, RAG setup, training)
export function checkExpensiveOpRateLimit(identifier: string) {
  // Strict limits for resource-intensive operations
  // 10 requests per hour to prevent abuse while allowing legitimate use
  return checkRateLimit(
    `expensive:${identifier}`,
    10, // max 10 requests
    60 * 60 * 1000 // per hour
  );
}